/**
 * Gemini Live API integration for real-time video streaming
 */

export interface GeminiConfig {
  apiKey: string;
  systemInstruction?: string;
  model?: string;
}

export interface VideoFrame {
  mimeType: string;
  data: string; // base64 encoded
}

export type MessageHandler = (description: string) => void;
export type ErrorHandler = (error: string) => void;
export type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected') => void;

export class GeminiLiveSession {
  private ws: WebSocket | null = null;
  private config: GeminiConfig;
  private onMessage: MessageHandler;
  private onError: ErrorHandler;
  private onStatus: StatusHandler;
  private isConnecting = false;

  constructor(
    config: GeminiConfig,
    onMessage: MessageHandler,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ) {
    this.config = {
      model: 'gemini-2.5-flash-preview-09-2025',
      systemInstruction: 'Describe what you see in the video in detail, including objects, people, actions, text, and spatial positioning.',
      ...config
    };
    this.onMessage = onMessage;
    this.onError = onError;
    this.onStatus = onStatus;
  }

  /**
   * Connect to the Gemini Live API WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('Connection already in progress');
      return;
    }

    this.isConnecting = true;
    this.onStatus('connecting');

    try {
      // Construct WebSocket URL with API key
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.config.apiKey}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.onStatus('connected');

        // Send initial setup configuration
        this.sendSetup();
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleServerMessage(response);
        } catch (err) {
          console.error('Failed to parse server message:', err);
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.isConnecting = false;
        this.onError('WebSocket connection error');
        this.onStatus('disconnected');
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.isConnecting = false;
        this.onStatus('disconnected');
      };

    } catch (err) {
      this.isConnecting = false;
      this.onError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
      this.onStatus('disconnected');
      throw err;
    }
  }

  /**
   * Send initial setup configuration
   */
  private sendSetup(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const setupMessage = {
      setup: {
        model: `models/${this.config.model}`,
        generation_config: {
          response_modalities: ['TEXT']
        }
      }
    };

    // Add system instruction if provided
    if (this.config.systemInstruction) {
      setupMessage.setup['system_instruction'] = {
        parts: [
          {
            text: this.config.systemInstruction
          }
        ]
      };
    }

    this.ws.send(JSON.stringify(setupMessage));
  }

  /**
   * Handle messages from the server
   */
  private handleServerMessage(response: any): void {
    // Handle setup complete
    if (response.setupComplete) {
      console.log('Setup complete');
      return;
    }

    // Handle server content (text responses)
    if (response.serverContent) {
      const parts = response.serverContent.modelTurn?.parts || [];

      for (const part of parts) {
        if (part.text) {
          this.onMessage(part.text);
        }
      }
      return;
    }

    // Handle tool calls or other message types
    if (response.toolCall) {
      console.log('Tool call received:', response.toolCall);
      return;
    }

    // Log unknown message types for debugging
    console.log('Unknown server message type:', response);
  }

  /**
   * Send a video frame to the API
   */
  sendVideoFrame(frame: VideoFrame): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send frame');
      return;
    }

    const message = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: frame.mimeType,
            data: frame.data
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send a text message (for custom prompts or instructions)
   */
  sendText(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send text');
      return;
    }

    const message = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [
              {
                text: text
              }
            ]
          }
        ],
        turnComplete: true
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Update the system instruction
   */
  updateSystemInstruction(instruction: string): void {
    this.config.systemInstruction = instruction;

    // Reconnect to apply new instruction
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if the session is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Capture a frame from a video element and convert to base64
 */
export function captureVideoFrame(video: HTMLVideoElement, quality = 0.8): VideoFrame | null {
  if (video.readyState < 2) {
    return null;
  }

  const canvas = document.createElement('canvas');

  // Gemini recommends 768x768 for best results at 1FPS
  const targetSize = 768;
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  // Draw video frame maintaining aspect ratio
  const aspectRatio = video.videoWidth / video.videoHeight;
  let drawWidth = targetSize;
  let drawHeight = targetSize;
  let offsetX = 0;
  let offsetY = 0;

  if (aspectRatio > 1) {
    // Landscape
    drawHeight = targetSize / aspectRatio;
    offsetY = (targetSize - drawHeight) / 2;
  } else {
    // Portrait
    drawWidth = targetSize * aspectRatio;
    offsetX = (targetSize - drawWidth) / 2;
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

  // Convert to base64 JPEG
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64Data = dataUrl.split(',')[1];

  return {
    mimeType: 'image/jpeg',
    data: base64Data
  };
}

/**
 * Gemini Completions API for single image descriptions (photo mode)
 */
export interface GeminiImageDescriptionResult {
  description: string;
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
}

/**
 * Describes an image using Gemini's REST API
 * @param apiKey - The Gemini API key
 * @param imageDataUrl - The image data URL (base64)
 * @param prompt - The prompt to use for image description
 * @returns The description or error
 */
export async function describeImageWithGemini(
  apiKey: string,
  imageDataUrl: string,
  prompt: string
): Promise<GeminiImageDescriptionResult> {
  try {
    // Extract base64 data without the data URL prefix
    const base64Data = imageDataUrl.includes('base64,')
      ? imageDataUrl.split('base64,')[1]
      : imageDataUrl;

    // Extract mime type from data URL
    const mimeTypeMatch = imageDataUrl.match(/data:([^;]+);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.4,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error?.message || `HTTP error! status: ${response.status}`;
      return {
        description: '',
        error: {
          message: errorMessage,
          type: errorData.error?.status,
          code: errorData.error?.code,
        },
      };
    }

    const data = await response.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No description available.';

    return { description };
  } catch (error) {
    return {
      description: '',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}
