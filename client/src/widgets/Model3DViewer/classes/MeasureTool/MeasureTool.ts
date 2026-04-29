import { type Object3D, Raycaster, Vector2, type Vector3 } from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { isMesh } from '../utils';
import { type Viewer } from '../Viewer';

const MEASURE_LINE_ID = 'measure-line';
const MEASURE_COLOR = 0x4dabf7;

export class MeasureTool {
  private readonly viewer: Viewer;
  private pointA: Vector3 | null = null;
  private line: Line2 | null = null;
  private label: CSS2DObject | null = null;
  private pointerDownHandler: ((event: PointerEvent) => void) | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  public constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  public start(): void {
    if (this.pointerDownHandler) return;

    const canvas = this.viewer.renderer.getCanvas();

    this.pointerDownHandler = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(x, y), this.viewer.camera.camera);

      const meshes: Object3D[] = [];
      this.viewer.world.scene.traverse((o) => {
        if (isMesh(o) && o.userData.id !== MEASURE_LINE_ID) meshes.push(o);
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length === 0) return;

      const hit = intersects[0].point.clone();

      if (!this.pointA) {
        this.pointA = hit;
        return;
      }

      this.drawMeasure(this.pointA, hit);
      this.pointA = null;
    };

    this.keydownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.viewer.setMode('view');
      }
    };

    canvas.addEventListener('pointerdown', this.pointerDownHandler);
    window.addEventListener('keydown', this.keydownHandler);
  }

  public stop(): void {
    const canvas = this.viewer.renderer.getCanvas();

    if (this.pointerDownHandler) {
      canvas.removeEventListener('pointerdown', this.pointerDownHandler);
      this.pointerDownHandler = null;
    }
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    this.pointA = null;
    this.disposeMeasureLine();
  }

  public dispose(): void {
    this.stop();
  }

  private drawMeasure(a: Vector3, b: Vector3): void {
    this.disposeMeasureLine();

    const canvas = this.viewer.renderer.getCanvas();

    const geometry = new LineGeometry();
    geometry.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);

    const material = new LineMaterial({
      color: MEASURE_COLOR,
      linewidth: 2,
      depthTest: false,
      transparent: true,
    });
    material.resolution.set(canvas.clientWidth, canvas.clientHeight);

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    line.renderOrder = 999;
    line.userData.id = MEASURE_LINE_ID;
    this.viewer.world.scene.add(line);
    this.line = line;

    const div = document.createElement('div');
    div.textContent = `${a.distanceTo(b).toFixed(2)} m`;
    div.style.color = '#ffffff';
    div.style.background = 'rgba(0, 0, 0, 0.7)';
    div.style.padding = '2px 6px';
    div.style.borderRadius = '4px';
    div.style.fontSize = '12px';
    div.style.fontFamily = 'sans-serif';
    div.style.pointerEvents = 'none';
    div.style.whiteSpace = 'nowrap';

    const label = new CSS2DObject(div);
    label.position.copy(a).add(b).multiplyScalar(0.5);
    label.userData.id = MEASURE_LINE_ID;
    this.viewer.world.scene.add(label);
    this.label = label;
  }

  private disposeMeasureLine(): void {
    if (this.line) {
      this.viewer.world.scene.remove(this.line);
      this.line.geometry.dispose();
      (this.line.material as LineMaterial).dispose();
      this.line = null;
    }
    if (this.label) {
      this.viewer.world.scene.remove(this.label);
      this.label.element.remove();
      this.label = null;
    }
  }
}
