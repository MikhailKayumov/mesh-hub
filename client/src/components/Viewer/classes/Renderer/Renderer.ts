import {
  Clock,
  // NoToneMapping,
  // LinearToneMapping,
  ReinhardToneMapping,
  // CineonToneMapping,
  // ACESFilmicToneMapping,
  // CustomToneMapping,
} from 'three';
import { Color, PCFSoftShadowMap, WebGLRenderer, WebGLRendererParameters, ColorRepresentation, WebGLInfo } from 'three';
import { CameraController } from '../Camera/Camera.ts';
import { World } from '../World';

export interface RendererParameters extends WebGLRendererParameters {
  world: World;
  cameraController: CameraController;
  place?: HTMLDivElement;
  pixelRatio?: number;
  clearColor?: Color;
}

export class Renderer {
  private place: HTMLDivElement | null = null;
  private placeObserver: ResizeObserver | null = null;

  private renderer: WebGLRenderer;
  private world: World;
  private cameraController: CameraController;

  public renderCallbacks: Array<(delta: number) => void> = [];

  public readonly clock = new Clock();

  public constructor({ world, cameraController, place, ...parameters }: RendererParameters) {
    this.world = world;
    this.cameraController = cameraController;

    this.renderer = new WebGLRenderer(parameters);
    this.renderer.toneMapping = ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
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

  public getPlace(): HTMLDivElement | null {
    return this.place;
  }

  public setPlace(place: HTMLDivElement): void {
    if (this.place) {
      this.placeObserver?.unobserve(this.place);
    }

    this.placeObserver?.disconnect();

    this.place = place;
    this.place.appendChild(this.renderer.domElement);

    this.resize();
    this.placeObserver = new ResizeObserver(() => this.resize());
    this.placeObserver.observe(this.place);
  }

  public getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  public getInfo(): WebGLInfo {
    return this.renderer.info;
  }

  public addCallback(callback: (delta: number) => void): this {
    this.renderCallbacks.push(callback);
    return this;
  }

  public removeCallback(callback: (delta: number) => void): this {
    this.renderCallbacks = this.renderCallbacks.filter((i) => i !== callback);
    return this;
  }

  public run(callback?: (delta: number) => void | null): void {
    if (callback) {
      this.renderCallbacks.push(callback);
    }

    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  public render() {
    const delta = this.clock.getDelta();

    this.cameraController.update();
    this.renderCallbacks.forEach((cb) => cb(delta));
    this.renderer.render(this.world, this.cameraController.camera);
  }

  public destroy() {
    if (this.place) {
      this.placeObserver?.unobserve(this.place);
    }

    this.placeObserver?.disconnect();
    this.renderCallbacks = [];
    this.renderer.setAnimationLoop(null);
    this.renderer.getRenderTarget()?.dispose();
    this.renderer.dispose();
  }

  public getScreenshot() {
    return this.renderer.domElement.toDataURL('image/png', 0.2);
  }

  public resize = () => {
    const size = this.place?.getBoundingClientRect();

    this.renderer.setSize(size?.width ?? 0, size?.height ?? 0);
    this.cameraController.resize();
  };
}
