import {
  Audio as ThreeAudio,
  AudioListener,
  AudioLoader,
  type AnimationClip,
  AnimationMixer,
  AnimationObjectGroup,
  Box3,
  type Object3D,
  PositionalAudio,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import type { Model3DResponseDto, SceneResponseDto } from '@/app/api/dto.ts';
import { getModel3DFileSrc } from '@/shared/utils/model3d.ts';
import type { LoadedModel3D, ViewerMode, ViewerModel3D } from '../types';
import { CameraController } from '../Camera';
import { Loader } from '../Loader';
import { MeasureTool } from '../MeasureTool';
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
  public measureTool: MeasureTool;

  private _mode: ViewerMode = 'view';
  private _pointerDownHandler: ((e: PointerEvent) => void) | null = null;
  private _sceneObjectMixers = new Map<
    string,
    { clips: AnimationClip[]; mixer: AnimationMixer; cleanup: () => void }
  >();
  private _audioListener: AudioListener | null = null;
  private _audioObjects: (ThreeAudio | PositionalAudio)[] = [];

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

    this.measureTool = new MeasureTool(this);

    this.createStats();
  }

  public init(): this {
    this.camera.on(this.renderer.getCanvas());

    if (this.stats) {
      this.renderer.addCallback(() => this.stats?.update());
    }

    const listener = new AudioListener();
    this.camera.camera.add(listener);
    this._audioListener = listener;

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

  public async loadFile(url: string): Promise<void> {
    this.world.destroy();
    this.model = null;

    const loadedModel = await Loader.load(url);
    const processed = await this.processLoadedModel(loadedModel);
    this.model = { data: null as any, ...processed };
  }

  public async run() {
    this.renderer.run();
  }

  public destroy(): void {
    this.stopAllAudio();
    if (this._audioListener) {
      this.camera.camera.remove(this._audioListener);
      this._audioListener.context.close().catch(() => undefined);
      this._audioListener = null;
    }
    this.clearSceneAnimations();
    this.measureTool.dispose();
    this.world.destroy();
    this.camera.off();
    this.renderer.destroy();
  }

  public get mode(): ViewerMode {
    return this._mode;
  }

  public setMode(mode: ViewerMode): void {
    const previous = this._mode;
    this._mode = mode;
    const canvas = this.renderer.getCanvas();
    canvas.style.cursor = mode === 'view' ? '' : 'crosshair';
    if (mode === 'view' && this._pointerDownHandler) {
      canvas.removeEventListener('pointerdown', this._pointerDownHandler);
      this._pointerDownHandler = null;
    }
    if (previous === 'measure' && mode !== 'measure') {
      this.measureTool.stop();
    }
    if (mode === 'measure' && previous !== 'measure') {
      this.measureTool.start();
    }
  }

  public onScenePointerDown(
    callback: (worldPos: Vector3, cameraPos: Vector3, sceneObjectId: string | null) => void,
  ): void {
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
      // also include scene objects (multi-model scenes have no this.model)
      this.world.scene.traverse((o) => {
        if (isMesh(o)) meshes.push(o);
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const hit = intersects[0].point;
        const camPos = this.camera.camera.position.clone();

        // walk up parents to find a sceneObjectId in userData
        let sceneObjectId: string | null = null;
        let cursor: Object3D | null = intersects[0].object;
        while (cursor) {
          const id = cursor.userData?.sceneObjectId;
          if (typeof id === 'string') {
            sceneObjectId = id;
            break;
          }
          cursor = cursor.parent;
        }

        canvas.removeEventListener('pointerdown', this._pointerDownHandler!);
        this._pointerDownHandler = null;
        this.setMode('view');
        callback(hit, camPos, sceneObjectId);
      }
    };

    canvas.addEventListener('pointerdown', this._pointerDownHandler);
  }

  public async loadScene(scene: SceneResponseDto): Promise<void> {
    Loader.resizeCache(20);
    this.world.clearScene();
    this.clearSceneAnimations();
    this.renderer.setSettings({ clearColor: scene.config.backgroundColor });
    this.world.setAmbientLight(scene.config.ambientLightIntensity);

    await Promise.allSettled(
      scene.objects.map(async (obj) => {
        const loaded = await Loader.load(getModel3DFileSrc(obj.model.id, obj.model.file.entryFile));
        const object = loaded.scene;
        object.position.set(obj.posX, obj.posY, obj.posZ);
        object.rotation.set(obj.rotX, obj.rotY, obj.rotZ);
        object.scale.set(obj.scaleX, obj.scaleY, obj.scaleZ);
        object.userData.sceneObjectId = obj.id;
        object.userData.isSceneObject = true;
        await this.world.spawn(object);

        if (loaded.animations?.length) {
          const mixer = new AnimationMixer(object);
          const onRender = mixer.update.bind(mixer);
          this.renderer.addCallback(onRender);
          this._sceneObjectMixers.set(obj.id, {
            clips: loaded.animations,
            mixer,
            cleanup: () => {
              mixer.stopAllAction();
              this.renderer.removeCallback(onRender);
            },
          });
        }
      }),
    );

    for (const light of scene.lights) {
      this.world.addLight(light);
    }

    if (scene.config.environmentHdriPath) {
      await this.world.loadHdri(scene.config.environmentHdriPath);
    }

    const [bookmark] = scene.config.cameraBookmarks;
    if (bookmark) {
      this.camera.flyTo(
        bookmark.posX,
        bookmark.posY,
        bookmark.posZ,
        bookmark.targetX,
        bookmark.targetY,
        bookmark.targetZ,
      );
    }

    await this.renderer.render();
  }

  public setSelectedObject(sceneObjectId: string | null): void {
    this.world.clearHighlight();
    if (!sceneObjectId) return;
    const target = this.getSceneObjectGroup(sceneObjectId);
    if (target) this.world.highlightObject(target);
  }

  public getObjectAnimations(sceneObjectId: string): AnimationClip[] {
    return this._sceneObjectMixers.get(sceneObjectId)?.clips ?? [];
  }

  public getObjectMixer(sceneObjectId: string): AnimationMixer | undefined {
    return this._sceneObjectMixers.get(sceneObjectId)?.mixer;
  }

  public getSceneObjectMixerIds(): string[] {
    return Array.from(this._sceneObjectMixers.keys());
  }

  public get audioContext(): AudioContext | null {
    return this._audioListener?.context ?? null;
  }

  public playAudio(
    url: string,
    opts: {
      loop?: boolean;
      volume?: number;
      positional?: boolean;
      maxDistance?: number;
      refDistance?: number;
      attachTo?: Object3D;
    } = {},
  ): ThreeAudio | PositionalAudio {
    if (!this._audioListener) throw new Error('AudioListener not initialized');

    const usePositional = !!(opts.positional && opts.attachTo);
    const audio = usePositional ? new PositionalAudio(this._audioListener) : new ThreeAudio(this._audioListener);
    audio.setVolume(opts.volume ?? 1);
    audio.setLoop(opts.loop ?? false);

    if (audio instanceof PositionalAudio) {
      audio.setRefDistance(opts.refDistance ?? 1);
      audio.setMaxDistance(opts.maxDistance ?? 100);
      audio.setRolloffFactor(1);
      audio.setDistanceModel('linear');
      opts.attachTo!.add(audio);
    }

    const loader = new AudioLoader();
    loader.load(url, (buffer: AudioBuffer) => {
      audio.setBuffer(buffer);
      audio.play();
    });
    this._audioObjects.push(audio);
    return audio;
  }

  public getSceneObjectGroup(sceneObjectId: string): Object3D | undefined {
    let target: Object3D | undefined;
    this.world.scene.traverse((obj) => {
      if (obj.userData.sceneObjectId === sceneObjectId) target = obj;
    });
    return target;
  }

  public stopAllAudio(): void {
    this._audioObjects.forEach((a) => {
      if (a.isPlaying) a.stop();
      a.disconnect();
      if (a.parent) a.parent.remove(a);
    });
    this._audioObjects = [];
  }

  private clearSceneAnimations(): void {
    this._sceneObjectMixers.forEach((entry) => entry.cleanup());
    this._sceneObjectMixers.clear();
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
