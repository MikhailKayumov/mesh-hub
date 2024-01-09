import { CameraController } from '../Camera';
import { Renderer } from '../Renderer';
import { World } from '../World';

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
