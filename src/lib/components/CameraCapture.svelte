<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCameraStream, captureFrame, stopStream } from '../camera';
  import { describeImage } from '../openai';
  import { getApiKey } from '../storage.svelte';
  import { getTranslations } from '../i18n/store.svelte';

  interface Props {
    onDescriptionComplete: (description: string) => void;
  }

  let { onDescriptionComplete }: Props = $props();

  let t = $derived(getTranslations());
  let videoElement = $state<HTMLVideoElement>();
  let stream = $state<MediaStream | null>(null);
  let statusMessage = $state('');
  let errorMessage = $state('');
  let customPrompt = $state('');
  let previousDefaultPrompt = $state('');
  let isProcessing = $state(false);
  let isCameraReady = $state(false);

  // Update prompt when language changes, but only if user hasn't customized it
  $effect(() => {
    const currentDefault = t.prompt.defaultPrompt;

    // If prompt is empty or still matches the previous default, update to new default
    if (!customPrompt || customPrompt === previousDefaultPrompt) {
      customPrompt = currentDefault;
    }

    previousDefaultPrompt = currentDefault;
  });

  onMount(async () => {
    try {
      stream = await getCameraStream();
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraReady = true;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : t.camera.errorGeneric;

      // Check for specific error types
      if (errMsg.includes('not supported') || errMsg.includes('HTTPS') || errMsg.includes('modern browser')) {
        errorMessage = t.camera.errorNotSupported;
      } else if (errMsg.includes('Permission denied') || errMsg.includes('NotAllowedError')) {
        errorMessage = t.camera.errorNoPermission;
      } else {
        errorMessage = errMsg;
      }
    }
  });

  onDestroy(() => {
    if (stream) {
      stopStream(stream);
    }
  });

  async function handleCapture() {
    const apiKey = getApiKey();
    if (!videoElement || !apiKey || isProcessing) return;

    try {
      isProcessing = true;
      errorMessage = '';
      statusMessage = t.camera.capturingFrame;

      // Capture the frame
      const imageDataUrl = captureFrame(videoElement);

      statusMessage = t.camera.uploadingImage;

      // Get the prompt (use custom or default)
      const prompt = customPrompt.trim() || t.prompt.defaultPrompt;

      // Send to OpenAI
      const result = await describeImage(apiKey, imageDataUrl, prompt);

      if (result.error) {
        errorMessage = result.error.message;
        statusMessage = '';
      } else {
        statusMessage = '';
        onDescriptionComplete(result.description);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorGeneric;
      statusMessage = '';
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="camera-capture">
  <div class="video-container">
    <video bind:this={videoElement} autoplay playsinline muted aria-label="Camera preview">
      <track kind="captions" />
    </video>
  </div>

  {#if errorMessage}
    <div class="error-message" role="alert" aria-live="assertive">
      {errorMessage}
    </div>
  {/if}

  {#if statusMessage}
    <div class="status-message" role="status" aria-live="polite">
      {statusMessage}
    </div>
  {/if}

  <div class="controls">
    <div class="form-group">
      <label for="custom-prompt">{t.prompt.label}</label>
      <textarea
        id="custom-prompt"
        bind:value={customPrompt}
        placeholder={t.prompt.placeholder}
        rows="3"
        disabled={isProcessing}
      ></textarea>
    </div>

    <button
      class="capture-button"
      onclick={handleCapture}
      disabled={!isCameraReady || isProcessing}
      aria-label={t.camera.captureButton}
    >
      {t.camera.captureButton}
    </button>
  </div>
</div>

<style>
  .camera-capture {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .video-container {
    position: relative;
    width: 100%;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .error-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #fee;
    border: 2px solid #c33;
    border-radius: 4px;
    color: #600;
    font-weight: 500;
    line-height: 1.5;
  }

  .status-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #e6f3ff;
    border: 2px solid #4a90e2;
    border-radius: 4px;
    color: #1a5490;
    font-weight: 500;
    text-align: center;
  }

  .controls {
    margin-top: 1.5rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2d3748;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  textarea:disabled {
    background: #f7fafc;
    cursor: not-allowed;
  }

  .capture-button {
    width: 100%;
    padding: 1rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .capture-button:hover:not(:disabled) {
    background: #5a67d8;
  }

  .capture-button:active:not(:disabled) {
    background: #4c51bf;
  }

  .capture-button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .capture-button {
      font-size: 1rem;
    }
  }
</style>
