export type CameraPermissionStatus = 'granted' | 'denied' | 'unknown';

export type VideoSourceType = 'camera' | 'screen';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface VideoSource {
  type: VideoSourceType;
  stream: MediaStream;
  device?: CameraDevice;
}

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionStatus> {
  try {
    // First try the permissions API
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
      } catch (error) {
        // Permissions API query failed, try alternative method
      }
    }

    // Alternative: Check if we can enumerate devices with labels
    // If device labels are available, permission was granted
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // If we have video devices with labels, permission is granted
      if (videoDevices.length > 0 && videoDevices[0].label) {
        return 'granted';
      }

      // If we have video devices but no labels, permission not granted yet
      if (videoDevices.length > 0 && !videoDevices[0].label) {
        return 'unknown';
      }
    }

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get list of available video input devices (cameras)
 */
export async function enumerateCameras(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));

    return videoDevices;
  } catch (error) {
    console.error('Error enumerating cameras:', error);
    return [];
  }
}

/**
 * Request camera access and return the video stream
 */
export async function getCameraStream(deviceId?: string, facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
  // Check if the browser supports mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Camera access is not supported in this browser. Please use HTTPS or a modern browser.'
    );
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        : {
            facingMode: facingMode, // 'user' = front camera, 'environment' = back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to access camera'
    );
  }
}

/**
 * Capture a frame from the video stream as a data URL
 */
export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Stop a media stream
 */
export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Create a silent audio track conforming to API requirements:
 * - 16-bit PCM
 * - 16kHz sample rate
 * - Mono (1 channel)
 */
function createSilentAudioTrack(): MediaStreamTrack {
  // Create AudioContext with 16kHz sample rate as required by Gemini API
  const audioContext = new AudioContext({ sampleRate: 16000 });

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Set gain to 0 for silence
  gainNode.gain.value = 0;

  oscillator.connect(gainNode);

  // Create destination with mono channel (1 channel)
  const destination = audioContext.createMediaStreamDestination();
  gainNode.connect(destination);
  oscillator.start();

  const audioTrack = destination.stream.getAudioTracks()[0];

  console.log('Silent audio track created with settings:');
  console.log('- Sample rate: 16kHz');
  console.log('- Channels: mono (1)');
  console.log('- Format: PCM (handled by browser)');

  return audioTrack;
}

/**
 * Audio generator for creating PCM audio stream from microphone or silent audio
 * Used to satisfy Gemini Live API's audio requirement
 */
export class VideoRecorder {
  private stream: MediaStream;
  private microphoneStream: MediaStream | null = null;
  private onAudioChunk?: (audioData: string) => void;
  private audioContext: AudioContext | null = null;
  private audioWorkletNode: ScriptProcessorNode | null = null;
  private useMicrophone: boolean;

  constructor(
    stream: MediaStream,
    onChunk: (chunk: Blob, mimeType: string) => void,
    chunkInterval = 1000,
    onAudioChunk?: (audioData: string) => void,
    useMicrophone = false
  ) {
    this.stream = stream;
    this.onAudioChunk = onAudioChunk;
    this.useMicrophone = useMicrophone;
  }

  /**
   * Start generating PCM audio (from microphone or silent)
   */
  async start(): Promise<void> {
    console.log('VideoRecorder.start() called');
    console.log('audioContext exists:', !!this.audioContext);
    console.log('onAudioChunk exists:', !!this.onAudioChunk);
    console.log('useMicrophone:', this.useMicrophone);

    if (this.audioContext) {
      console.warn('Audio generation already started');
      return;
    }

    // Start PCM audio generation if callback provided
    if (this.onAudioChunk) {
      console.log('Starting audio generation...');
      if (this.useMicrophone) {
        console.log('Using microphone');
        await this.startMicrophoneAudio();
      } else {
        console.log('Using silent audio');
        this.startPCMAudioGeneration();
      }
    } else {
      console.warn('No audio chunk callback provided!');
    }
  }

