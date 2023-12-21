import { CameraController } from '@/components/Viewer/classes/Camera.ts';
import { Renderer } from '@/components/Viewer/classes/Renderer.ts';
import { World } from '@/components/Viewer/classes/World.ts';

export interface Viewer {
  world: World;
  cameraController: CameraController;
  renderer: Renderer;
  stats: Stats;
}
