import { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, type Object3D } from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { type LoadedModel3D } from '../types';
import { LoaderCache } from './LoaderCache.ts';

type SupportedFormat = 'glb' | 'gltf' | 'fbx' | 'obj' | 'dae' | 'stl';

export class Loader {
  public static readonly cache = new LoaderCache(3);
  public static readonly loaders = {
    gltf: new GLTFLoader(),
    fbx: new FBXLoader(),
    dae: new ColladaLoader(),
    stl: new STLLoader(),
    // OBJ + MTL are constructed per-load: MTLLoader.setResourcePath and OBJLoader.setMaterials
    // are stateful, so reusing instances would leak materials/paths between calls.
  };

  public static resizeCache(maxItems: number): void {
    Loader.cache.maxSize = maxItems;
  }

  public static async load(filepath: string): Promise<LoadedModel3D> {
    const format = Loader.detectFormat(filepath);

    switch (format) {
      case 'fbx':
        return Loader.loadFbx(filepath);
      case 'obj':
        return Loader.loadObj(filepath);
      case 'dae':
        return Loader.loadDae(filepath);
      case 'stl':
        return Loader.loadStl(filepath);
      case 'glb':
      case 'gltf':
      default:
        return Loader.loadGltf(filepath);
    }
  }

  private static detectFormat(url: string): SupportedFormat | string {
    const cleanUrl = url.split('?')[0];
    const lastDot = cleanUrl.lastIndexOf('.');
    if (lastDot === -1) return 'glb';
    return cleanUrl.slice(lastDot + 1).toLowerCase();
  }

  private static async loadGltf(url: string): Promise<LoadedModel3D> {
    const { scene, animations, parser } = await Loader.loaders.gltf.loadAsync(url);

    return {
      scene,
      animations,
      associations: parser.associations,
    };
  }

  private static async loadFbx(url: string): Promise<LoadedModel3D> {
    const group = await Loader.loaders.fbx.loadAsync(url);
    Loader.applyDefaultMaterialFallback(group);

    return {
      scene: group,
      animations: group.animations,
    };
  }

  private static async loadObj(url: string): Promise<LoadedModel3D> {
    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
    const mtlUrl = url.replace(/\.obj$/i, '.mtl');

    const objLoader = new OBJLoader();

    try {
      const mtlLoader = new MTLLoader();
      mtlLoader.setResourcePath(baseUrl);
      const materials = await mtlLoader.loadAsync(mtlUrl);
      materials.preload();
      objLoader.setMaterials(materials);
    } catch {
      // No MTL alongside the OBJ — fall back to OBJ-only with default materials.
    }

    const group = await objLoader.loadAsync(url);
    Loader.applyDefaultMaterialFallback(group);

    return {
      scene: group,
      animations: [],
    };
  }

  private static async loadDae(url: string): Promise<LoadedModel3D> {
    const result = (await Loader.loaders.dae.loadAsync(url)) as {
      scene: Object3D & { animations?: LoadedModel3D['animations'] };
      animations?: LoadedModel3D['animations'];
    };
    Loader.applyDefaultMaterialFallback(result.scene);

    return {
      scene: result.scene,
      animations: result.animations ?? result.scene.animations ?? [],
    };
  }

  private static async loadStl(url: string): Promise<LoadedModel3D> {
    const geometry = await Loader.loaders.stl.loadAsync(url);
    const material = new MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.1, roughness: 0.8 });
    const mesh = new Mesh(geometry, material);
    const group = new Group();
    group.add(mesh);

    return {
      scene: group,
      animations: [],
    };
  }

  private static applyDefaultMaterialFallback(root: Object3D): void {
    root.traverse((object) => {
      if (!(object instanceof Mesh)) return;

      const material = object.material;
      if (Array.isArray(material)) {
        object.material = material.map((m) => Loader.replaceIfMissingOrBasic(m));
      } else {
        object.material = Loader.replaceIfMissingOrBasic(material);
      }
    });
  }

  private static replaceIfMissingOrBasic<T>(material: T): T | MeshStandardMaterial {
    if (!material) {
      return new MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 });
    }

    if (material instanceof MeshBasicMaterial && !material.map) {
      return new MeshStandardMaterial({ color: 0xcccccc, metalness: 0.1, roughness: 0.8 });
    }

    return material;
  }
}
