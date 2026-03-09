import {
  BasicShadowMap,
  Clock,
  Color,
  PCFSoftShadowMap,
  ReinhardToneMapping,
  type ShadowMapType,
  WebGLRenderer,
} from 'three';
import { type CameraController } from '../Camera';
import { type RenderCallback, type RendererParameters, type RendererSettings } from '../types';
import { isMesh } from '../utils';
import { type World } from '../World';

export class Renderer {
  private readonly world: World;
  private readonly cameraController: CameraController;
  private readonly renderCallbacks: Set<RenderCallback> = new Set();
  private place: HTMLDivElement | null = null;
  private placeObserver: ResizeObserver | null = null;

  public readonly renderer: WebGLRenderer;
  public readonly clock = new Clock();

  public constructor({ world, cameraController, place, ...parameters }: RendererParameters) {
    this.world = world;
    this.cameraController = cameraController;

    this.renderer = new WebGLRenderer(parameters);

    this.renderer.toneMapping = ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.renderer.info.autoReset = false;

    this.renderer.autoClear = true;
    this.renderer.setClearColor(new Color(0, 0, 0), 0);

    this.setShadowMap(PCFSoftShadowMap);

    if (place) this.setPlace(place);
  }

  public run(callback?: RenderCallback): void {
    callback && this.renderCallbacks.add(callback);
    this.renderer.setAnimationLoop(this.render.bind(this));
  }

  public async render() {
    this.renderer.info.reset();

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.cameraController.update(delta);

    const callbacks: (Promise<void> | void)[] = [];

    this.renderCallbacks.forEach((cb) => {
      callbacks.push(cb(delta, elapsed, this.clock));
    });

    await Promise.all(callbacks);

    this.renderer.clear();
    this.renderer.render(this.world.scene, this.cameraController.camera);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
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

  public getInfo() {
    return this.renderer.info;
  }

  public getScreenshot() {
    return this.renderer.domElement.toDataURL('image/png', 0.2);
  }

  public getSettings(): RendererSettings {
    const clearColor = new Color();
    this.renderer.getClearColor(clearColor);

    return {
      outputColorSpace: this.renderer.outputColorSpace,
      shadowMapType: this.renderer.shadowMap.enabled ? this.renderer.shadowMap.type : undefined,
      toneMapping: this.renderer.toneMapping,
      toneMappingExposure: this.renderer.toneMappingExposure,
      clearColor: `#${clearColor.getHexString()}`,
      clearAlpha: this.renderer.getClearAlpha(),
    };
  }

  public setSettings(settings: RendererSettings) {
    if (settings.outputColorSpace) {
      this.renderer.outputColorSpace = settings.outputColorSpace;
    }

    this.renderer.toneMapping = settings.toneMapping ?? this.renderer.toneMapping ?? ReinhardToneMapping;
    this.renderer.toneMappingExposure = settings.toneMappingExposure ?? this.renderer.toneMappingExposure ?? 1;

    this.setShadowMap(settings.shadowMapType);

    this.renderer.setClearColor(settings.clearColor ?? 0x000000, settings.clearAlpha ?? 0);
  }

  public addCallback(callback: RenderCallback): () => void {
    this.renderCallbacks.add(callback);

    return () => this.removeCallback(callback);
  }

  public removeCallback(callback: RenderCallback): void {
    this.renderCallbacks.delete(callback);
  }

  public resize() {
    const size = this.place?.getBoundingClientRect();

    this.renderer.setSize(size?.width ?? 0, size?.height ?? 0);
    this.cameraController.resize();
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

  // =====
  private setShadowMap(shadowMapType?: ShadowMapType) {
    this.renderer.shadowMap.enabled = shadowMapType !== undefined;
    this.renderer.shadowMap.type = shadowMapType ?? this.renderer.shadowMap.type ?? BasicShadowMap;
    this.renderer.shadowMap.needsUpdate = true;

    this.world.scene.traverse((object) => {
      if (isMesh(object)) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => {
            m.needsUpdate = true;
          });
        } else {
          object.material.needsUpdate = true;
        }
      }
    });
  }
}
