<script lang="ts">
  import { getApiKey, getGeminiApiKey, getMode, setMode, type AppMode, getOutputMode, getTTSRate, setTTSRate } from './lib/storage.svelte';
  import { getTranslations } from './lib/i18n/store.svelte';
  import Onboarding from './lib/components/Onboarding.svelte';
  import CameraCapture from './lib/components/CameraCapture.svelte';
  import VideoCapture from './lib/components/VideoCapture.svelte';
  import History from './lib/components/History.svelte';
  import Footer from './lib/components/Footer.svelte';
  import LanguageSelector from './lib/components/LanguageSelector.svelte';
  import { TextToSpeech } from './lib/tts';
  import { onDestroy } from 'svelte';

  let descriptions = $state<string[]>([]);
  let modeAnnouncementElement = $state<HTMLDivElement>();
  let modeErrorElement = $state<HTMLDivElement>();
  let modeErrorMessage = $state('');
  let tts: TextToSpeech | null = null;
  let outputMode = $derived(getOutputMode());
  let ttsRate = $derived(getTTSRate());

  function handleDescriptionComplete(description: string) {
    descriptions = [description, ...descriptions];
  }

  let hasApiKey = $derived(!!getApiKey() || !!getGeminiApiKey());
  let hasGeminiKey = $derived(!!getGeminiApiKey());
  let currentMode = $derived(getMode());
  let t = $derived(getTranslations());

  let pageTitle = $derived(
    currentMode === 'video' ? t.videoModeTitle : t.photoModeTitle
  );

  let modeAnnouncement = $derived(
    currentMode === 'video' ? t.mode.currentModeVideo : t.mode.currentModePhoto
  );

  function switchMode() {
    const newMode: AppMode = currentMode === 'photo' ? 'video' : 'photo';

    // Check if trying to switch to video without Gemini key
    if (newMode === 'video' && !hasGeminiKey) {
      modeErrorMessage = t.mode.geminiKeyRequiredForVideo;

      // Clear error after 5 seconds
      setTimeout(() => {
        modeErrorMessage = '';
      }, 5000);

      return;
    }

    modeErrorMessage = '';
    setMode(newMode);

    // Trigger ARIA announcement
    if (modeAnnouncementElement) {
      // Force screen readers to announce by updating the element
      modeAnnouncementElement.textContent = '';
      setTimeout(() => {
        if (modeAnnouncementElement) {
          modeAnnouncementElement.textContent = newMode === 'video'
            ? t.mode.currentModeVideo
            : t.mode.currentModePhoto;
        }
      }, 100);
    }
  }

  function handleStopTTS() {
    if (tts) {
      tts.cancel();
    }
  }

  function handleRateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newRate = parseFloat(target.value);
    setTTSRate(newRate);
  }

  onDestroy(() => {
    if (tts) {
      tts.cancel();
    }
  });
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<!-- ARIA live region for mode announcements -->
<div
  bind:this={modeAnnouncementElement}
  class="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {modeAnnouncement}
</div>

{#if !hasApiKey}
  <Onboarding />
{:else}
  <main>
    <div class="container">
      <header>
        <div class="header-content">
          <h1>{pageTitle}</h1>
          <div class="header-controls">
            <button
              class="mode-switch-button"
              onclick={switchMode}
              aria-label={t.mode.switchModeAriaLabel}
            >
              {currentMode === 'photo' ? t.mode.switchToVideo : t.mode.switchToPhoto}
            </button>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {#if modeErrorMessage}
        <div class="mode-error-alert" role="alert">
          {modeErrorMessage}
        </div>
      {/if}

      {#if currentMode === 'photo'}
        <CameraCapture onDescriptionComplete={handleDescriptionComplete} />
        {#if descriptions.length > 0}
          <fieldset class="outputs-fieldset">
            <legend>{t.outputs.legend}</legend>
            {#if outputMode === 'tts'}
              <div class="outputs-controls">
                <button class="stop-tts-button" onclick={handleStopTTS}>
                  {t.outputs.stopTTS}
                </button>
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
            <History {descriptions} />
          </fieldset>
        {/if}
      {:else}
        <VideoCapture />
      {/if}
    </div>
  </main>

  <Footer />
{/if}

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  main {
    min-height: calc(100vh - 200px);
    padding: 2rem 1rem;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 2rem;
  }

  .mode-error-alert {
    padding: 1rem;
    margin-bottom: 1.5rem;
    background: #fed7d7;
    color: #9b2c2c;
    border-radius: 8px;
    border-left: 4px solid #f56565;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .mode-switch-button {
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .mode-switch-button:hover {
    background: #3182ce;
  }

  .mode-switch-button:active {
    background: #2c5282;
  }

  .mode-switch-button:focus {
    outline: 3px solid #4299e1;
    outline-offset: 2px;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    color: #1a202c;
    font-weight: 700;
  }

  .outputs-fieldset {
    margin-top: 2rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
  }

  .outputs-fieldset legend {
    font-weight: 600;
    font-size: 1.125rem;
    padding: 0 0.5rem;
    color: #2d3748;
  }

  .outputs-controls {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
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

  .stop-tts-button:hover {
    background: #e53e3e;
  }

  .stop-tts-button:active {
    background: #c53030;
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
    main {
      padding: 1.5rem 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .header-controls {
      width: 100%;
      justify-content: space-between;
    }

    h1 {
      font-size: 1.5rem;
    }

    .mode-switch-button {
      font-size: 0.85rem;
      padding: 0.4rem 0.8rem;
    }

    .outputs-fieldset {
      padding: 1rem;
    }

    .outputs-fieldset legend {
      font-size: 1rem;
    }

    .outputs-controls {
      flex-direction: column;
      align-items: stretch;
    }

    .rate-control {
      min-width: 100%;
    }
  }
</style>
