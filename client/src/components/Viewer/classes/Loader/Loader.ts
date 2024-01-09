import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';
import { ViewerModel3D } from '../types';
import { LoaderCache } from './LoaderCache.ts';

export class Loader {
  public static async load({ file }: Model3DResponseDto): Promise<ViewerModel3D> {
    let model = LoaderCache.getItem(file.id);
    if (model) return model;

    const fileSrc = getModel3DFileSrc(file.id, file.name);

    if (file.extension.includes('fbx')) {
      const loader = new FBXLoader();
      const loadedModel = await loader.loadAsync(fileSrc);

      model = { scene: loadedModel, animations: loadedModel.animations };
    } else {
      const loader = new GLTFLoader();
      const loadedModel = await loader.loadAsync(fileSrc);

      model = {
        scene: loadedModel.scene,
        animations: loadedModel.animations,
        associations: loadedModel.parser.associations,
      };
    }

    LoaderCache.setItem(file.id, model);

    return model;
  }
}
