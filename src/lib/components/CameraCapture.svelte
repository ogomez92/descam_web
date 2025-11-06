<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCameraStream, captureFrame, stopStream, enumerateCameras, getScreenStream, type CameraDevice } from '../camera';
  import { describeImage } from '../openai';
  import { describeImageWithGemini } from '../gemini';
  import { getApiKey, getGeminiApiKey, getOutputMode, getTTSRate, getCustomPrompt, setCustomPrompt, removeCustomPrompt } from '../storage.svelte';
  import { getTranslations, getCurrentLanguage } from '../i18n/store.svelte';
  import { setCurrentCamera } from '../cameraStore.svelte';
  import { TextToSpeech, getTTSLanguage } from '../tts';
  import OutputModeSelector from './OutputModeSelector.svelte';

  interface Props {
    onDescriptionComplete: (description: string) => void;
  }

  let { onDescriptionComplete }: Props = $props();

  let t = $derived(getTranslations());
  let videoElement = $state<HTMLVideoElement>();
  let promptTextarea = $state<HTMLTextAreaElement>();
  let fileInput = $state<HTMLInputElement>();
  let stream = $state<MediaStream | null>(null);
  let statusMessage = $state('');
  let errorMessage = $state('');
  let customPrompt = $state('');
  let previousDefaultPrompt = $state('');
  let isProcessing = $state(false);
  let isCameraReady = $state(false);
  let availableCameras = $state<CameraDevice[]>([]);
  let selectedCameraIndex = $state(0);
  let videoSourceType = $state<'camera' | 'screen'>('camera');
  let tts = $state<TextToSpeech | null>(null);
  let isInitialized = $state(false);
  let countdownMessage = $state('');
  let countdownElement = $state<HTMLDivElement>();
  let selectedSourceId = $state<string>(''); // deviceId or 'screen-share'

  // Load saved custom prompt on initialization
  $effect(() => {
    if (!isInitialized) {
      const savedPrompt = getCustomPrompt();
      if (savedPrompt) {
        customPrompt = savedPrompt;
        previousDefaultPrompt = savedPrompt;
      } else {
        customPrompt = t.prompt.defaultPrompt;
        previousDefaultPrompt = t.prompt.defaultPrompt;
      }
      isInitialized = true;
    }
  });

  // Update prompt when language changes, but only if user hasn't customized it
  $effect(() => {
    const currentDefault = t.prompt.defaultPrompt;

    // Only run after initialization
    if (!isInitialized) return;

    // If prompt matches the previous default (not customized), update to new default
    if (customPrompt === previousDefaultPrompt) {
      customPrompt = currentDefault;
      previousDefaultPrompt = currentDefault;
      // Clear saved prompt since we're using default
      removeCustomPrompt();
    }
  });

  // Save custom prompt whenever it changes (but only if different from default)
  $effect(() => {
    if (isInitialized && customPrompt !== t.prompt.defaultPrompt) {
      setCustomPrompt(customPrompt);
    }
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

  async function handleSourceChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const sourceId = target.value;
    selectedSourceId = sourceId;

    if (sourceId === 'screen-share') {
      await startScreenShare();
    } else {
      // If switching from screen share back to camera
      if (videoSourceType === 'screen') {
        if (stream) {
          stopStream(stream);
          stream = null;
        }
        videoSourceType = 'camera';
      }

      // Find the camera by deviceId
      const cameraIndex = availableCameras.findIndex(cam => cam.deviceId === sourceId);
      if (cameraIndex >= 0) {
        selectedCameraIndex = cameraIndex;
        await startCamera(sourceId);
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    // Stop TTS on Escape key
    if (event.key === 'Escape' && tts && getOutputMode() === 'tts') {
      tts.cancel();
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
      selectedSourceId = availableCameras[0].deviceId;
      await startCamera(availableCameras[0].deviceId);
    } else {
      await startCamera();
    }

    // Focus the prompt textarea for better accessibility
    if (promptTextarea) {
      promptTextarea.focus();
    }

    // Add escape key listener
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (stream) {
      stopStream(stream);
    }
    setCurrentCamera(null); // Clear camera state on unmount

    // Cleanup TTS
    if (tts) {
      tts.cancel();
    }

    // Remove escape key listener
    window.removeEventListener('keydown', handleKeydown);
  });

  async function announceCountdown(count: number) {
    const message = t.camera.countdown.replace('{count}', count.toString());

    // Update ARIA live region
    countdownMessage = message;

    // Announce via TTS if enabled
    if (getOutputMode() === 'tts') {
      if (!tts) {
        tts = new TextToSpeech();
      }
      const lang = getTTSLanguage(getCurrentLanguage());
      const rate = getTTSRate();
      tts.speak(message, { lang, rate });
    }
  }

  async function handleCapture() {
    const openaiKey = getApiKey();
    const geminiKey = getGeminiApiKey();

    // Check if at least one API key is available
    if (!videoElement || (!openaiKey && !geminiKey) || isProcessing) return;

    try {
      isProcessing = true;
      errorMessage = '';
      statusMessage = t.camera.capturingFrame;

      // Add 3 second countdown when in screen share mode
      if (videoSourceType === 'screen') {
        for (let i = 3; i >= 1; i--) {
          await announceCountdown(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Clear countdown message
        countdownMessage = '';
      }

      // Capture the frame
      const imageDataUrl = captureFrame(videoElement);

      statusMessage = t.camera.uploadingImage;

      // Get the prompt (use custom or default)
      const prompt = customPrompt.trim() || t.prompt.defaultPrompt;

      // Use OpenAI if available, otherwise use Gemini
      let result;
      if (openaiKey) {
        result = await describeImage(openaiKey, imageDataUrl, prompt);
      } else if (geminiKey) {
        result = await describeImageWithGemini(geminiKey, imageDataUrl, prompt);
      }

      if (result.error) {
        errorMessage = result.error.message;
        statusMessage = '';
      } else {
        statusMessage = '';
        onDescriptionComplete(result.description);
        handleDescriptionOutput(result.description);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorGeneric;
      statusMessage = '';
    } finally {
      isProcessing = false;
    }
  }

  function handleUploadClick() {
    fileInput?.click();
  }

  async function handleFileUpload(event: Event) {
    const openaiKey = getApiKey();
    const geminiKey = getGeminiApiKey();

    // Check if at least one API key is available
    if ((!openaiKey && !geminiKey) || isProcessing) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      isProcessing = true;
      errorMessage = '';
      statusMessage = t.camera.uploadingImage;

      // Read the file as data URL
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Get the prompt (use custom or default)
      const prompt = customPrompt.trim() || t.prompt.defaultPrompt;

      // Use OpenAI if available, otherwise use Gemini
      let result;
      if (openaiKey) {
        result = await describeImage(openaiKey, imageDataUrl, prompt);
      } else if (geminiKey) {
        result = await describeImageWithGemini(geminiKey, imageDataUrl, prompt);
      }

      if (result.error) {
        errorMessage = result.error.message;
        statusMessage = '';
      } else {
        statusMessage = '';
        onDescriptionComplete(result.description);
        handleDescriptionOutput(result.description);
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorGeneric;
      statusMessage = '';
    } finally {
      isProcessing = false;
      // Clear the input so the same file can be selected again
      input.value = '';
    }
  }

  function handleDescriptionOutput(description: string) {
    const outputMode = getOutputMode();

    if (outputMode === 'tts' && description) {
      if (!tts) {
        tts = new TextToSpeech();
      }
      const lang = getTTSLanguage(getCurrentLanguage());
      const rate = getTTSRate();
      tts.speak(description, { lang, rate });
    }
  }

  async function startScreenShare() {
    try {
      errorMessage = '';

      if (stream) {
        stopStream(stream);
      }

      stream = await getScreenStream();

      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraReady = true;
        videoSourceType = 'screen';
        selectedSourceId = 'screen-share';

        // Listen for when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorScreenCapture;
      isCameraReady = false;
    }
  }

  function stopScreenShare() {
    if (stream && videoSourceType === 'screen') {
      stopStream(stream);
      stream = null;
      isCameraReady = false;
      videoSourceType = 'camera';

      // Switch back to first camera
      if (availableCameras.length > 0) {
        selectedCameraIndex = 0;
        selectedSourceId = availableCameras[0].deviceId;
        startCamera(availableCameras[0].deviceId);
      }
    }
  }

  function handleResetPrompt() {
    customPrompt = t.prompt.defaultPrompt;
    previousDefaultPrompt = t.prompt.defaultPrompt;
    // Remove saved custom prompt
    removeCustomPrompt();
    // Focus the textarea after resetting
    if (promptTextarea) {
      promptTextarea.focus();
    }
  }

  function handleStopTTS() {
    if (tts) {
      tts.cancel();
    }
  }
</script>

<div class="camera-capture">
  <!-- ARIA live region for countdown -->
  <div
    bind:this={countdownElement}
    class="sr-only"
    role="status"
    aria-live="assertive"
    aria-atomic="true"
  >
    {countdownMessage}
  </div>

  <div class="video-container">
    <video bind:this={videoElement} autoplay playsinline muted aria-label="Camera preview">
      <track kind="captions" />
    </video>
    {#if availableCameras.length >= 1}
      <div class="camera-selector">
        <label for="camera-select" class="sr-only">{t.camera.cameraSelectionAriaLabel}</label>
        <select
          id="camera-select"
          value={selectedSourceId}
          onchange={handleSourceChange}
          disabled={isProcessing}
          aria-label={t.camera.cameraSelectionAriaLabel}
        >
          {#each availableCameras as camera}
            <option value={camera.deviceId}>
              {camera.label}
            </option>
          {/each}
          <option value="screen-share">
            {t.camera.screenShare}
          </option>
        </select>
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
    <!-- Output Mode Selector -->
    <OutputModeSelector {tts} />

    <div class="form-group">
      <div class="prompt-header">
        <label for="custom-prompt">{t.prompt.label}</label>
        <button
          type="button"
          class="reset-button"
          onclick={handleResetPrompt}
          disabled={isProcessing}
          aria-label={t.prompt.resetButton}
        >
          {t.prompt.resetButton}
        </button>
      </div>
      <textarea
        id="custom-prompt"
        bind:this={promptTextarea}
        bind:value={customPrompt}
        placeholder={t.prompt.placeholder}
        rows="3"
        disabled={isProcessing}
      ></textarea>
    </div>

    <!-- Hidden file input for image upload -->
    <input
      type="file"
      bind:this={fileInput}
      onchange={handleFileUpload}
      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/heic,image/heif"
      style="display: none;"
      aria-hidden="true"
    />

    <div class="button-group">
      <button
        class="capture-button"
        onclick={handleCapture}
        disabled={!isCameraReady || isProcessing}
        aria-label={t.camera.captureButton}
      >
        {t.camera.captureButton}
      </button>
      <button
        class="upload-button"
        onclick={handleUploadClick}
        disabled={isProcessing}
        aria-label={t.camera.uploadButton}
      >
        {t.camera.uploadButton}
      </button>
    </div>
  </div>
</div>

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

  .camera-selector {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    padding: 0.5rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
    max-width: calc(100% - 2rem);
  }

  .camera-selector select {
    padding: 0.5rem 2rem 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.9);
    color: #2d3748;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 200px;
    appearance: none;
    background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232d3748" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e');
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 1rem;
  }

  .camera-selector select:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 1);
    border-color: rgba(255, 255, 255, 0.7);
  }

  .camera-selector select:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  .camera-selector select:disabled {
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

  .prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  label {
    font-weight: 600;
    color: #2d3748;
    margin: 0;
  }

  .reset-button {
    padding: 0.375rem 0.75rem;
    background: #e2e8f0;
    color: #2d3748;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .reset-button:hover:not(:disabled) {
    background: #cbd5e0;
  }

  .reset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .button-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .capture-button,
  .upload-button {
    padding: 1rem;
    border: none;
    border-radius: 4px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .capture-button {
    background: #667eea;
    color: white;
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

  .upload-button {
    background: #48bb78;
    color: white;
  }

  .upload-button:hover:not(:disabled) {
    background: #38a169;
  }

  .upload-button:active:not(:disabled) {
    background: #2f855a;
  }

  .upload-button:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .capture-button,
    .upload-button {
      font-size: 0.9rem;
      padding: 0.75rem;
    }

    .button-group {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .reset-button {
      font-size: 0.8rem;
      padding: 0.3rem 0.6rem;
    }

    .camera-selector {
      top: 0.75rem;
      padding: 0.375rem;
      max-width: calc(100% - 1.5rem);
    }

    .camera-selector select {
      font-size: 0.8rem;
      min-width: 150px;
      padding: 0.375rem 1.75rem 0.375rem 0.75rem;
    }
  }
</style>