  /**
   * Request microphone access and start capturing real audio
   */
  private async startMicrophoneAudio(): Promise<void> {
    console.log('startMicrophoneAudio called');
    try {
      console.log('Requesting microphone access...');
      // Request microphone access
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 16000, // 16kHz
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log('Microphone access granted');
      console.log('Microphone stream:', this.microphoneStream);

      // Create AudioContext with 16kHz sample rate
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Create source from microphone stream
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);

      // Use ScriptProcessorNode to capture PCM audio
      // Buffer size of 4096 samples = ~256ms at 16kHz
      this.audioWorkletNode = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(this.audioWorkletNode);
      this.audioWorkletNode.connect(this.audioContext.destination);

      this.audioWorkletNode.onaudioprocess = (audioProcessingEvent) => {
        if (!this.onAudioChunk) return;

        const inputBuffer = audioProcessingEvent.inputBuffer;
        const inputData = inputBuffer.getChannelData(0); // Mono channel

        // Convert Float32Array to Int16Array (16-bit PCM)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp to [-1, 1] and convert to 16-bit
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const base64Audio = this.arrayBufferToBase64(pcmData.buffer);
        this.onAudioChunk(base64Audio);
      };

      console.log('Microphone audio capture started (16kHz, mono, 16-bit)');
    } catch (error) {
      console.error('Failed to access microphone:', error);
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      throw new Error('Microphone access denied or not available: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Generate silent PCM audio at 16kHz mono
   */
  private startPCMAudioGeneration(): void {
    console.log('startPCMAudioGeneration called');

    // Create AudioContext with 16kHz sample rate
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    console.log('AudioContext created with sample rate:', this.audioContext.sampleRate);

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Set gain to 0 for silence
    gainNode.gain.value = 0;

    oscillator.connect(gainNode);

    // Use ScriptProcessorNode to capture PCM audio
    // Buffer size of 4096 samples = ~256ms at 16kHz
    this.audioWorkletNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    console.log('ScriptProcessorNode created');

    gainNode.connect(this.audioWorkletNode);
    this.audioWorkletNode.connect(this.audioContext.destination);

    this.audioWorkletNode.onaudioprocess = (audioProcessingEvent) => {
      console.log('onaudioprocess triggered');
      if (!this.onAudioChunk) {
        console.log('No audio chunk callback');
        return;
      }

      const inputBuffer = audioProcessingEvent.inputBuffer;
      const inputData = inputBuffer.getChannelData(0); // Mono channel

      // Convert Float32Array to Int16Array (16-bit PCM)
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Clamp to [-1, 1] and convert to 16-bit
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to base64
      const base64Audio = this.arrayBufferToBase64(pcmData.buffer);
      console.log('Calling audio chunk callback with', base64Audio.length, 'bytes');
      this.onAudioChunk(base64Audio);
    };

    oscillator.start();
    console.log('PCM audio generation started (16kHz, mono, 16-bit)');
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Stop PCM audio generation
   */
  stop(): void {
    // Stop and clean up PCM audio generation
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
      console.log('PCM audio generation stopped');
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      console.log('Audio context closed');
    }

    // Stop microphone stream if it was used
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
      console.log('Microphone stream stopped');
    }
  }

  /**
   * Check if audio generation is active
   */
  isRecording(): boolean {
    return this.audioContext !== null;
  }
}

/**
 * Request screen capture access and return the display stream
 */
export async function getScreenStream(): Promise<MediaStream> {
  // Check if the browser supports getDisplayMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error(
      'Screen capture is not supported in this browser. Please use a modern browser.'
    );
  }

  try {
    const constraints: DisplayMediaStreamOptions = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false, // Don't capture audio as per user request
    };

    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return stream;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Screen capture permission denied');
      }
      throw new Error(error.message);
    }
    throw new Error('Failed to capture screen');
  }
}
