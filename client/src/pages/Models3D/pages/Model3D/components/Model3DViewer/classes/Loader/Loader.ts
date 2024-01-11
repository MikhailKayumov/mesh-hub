import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Model3DFileResponseDto } from '@/api/dto.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';
import { LoadedModel3D } from '../types';
import { LoaderCache } from './LoaderCache.ts';

export class Loader {
  public static readonly cache = new LoaderCache(3);

  public static async load({ id, name }: Model3DFileResponseDto): Promise<LoadedModel3D> {
    const { scene, animations, parser } = await new GLTFLoader().loadAsync(getModel3DFileSrc(id, name));

    return {
      scene,
      animations,
      associations: parser.associations,
    };
  }
}
