import { Material, Mesh, MeshStandardMaterial, OrthographicCamera, PerspectiveCamera } from 'three/src/Three.js';
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
