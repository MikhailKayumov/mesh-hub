import CameraControls from 'camera-controls';
import {
  Box3,
  Clock,
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three/src/Three.js';

CameraControls.install({
  THREE: {
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
  },
});

const clock = new Clock();

export class CameraController {
  public camera: PerspectiveCamera;
  public control: CameraControls | null = null;

  private canvas: HTMLCanvasElement | null = null;

  public constructor() {
    this.camera = new PerspectiveCamera(75, 1, 0.05, 4000);
    this.camera.position.set(0, 0, -120);
  }

  public on(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    this.resize();
    this.createControl();
  }

  public update() {
    return this.control?.update(clock.getDelta());
  }

  public resize() {
    if (!this.canvas) return;

    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
  }

  private createControl() {
    if (this.control) {
      this.control.dispose();
    }

    if (!this.canvas) {
      return;
    }

    this.control = new CameraControls(this.camera, this.canvas);
    this.control.smoothTime = 0.16;
    this.control.mouseButtons.left = CameraControls.ACTION.TRUCK;
    this.control.mouseButtons.right = CameraControls.ACTION.ROTATE;
    this.control.updateCameraUp();
  }

  public async fitToBox(boundingBox: Box3): Promise<void> {
    if (!this.control) return;

    await this.control.reset(false);

    this.control.smoothTime = 0.56;
    await this.control.fitToBox(boundingBox, false, {
      cover: false,
      paddingTop: 0.3,
      paddingBottom: 0.3,
      paddingLeft: 0.3,
      paddingRight: 0.3,
    });
    await this.control.rotateTo(MathUtils.degToRad(10), MathUtils.degToRad(78), true);
    this.control.smoothTime = 0.16;
  }
}
