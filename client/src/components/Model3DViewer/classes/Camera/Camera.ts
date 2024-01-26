import CameraControls from 'camera-controls';
import {
  Box3,
  Layers,
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
    this.camera = new PerspectiveCamera(45, 1, 0.05, 5000);
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

  public testLayers(layers: Layers) {
    return this.camera.layers.test(layers);
  }

  public enableLayer(layer: number | number[]) {
    if (Array.isArray(layer)) {
      layer.forEach(this.enableLayer, this);
    } else {
      !this.camera.layers.isEnabled(layer) && this.camera.layers.enable(layer);
    }
  }

  public disableLayer(layer: number | number[]) {
    if (Array.isArray(layer)) {
      layer.forEach(this.disableLayer, this);
    } else {
      this.camera.layers.isEnabled(layer) && this.camera.layers.disable(layer);
    }
  }

  public disableLayers(layers?: number[] | null) {
    if (!layers) {
      this.camera.layers.disableAll();
    } else {
      this.disableLayer(layers);
    }
  }

  public async moveToInitPosition(boundingBox: Box3): Promise<void> {
    if (!this.control) return;

    await Promise.all([
      this.control.fitToBox(boundingBox, false, {
        cover: true,
        paddingTop: 25,
        paddingBottom: 25,
        paddingLeft: 25,
        paddingRight: 25,
      }),
      this.control.rotateTo(MathUtils.degToRad(194), MathUtils.degToRad(58), false),
    ]);
  }

  public async fitToBox(boundingBox: Box3, padding = 0): Promise<void> {
    if (!this.control) return;

    this.control.smoothTime = 0.482;

    await Promise.all([
      this.control.fitToBox(boundingBox, true, {
        cover: false,
        paddingTop: padding,
        paddingBottom: padding,
        paddingLeft: padding,
        paddingRight: padding,
      }),
      this.control.rotateTo(MathUtils.degToRad(-0), MathUtils.degToRad(76), true),
    ]);

    this.control.smoothTime = 0.16;
  }

  private createControl() {
    if (this.control) {
      this.off();
    }

    if (!this.canvas) {
      return;
    }

    this.control = new CameraControls(this.camera, this.canvas);

    this.control.minDistance = Number.EPSILON;
    this.control.maxDistance = 2000;
    this.control.smoothTime = 0.16;

    this.control.mouseButtons.left = CameraControls.ACTION.TRUCK;
    this.control.mouseButtons.right = CameraControls.ACTION.ROTATE;
    this.control.mouseButtons.middle = CameraControls.ACTION.NONE;

    this.control.updateCameraUp();
  }
}
