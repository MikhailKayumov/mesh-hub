import {
  Color,
  PCFSoftShadowMap,
  WebGLRenderer,
  WebGLRendererParameters,
  ColorRepresentation,
  WebGLInfo,
} from 'three/src/Three.js';
import { CameraController } from './Camera';
import { World } from './world/World.ts';

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

  public constructor({ world, cameraController, place, ...parameters }: RendererParameters) {
    this.world = world;
    this.cameraController = cameraController;

    this.renderer = new WebGLRenderer(parameters);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap; // PCFShadowMap,BasicShadowMap,PCFSoftShadowMap,VSMShadowMap
    this.renderer.setClearColor(new Color(0, 0, 0), 0);

    if (place) this.setPlace(place);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  public setClearColor(clearColor: ColorRepresentation = new Color('#282828')) {
    this.renderer.setClearColor(clearColor);
  }

  public setPlace(place: HTMLDivElement): void {
    this.place = place;
    this.place.appendChild(this.renderer.domElement);

    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  public getInfo(): WebGLInfo {
    return this.renderer.info;
  }

  public addCallback(callback: XRFrameRequestCallback): this {
    this.renderCallbacks.push(callback);
    return this;
  }

  public run(callback?: XRFrameRequestCallback | null): void {
    if (callback) {
      this.renderCallbacks.push(callback);
    }

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  public render(delta: number, frame: XRFrame) {
    this.cameraController.update();
    this.renderCallbacks.forEach((cb) => cb(delta, frame));
    this.renderer.render(this.world, this.cameraController.camera);
  }

  public destroy() {
    window.removeEventListener('resize', this.resize);

    this.renderer.getRenderTarget()?.dispose();
    this.renderer.dispose();
  }

  public getScreenshot() {
    return this.renderer.domElement.toDataURL('image/png', 0.4);
  }

  public resize = () => {
    const size = this.place?.getBoundingClientRect();

    this.renderer.setSize(size?.width ?? 0, size?.height ?? 0);
    this.cameraController.resize();
  };
}
