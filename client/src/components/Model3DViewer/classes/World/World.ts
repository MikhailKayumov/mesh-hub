import {
  AxesHelper,
  Box3,
  Box3Helper,
  GridHelper,
  MathUtils,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  Vector3,
} from 'three';
import { Destroyer } from '../Destroyer';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import { WorldHelpers, WorldObject3D } from '../types';
import { isObject3D } from '../utils';
import { WorldEventNames } from './constants.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends EventTarget {
  public readonly scene: Scene;
  public readonly helpers: WorldHelpers;

  public constructor(scene?: Scene) {
    super();

    this.scene = scene ?? new Scene();
    this.helpers = {
      grid: null,
      axis: null,
      ground: null,
      sceneBoundingBox: null,
    };
  }

  public add(object: Object3D, layer = 0): void {
    object.layers.set(layer);
    this.scene.add(object);
  }

  public async spawn(
    object: Array<WorldObject3D | null> | WorldObject3D | null,
    layer = 0,
    silent = false,
  ): Promise<void> {
    if (!object) return;

    if (Array.isArray(object)) {
      await Promise.all(object.map((o) => this.spawn(o, layer, true)));

      const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
      !silent && this.dispatchEvent(event);
    } else {
      if (isObject3D(object)) {
        this.add(object, layer);

        const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
        !silent && this.dispatchEvent(event);
      } else {
        object.then((o) => this.spawn(o, layer));
      }
    }
  }

  // helpers

  public spawnAxisHelper(size = 1, layer = 3): Promise<void> {
    if (this.helpers.axis) {
      Destroyer.destroyObject(this.helpers.axis);
      this.scene.remove(this.helpers.axis);
    }

    this.helpers.axis = new AxesHelper(size);
    this.helpers.axis.name = 'Axes helper';
    return this.spawn(this.helpers.axis, layer);
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef', layer = 3): Promise<void> {
    if (this.helpers.grid) {
      Destroyer.destroyObject(this.helpers.grid);
      this.scene.remove(this.helpers.grid);
    }

    this.helpers.grid = new GridHelper(size, division, color1, color2);
    this.helpers.grid.name = 'Grid helper';
    return this.spawn(this.helpers.grid, layer);
  }

  public spawnSceneBoundingBoxHelper(bb: Box3, color = '#dee2e6', layer = 3) {
    if (this.helpers.sceneBoundingBox) {
      Destroyer.destroyObject(this.helpers.sceneBoundingBox);
      this.scene.remove(this.helpers.sceneBoundingBox);
    }

    this.helpers.sceneBoundingBox = new Box3Helper(bb, color);
    this.helpers.sceneBoundingBox.layers.set(layer);
    this.helpers.sceneBoundingBox.name = 'Scene bounding box';

    return this.spawn(this.helpers.sceneBoundingBox, layer);
  }

  public spawnGroundHelper(
    color = '#dee2e6',
    width = 10,
    height = 10,
    wSegments = 24,
    hSegments = 24,
    layer = 3,
  ): Promise<void> {
    if (this.helpers.ground) {
      Destroyer.destroyObject(this.helpers.ground);
      this.scene.remove(this.helpers.ground);
    }

    const geometry = new PlaneGeometry(width, height, wSegments, hSegments);
    const material = new MeshLambertMaterial({ color });

    this.helpers.ground = new Mesh(geometry, material);
    this.helpers.ground.name = 'Floor';
    this.helpers.ground.receiveShadow = true;
    this.helpers.ground.rotateX(MathUtils.degToRad(-90));

    return this.spawn(this.helpers.ground, layer);
  }

  // helpers end

  public prepare(sceneBB?: Box3) {
    const min = sceneBB?.min ?? new Vector3();
    const max = sceneBB?.max ?? new Vector3();
    const length = max.manhattanDistanceTo(min);

    const center = new Vector3();
    sceneBB?.getCenter(center);

    const widthHelper = false;
    const [dl1, dlh1] = buildDirectionalLight({
      at: new Vector3(min.x - 0.3 * min.x, center.y - 0.7 * center.y, min.z * 3),
      intensity: 7,
      widthHelper,
    });
    dl1.name = 'Directional light 1';

    const [dl2, dlh2] = buildDirectionalLight({
      at: new Vector3(min.x - 0.6 * min.x, max.y - 0.16 * max.y, max.z * 2),
      intensity: 16,
      widthHelper,
      shadow: {
        size: 1024,
        bias: 0.0001,
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
      intensity: 12,
      widthHelper,
    });
    dl3.name = 'Directional light 3';

    const al = buildAmbientLight();
    al.name = 'Ambient light';

    return this.spawn([al, dl1, dlh1, dl2, dlh2, dl3, dlh3]);
  }

  public destroy(): void {
    this.scene.traverse(Destroyer.destroyObject);
    this.scene.clear();
    this.scene.environment?.dispose();
    this.scene.overrideMaterial?.dispose();
  }
}
