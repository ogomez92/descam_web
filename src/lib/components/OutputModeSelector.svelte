<script lang="ts">
  import { getOutputMode, setOutputMode, type OutputMode, getTTSRate, setTTSRate, getTTSVoice, setTTSVoice } from '../storage.svelte';
  import { getTranslations, getCurrentLanguage } from '../i18n/store.svelte';
  import { isTTSSupported, TextToSpeech } from '../tts';

  interface Props {
    tts: TextToSpeech | null;
  }

  let { tts }: Props = $props();

  let t = $derived(getTranslations());
  let currentMode = $derived(getOutputMode());
  let ttsSupported = $state(isTTSSupported());
  let ttsRate = $derived(getTTSRate());
  let ttsVoice = $derived(getTTSVoice());
  let isSpeaking = $state(false);
  let availableVoices = $state<SpeechSynthesisVoice[]>([]);

  // Load available voices on mount only (not in reactive effect)
  import { onMount, onDestroy } from 'svelte';

  let checkSpeakingInterval: number | null = null;
  let voicesChangedHandler: (() => void) | null = null;

  onMount(() => {
    if (ttsSupported && typeof window !== 'undefined' && window.speechSynthesis) {
      // Load voices initially
      availableVoices = window.speechSynthesis.getVoices();

      // Always listen for async voice loading (don't poll)
      voicesChangedHandler = () => {
        availableVoices = window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', voicesChangedHandler);
    }
  });

  onDestroy(() => {
    // Clean up voices event listener
    if (voicesChangedHandler && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedHandler);
      voicesChangedHandler = null;
    }

    // Clean up speaking interval
    if (checkSpeakingInterval) {
      clearInterval(checkSpeakingInterval);
      checkSpeakingInterval = null;
    }
  });

  // Watch for TTS state changes
  $effect(() => {
    if (tts && !checkSpeakingInterval) {
      // Start checking speaking state
      checkSpeakingInterval = window.setInterval(() => {
        const speaking = window.speechSynthesis?.speaking || false;
        if (isSpeaking !== speaking) {
          isSpeaking = speaking;
        }
      }, 250);
    } else if (!tts && checkSpeakingInterval) {
      // Stop checking
      clearInterval(checkSpeakingInterval);
      checkSpeakingInterval = null;
      isSpeaking = false;
    }

    return () => {
      if (checkSpeakingInterval) {
        clearInterval(checkSpeakingInterval);
        checkSpeakingInterval = null;
      }
    };
  });

  function handleModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setOutputMode(target.value as OutputMode);
  }

  function handleStopTTS() {
    if (tts) {
      tts.cancel();
      isSpeaking = false;
    }
  }

  function handleRateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newRate = parseFloat(target.value);
    setTTSRate(newRate);
  }

  function handleVoiceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setTTSVoice(target.value);
  }
</script>

<div class="output-mode-selector">
  <fieldset>
    <legend>{t.outputMode.label}</legend>

    <div class="radio-group">
      <label class="radio-label">
        <input
          type="radio"
          name="output-mode"
          value="aria"
          checked={currentMode === 'aria'}
          onchange={handleModeChange}
        />
        <span class="radio-text">
          <strong>{t.outputMode.aria}</strong>
          <span class="radio-description">{t.outputMode.ariaDescription}</span>
        </span>
      </label>

      <label class="radio-label" class:disabled={!ttsSupported}>
        <input
          type="radio"
          name="output-mode"
          value="tts"
          checked={currentMode === 'tts'}
          disabled={!ttsSupported}
          onchange={handleModeChange}
        />
        <span class="radio-text">
          <strong>{t.outputMode.tts}</strong>
          <span class="radio-description">
            {ttsSupported ? t.outputMode.ttsDescription : t.outputMode.ttsNotSupported}
          </span>
        </span>
      </label>
    </div>

    {#if currentMode === 'tts'}
      <div class="tts-controls">
        <button class="stop-tts-button" onclick={handleStopTTS} disabled={!isSpeaking}>
          {t.outputs.stopTTS}
        </button>
        <div class="voice-control">
          <label for="tts-voice">{t.outputs.ttsVoice || 'Voice'}</label>
          <select
            id="tts-voice"
            value={ttsVoice || ''}
            onchange={handleVoiceChange}
          >
            <option value="">{t.outputs.ttsVoiceDefault || 'Default'}</option>
            {#each availableVoices as voice (voice.voiceURI)}
              <option value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            {/each}
          </select>
        </div>
        <div class="rate-control">
          <label for="tts-rate">{t.outputs.ttsRate}: {ttsRate.toFixed(1)}x</label>
          <input
            id="tts-rate"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={ttsRate}
            oninput={handleRateChange}
          />
        </div>
      </div>
    {/if}
  </fieldset>
</div>

<style>
  .output-mode-selector {
    margin-bottom: 1.5rem;
  }

  fieldset {
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin: 0;
  }

  legend {
    font-weight: 600;
    font-size: 1rem;
    padding: 0 0.5rem;
    color: #2d3748;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .radio-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .radio-label:hover:not(.disabled) {
    background-color: #f7fafc;
  }

  .radio-label.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  input[type="radio"] {
    margin-top: 0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    flex-shrink: 0;
  }

  input[type="radio"]:disabled {
    cursor: not-allowed;
  }

  .radio-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .radio-text strong {
    font-size: 0.95rem;
    color: #2d3748;
  }

  .radio-description {
    font-size: 0.85rem;
    color: #718096;
    line-height: 1.4;
  }

  .tts-controls {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 1.5rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .stop-tts-button {
    padding: 0.5rem 1rem;
    background: #f56565;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .stop-tts-button:hover:not(:disabled) {
    background: #e53e3e;
  }

  .stop-tts-button:active:not(:disabled) {
    background: #c53030;
  }

  .stop-tts-button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    opacity: 0.6;
  }

  .voice-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .voice-control label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2d3748;
  }

  .voice-control select {
    padding: 0.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .voice-control select:hover {
    border-color: #cbd5e0;
  }

  .voice-control select:focus {
    outline: none;
    border-color: #4299e1;
  }

  .rate-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .rate-control label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2d3748;
  }

  .rate-control input[type="range"] {
    width: 100%;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    fieldset {
      padding: 0.75rem;
    }

    legend {
      font-size: 0.9rem;
    }

    .radio-label {
      padding: 0.5rem;
    }

    .radio-text strong {
      font-size: 0.9rem;
    }

    .radio-description {
      font-size: 0.8rem;
    }

    .tts-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .voice-control {
      min-width: 100%;
    }

    .rate-control {
      min-width: 100%;
    }
  }
</style>
