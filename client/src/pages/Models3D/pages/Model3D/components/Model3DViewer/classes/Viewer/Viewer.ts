import { AnimationObjectGroup, Box3, Object3D, Vector3 } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { Loader } from '@/pages/Models3D/pages/Model3D/components/Model3DViewer/classes/Loader';
import { isMesh, isSkinnedMesh } from '@/pages/Models3D/pages/Model3D/components/Model3DViewer/classes/utils';
import sleep from '@/utils/sleep.ts';
import { CameraController } from '../Camera';
import { Renderer } from '../Renderer';
import { LoadedModel3D, ViewerModel3D } from '../types';
import { World } from '../World';

export class Viewer {
  public place: HTMLDivElement | undefined;
  public renderer: Renderer;
  public camera: CameraController;
  public world: World;
  public stats: Stats | null = null;
  public model: ViewerModel3D | null = null;

  public constructor(place?: HTMLDivElement) {
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

  public init(): this {
    this.camera.on(this.renderer.getCanvas());

    if (this.stats) {
      this.renderer.addCallback(() => this.stats?.update());
    }

    return this;
  }

  public async loadModel(modelData: Model3DResponseDto): Promise<void> {
    this.model = Loader.cache.get(modelData.id);

    if (this.model) {
      await this.world.spawn(this.model.scene);
      this.renderer.render();
    } else {
      const loadedModel = await Loader.load(modelData.file);

      await this.processLoadedModel(loadedModel);

      this.model = {
        data: modelData,
        ...(await this.processLoadedModel(loadedModel)),
      };

      Loader.cache.set(modelData.id, this.model);
    }
  }

  public async run(onReady?: (viewer: Viewer) => void) {
    if (!this.model) return;

    await this.world.prepare();
    this.renderer.run();

    await sleep(0.02);
    onReady?.(this);

    // viewer.world.spawn(new Box3Helper(bb, '#5d5d5d'));
    await this.camera.fitToBox(this.model.sceneBoundingBox);
  }

  public destroy(): void {
    this.world.destroy();
    this.camera.off();
    this.renderer.destroy();
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

  private createStats(): void {
    if (import.meta.env.MODE !== 'development') return;

    this.stats = new Stats();
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = 'initial';
    this.stats.dom.style.right = '0';
    this.stats.dom.style.top = '0';
    this.stats.dom.style.left = 'initial';
    this.stats.dom.style.zIndex = '50';
    this.stats.dom.style.opacity = '0.70';

    if (this.place) {
      this.place.appendChild(this.stats.dom);
    }
  }

  private async processLoadedModel({
    scene,
    animations,
    associations,
  }: LoadedModel3D): Promise<Omit<ViewerModel3D, 'data'>> {
    await this.world.spawn(scene);
    this.renderer.render();

    const bb = new Box3().makeEmpty();
    const ag: AnimationObjectGroup = new AnimationObjectGroup();

    scene.traverse((object: Object3D) => {
      if (isSkinnedMesh(object)) {
        const vector = new Vector3();

        for (let i = 0; i < object.geometry.attributes.position.count; i++) {
          vector.fromBufferAttribute(object.geometry.attributes.position, i);
          object.applyBoneTransform(i, vector);
          object.localToWorld(vector);
          bb.expandByPoint(vector);
        }

        object.computeBoundingBox();
        object.computeBoundingSphere();

        ag.add(object);
      } else if (isMesh(object)) {
        object.geometry.computeBoundingBox();
        object.geometry.computeBoundingSphere();
      }
    });

    bb.isEmpty() && bb.setFromObject(scene);

    scene.translateY(bb.min.y * -1);
    bb.translate(new Vector3(0, bb.min.y * -1, 0));

    const hasAnimations = ag.stats.objects.total && animations?.length;

    return {
      scene,
      sceneBoundingBox: bb,
      animations: hasAnimations ? { objectGroup: ag, clips: animations } : null,
      associations,
    };
  }
}
