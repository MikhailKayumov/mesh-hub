export interface SceneCameraBookmark {
  label: string;
  posX: number;
  posY: number;
  posZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface SceneConfig {
  backgroundColor: string;
  ambientLightIntensity: number;
  environmentHdriPath?: string;
  cameraBookmarks: SceneCameraBookmark[];
}
