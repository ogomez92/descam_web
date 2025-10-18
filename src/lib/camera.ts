export type CameraPermissionStatus = 'granted' | 'denied' | 'unknown';

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionStatus> {
  try {
    if (!navigator.permissions) {
      return 'unknown';
    }

    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown';
  } catch (error) {
    // Permissions API might not be available
    return 'unknown';
  }
}

/**
 * Request camera access and return the video stream
 */
export async function getCameraStream(): Promise<MediaStream> {
  // Check if the browser supports mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Camera access is not supported in this browser. Please use HTTPS or a modern browser.'
    );
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Prefer back camera on mobile
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    return stream;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to access camera'
    );
  }
}

/**
 * Capture a frame from the video stream as a data URL
 */
export function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Stop a media stream
 */
export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
