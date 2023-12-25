import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Model3DResponseDto } from '@/api/dto.ts';
import { getModel3DFileSrc } from '@/utils/model3d.ts';

export async function loadModel3D(model: Model3DResponseDto) {
  const fileSrc = getModel3DFileSrc(model.file.id, model.file.name);

  if (model.file.extension.includes('fbx')) {
    const loader = new FBXLoader();
    const loadedModel = await loader.loadAsync(fileSrc);

    console.log(loadedModel);

    return loadedModel;
  } else {
    const loader = new GLTFLoader();
    const loadedModel = await loader.loadAsync(fileSrc);

    // console.log(loadedModel);

    return loadedModel.scene;
  }
}
