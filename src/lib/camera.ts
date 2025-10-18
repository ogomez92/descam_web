export type CameraPermissionStatus = 'granted' | 'denied' | 'unknown';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionStatus> {
  try {
    // First try the permissions API
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') return 'granted';
        if (result.state === 'denied') return 'denied';
      } catch (error) {
        // Permissions API query failed, try alternative method
      }
    }

    // Alternative: Check if we can enumerate devices with labels
    // If device labels are available, permission was granted
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // If we have video devices with labels, permission is granted
      if (videoDevices.length > 0 && videoDevices[0].label) {
        return 'granted';
      }

      // If we have video devices but no labels, permission not granted yet
      if (videoDevices.length > 0 && !videoDevices[0].label) {
        return 'unknown';
      }
    }

    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get list of available video input devices (cameras)
 */
export async function enumerateCameras(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices
      .filter(device => device.kind === 'videoinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));

    return videoDevices;
  } catch (error) {
    console.error('Error enumerating cameras:', error);
    return [];
  }
}

/**
 * Request camera access and return the video stream
 */
export async function getCameraStream(deviceId?: string, facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
  // Check if the browser supports mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Camera access is not supported in this browser. Please use HTTPS or a modern browser.'
    );
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: deviceId
        ? {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        : {
            facingMode: facingMode, // 'user' = front camera, 'environment' = back camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
