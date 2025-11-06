<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCameraStream, stopStream, enumerateCameras, type CameraDevice, getScreenStream } from '../camera';
  import { GeminiLiveSession, captureVideoFrame } from '../gemini';
  import { getGeminiApiKey, getOutputMode } from '../storage.svelte';
  import { getTranslations, getCurrentLanguage } from '../i18n/store.svelte';
  import { setCurrentCamera } from '../cameraStore.svelte';
  import { TextToSpeech, getTTSLanguage } from '../tts';
  import OutputModeSelector from './OutputModeSelector.svelte';

  let t = $derived(getTranslations());
  let videoElement = $state<HTMLVideoElement>();
  let promptTextarea = $state<HTMLTextAreaElement>();
  let stream = $state<MediaStream | null>(null);
  let statusMessage = $state('');
  let errorMessage = $state('');
  let customPrompt = $state('');
  let previousDefaultPrompt = $state('');
  let isStreaming = $state(false);
  let isCameraReady = $state(false);
  let availableCameras = $state<CameraDevice[]>([]);
  let selectedCameraIndex = $state(0);
  let cameraTabRefs = $state<(HTMLButtonElement | undefined)[]>([]);
  let currentDescription = $state('');
  let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('disconnected');
  let videoSourceType = $state<'camera' | 'screen'>('camera');

  let geminiSession: GeminiLiveSession | null = null;
  let frameIntervalId: number | null = null;
  let tts: TextToSpeech | null = null;

  // Update prompt when language changes
  $effect(() => {
    const currentDefault = t.prompt.defaultPrompt;

    if (!customPrompt || customPrompt === previousDefaultPrompt) {
      customPrompt = currentDefault;
    }

    previousDefaultPrompt = currentDefault;
  });

  // Handle TTS output when description changes
  $effect(() => {
    if (currentDescription) {
      handleDescriptionOutput(currentDescription);
    }
  });

  function handleDescriptionOutput(description: string) {
    const outputMode = getOutputMode();
    if (outputMode === 'tts' && description) {
      if (!tts) {
        tts = new TextToSpeech();
      }
      const lang = getTTSLanguage(getCurrentLanguage());
      tts.speak(description, { lang });
    }
  }

  async function startCamera(deviceId?: string) {
    try {
      if (stream) {
        stopStream(stream);
      }

      stream = await getCameraStream(deviceId);
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraReady = true;
        errorMessage = '';

        const currentCamera = availableCameras.find(cam => cam.deviceId === deviceId) || availableCameras[selectedCameraIndex];
        if (currentCamera) {
          setCurrentCamera(currentCamera);
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : t.camera.errorGeneric;

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
      setCurrentCamera(null);
    }
  }

  async function switchCamera(index: number) {
    if (index < 0 || index >= availableCameras.length) return;

    selectedCameraIndex = index;
    const camera = availableCameras[index];
    await startCamera(camera.deviceId);

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

  async function startScreenShare() {
    try {
      // Stop current stream if any
      if (stream) {
        stopStream(stream);
      }

      stream = await getScreenStream();
      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
        isCameraReady = true;
        videoSourceType = 'screen';
        errorMessage = '';
        setCurrentCamera(null); // Screen share doesn't use camera

        // Handle when user stops sharing via browser UI
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopScreenShare();
          };
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorScreenCapture;
      isCameraReady = false;
    }
  }

  function stopScreenShare() {
    if (stream) {
      stopStream(stream);
      stream = null;
    }
    isCameraReady = false;
    videoSourceType = 'camera';
    errorMessage = '';
  }

  async function startStreaming() {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      errorMessage = t.video.errorNoApiKey || 'Gemini API key is required';
      return;
    }

    if (!videoElement || !isCameraReady) {
      errorMessage = t.camera.errorNotReady;
      return;
    }

    try {
      errorMessage = '';
      statusMessage = t.video.connecting || 'Connecting to Gemini...';

      // Create Gemini session
      geminiSession = new GeminiLiveSession(
        {
          apiKey,
          systemInstruction: customPrompt || t.prompt.defaultPrompt
        },
        (description) => {
          // Update with latest description
          currentDescription = description;
          statusMessage = '';
        },
        (error) => {
          errorMessage = error;
          stopStreaming();
        },
        (status) => {
          connectionStatus = status;
          if (status === 'connected') {
            statusMessage = t.video.streaming || 'Streaming video...';
            startSendingFrames();
          } else if (status === 'connecting') {
            statusMessage = t.video.connecting || 'Connecting...';
          } else {
            statusMessage = '';
          }
        }
      );

      await geminiSession.connect();
      isStreaming = true;

    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.video.errorGeneric || 'Failed to start streaming';
      stopStreaming();
    }
  }

  function startSendingFrames() {
    // Send frames at 1 FPS (Gemini's recommended rate)
    frameIntervalId = window.setInterval(() => {
      if (videoElement && geminiSession?.isConnected()) {
        const frame = captureVideoFrame(videoElement);
        if (frame) {
          geminiSession.sendVideoFrame(frame);
        }
      }
    }, 1000); // 1 second = 1 FPS
  }

  function stopStreaming() {
    isStreaming = false;

    if (frameIntervalId !== null) {
      clearInterval(frameIntervalId);
      frameIntervalId = null;
    }

    if (geminiSession) {
      geminiSession.disconnect();
      geminiSession = null;
    }

    connectionStatus = 'disconnected';
    statusMessage = '';
  }

  function handleResetPrompt() {
    customPrompt = t.prompt.defaultPrompt;
    promptTextarea?.focus();

    // Update system instruction if streaming
    if (geminiSession?.isConnected()) {
      geminiSession.updateSystemInstruction(customPrompt);
    }
  }

  onMount(async () => {
    try {
      // Request camera permission first
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      stopStream(tempStream);

      // Enumerate cameras
      availableCameras = await enumerateCameras();

      if (availableCameras.length === 0) {
        errorMessage = t.camera.errorNotFound;
        return;
      }

      // Start with first camera
      await startCamera(availableCameras[0].deviceId);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : t.camera.errorGeneric;
    }
  });

  onDestroy(() => {
    stopStreaming();

    if (stream) {
      stopStream(stream);
      setCurrentCamera(null);
    }

    // Cleanup TTS
    if (tts) {
      tts.cancel();
      tts = null;
    }
  });
