<script lang="ts">
  import { getOutputMode, setOutputMode, type OutputMode } from '../storage.svelte';
  import { getTranslations, getCurrentLanguage } from '../i18n/store.svelte';
  import { isTTSSupported } from '../tts';

  let t = $derived(getTranslations());
  let currentMode = $derived(getOutputMode());
  let ttsSupported = $state(isTTSSupported());

  function handleModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setOutputMode(target.value as OutputMode);
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
  }
</style>
