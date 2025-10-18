<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCameraStream, captureFrame, stopStream, enumerateCameras, type CameraDevice } from '../camera';
  import { describeImage } from '../openai';
  import { getApiKey } from '../storage.svelte';
  import { getTranslations } from '../i18n/store.svelte';
  import { setCurrentCamera } from '../cameraStore.svelte';

  interface Props {
    onDescriptionComplete: (description: string) => void;
  }

  let { onDescriptionComplete }: Props = $props();

  let t = $derived(getTranslations());
  let videoElement = $state<HTMLVideoElement>();
  let promptTextarea = $state<HTMLTextAreaElement>();
  let stream = $state<MediaStream | null>(null);
  let statusMessage = $state('');
  let errorMessage = $state('');
  let customPrompt = $state('');
  let previousDefaultPrompt = $state('');
  let isProcessing = $state(false);
  let isCameraReady = $state(false);
  let availableCameras = $state<CameraDevice[]>([]);
  let selectedCameraIndex = $state(0);
  let cameraTabRefs = $state<(HTMLButtonElement | undefined)[]>([]);

  // Update prompt when language changes, but only if user hasn't customized it
  $effect(() => {
    const currentDefault = t.prompt.defaultPrompt;

    // If prompt is empty or still matches the previous default, update to new default
    if (!customPrompt || customPrompt === previousDefaultPrompt) {
      customPrompt = currentDefault;
    }

    previousDefaultPrompt = currentDefault;
  });

  async function startCamera(deviceId?: string) {
    try {
      // Stop existing stream if any
      if (stream) {
        stopStream(stream);
      }

      stream = await getCameraStream(deviceId);
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraReady = true;
        errorMessage = '';

        // Update camera store with current camera
        const currentCamera = availableCameras.find(cam => cam.deviceId === deviceId) || availableCameras[selectedCameraIndex];
        if (currentCamera) {
          setCurrentCamera(currentCamera);
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : t.camera.errorGeneric;

      // Check for specific error types
      if (errMsg.includes('not supported') || errMsg.includes('HTTPS') || errMsg.includes('modern browser')) {
        errorMessage = t.camera.errorNotSupported;
      } else if (errMsg.includes('Permission denied') || errMsg.includes('NotAllowedError')) {
        errorMessage = t.camera.errorNoPermission;
      } else if (errMsg.toLowerCase().includes('could not start video source') || errMsg.includes('NotReadableError')) {
        errorMessage = t.camera.errorVideoSource;
      } else {
        errorMessage = errMsg;
      }
      isCameraReady = false;
      setCurrentCamera(null); // Clear camera on error
    }
  }

  async function switchCamera(index: number) {
    if (index < 0 || index >= availableCameras.length) return;

    selectedCameraIndex = index;
    const camera = availableCameras[index];
    await startCamera(camera.deviceId);

    // Restore focus to the selected tab
    if (cameraTabRefs[index]) {
      cameraTabRefs[index]?.focus();
    }
  }

  function handleCameraTabKeydown(event: KeyboardEvent, index: number) {
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      switchCamera(index - 1);
    } else if (event.key === 'ArrowRight' && index < availableCameras.length - 1) {
      event.preventDefault();
      switchCamera(index + 1);
    }
  }

  onMount(async () => {
    // First, get a temporary stream to trigger permission prompt and populate device labels
    try {
      const tempStream = await getCameraStream();
      stopStream(tempStream);
    } catch (error) {
      // Permission denied or no camera, will be handled by startCamera
    }

    // Enumerate cameras (labels will be available after permission granted)
    availableCameras = await enumerateCameras();

    // Start with the first camera
    if (availableCameras.length > 0) {
      await startCamera(availableCameras[0].deviceId);
    } else {
      await startCamera();
    }

    // Focus the prompt textarea for better accessibility
    if (promptTextarea) {
      promptTextarea.focus();
    }
  });

  onDestroy(() => {
    if (stream) {
      stopStream(stream);
    }
    setCurrentCamera(null); // Clear camera state on unmount
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
    {#if availableCameras.length > 1}
      <div class="camera-tabs" role="tablist" aria-label="Camera selection">
        {#each availableCameras as camera, index}
          <button
            bind:this={cameraTabRefs[index]}
            role="tab"
            aria-selected={index === selectedCameraIndex}
            aria-disabled={isProcessing}
            aria-controls="camera-preview"
            tabindex={index === selectedCameraIndex ? 0 : -1}
            onclick={() => switchCamera(index)}
            onkeydown={(e) => handleCameraTabKeydown(e, index)}
            class="camera-tab"
            class:active={index === selectedCameraIndex}
            title={camera.label}
          >
            {camera.label}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Error messages -->
  {#if errorMessage}
    <div class="error-message" role="alert">
      {errorMessage}
    </div>
  {/if}

  <!-- Status messages -->
  {#if statusMessage}
    <div class="status-message" role="alert">
      {statusMessage}
    </div>
  {/if}

  <div class="controls">
    <div class="form-group">
      <label for="custom-prompt">{t.prompt.label}</label>
      <textarea
        id="custom-prompt"
        bind:this={promptTextarea}
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

  .camera-tabs {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.5rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  .camera-tab {
    padding: 0.5rem 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 200px;
  }

  .camera-tab:hover:not([aria-disabled="true"]) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .camera-tab:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  .camera-tab.active {
    background: rgba(255, 255, 255, 0.9);
    color: #2d3748;
    border-color: rgba(255, 255, 255, 0.9);
  }

  .camera-tab[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
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

    .camera-tabs {
      top: 0.75rem;
      padding: 0.375rem;
      gap: 0.375rem;
      max-width: calc(100% - 1.5rem);
      flex-wrap: wrap;
      justify-content: center;
    }

    .camera-tab {
      padding: 0.375rem 0.75rem;
      font-size: 0.8rem;
      max-width: 150px;
    }
  }
</style>
