import { MOUSE, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { isOrthographicCamera, isPerspectiveCamera } from './utils';

export type CameraType = 'perspective' | 'orthographic';

export class CameraController {
  public camera: PerspectiveCamera | OrthographicCamera;
  public control: OrbitControls | null = null;

  private canvas: HTMLCanvasElement | null = null;

  public constructor(type: CameraType = 'perspective') {
    if (type === 'perspective') {
      this.camera = new PerspectiveCamera(75, 1, 0.1, 4000);
    } else {
      this.camera = new OrthographicCamera(2, -2, -1, 1, 0.001, 4000);
    }
  }

  public on(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;

    this.resize();
    this.createControl();
  }

  public update(delta: number) {
    this.camera.updateProjectionMatrix();
    this.control?.update(delta);
  }

  public resize() {
    if (!this.canvas) return;

    const aspect = this.canvas.width / this.canvas.height;

    if (isPerspectiveCamera(this.camera)) {
      this.camera.aspect = aspect;
      this.camera.position.set(3.5, -1, 2);
    } else if (isOrthographicCamera(this.camera)) {
      this.camera.left = this.canvas.width / -2;
      this.camera.right = this.canvas.width / 2;
      this.camera.top = this.canvas.height / 2;
      this.camera.bottom = this.canvas.height / -2;
      this.camera.zoom = aspect * 100;
      this.camera.position.set(2, 2, this.camera.zoom);
    }
  }

  private createControl() {
    if (this.control) {
      this.control.dispose();
    }

    if (!this.canvas) {
      return;
    }

    this.control = new OrbitControls(this.camera, this.canvas);
    this.control.target = new Vector3(0, 0, 0);

    this.control.enabled = true;
    this.control.enableDamping = true;
    this.control.dampingFactor = 0.06;

    this.control.mouseButtons = {
      LEFT: MOUSE.PAN,
      MIDDLE: undefined,
      RIGHT: MOUSE.ROTATE,
    };
  }
}
