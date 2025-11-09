const OPENAI_API_KEY_STORAGE_KEY = 'descam_openai_api_key';
const GEMINI_API_KEY_STORAGE_KEY = 'descam_gemini_api_key';
const MODE_STORAGE_KEY = 'descam_mode';
const OUTPUT_MODE_STORAGE_KEY = 'descam_output_mode';
const TTS_RATE_STORAGE_KEY = 'descam_tts_rate';
const TTS_VOICE_STORAGE_KEY = 'descam_tts_voice';
const CUSTOM_PROMPT_STORAGE_KEY = 'descam_custom_prompt';

export type AppMode = 'photo' | 'video';
export type OutputMode = 'aria' | 'tts';

// OpenAI API Key functions
function getApiKeyFromStorage(): string | null {
  try {
    return localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading API key from localStorage:', error);
    return null;
  }
}

function setApiKeyToStorage(apiKey: string): void {
  try {
    localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
  }
}

function removeApiKeyFromStorage(): void {
  try {
    localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing API key from localStorage:', error);
  }
}

// Gemini API Key functions
function getGeminiApiKeyFromStorage(): string | null {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading Gemini API key from localStorage:', error);
    return null;
  }
}

function setGeminiApiKeyToStorage(apiKey: string): void {
  try {
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving Gemini API key to localStorage:', error);
  }
}

function removeGeminiApiKeyFromStorage(): void {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing Gemini API key from localStorage:', error);
  }
}

// Mode functions
function getModeFromStorage(): AppMode {
  try {
    const mode = localStorage.getItem(MODE_STORAGE_KEY);
    return (mode === 'video' ? 'video' : 'photo') as AppMode;
  } catch (error) {
    console.error('Error reading mode from localStorage:', error);
    return 'photo';
  }
}

function setModeToStorage(mode: AppMode): void {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.error('Error saving mode to localStorage:', error);
  }
}

// Output mode functions
function getOutputModeFromStorage(): OutputMode {
  try {
    const outputMode = localStorage.getItem(OUTPUT_MODE_STORAGE_KEY);
    return (outputMode === 'tts' ? 'tts' : 'aria') as OutputMode;
  } catch (error) {
    console.error('Error reading output mode from localStorage:', error);
    return 'aria';
  }
}

function setOutputModeToStorage(outputMode: OutputMode): void {
  try {
    localStorage.setItem(OUTPUT_MODE_STORAGE_KEY, outputMode);
  } catch (error) {
    console.error('Error saving output mode to localStorage:', error);
  }
}

// TTS rate functions
function getTTSRateFromStorage(): number {
  try {
    const rate = localStorage.getItem(TTS_RATE_STORAGE_KEY);
    if (rate) {
      const parsed = parseFloat(rate);
      // Ensure rate is between 0.5 and 2.0
      return Math.min(Math.max(parsed, 0.5), 2.0);
    }
    return 1.0; // Default rate
  } catch (error) {
    console.error('Error reading TTS rate from localStorage:', error);
    return 1.0;
  }
}

function setTTSRateToStorage(rate: number): void {
  try {
    localStorage.setItem(TTS_RATE_STORAGE_KEY, rate.toString());
  } catch (error) {
    console.error('Error saving TTS rate to localStorage:', error);
  }
}

// TTS voice functions
function getTTSVoiceFromStorage(): string | null {
  try {
    return localStorage.getItem(TTS_VOICE_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading TTS voice from localStorage:', error);
    return null;
  }
}

function setTTSVoiceToStorage(voiceURI: string): void {
  try {
    localStorage.setItem(TTS_VOICE_STORAGE_KEY, voiceURI);
  } catch (error) {
    console.error('Error saving TTS voice to localStorage:', error);
  }
}

// Custom prompt functions
function getCustomPromptFromStorage(): string | null {
  try {
    return localStorage.getItem(CUSTOM_PROMPT_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading custom prompt from localStorage:', error);
    return null;
  }
}

function setCustomPromptToStorage(prompt: string): void {
  try {
    localStorage.setItem(CUSTOM_PROMPT_STORAGE_KEY, prompt);
  } catch (error) {
    console.error('Error saving custom prompt to localStorage:', error);
  }
}

function removeCustomPromptFromStorage(): void {
  try {
    localStorage.removeItem(CUSTOM_PROMPT_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing custom prompt from localStorage:', error);
  }
}

// Svelte 5 reactive state
let apiKey = $state<string | null>(getApiKeyFromStorage());
let geminiApiKey = $state<string | null>(getGeminiApiKeyFromStorage());
let mode = $state<AppMode>(getModeFromStorage());
let outputMode = $state<OutputMode>(getOutputModeFromStorage());
let ttsRate = $state<number>(getTTSRateFromStorage());
let ttsVoice = $state<string | null>(getTTSVoiceFromStorage());

// OpenAI API Key exports
export function getApiKey(): string | null {
  return apiKey;
}

export function setApiKey(key: string): void {
  apiKey = key;
  setApiKeyToStorage(key);
}

export function removeApiKey(): void {
  apiKey = null;
  removeApiKeyFromStorage();
}

// Gemini API Key exports
export function getGeminiApiKey(): string | null {
  return geminiApiKey;
}

export function setGeminiApiKey(key: string): void {
  geminiApiKey = key;
  setGeminiApiKeyToStorage(key);
}

export function removeGeminiApiKey(): void {
  geminiApiKey = null;
  removeGeminiApiKeyFromStorage();
}

// Mode exports
export function getMode(): AppMode {
  return mode;
}

export function setMode(newMode: AppMode): void {
  mode = newMode;
  setModeToStorage(newMode);
}

// Output mode exports
export function getOutputMode(): OutputMode {
  return outputMode;
}

export function setOutputMode(newOutputMode: OutputMode): void {
  outputMode = newOutputMode;
  setOutputModeToStorage(newOutputMode);
}

// TTS rate exports
export function getTTSRate(): number {
  return ttsRate;
}

export function setTTSRate(newRate: number): void {
  // Ensure rate is between 0.5 and 2.0
  const clampedRate = Math.min(Math.max(newRate, 0.5), 2.0);
  ttsRate = clampedRate;
  setTTSRateToStorage(clampedRate);
}

// TTS voice exports
export function getTTSVoice(): string | null {
  return ttsVoice;
}

export function setTTSVoice(voiceURI: string): void {
  ttsVoice = voiceURI;
  setTTSVoiceToStorage(voiceURI);
}

// Custom prompt exports
export function getCustomPrompt(): string | null {
  return getCustomPromptFromStorage();
}

export function setCustomPrompt(prompt: string): void {
  setCustomPromptToStorage(prompt);
}

export function removeCustomPrompt(): void {
  removeCustomPromptFromStorage();
}
