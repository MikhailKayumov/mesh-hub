import Stats from 'three/addons/libs/stats.module.js';
import { CameraController } from '../Camera';
import { Renderer } from '../Renderer';
import { ViewerAnimations } from '../types';
import { World } from '../World';

export class Viewer {
  public place: HTMLDivElement | undefined;
  public world: World;
  public camera: CameraController;
  public renderer: Renderer;
  public stats: Stats | null = null;
  public animations: ViewerAnimations | null = null;

  public constructor(place: HTMLDivElement) {
    this.place = place;

    this.world = new World();
    this.camera = new CameraController();
    this.renderer = new Renderer({
      world: this.world,
      cameraController: this.camera,
      antialias: true,
      precision: 'highp',
      preserveDrawingBuffer: true,
      alpha: true,
      logarithmicDepthBuffer: true,
      depth: true,
      place: this.place,
    });

    this.createStats();
  }

  public setPlace(place: HTMLDivElement): this {
    if (this.place !== place) {
      this.place = place;
      this.renderer.setPlace(place);

      if (this.stats) {
        this.place.appendChild(this.stats.dom);
      }
    }

    return this;
  }

  public run(): this {
    this.camera.on(this.renderer.getCanvas());

    if (this.stats) {
      this.renderer.addCallback(() => this.stats?.update());
    }

    this.renderer.render();

    return this;
  }

  public destroy(): void {
    this.world.destroy();
    this.camera.off();
    this.renderer.destroy();
  }

  private createStats(): void {
    if (import.meta.env.MODE !== 'development' || !this.place) return;

    this.stats = new Stats();
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = 'initial';
    this.stats.dom.style.right = '0';
    this.stats.dom.style.top = '0';
    this.stats.dom.style.left = 'initial';
    this.stats.dom.style.zIndex = '50';
    this.stats.dom.style.opacity = '0.70';

    this.place.appendChild(this.stats.dom);
  }
}
