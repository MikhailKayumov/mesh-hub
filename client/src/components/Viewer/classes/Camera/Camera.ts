import CameraControls from 'camera-controls';
import {
  Box3,
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
} from 'three';
import sleep from '@/utils/sleep.ts';

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

export class CameraController {
  public camera: PerspectiveCamera;
  public control: CameraControls | null = null;

  private canvas: HTMLCanvasElement | null = null;

  public constructor() {
    this.camera = new PerspectiveCamera(75, 1, 0.05, 4000);
    this.camera.position.set(0, 0, 1);
  }

  public on(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    this.resize();
    this.createControl();
  }

  public off(): void {
    // todo: remove camera children
    this.control?.dispose();
  }

  public update(delta: number) {
    return this.control?.update(delta);
  }

  public resize() {
    if (!this.canvas) return;

    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();
  }

  private createControl() {
    if (this.control) {
      this.off();
    }

    if (!this.canvas) {
      return;
    }

    this.control = new CameraControls(this.camera, this.canvas);

    this.control.smoothTime = 0.16;
    this.control.mouseButtons.left = CameraControls.ACTION.TRUCK;
    this.control.mouseButtons.right = CameraControls.ACTION.ROTATE;
    this.control.mouseButtons.middle = CameraControls.ACTION.NONE;

    this.control.updateCameraUp();
  }

  public async fitToBox(boundingBox: Box3): Promise<void> {
    if (!this.control) return;

    const bbCenter = boundingBox.getCenter(new Vector3());
    const bbMin = boundingBox.min;
    const bbMax = boundingBox.max;

    await this.control.setLookAt(
      0,
      bbMax.y,
      -(Math.abs(bbMin.z) + Math.max(0.25 * bbMin.z, 20)),
      bbCenter.x,
      bbCenter.y,
      bbCenter.z,
      false,
    );
    await this.control.rotateTo(MathUtils.degToRad(160), MathUtils.degToRad(62), false);

    this.control.smoothTime = 0.472;

    await sleep(0.02);

    await Promise.all([
      this.control.fitToBox(boundingBox, true, {
        cover: false,
        paddingTop: 0.1,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
      }),
      this.control.rotateTo(MathUtils.degToRad(10), MathUtils.degToRad(84), true),
    ]);

    this.control.smoothTime = 0.16;
  }
}
