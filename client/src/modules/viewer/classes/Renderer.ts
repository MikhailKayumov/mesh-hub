import { Color, PCFSoftShadowMap, WebGLRenderer, WebGLRendererParameters } from 'three';
import { CameraController } from './Camera';
import { World } from './World';

export interface RendererParameters extends WebGLRendererParameters {
  world: World;
  cameraController: CameraController;
  place?: HTMLDivElement;
  pixelRatio?: number;
  clearColor?: Color;
}

export class Renderer {
  // viewport
  private place: HTMLDivElement | null = null;

  private renderer: WebGLRenderer;
  private world: World;
  private cameraController: CameraController;
  private renderCallbacks: XRFrameRequestCallback[] = [];

  public constructor({ world, cameraController, place, pixelRatio, clearColor, ...parameters }: RendererParameters) {
    this.world = world;
    this.cameraController = cameraController;

    this.renderer = new WebGLRenderer(parameters);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(pixelRatio ?? window.devicePixelRatio);
    this.renderer.setClearColor(clearColor ?? new Color('#282828'));

    if (place) this.setPlace(place);
  }

  public setPlace(place: HTMLDivElement): void {
    this.place = place;
    this.place.innerHTML = '';
    this.place.appendChild(this.renderer.domElement);

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public run(callback: XRFrameRequestCallback | null): void {
    if (callback) {
      this.renderCallbacks.push(callback);
    }

    this.cameraController.on(this.renderer.domElement);

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  public render(delta: number, frame: XRFrame) {
    this.cameraController.update(delta);
    this.renderCallbacks.forEach((cb) => cb(delta, frame));
    this.renderer.render(this.world, this.cameraController.camera);
  }

  public destroy() {
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
  }

  public resize = () => {
    const size = this.place?.getBoundingClientRect();
    this.renderer.setSize(size?.width ?? 0, size?.height ?? 0);
    this.cameraController.resize();
  };
}
