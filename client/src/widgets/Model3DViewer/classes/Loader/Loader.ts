import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LoadedModel3D } from '../types';
import { LoaderCache } from './LoaderCache.ts';

export class Loader {
  public static readonly cache = new LoaderCache(3);
  public static readonly loaders = {
    gltf: new GLTFLoader(),
  };

  public static async load(filepath: string): Promise<LoadedModel3D> {
    const { scene, animations, parser, ...rest } = await this.loaders.gltf.loadAsync(filepath);

    console.log('==== GLTF ====', { scene, animations, parser, ...rest });

    return {
      scene,
      animations,
      associations: parser.associations,
    };
  }
}
