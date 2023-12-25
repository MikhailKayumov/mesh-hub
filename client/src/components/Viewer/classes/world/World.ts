import { AxesHelper, GridHelper, Material, Object3D, Scene } from 'three/src/Three.js';
import { PromiseWorldObject3D, WorldLights, WorldObject3D } from '../types/world.ts';
import { isDisposableObject3D, isLight, isMesh, isWithMaterialObject3D } from '../utils/type-guards.ts';

const MATERIAL_TEXTURE_FIELDS = [
  'alphaMap',
  'aoMap',
  'envMap',
  'lightMap',
  'map',
  'bumpMap',
  'displacementMap',
  'emissiveMap',
  'gradientMap',
  'metalnessMap',
  'normalMap',
  'roughnessMap',
  'specularMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'sheenRoughnessMap',
  'sheenColorMap',
  'specularIntensityMap',
  'specularColorMap',
  'thicknessMap',
  'transmissionMap',
];

export class World extends Scene {
  public readonly lights: WorldLights = {
    ambient: null,
    spot: [],
  };

  public async spawn(object: Array<WorldObject3D | null> | WorldObject3D | null): Promise<void> {
    if (!object) return;

    if (Array.isArray(object)) {
      object.forEach(this.spawn, this);
    } else {
      if ((object as Object3D).isObject3D) {
        this.add(object as any);
      } else {
        await this.spawnAsync(object as any);
      }
    }
  }

  public async spawnAsync(object: PromiseWorldObject3D[] | PromiseWorldObject3D): Promise<void> {
    if (Array.isArray(object)) {
      await Promise.all(object).then((objects) => {
        objects.forEach((o) => this.spawn(o));
      });
    } else {
      object.then((o) => this.spawn(o));
    }
  }

  public addAxisHelper(size = 1): this {
    const axisHelper = new AxesHelper(size);

    this.add(axisHelper);

    return this;
  }

  public addGridHelper(size = 100, division = 50): this {
    const color1 = '#dee2e6';
    const color2 = '#e9ecef';

    const gridHelper = new GridHelper(size, division, color1, color2);

    this.add(gridHelper);

    return this;
  }

  public destroy(): void {
    this.traverse(this.destroyObject.bind(this));
    this.clear();
    this.environment?.dispose();
    this.overrideMaterial?.dispose();
  }

  private destroyObject(object: Object3D): void {
    if (isMesh(object)) {
      object.geometry.dispose();
    }

    if (isLight(object)) {
      object.shadow?.map?.dispose();
      object.shadow?.mapPass?.dispose();
      object.shadow?.dispose();
    }

    if (isWithMaterialObject3D(object)) {
      this.destroyMaterial(object.material);
    }

    if (isDisposableObject3D(object)) {
      object.dispose();
    }
  }

  private destroyMaterial(material: Material | Material[]): void {
    if (Array.isArray(material)) {
      material.forEach(this.destroyMaterial, this);
    } else {
      MATERIAL_TEXTURE_FIELDS.forEach((field) => {
        (material as any)[field]?.dispose();
      });

      material.dispose();
    }
  }
}
