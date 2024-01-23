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
import { Destroyer } from '@/components/Model3DViewer/classes/Destroyer';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import { PromiseWorldObject3D, WorldHelpers, WorldObject3D } from '../types';
import { isObject3D } from '../utils';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends Scene {
  private helpers: WorldHelpers = {
    grid: null,
    axis: null,
    ground: null,
    sceneBoundingBox: null,
  };

  public async spawn(object: Array<WorldObject3D | null> | WorldObject3D | null, layer = 0): Promise<void> {
    if (!object) return;

    if (Array.isArray(object)) {
      object.forEach((o) => this.spawn(o, layer), this);
    } else {
      if (isObject3D(object)) {
        object.layers.set(layer);
        this.add(object);
      } else {
        await this.spawnAsync(object, layer);
      }
    }
  }

  public async spawnAsync(object: PromiseWorldObject3D[] | PromiseWorldObject3D, layer = 0): Promise<void> {
    if (Array.isArray(object)) {
      await Promise.all(object).then((objects) => {
        objects.forEach((o) => this.spawn(o, layer));
      });
    } else {
      object.then((o) => this.spawn(o, layer));
    }
  }

  public spawnAxisHelper(size = 1, layer = 3): this {
    if (this.helpers.axis) {
      Destroyer.destroyObject(this.helpers.axis);
      this.remove(this.helpers.axis);
    }

    this.helpers.axis = new AxesHelper(size);
    this.helpers.axis.layers.set(layer);

    this.add(this.helpers.axis);

    return this;
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef', layer = 3): this {
    if (this.helpers.grid) {
      Destroyer.destroyObject(this.helpers.grid);
      this.remove(this.helpers.grid);
    }

    this.helpers.grid = new GridHelper(size, division, color1, color2);
    this.helpers.grid.layers.set(layer);
    this.add(this.helpers.grid);

    return this;
  }

  public spawnSceneBoundingBoxHelper(bb: Box3, color = '#dee2e6', layer = 3): this {
    if (this.helpers.sceneBoundingBox) {
      Destroyer.destroyObject(this.helpers.sceneBoundingBox);
      this.remove(this.helpers.sceneBoundingBox);
    }

    this.helpers.sceneBoundingBox = new Box3Helper(bb, color);
    this.helpers.sceneBoundingBox.layers.set(layer);

    this.add(this.helpers.sceneBoundingBox);

    return this;
  }

  public spawnGroundHelper(color = '#dee2e6', width = 10, height = 10, wSegments = 24, hSegments = 24): this {
    if (this.helpers.ground) {
      Destroyer.destroyObject(this.helpers.ground);
      this.remove(this.helpers.ground);
    }

    const geometry = new PlaneGeometry(width, height, wSegments, hSegments);
    const material = new MeshLambertMaterial({ color });

    this.helpers.ground = new Mesh(geometry, material);
    this.helpers.ground.receiveShadow = true;
    this.helpers.ground.rotateX(MathUtils.degToRad(-90));

    this.add(this.helpers.ground);

    return this;
  }

  public prepare(sceneBB?: Box3) {
    const widthHelper = false;
    const shadow = { size: 2048, near: 1, far: 10000 };

    const center = new Vector3();
    sceneBB?.getCenter(center);

    const [dl1, dlh1] = buildDirectionalLight({
      at: new Vector3(sceneBB?.max.x, center.y + center.y / 2, center.z + center.z / 3),
      intensity: 2.2,
      widthHelper,
      shadow,
    });
    const [dl2, dlh2] = buildDirectionalLight({
      at: new Vector3(center.x, center.y - center.y / 2, sceneBB?.max.z),
      intensity: 2.9,
      widthHelper,
      shadow,
    });
    const [dl3, dlh3] = buildDirectionalLight({
      at: new Vector3(sceneBB?.min.x, Math.max(sceneBB?.min.y ?? 0, 0.1), sceneBB?.min.z),
      intensity: 1.1,
      widthHelper,
      shadow,
    });

    /*const [dl, dlh] = buildDirectionalLight({
      at: new Vector3(0, (sceneBB?.max.y ?? 1) * 10, 0),
      intensity: 1,
      widthHelper,
      shadow,
    });
    const [sl1, slh1] = buildSpotLight({
      at: new Vector3(sceneBB?.min.x, (sceneBB?.max.y ?? 1) * 2, sceneBB?.max.z),
      to: new Vector3(0, center.y, 0),
      power: 48,
      widthHelper,
      shadow,
    });
    const [sl2, slh2] = buildSpotLight({
      at: new Vector3(sceneBB?.max.x, center.y, (sceneBB?.max.z ?? 1) * 10),
      to: new Vector3(0, center.y, 0),
      power: 120,
      intensity: 10,
      angel: 27,
      widthHelper,
      shadow,
    });
    const [sl3, slh3] = buildSpotLight({
      at: new Vector3(sceneBB?.min.x, Math.max(sceneBB?.min.y ?? 0, 1), -(sceneBB?.max.z ?? 1) * 4),
      to: new Vector3(0, center.y, 0),
      power: 16,
      angel: 36,
      widthHelper,
      shadow,
    });*/

    return this.spawn([
      buildAmbientLight(), //
      dl1,
      dlh1,
      dl2,
      dlh2,
      dl3,
      dlh3,
    ]);
    // return this.spawn([al, sl1, slh1, sl2, slh2, sl3, slh3, dl, dlh]);
  }

  public destroy(): void {
    this.traverse(Destroyer.destroyObject);
    this.clear();
    this.environment?.dispose();
    this.overrideMaterial?.dispose();
  }
}
