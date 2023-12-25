import {
  AxesHelper,
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
} from 'three/src/Three.js';
import { isObject } from '@/utils/type-guards.ts';

export const isMesh = (object: unknown): object is Mesh => {
  return isObject(object) && (object as Mesh).isMesh;
};

// ####### materials #######

export const isMaterial = (object: unknown): object is Material => {
  return isObject(object) && (object as Material).isMaterial;
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

export function isWithMaterialObject3D(object: unknown): object is Object3D & { material: Material | Material[] } {
  return isObject(object) && !!object?.material;
}
