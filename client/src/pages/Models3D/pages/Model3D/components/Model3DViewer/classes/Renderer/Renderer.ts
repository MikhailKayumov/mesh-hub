import { Clock, ReinhardToneMapping, Color, PCFSoftShadowMap, WebGLRenderer } from 'three';
import { CameraController } from '../Camera';
import { RendererParameters } from '../types';
import { World } from '../World';

export class Renderer {
  private readonly world: World;
  private readonly cameraController: CameraController;
  private readonly renderCallbacks: Set<(delta: number) => void> = new Set();
  private place: HTMLDivElement | null = null;
  private placeObserver: ResizeObserver | null = null;

  public readonly renderer: WebGLRenderer;
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

  public addCallback(callback: (delta: number) => void): this {
    this.renderCallbacks.add(callback);
    return this;
  }

  public removeCallback(callback: (delta: number) => void): this {
    this.renderCallbacks.delete(callback);
    return this;
  }

  public run(callback?: (delta: number) => void | null): void {
    callback && this.renderCallbacks.add(callback);
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  public render() {
    const delta = this.clock.getDelta();

    this.cameraController.update(delta);
    this.renderCallbacks.forEach((cb) => cb(delta));
    this.renderer.render(this.world, this.cameraController.camera);
  }

  public destroy() {
    if (this.place) {
      this.placeObserver?.unobserve(this.place);
    }

    this.placeObserver?.disconnect();
    this.renderCallbacks.clear();
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
