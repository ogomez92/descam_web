<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCameraStream, stopStream, enumerateCameras, type CameraDevice, getScreenStream, VideoRecorder } from '../camera';
  import { GeminiLiveSession, captureVideoFrame, type VideoChunk } from '../gemini';
  import { getGeminiApiKey, getOutputMode, getTTSRate, getTTSVoice } from '../storage.svelte';
  import { getTranslations, getCurrentLanguage } from '../i18n/store.svelte';
  import { setCurrentCamera, setScreenSharingActive } from '../cameraStore.svelte';
  import { TextToSpeech, getTTSLanguage } from '../tts';
  import OutputModeSelector from './OutputModeSelector.svelte';
  import CameraSourceDropdown, { type CameraSourceOption } from './CameraSourceDropdown.svelte';

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
  let selectedSourceId = $state<string>('');
  let cameraOptions = $derived.by(() => {
    const options: CameraSourceOption[] = availableCameras.map(camera => ({
      id: camera.deviceId,
      label: camera.label,
      type: 'camera',
    }));

    options.push({
      id: 'screen-share',
      label: t.camera.screenShare,
      type: 'screen',
    });

    return options;
  });
  let currentDescription = $state('');
  let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('disconnected');
  let videoSourceType = $state<'camera' | 'screen'>('camera');
  let outputMode = $derived(getOutputMode());

  let geminiSession: GeminiLiveSession | null = null;
  let frameIntervalId: number | null = null;
  let videoRecorder: VideoRecorder | null = null;
  let tts = $state<TextToSpeech | null>(null);

  // Update prompt when language changes
  onMount(() => {
    customPrompt = t.prompt.defaultPrompt;
    previousDefaultPrompt = t.prompt.defaultPrompt;
  });

  function handleDescriptionOutput(description: string) {
    const outputMode = getOutputMode();
    if (outputMode === 'tts' && description) {
      if (!tts) {
        tts = new TextToSpeech();
      }
      const lang = getTTSLanguage(getCurrentLanguage());
      const rate = getTTSRate();
      const voiceURI = getTTSVoice();
      tts.speak(description, { lang, rate, voiceURI: voiceURI || undefined });
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

        const currentCamera = availableCameras.find(cam => cam.deviceId === deviceId) || availableCameras[0];
        if (currentCamera) {
          setCurrentCamera(currentCamera);
          if (deviceId) {
            selectedSourceId = deviceId;
          } else {
            selectedSourceId = currentCamera.deviceId;
          }
        }
        videoSourceType = 'camera';
        setScreenSharingActive(false);
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
      setScreenSharingActive(false);
    }
  }

  async function handleSourceSelect(sourceId: string) {
    selectedSourceId = sourceId;

    if (sourceId === 'screen-share') {
      await startScreenShare();
      return;
    }

    if (videoSourceType === 'screen') {
      stopScreenShare({ resumeDefaultCamera: false });
    }

    const camera = availableCameras.find(cam => cam.deviceId === sourceId);
    if (camera) {
      await startCamera(camera.deviceId);
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
        selectedSourceId = 'screen-share';
        setCurrentCamera(null); // Screen share doesn't use camera
        setScreenSharingActive(true);

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
      setScreenSharingActive(false);
    }
  }

  function stopScreenShare(options?: { resumeDefaultCamera?: boolean }) {
    const resumeDefaultCamera = options?.resumeDefaultCamera ?? true;

    if (videoSourceType === 'screen' && stream) {
      stopStream(stream);
      stream = null;
    }

    if (videoSourceType === 'screen') {
      videoSourceType = 'camera';
    }

    isCameraReady = false;
    setScreenSharingActive(false);
    errorMessage = '';

    if (resumeDefaultCamera && availableCameras.length > 0) {
      const fallbackId = availableCameras[0].deviceId;
      selectedSourceId = fallbackId;
      startCamera(fallbackId);
    }
  }

  async function startStreaming() {
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
      errorMessage = t.video.errorNoApiKey || 'Gemini API key is required';
      return;
    }

    if (!videoElement || !isCameraReady || !stream) {
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
          systemInstruction: t.video.systemInstruction
        },
        (description) => {
          // Update with latest description
          currentDescription = description;
          handleDescriptionOutput(description);
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
            // Use a small delay to ensure everything is ready
            setTimeout(() => {
              startVideoRecording();
            }, 100);
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

  function startVideoRecording() {
    console.log('startVideoRecording called');
    console.log('stream exists:', !!stream);
    console.log('geminiSession exists:', !!geminiSession);
    console.log('geminiSession.isConnected():', geminiSession?.isConnected());

    if (!stream) {
      console.error('Cannot start video recording: missing stream');
      return;
    }

    if (!geminiSession) {
      console.error('Cannot start video recording: missing session');
      return;
    }

    if (!videoElement) {
      console.error('Cannot start video recording: missing video element');
      return;
    }

    // Start sending frames at 1 FPS (like the Python script)
    const sendFrame = () => {
      console.log('sendFrame called');
      if (!videoElement || !geminiSession?.isConnected()) {
        console.log('Cannot send frame - videoElement:', !!videoElement, 'session connected:', geminiSession?.isConnected());
        return;
      }

      const frame = captureVideoFrame(videoElement);
      if (!frame) {
        console.log('Failed to capture frame');
        return;
      }

      console.log('Frame captured, sending to Gemini');
      // Send the frame - the model will respond based on system instruction
      geminiSession.sendVideoFrame(frame);
    };

    // Send initial frame
    console.log('Starting frame sending...');
    sendFrame();
    // Send frames at 1 FPS
    frameIntervalId = window.setInterval(sendFrame, 1000);
    console.log('Frame interval started');

    // Send initial prompt to trigger the model to start describing
    setTimeout(() => {
      if (geminiSession?.isConnected()) {
        console.log('Sending initial prompt to trigger description');
        geminiSession.sendPrompt({ text: t.video.initialPrompt }, true);
      }
    }, 1500);

    // Start PCM audio generation and sending
    // In video mode, use microphone; otherwise use silent audio
    videoRecorder = new VideoRecorder(
      stream,
      () => {}, // No video chunk callback needed
      1000,
      (audioData: string) => {
        // Audio callback for PCM audio chunks
        if (!geminiSession?.isConnected()) {
          return;
        }

        // Send PCM audio to Gemini
        geminiSession.sendAudioChunk(audioData);
      },
      true // Use microphone in video mode
    );

    // Start audio generation (async because it requests microphone permission)
    statusMessage = t.video.requestingMicrophone || 'Requesting microphone access...';
    videoRecorder.start().then(() => {
      console.log('Audio capture started (microphone)');
      statusMessage = t.video.microphoneGranted || 'Microphone access granted';
      // Clear the status message after a delay
      setTimeout(() => {
        if (statusMessage === (t.video.microphoneGranted || 'Microphone access granted')) {
          statusMessage = t.video.streaming || 'Streaming video...';
        }
      }, 2000);
    }).catch((error) => {
      console.error('Failed to start audio capture:', error);
      const micError = error instanceof Error ? error.message : 'Failed to start audio capture';
      errorMessage = `${t.video.microphoneDenied || 'Microphone access denied'}: ${micError}`;
      statusMessage = '';
      // If microphone fails, try to continue without it
      // The session might still work or fail gracefully
    });
  }

  function stopStreaming() {
    isStreaming = false;

    if (frameIntervalId !== null) {
      clearInterval(frameIntervalId);
      frameIntervalId = null;
    }

    if (videoRecorder) {
      videoRecorder.stop();
      videoRecorder = null;
      console.log('Video recorder stopped');
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
    setScreenSharingActive(false);

    // Cleanup TTS
    if (tts) {
      tts.cancel();
      tts = null;
    }
  });
</script>

<div class="video-capture">
  {#if outputMode === 'aria'}
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {currentDescription}
    </div>
  {/if}
  <div class="video-container">
    <video bind:this={videoElement} autoplay playsinline muted aria-label={t.camera.videoFeedAriaLabel}></video>

    {#if !isCameraReady}
      <div class="video-placeholder">
        <p>{t.camera.initializing}</p>
      </div>
    {/if}

    {#if cameraOptions.length > 0}
      <div class="source-selector">
        <CameraSourceDropdown
          options={cameraOptions}
          selectedId={selectedSourceId}
          ariaLabel={t.camera.cameraSelectionAriaLabel}
          placeholder={t.camera.cameraSelectionAriaLabel}
          onSelect={handleSourceSelect}
          disabled={isStreaming}
        />
      </div>
    {/if}
  </div>

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

  <OutputModeSelector {tts} />

  <div class="controls">
    <div class="action-buttons">
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
      <div class="description-content" role="region" aria-live={outputMode === 'aria' ? 'polite' : 'off'}>
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

  .source-selector {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.7);
    padding: 0.5rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
    z-index: 3;
  }

  .source-selector :global(.source-button) {
    background: rgba(247, 250, 252, 0.95);
  }

  .source-selector :global(.dropdown-panel) {
    left: auto;
    right: 0;
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

  .action-buttons {
    display: flex;
    justify-content: flex-start;
  }

  .capture-button,
  .stop-button {
    min-width: 220px;
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

  @media (max-width: 768px) {
    .source-selector {
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.35rem;
    }

    .action-buttons {
      width: 100%;
    }

    .capture-button,
    .stop-button {
      min-width: unset;
      width: 100%;
    }
  }
</style>