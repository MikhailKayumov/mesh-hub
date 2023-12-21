import {
  AxesHelper,
  GridHelper,
  Light,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
} from 'three/src/Three.js';
import { isObject } from '@/utils/type-guards.ts';

export const isMesh = (object: unknown): object is Mesh => {
  return isObject(object) && (object as Mesh).isMesh;
};

export const isMaterial = (object: unknown): object is Material => {
  return isObject(object) && (object as Material).isMaterial;
};

export const isMeshStandardMaterial = (object: unknown): object is MeshStandardMaterial => {
  return isObject(object) && (object as MeshStandardMaterial).isMeshStandardMaterial;
};

export const isPerspectiveCamera = (object: unknown): object is PerspectiveCamera => {
  return isObject(object) && (object as PerspectiveCamera).isPerspectiveCamera;
};

export const isOrthographicCamera = (object: unknown): object is OrthographicCamera => {
  return isObject(object) && (object as OrthographicCamera).isOrthographicCamera;
};

export function isGrid(object3D: Object3D): object3D is GridHelper {
  return (object3D as GridHelper)?.type === 'GridHelper';
}

export function isAxis(object3D: Object3D): object3D is AxesHelper {
  return (object3D as AxesHelper)?.type === 'AxesHelper';
}

export function isLight(object3D: Object3D): object3D is Light {
  return (object3D as Light).isLight;
}
