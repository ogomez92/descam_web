import type { CameraDevice } from './camera';

interface CameraState {
  currentCamera: CameraDevice | null;
  isActive: boolean;
}

// Svelte 5 reactive state
let cameraState = $state<CameraState>({
  currentCamera: null,
  isActive: false,
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
}

export function getCameraState(): CameraState {
  return cameraState;
}
