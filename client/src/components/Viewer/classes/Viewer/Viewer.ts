import { CameraController } from '@/components/Viewer/classes/Camera/Camera.ts';
import { Renderer } from '@/components/Viewer/classes/Renderer/Renderer.ts';
import { World } from '@/components/Viewer/classes/World';

export class Viewer {
  public world: World;
  public camera: CameraController;
  public renderer: Renderer;
  // public stats: Stats;

  public constructor() {
    this.world = new World();
    this.camera = new CameraController();
    this.renderer = new Renderer({
      world: this.world,
      cameraController: this.camera,
      antialias: true,
      precision: 'highp',
      preserveDrawingBuffer: true,
      alpha: true,
    });
  }
}
