/**
 * Gemini Live API integration for real-time video streaming
 */

import { GoogleGenAI, Modality } from '@google/genai';

export interface GeminiConfig {
  apiKey: string;
  systemInstruction?: string;
  model?: string;
}

export interface VideoFrame {
  mimeType: string;
  data: string; // base64 encoded
}

export interface VideoChunk {
  mimeType: string;
  data: string; // base64 encoded video chunk
}

export type MessageHandler = (description: string) => void;
export type ErrorHandler = (error: string) => void;
export type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected') => void;

export class GeminiLiveSession {
  private config: GeminiConfig;
  private onMessage: MessageHandler;
  private onError: ErrorHandler;
  private onStatus: StatusHandler;
  private session: any = null;
  private ai: GoogleGenAI;
  private accumulatedText: string = '';
  private textAccumulationTimer: number | null = null;

  constructor(
    config: GeminiConfig,
    onMessage: MessageHandler,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ) {
    this.config = {
      model: 'gemini-2.0-flash-live-001',
      systemInstruction: 'You give short concise descriptions of the video you are given. Listen to the user\'s instructions and focus on what they are asking.',
      ...config
    };
    this.onMessage = onMessage;
    this.onError = onError;
    this.onStatus = onStatus;

    // Initialize the Google GenAI client
    this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * Connect to the Gemini Live API using SDK
   */
  async connect(): Promise<void> {
    console.log('=== CONNECT METHOD CALLED ===');
    console.log('Session exists?', !!this.session);

    if (this.session) {
      console.log('Already connected');
      return;
    }

    try {
      console.log('Calling onStatus with "connecting"');
      this.onStatus('connecting');

      const config: any = {
        responseModalities: [Modality.TEXT]
      };

      // Add system instruction to config if provided
      if (this.config.systemInstruction) {
        console.log('Adding system instruction:', this.config.systemInstruction);
        config.systemInstruction = {
          parts: [{ text: this.config.systemInstruction }]
        };
      }

      console.log('Calling ai.live.connect with model:', this.config.model);
      console.log('Config:', config);

      this.session = await this.ai.live.connect({
        model: this.config.model!,
        config: config,
        callbacks: {
          onopen: () => {
            console.log('=== ONOPEN CALLBACK TRIGGERED ===');
            this.onStatus('connected');
          },
          onmessage: (message: any) => {
            console.log('=== ONMESSAGE CALLBACK TRIGGERED ===');
            this.handleServerMessage(message);
          },
          onerror: (e: any) => {
            console.error('=== ONERROR CALLBACK TRIGGERED ===');
            console.error('Error:', e);
            this.onError(e.message || 'Connection error');
            this.onStatus('disconnected');
          },
          onclose: (e: any) => {
            console.log('=== ONCLOSE CALLBACK TRIGGERED ===');
            console.log('Close reason:', e.reason);
            this.onStatus('disconnected');
            this.session = null;
          }
        }
      });

      console.log('=== SESSION CREATED ===');
      console.log('Session object:', this.session);
      console.log('Has sendClientContent?', typeof this.session?.sendClientContent);
      console.log('Has sendRealtimeInput?', typeof this.session?.sendRealtimeInput);
    } catch (err) {
      console.error('=== CONNECT ERROR ===');
      console.error('Error:', err);
      this.onError(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
      this.onStatus('disconnected');
      throw err;
    }
  }

  /**
   * Handle messages from the server
   */
  private handleServerMessage(message: any): void {
    console.log('Raw message received:', message);

    // Use the built-in text getter from LiveServerMessage
    const text = message.text;
    console.log('Message text:', text);

    // Check if turn is complete using comprehensive check
    const turnComplete = this.isTurnComplete(message);
    console.log('Turn complete:', turnComplete);

    // Accumulate text chunks
    if (text && text.trim().length > 0) {
      this.accumulatedText += text;
      console.log('Accumulated text so far:', this.accumulatedText);

      // Clear any existing timer
      if (this.textAccumulationTimer !== null) {
        clearTimeout(this.textAccumulationTimer);
      }

      // Set a timer to send accumulated text after 300ms of no new text
      this.textAccumulationTimer = window.setTimeout(() => {
        if (this.accumulatedText.trim().length > 0) {
          console.log('No new text for 300ms - sending accumulated text:', this.accumulatedText);
          this.onMessage(this.accumulatedText.trim());
          this.accumulatedText = '';
          this.textAccumulationTimer = null;
        }
      }, 300);
    }

    // Send complete message immediately when turn is done
    if (turnComplete && this.accumulatedText.trim().length > 0) {
      console.log('Turn complete - sending accumulated text immediately:', this.accumulatedText);

      // Clear the timer since we're sending now
      if (this.textAccumulationTimer !== null) {
        clearTimeout(this.textAccumulationTimer);
        this.textAccumulationTimer = null;
      }

      this.onMessage(this.accumulatedText.trim());
      this.accumulatedText = ''; // Reset for next turn
      return;
    }

    // Handle tool calls or other message types
    if (message.toolCall) {
      console.log('Tool call received:', message.toolCall);
      return;
    }

    // Log setup complete
    if (message.setupComplete) {
      console.log('Setup complete:', message.setupComplete);
      return;
    }

    // Log other message types if no text
    if (!text) {
      console.log('No text in message, message type:', Object.keys(message));
    }
  }

  private isTurnComplete(response: any): boolean {
    if (response.turnComplete) return true;
    if (response.serverContent?.event === 'TURN_COMPLETE') return true;
    if (response.realtimeOutput?.event === 'TURN_COMPLETE') return true;
    if (response.serverContent?.realtimeOutput?.event === 'TURN_COMPLETE') return true;
    if (response.serverEvent === 'TURN_COMPLETE') return true;
    return false;
  }

  private extractErrorMessage(response: any): string | null {
    const errorCandidates = [
      response.error,
      response.serverError,
      response.serverContent?.error,
      response.serverContent?.modelResponse?.error,
      response.serverContent?.modelResponse?.status?.state === 'ERROR'
        ? response.serverContent?.modelResponse?.status
        : null,
      response.realtimeOutput?.error,
      response.realtimeOutput?.modelResponse?.error
    ];

    for (const candidate of errorCandidates) {
      if (!candidate) continue;

      if (typeof candidate === 'string') {
        return candidate;
      }

      const message = candidate.message ?? candidate.details ?? candidate.statusMessage;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message.trim();
      }

      const code = candidate.code ?? candidate.status;
      if (typeof code === 'string' && code.trim().length > 0) {
        return `Gemini error (${code.trim()})`;
      }
    }

    return null;
  }

  private isTurnComplete(response: any): boolean {
    if (response.turnComplete) return true;
    if (response.serverContent?.event === 'TURN_COMPLETE') return true;
    if (response.realtimeOutput?.event === 'TURN_COMPLETE') return true;
    if (response.serverContent?.realtimeOutput?.event === 'TURN_COMPLETE') return true;
    if (response.serverEvent === 'TURN_COMPLETE') return true;
    return false;
  }

  private extractTextsFromResponse(response: any): string[] {
    const texts: string[] = [];

    const pushText = (value?: string) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          texts.push(trimmed);
        }
      }
    };

    const collectParts = (parts?: any[]) => {
      if (!Array.isArray(parts)) return;
      for (const part of parts) {
        pushText(part?.text);
      }
    };

    collectParts(response.serverContent?.modelTurn?.parts);

    const serverTurns = response.serverContent?.turns;
    if (Array.isArray(serverTurns)) {
      serverTurns.forEach((turn: any) => collectParts(turn?.parts));
    }

    collectParts(response.modelTurn?.parts);

    const candidates = response.candidates;
    if (Array.isArray(candidates)) {
      candidates.forEach((candidate: any) => collectParts(candidate?.content?.parts));
    }

    collectParts(response.content?.parts);
    collectParts(response.output?.content?.parts);
    collectParts(response.reply?.parts);
    collectParts(response.realtimeOutput?.modelTurn?.parts);

    const modelOutputs = response.serverContent?.modelResponse?.output;
    if (Array.isArray(modelOutputs)) {
      modelOutputs.forEach((output: any) => collectParts(output?.content?.parts));
    }

    pushText(response.text);
    pushText(response.serverContent?.text);

    return texts;
  }

  /**
   * Send a text prompt to the API using turn-based conversation.
   */
  sendPrompt(prompt: { text?: string; frame?: VideoFrame }, turnComplete = true): void {
    console.log('sendPrompt called with:', prompt, 'turnComplete:', turnComplete);

    if (!this.session) {
      console.warn('Session not connected, cannot send prompt');
      return;
    }

    // If there's a video frame, use sendRealtimeInput instead
    if (prompt.frame) {
      this.sendVideoFrame(prompt.frame);
      // If there's also text, send it separately
      if (prompt.text) {
        this.sendTextPrompt(prompt.text, turnComplete);
      }
      return;
    }

    // For text-only prompts, use sendClientContent
    if (prompt.text) {
      console.log('Sending text prompt:', prompt.text);
      this.sendTextPrompt(prompt.text, turnComplete);
    }
  }

  /**
   * Send a text prompt using turn-based conversation
   */
  private sendTextPrompt(text: string, turnComplete = true): void {
    if (!this.session) {
      console.warn('Session not available in sendTextPrompt');
      return;
    }

    const turns = [
      {
        role: 'user',
        parts: [{ text }]
      }
    ];

    console.log('Calling sendClientContent with turns:', turns);

    // Use SDK's sendClientContent method with turns
    this.session.sendClientContent({ turns, turnComplete });

    console.log('sendClientContent called successfully');
  }

  /**
   * Send a video frame (image) to the API using realtime input
   * This sends JPEG frames at ~1 FPS as per Gemini Live API best practices
   */
  sendVideoFrame(frame: VideoFrame): void {
    if (!this.session) {
      console.warn('Session not connected, cannot send video frame');
      return;
    }

    console.log('Sending video frame, mimeType:', frame.mimeType, 'data length:', frame.data.length);

    // The SDK expects a Blob object with data (base64) and mimeType properties
    const blob = {
      data: frame.data,
      mimeType: frame.mimeType
    };

    // Use SDK's sendRealtimeInput for video frames
    this.session.sendRealtimeInput({ video: blob });
    console.log('Video frame sent');
  }

  /**
   * Send a video chunk to the API using realtime input (optimized for streaming)
   */
  sendVideoChunk(chunk: VideoChunk): void {
    console.log('=== SEND VIDEO CHUNK CALLED ===');
    console.log('Session exists?', !!this.session);

    if (!this.session) {
      console.warn('Session not connected, cannot send video chunk');
      return;
    }

    // The SDK expects a Blob object with data (base64) and mimeType properties
    const blob = {
      data: chunk.data,
      mimeType: chunk.mimeType
    };

    console.log('Sending video chunk, mimeType:', chunk.mimeType, 'data length:', chunk.data.length);

    // Use SDK's sendRealtimeInput for video chunks
    this.session.sendRealtimeInput({ video: blob });

    console.log('Video chunk sent via sendRealtimeInput');
  }

  /**
   * Send PCM audio data to the API using realtime input
   * Audio must be 16-bit PCM, 16kHz, mono, base64-encoded
   */
  sendAudioChunk(audioData: string): void {
    if (!this.session) {
      console.warn('Session not connected, cannot send audio chunk');
      return;
    }

    console.log('Sending audio chunk, data length:', audioData.length);

    const blob = {
      data: audioData,
      mimeType: 'audio/pcm'
    };

    // Use SDK's sendRealtimeInput for audio
    this.session.sendRealtimeInput({ audio: blob });
    console.log('Audio chunk sent');
  }

  /**
   * Update the system instruction
   */
  updateSystemInstruction(instruction: string): void {
    this.config.systemInstruction = instruction;

    // Reconnect to apply new instruction
    if (this.session) {
      this.disconnect();
      setTimeout(() => this.connect(), 100);
    }
  }

  /**
   * Disconnect from the session
   */
  disconnect(): void {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }

  /**
   * Check if the session is connected
   */
  isConnected(): boolean {
    return this.session !== null;
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
