import { MOUSE, PerspectiveCamera, Vector3 } from 'three/src/Three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Camera {
  public static camera: PerspectiveCamera;
  public static control: OrbitControls;

  public static create(width: number, height: number, canvas: HTMLCanvasElement) {
    this.camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(24, -6, 22);

    this.control = new OrbitControls(this.camera, canvas);
    this.control.target = new Vector3(-5, 5, 5);
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
