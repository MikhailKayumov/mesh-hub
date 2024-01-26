import {
  AxesHelper,
  Box3,
  Box3Helper,
  Color,
  GridHelper,
  Light,
  MathUtils,
  Mesh,
  Object3D,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  Vector3,
} from 'three';
import { Destroyer } from '../Destroyer';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import { WorldObject3D, WorldObjects3D, WorldSpawnOptions } from '../types';
import { isLight, isObject3D } from '../utils';
import { DEFAULT_LAYER, WorldEventNames } from './constants.ts';
import { WorldHelpers } from './WorldHelpers.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends EventTarget {
  public readonly scene: Scene;
  public readonly models: Object3D[] = [];
  public readonly lights: Light[] = [];
  public readonly helpers: WorldHelpers = new WorldHelpers(); //

  public constructor(scene?: Scene) {
    super();

    this.scene = scene ?? new Scene();
  }

  public add(object: Object3D, layer = DEFAULT_LAYER): void {
    object.layers.set(layer);
    this.scene.add(object);
  }

  public async spawn(object: WorldObject3D | WorldObjects3D, options?: WorldSpawnOptions): Promise<void> {
    if (!object) return;

    if (Array.isArray(object)) {
      await Promise.all(object.map((o) => this.spawn(o, options)));

      const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
      !options?.silent && this.dispatchEvent(event);

      return;
    }

    if (!isObject3D(object)) {
      object.then((o) => this.spawn(o, options));
      return;
    }

    if (isLight(object)) this.lights.push();

    this.add(object, options?.layer);

    const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
    !options?.silent && this.dispatchEvent(event);
  }

  // helpers
  public spawnAxisHelper(size = 1): Promise<void> {
    if (this.helpers.axis) {
      Destroyer.destroyObject(this.helpers.axis);
      this.scene.remove(this.helpers.axis);
    }

    this.helpers.axis = new AxesHelper(size);
    this.helpers.axis.name = 'Axes helper';
    return this.spawn(this.helpers.axis);
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef', layer = 3): Promise<void> {
    if (this.helpers.grid) {
      Destroyer.destroyObject(this.helpers.grid);
      this.scene.remove(this.helpers.grid);
    }

    this.helpers.grid = new GridHelper(size, division, color1, color2);
    this.helpers.grid.name = 'Grid helper';
    return this.spawn(this.helpers.grid, { layer });
  }

  public spawnSceneBoundingBoxHelper(bb: Box3, color = '#dee2e6', layer = 3) {
    if (this.helpers.sceneBoundingBox) {
      Destroyer.destroyObject(this.helpers.sceneBoundingBox);
      this.scene.remove(this.helpers.sceneBoundingBox);
    }

    this.helpers.sceneBoundingBox = new Box3Helper(bb, color);
    this.helpers.sceneBoundingBox.layers.set(layer);
    this.helpers.sceneBoundingBox.name = 'Scene bounding box';

    return this.spawn(this.helpers.sceneBoundingBox, { layer });
  }

  public spawnGroundHelper(
    w = 10,
    h = 10,
    layer = 3,
    options = {
      segments: { w: 1, h: 1 },
      color: new Color(0),
    },
  ): Promise<void> {
    if (this.helpers.ground) {
      Destroyer.destroyObject(this.helpers.ground);
      this.scene.remove(this.helpers.ground);
    }

    const geometry = new PlaneGeometry(w, h, options.segments.w ?? 1, options.segments.h ?? 1);
    const material = new ShadowMaterial({ color: options.color, opacity: 0.1 });

    this.helpers.ground = new Mesh(geometry, material);
    this.helpers.ground.name = 'Ground';
    this.helpers.ground.receiveShadow = true;
    this.helpers.ground.rotateX(MathUtils.degToRad(-90));

    return this.spawn(this.helpers.ground, { layer });
  }

  // helpers end

  public prepare(sceneBB?: Box3) {
    const min = sceneBB?.min ?? new Vector3(-1, -1, -1);
    const max = sceneBB?.max ?? new Vector3(1, 1, 1);
    const length = max.manhattanDistanceTo(min);

    const center = new Vector3();
    sceneBB?.getCenter(center);

    const widthHelper = true;
    const [dl1] = buildDirectionalLight({
      at: new Vector3(min.x - 0.3 * min.x, center.y - 0.7 * center.y, min.z * 3),
      intensity: 3,
      widthHelper,
    });
    dl1.name = 'Directional light 1';

    const [dl2] = buildDirectionalLight({
      at: new Vector3(Math.min(min.x - 0.3 * min.x, -3), max.y + 0.46 * max.y, Math.max(max.z * 2, 3)),
      intensity: 10,
      widthHelper,
      shadow: {
        size: 6128,
        bias: -0.005,
        near: 0.1,
        far: Math.max(length * 2, 100),
        top: length / 2,
        bottom: -length / 2,
        right: length / 2,
        left: -length / 2,
      },
    });
    dl2.name = 'Directional light 2';

    const [dl3, dlh3] = buildDirectionalLight({
      at: new Vector3(min.x + 0.1 * min.x, center.y - 1.2 * center.y, center.z),
      intensity: 6,
      widthHelper,
    });
    dl3.name = 'Directional light 3';
    console.log(dlh3);

    const al = buildAmbientLight();
    al.name = 'Ambient light';

    return this.spawn([
      al, //
      dl1,
      // dlh1,
      dl2,
      // dlh2,
      dl3,
      // dlh3,
    ]);
  }

  public destroy(): void {
    this.scene.traverse(Destroyer.destroyObject);
    this.scene.clear();
    this.scene.environment?.dispose();
    this.scene.overrideMaterial?.dispose();
  }
}
