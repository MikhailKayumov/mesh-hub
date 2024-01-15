import {
  AxesHelper,
  BufferGeometry,
  GridHelper,
  Light,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  Texture,
  Source,
  SkinnedMesh,
  Bone,
} from 'three';
import { isObject } from '@/utils/type-guards.ts';

export const isBone = (object: unknown): object is Bone => {
  return isObject(object) && (object as Bone).isBone;
};

export const isMesh = (object: unknown): object is Mesh => {
  return isObject(object) && (object as Mesh).isMesh;
};

export const isSkinnedMesh = (object: unknown): object is SkinnedMesh => {
  return isMesh(object) && (object as SkinnedMesh).isSkinnedMesh;
};

// ####### materials #######

export const isMaterial = (object: unknown): object is Material => {
  return isObject(object) && (object as Material).isMaterial;
};

export const isTexture = (object: unknown): object is Texture => {
  return isObject(object) && (object as Texture).isTexture;
};

export const isSource = (object: unknown): object is Source => {
  return isObject(object) && (object as Source).isSource;
};

export const isImageBitmap = (object: unknown): object is ImageBitmap => {
  return isObject(object) && object instanceof ImageBitmap;
};

export const isImageBitmapSource = (object: unknown): object is Texture => {
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
  return isObject(object) && (object as PerspectiveCamera).isPerspectiveCamera;
};

export const isOrthographicCamera = (object: unknown): object is OrthographicCamera => {
  return isObject(object) && (object as OrthographicCamera).isOrthographicCamera;
};

export function isGrid(object: unknown): object is GridHelper {
  return isObject(object) && (object as GridHelper)?.type === 'GridHelper';
}

export function isAxis(object: unknown): object is AxesHelper {
  return isObject(object) && (object as AxesHelper)?.type === 'AxesHelper';
}

export function isLight(object: unknown): object is Light {
  return isObject(object) && (object as Light).isLight;
}

export function isLineSegments(object: unknown): object is LineSegments {
  return isObject(object) && (object as LineSegments).isLineSegments;
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
