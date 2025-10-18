const API_KEY_STORAGE_KEY = 'descam_openai_api_key';

function getApiKeyFromStorage(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading API key from localStorage:', error);
    return null;
  }
}

function setApiKeyToStorage(apiKey: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
  }
}

function removeApiKeyFromStorage(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing API key from localStorage:', error);
  }
}

// Svelte 5 reactive state
let apiKey = $state<string | null>(getApiKeyFromStorage());

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
