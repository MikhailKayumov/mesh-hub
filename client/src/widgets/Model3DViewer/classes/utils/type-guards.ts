import {
  type AxesHelper,
  type BufferGeometry,
  type GridHelper,
  type Light,
  type LineSegments,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  type MeshPhysicalMaterial,
  type MeshStandardMaterial,
  type Object3D,
  type OrthographicCamera,
  type PerspectiveCamera,
  type Texture,
  type Source,
  type SkinnedMesh,
  type Bone,
  type Group,
} from 'three';

export const isObject = (object: unknown): object is Record<any, any> => {
  return typeof object === 'object' && object !== null;
};

export const isObject3D = (object: unknown): object is Object3D => {
  return isObject(object) && (object as Object3D).isObject3D;
};

export const isGroup = (object: unknown): object is Group => {
  return isObject3D(object) && (object as Group).isGroup;
};

export const isBone = (object: unknown): object is Bone => {
  return isObject3D(object) && (object as Bone).isBone;
};

export const isMesh = (object: unknown): object is Mesh => {
  return isObject3D(object) && (object as Mesh).isMesh;
};

export const isSkinnedMesh = (object: unknown): object is SkinnedMesh => {
  return isObject3D(object) && (object as SkinnedMesh).isSkinnedMesh;
};

// ####### materials #######

export const isMaterial = (object: unknown): object is Material => {
  return isObject(object) && (object as Material).isMaterial;
};

export const isTexture = (object: unknown): object is Texture => {
  return isObject(object) && (object as Texture).isTexture;
};

export const isSource = (object: unknown): object is Source<any> => {
  return isObject(object) && (object as Source<any>).isSource;
};

export const isImageBitmap = (object: unknown): object is ImageBitmap => {
  return isObject(object) && object instanceof ImageBitmap;
};

export const isImageBitmapSource = (object: unknown): object is ImageBitmapSource => {
  return isSource(object) && isImageBitmap(object.data);
};

export const isMeshBasicMaterial = (object: unknown): object is MeshBasicMaterial => {
  return isObject(object) && (object as MeshBasicMaterial).isMaterial;
};

export const isMeshStandardMaterial = (object: unknown): object is MeshStandardMaterial => {
  return (
    isObject(object) &&
    (object as MeshStandardMaterial).isMeshStandardMaterial &&
    (object as MeshPhysicalMaterial).isMeshPhysicalMaterial
  );
};

export const isMeshPhysicalMaterial = (object: unknown): object is MeshPhysicalMaterial => {
  return isObject(object) && (object as MeshPhysicalMaterial).isMeshPhysicalMaterial;
};

//end ####### materials #######

export const isPerspectiveCamera = (object: unknown): object is PerspectiveCamera => {
  return isObject3D(object) && (object as PerspectiveCamera).isPerspectiveCamera;
};

export const isOrthographicCamera = (object: unknown): object is OrthographicCamera => {
  return isObject3D(object) && (object as OrthographicCamera).isOrthographicCamera;
};

export function isGrid(object: unknown): object is GridHelper {
  return isObject3D(object) && (object as GridHelper)?.type === 'GridHelper';
}

export function isAxis(object: unknown): object is AxesHelper {
  return isObject3D(object) && (object as AxesHelper)?.type === 'AxesHelper';
}

export function isLight(object: unknown): object is Light {
  return isObject3D(object) && (object as Light).isLight;
}

export function isLineSegments(object: unknown): object is LineSegments {
  return isObject3D(object) && (object as LineSegments).isLineSegments;
}

export function isDisposableObject3D(object: unknown): object is Object3D & { dispose: () => void } {
  return isObject(object) && typeof object?.dispose === 'function';
}

export function isWithGeometryObject3D(object: unknown): object is Object3D & { geometry: BufferGeometry } {
  return isObject(object) && !!object?.geometry;
}

export function isWithMaterialObject3D(object: unknown): object is Object3D & { material: Material | Material[] } {
  return isObject(object) && !!object?.material;
}
