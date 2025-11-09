/**
 * Text-to-Speech utility using Web Speech API
 */

export type TTSStatus = 'idle' | 'speaking' | 'paused';

export class TextToSpeech {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStatusChange?: (status: TTSStatus) => void;

  constructor(onStatusChange?: (status: TTSStatus) => void) {
    if (!('speechSynthesis' in window)) {
      throw new Error('Text-to-speech is not supported in this browser');
    }

    this.synth = window.speechSynthesis;
    this.onStatusChange = onStatusChange;
  }

  /**
   * Speak the given text
   */
  speak(text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
    voiceURI?: string;
  }): void {
    // Cancel any ongoing speech
    this.cancel();

    if (!text.trim()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set options with defaults
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = options?.lang ?? 'en-US';

    // Set voice if voiceURI is provided
    if (options?.voiceURI) {
      const voices = this.getVoices();
      const selectedVoice = voices.find(voice => voice.voiceURI === options.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      this.onStatusChange?.('speaking');
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      this.onStatusChange?.('idle');
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      this.currentUtterance = null;
      this.onStatusChange?.('idle');
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Cancel current speech
   */
  cancel(): void {
    if (this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
      this.onStatusChange?.('idle');
    }
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.onStatusChange?.('paused');
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
      this.onStatusChange?.('speaking');
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth.speaking;
  }

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return this.synth.paused;
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Get language-specific voice
   */
  getVoiceForLanguage(lang: string): SpeechSynthesisVoice | undefined {
    const voices = this.getVoices();
    return voices.find(voice => voice.lang.startsWith(lang));
  }
}

/**
 * Helper function to get TTS language from app language
 */
export function getTTSLanguage(appLanguage: string): string {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'de': 'de-DE',
    'fr': 'fr-FR',
    'it': 'it-IT',
  };

  return languageMap[appLanguage] || 'en-US';
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
  return 'speechSynthesis' in window;
}