</script>

<div class="video-capture">
  <div class="video-container">
    <video bind:this={videoElement} autoplay playsinline muted aria-label={t.camera.videoFeedAriaLabel}></video>

    {#if !isCameraReady}
      <div class="video-placeholder">
        <p>{t.camera.initializing}</p>
      </div>
    {/if}
  </div>

  {#if availableCameras.length > 1}
    <div class="camera-tabs" role="tablist" aria-label={t.camera.cameraSelectionAriaLabel}>
      {#each availableCameras as camera, index}
        <button
          bind:this={cameraTabRefs[index]}
          role="tab"
          aria-selected={index === selectedCameraIndex}
          aria-label={`${t.camera.camera} ${index + 1}: ${camera.label}`}
          tabindex={index === selectedCameraIndex ? 0 : -1}
          class="camera-tab"
          class:active={index === selectedCameraIndex}
          onclick={() => switchCamera(index)}
          onkeydown={(e) => handleCameraTabKeydown(e, index)}
        >
          {t.camera.camera} {index + 1}
        </button>
      {/each}
    </div>
  {/if}

  {#if statusMessage}
    <div class="status-message" role="alert" aria-live="polite">
      {statusMessage}
    </div>
  {/if}

  {#if errorMessage}
    <div class="error-message" role="alert" aria-live="assertive">
      {errorMessage}
    </div>
  {/if}

  <OutputModeSelector />

  <div class="controls">
    <div class="prompt-section">
      <label for="video-prompt-input">{t.prompt.customPromptLabel}</label>
      <textarea
        id="video-prompt-input"
        bind:this={promptTextarea}
        bind:value={customPrompt}
        placeholder={t.prompt.customPromptPlaceholder}
        disabled={isStreaming}
        rows="3"
      ></textarea>
      <button
        class="reset-button"
        onclick={handleResetPrompt}
        disabled={isStreaming}
        aria-label={t.prompt.resetButtonAriaLabel}
      >
        {t.prompt.resetButton}
      </button>
    </div>

    <div class="action-buttons">
      {#if videoSourceType === 'camera'}
        <button
          class="screen-share-button"
          onclick={startScreenShare}
          disabled={isStreaming}
          aria-label={t.camera.shareScreen}
        >
          {t.camera.shareScreen}
        </button>
      {:else}
        <button
          class="stop-share-button"
          onclick={stopScreenShare}
          disabled={isStreaming}
          aria-label={t.camera.stopSharing}
        >
          {t.camera.stopSharing}
        </button>
      {/if}

      {#if !isStreaming}
        <button
          class="capture-button"
          onclick={startStreaming}
          disabled={!isCameraReady}
          aria-label={t.video.startStreamingAriaLabel || 'Start streaming video'}
        >
          {t.video.startStreaming || 'Start Streaming'}
        </button>
      {:else}
        <button
          class="stop-button"
          onclick={stopStreaming}
          aria-label={t.video.stopStreamingAriaLabel || 'Stop streaming video'}
        >
          {t.video.stopStreaming || 'Stop Streaming'}
        </button>
      {/if}
    </div>
  </div>

  {#if currentDescription}
    <div class="description-section">
      <h2>{t.video.currentDescription || 'Current Description'}</h2>
      <div class="description-content" role="region" aria-live="polite">
        {currentDescription}
      </div>
    </div>
  {/if}
</div>

<style>
  .video-capture {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 1rem;
  }

  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }

  .camera-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .camera-tab {
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    border: 2px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .camera-tab:hover {
    background: #e0e0e0;
  }

  .camera-tab.active {
    background: #007bff;
    color: white;
    border-color: #0056b3;
  }

  .camera-tab:focus {
    outline: 3px solid #0056b3;
    outline-offset: 2px;
  }

  .status-message {
    padding: 0.75rem;
    background: #d1ecf1;
    color: #0c5460;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .error-message {
    padding: 0.75rem;
    background: #f8d7da;
    color: #721c24;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .prompt-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .prompt-section label {
    font-weight: 600;
  }

  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
    resize: vertical;
  }

  textarea:focus {
    outline: 3px solid #0056b3;
    outline-offset: 2px;
    border-color: #0056b3;
  }

  textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .reset-button {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .reset-button:hover:not(:disabled) {
    background: #5a6268;
  }

  .reset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .screen-share-button,
  .stop-share-button {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .screen-share-button {
    background: #17a2b8;
    color: white;
  }

  .screen-share-button:hover:not(:disabled) {
    background: #138496;
  }

  .screen-share-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .stop-share-button {
    background: #fd7e14;
    color: white;
  }

  .stop-share-button:hover:not(:disabled) {
    background: #e8590c;
  }

  .stop-share-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .capture-button,
  .stop-button {
    flex: 1;
    min-width: 200px;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .capture-button {
    background: #28a745;
    color: white;
  }

  .capture-button:hover:not(:disabled) {
    background: #218838;
  }

  .capture-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .stop-button {
    background: #dc3545;
    color: white;
  }

  .stop-button:hover {
    background: #c82333;
  }

  .capture-button:focus,
  .stop-button:focus {
    outline: 3px solid #0056b3;
    outline-offset: 2px;
  }

  .description-section {
    margin-top: 2rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .description-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
  }

  .description-content {
    padding: 1rem;
    background: white;
    border-radius: 4px;
    border: 1px solid #dee2e6;
    line-height: 1.6;
    min-height: 100px;
  }

  @media (max-width: 768px) {
    .camera-tab {
      font-size: 0.8rem;
      padding: 0.4rem 0.8rem;
    }

    .action-buttons {
      grid-template-columns: 1fr;
    }

    .capture-button,
    .stop-button,
    .screen-share-button,
    .stop-share-button {
      min-width: unset;
      width: 100%;
    }
  }
</style>
