import {
  AxesHelper,
  type Box3,
  Box3Helper,
  Color,
  GridHelper,
  type Light,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { Destroyer } from '../Destroyer';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import { type WorldEventListener, type WorldObject3D, type WorldObjects3D, type WorldSpawnOptions } from '../types';
import { isLight, isObject3D } from '../utils';
import { DEFAULT_LAYER, type WorldEvent, WorldEventNames } from './constants.ts';
import { WorldHelpers } from './WorldHelpers.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends EventTarget {
  public readonly scene: Scene;
  public readonly models: Object3D[] = [];
  public readonly lights: Light[] = [];
  public readonly helpers: WorldHelpers = new WorldHelpers(); //
  private markers: Map<string, Mesh> = new Map();

  public constructor(scene?: Scene) {
    super();

    this.scene = scene ?? new Scene();
  }

  public add(object: Object3D, layer = DEFAULT_LAYER): void {
    object.traverse((o) => {
      o.layers.set(layer);
    });
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

    if (isLight(object)) this.lights.push(object);

    this.add(object, options?.layer);

    const event = new CustomEvent<Scene>(WorldEventNames.WorldSceneChange, { detail: this.scene });
    !options?.silent && this.dispatchEvent(event);
  }

  // events
  public on(name: WorldEvent, listener: WorldEventListener): () => void {
    this.addEventListener(name, listener as EventListenerOrEventListenerObject);

    return () => {
      this.removeEventListener(name, listener as EventListenerOrEventListenerObject);
    };
  }

  public off(name: WorldEvent, listener: WorldEventListener): void {
    this.removeEventListener(name, listener as EventListenerOrEventListenerObject);
  }

  // helpers
  public spawnAxisHelper(size = 1): Promise<void> {
    if (this.helpers.axis) {
      Destroyer.destroyObject(this.helpers.axis);
      this.scene.remove(this.helpers.axis);
    }

    this.helpers.axis = new AxesHelper(size);
    this.helpers.axis.name = 'Axes helper';
    return this.spawn(this.helpers.axis, { layer: 10 });
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef', layer = 10): Promise<void> {
    if (this.helpers.grid) {
      Destroyer.destroyObject(this.helpers.grid);
      this.scene.remove(this.helpers.grid);
    }

    this.helpers.grid = new GridHelper(size, division, color1, color2);
    this.helpers.grid.name = 'Grid helper';
    return this.spawn(this.helpers.grid, { layer });
  }

  public spawnSceneBoundingBoxHelper(bb: Box3, color = '#dee2e6', layer = 11) {
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
    layer = 9,
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

  public async prepare(sceneBB?: Box3) {
    const min = sceneBB?.min ?? new Vector3(-1, -1, -1);
    const max = sceneBB?.max ?? new Vector3(1, 1, 1);
    const length = max.manhattanDistanceTo(min);

    const center = new Vector3();
    sceneBB?.getCenter(center);

    const [dl1, dlh1] = buildDirectionalLight({
      color: 'rgb(152,214,255)',
      at: new Vector3(min.x - 0.3 * min.x, center.y - 0.7 * center.y, min.z * 13),
      to: new Vector3(0, center.y, 0),
      intensity: 2.4,
      name: 'Directional light 1',
    });

    const [dl2, dlh2] = buildDirectionalLight({
      color: 'rgb(255,236,204)',
      at: new Vector3(Math.min(min.x - 0.3 * min.x, -3), max.y + 0.46 * max.y, Math.min(Math.max(max.z * 2, 3), 5)),
      intensity: 28,
      name: 'Directional light 2',
      shadow: {
        size: 1024,
        bias: -0.0005,
        near: 0.1,
        far: Math.max(length * 2, 100),
        top: length / 2,
        bottom: -length / 2,
        right: length / 2,
        left: -length / 2,
      },
    });

    const [dl3, dlh3] = buildDirectionalLight({
      color: 'rgb(255, 204, 51)',
      at: new Vector3(min.x + 0.1 * min.x, center.y - 3.5 * center.y, center.z),
      intensity: 1.6,
      name: 'Directional light 3',
    });

    const al = buildAmbientLight({ intensity: 0.2 });
    al.name = 'Ambient light';

    await Promise.all([
      this.spawn(
        [
          al, //
          dl1,
          dl2,
          dl3,
        ],
        { layer: 1 },
      ), //
      this.spawn([dlh1, dlh2, dlh3], { layer: 13 }),
    ]);
  }

  public destroy(): void {
    this.scene.traverse(Destroyer.destroyObject);
    this.scene.clear();
    this.scene.environment?.dispose();
    this.scene.overrideMaterial?.dispose();
  }

  // markers
  public spawnMarker(id: string, pos: Vector3): void {
    this.removeMarker(id);
    const geo = new SphereGeometry(0.02, 8, 8);
    const mat = new MeshBasicMaterial({ color: 0xffaa00 });
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.userData.markerId = id;
    this.scene.add(mesh);
    this.markers.set(id, mesh);
  }

  public removeMarker(id: string): void {
    const mesh = this.markers.get(id);
    if (!mesh) return;
    this.scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as MeshBasicMaterial).dispose();
    this.markers.delete(id);
  }

  public clearMarkers(): void {
    for (const id of [...this.markers.keys()]) {
      this.removeMarker(id);
    }
  }

  public highlightMarker(id: string | null): void {
    this.markers.forEach((mesh, markerId) => {
      (mesh.material as MeshBasicMaterial).color.set(markerId === id ? 0xff5500 : 0xffaa00);
    });
  }
}
