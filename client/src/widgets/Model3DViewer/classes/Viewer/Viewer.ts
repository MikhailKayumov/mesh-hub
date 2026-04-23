import { AnimationObjectGroup, Box3, type Object3D, Raycaster, Vector2, Vector3 } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import { getModel3DFileSrc } from '@/shared/utils/model3d.ts';
import type { LoadedModel3D, ViewerMode, ViewerModel3D } from '../types';
import { CameraController } from '../Camera';
import { Loader } from '../Loader';
import { Renderer } from '../Renderer';
import { isMesh, isObject3D, isSkinnedMesh } from '../utils';
import { World } from '../World';

export class Viewer {
  public place: HTMLDivElement | undefined;
  public renderer: Renderer;
  public camera: CameraController;
  public world: World;
  public stats: Stats | null = null;
  public model: ViewerModel3D<Model3DResponseDto> | null = null;

  private _mode: ViewerMode = 'view';
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null;

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
    this.model = Loader.cache.get(modelData.id) as ViewerModel3D<Model3DResponseDto>;

    if (this.model) {
      await this.world.spawn(this.model.scene);
      await this.renderer.render();
      return;
    }

    const loadedModel = await Loader.load(getModel3DFileSrc(modelData.id, modelData.file.entryFile));

    this.model = {
      data: modelData,
      ...(await this.processLoadedModel(loadedModel)),
    };
    this.model.scene.name = modelData.name;

    Loader.cache.set(modelData.id, this.model);
  }

  public async run() {
    this.renderer.run();
  }

  public destroy(): void {
    this.world.destroy();
    this.camera.off();
    this.renderer.destroy();
  }

  public setMode(mode: ViewerMode): void {
    this._mode = mode;
    const canvas = this.renderer.getCanvas();
    canvas.style.cursor = mode === 'view' ? '' : 'crosshair';
    if (mode === 'view' && this._pointerDownHandler) {
      canvas.removeEventListener('pointerdown', this._pointerDownHandler);
      this._pointerDownHandler = null;
    }
  }

  public onScenePointerDown(callback: (worldPos: Vector3, cameraPos: Vector3) => void): void {
    const canvas = this.renderer.getCanvas();
    if (this._pointerDownHandler) {
      canvas.removeEventListener('pointerdown', this._pointerDownHandler);
    }

    this._pointerDownHandler = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new Raycaster();
      raycaster.setFromCamera(new Vector2(x, y), this.camera.camera);

      const meshes: Object3D[] = [];
      if (this.model) {
        this.model.scene.traverse((o) => {
          if (isMesh(o)) meshes.push(o);
        });
      }

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].point;
        const camPos = this.camera.camera.position.clone();
        canvas.removeEventListener('pointerdown', this._pointerDownHandler!);
        this._pointerDownHandler = null;
        this.setMode('view');
        callback(hit, camPos);
      }
    };

    canvas.addEventListener('pointerdown', this._pointerDownHandler);
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
    await this.renderer.render();

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

      if (isMesh(object)) {
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => {
            m.needsUpdate = true;
          });
        } else {
          object.material.needsUpdate = true;
        }
      }

      if (isObject3D(object)) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    if (bb.isEmpty()) {
      bb.setFromObject(scene);
    }

    const centerX = bb.max.x - (bb.max.x - bb.min.x) / 2;
    const centerZ = bb.max.z - (bb.max.z - bb.min.z) / 2;

    const bbCenter = new Vector3();
    bb.getCenter(bbCenter);

    scene.position.set(centerX * -1, bb.min.y * -1, centerZ * -1);
    bb.translate(new Vector3(centerX * -1, bb.min.y * -1, centerZ * -1));

    return {
      scene,
      sceneBoundingBox: bb,
      animations: animations?.length ? { objectGroup: ag, clips: animations } : null,
      associations,
    };
  }
}
