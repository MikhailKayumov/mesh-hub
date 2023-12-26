import { AxesHelper, GridHelper, Material, Object3D, Scene, Texture, Vector3 } from 'three/src/Three.js';
import { MATERIAL_TEXTURE_FIELDS } from '@/components/Viewer/classes/World/constants.ts';
import { PromiseWorldObject3D, WorldLights, WorldObject3D } from '../types/world.ts';
import { isDisposableObject3D, isLight, isWithGeometryObject3D, isWithMaterialObject3D } from '../utils/type-guards.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class World extends Scene {
  public readonly lights: WorldLights = {
    ambient: null,
    spot: [],
  };

  private grid: GridHelper | null = null;

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

  public spawnAxisHelper(size = 1): this {
    const axisHelper = new AxesHelper(size);

    this.add(axisHelper);

    return this;
  }

  public spawnGridHelper(size = 30, division = 30, color1 = '#dee2e6', color2 = '#e9ecef'): this {
    if (this.grid) {
      this.destroyObject(this.grid);
      this.remove(this.grid);
    }

    this.grid = new GridHelper(size, division, color1, color2);
    this.add(this.grid);

    return this;
  }

  public destroy(): void {
    this.traverse(this.destroyObject.bind(this));
    this.clear();
    this.environment?.dispose();
    this.overrideMaterial?.dispose();
  }

  private destroyObject(object: Object3D): this {
    if (isLight(object)) {
      object.shadow?.map?.dispose();
      object.shadow?.mapPass?.dispose();
      object.shadow?.dispose();
    }

    if (isWithGeometryObject3D(object)) {
      object.geometry.dispose();
    }
    if (isWithMaterialObject3D(object)) {
      this.destroyMaterial(object.material);
    }
    if (isDisposableObject3D(object)) {
      object.dispose();
    }

    return this;
  }

  private destroyMaterial(material: Material | Material[]): this {
    if (Array.isArray(material)) {
      material.forEach(this.destroyMaterial, this);
    } else {
      MATERIAL_TEXTURE_FIELDS.forEach((field) => {
        const texture = (material as any)[field] as Texture | undefined;
        if (texture) this.destroyTexture(texture);
      });

      material.dispose();
    }

    return this;
  }

  private destroyTexture(texture: Texture): this {
    texture.dispose();

    return this;
  }
}
