import type { CameraDevice } from './camera';

interface CameraState {
  currentCamera: CameraDevice | null;
  isActive: boolean;
  isScreenSharing: boolean;
}

// Svelte 5 reactive state
let cameraState = $state<CameraState>({
  currentCamera: null,
  isActive: false,
  isScreenSharing: false,
});

export function getCurrentCamera(): CameraDevice | null {
  return cameraState.currentCamera;
}

export function isCameraActive(): boolean {
  return cameraState.isActive;
}

export function setCurrentCamera(camera: CameraDevice | null): void {
  cameraState.currentCamera = camera;
  cameraState.isActive = !!camera;
  if (camera) {
    cameraState.isScreenSharing = false;
  } else if (!cameraState.isScreenSharing) {
    cameraState.isActive = false;
  }
}

export function setScreenSharingActive(isActive: boolean): void {
  cameraState.isScreenSharing = isActive;
  if (isActive) {
    cameraState.currentCamera = null;
    cameraState.isActive = true;
  } else if (!cameraState.currentCamera) {
    cameraState.isActive = false;
  }
}

export function getCameraState(): CameraState {
  return cameraState;
}
