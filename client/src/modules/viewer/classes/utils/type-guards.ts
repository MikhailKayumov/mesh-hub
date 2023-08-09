import { Material, Mesh, MeshStandardMaterial } from 'three';
import { isObject } from '~/utils/type-guards';

export const isMesh = (object: unknown): object is Mesh => {
  return isObject(object) && (object as Mesh).isMesh;
};

export const isMaterial = (object: unknown): object is Material => {
  return isObject(object) && (object as Material).isMaterial;
};

export const isMeshStandardMaterial = (object: unknown): object is MeshStandardMaterial => {
  return isObject(object) && (object as MeshStandardMaterial).isMeshStandardMaterial;
};
