import { Material, Object3D, Texture } from 'three';
import { MATERIAL_TEXTURE_MAP_FIELDS } from '@/components/Model3DViewer/classes/Destroyer/constants.ts';
import {
  isDisposableObject3D,
  isLight,
  isWithGeometryObject3D,
  isWithMaterialObject3D,
} from '@/components/Model3DViewer/classes/utils';

export class Destroyer {
  private constructor() {}

  public static destroyObject(object: Object3D) {
    if (isLight(object)) {
      object.shadow?.map?.dispose();
      object.shadow?.mapPass?.dispose();
      object.shadow?.dispose();
    }

    if (isWithGeometryObject3D(object)) {
      object.geometry.dispose();
    }

    if (isWithMaterialObject3D(object)) {
      Destroyer.destroyMaterial(object.material);
    }

    if (isDisposableObject3D(object)) {
      object.dispose();
    }
  }

  public static destroyMaterial(material: Material | Material[]) {
    if (Array.isArray(material)) {
      material.forEach(Destroyer.destroyMaterial);
    } else {
      MATERIAL_TEXTURE_MAP_FIELDS.forEach((field) => {
        const texture = (material as any)[field] as Texture | undefined;
        if (texture) Destroyer.destroyTexture(texture);
      });

      material.dispose();
    }
  }

  public static destroyTexture(texture: Texture) {
    texture.dispose();
  }

  public static destroyImageBitmap(imageBitmap: ImageBitmap) {
    imageBitmap.close();
  }
}
