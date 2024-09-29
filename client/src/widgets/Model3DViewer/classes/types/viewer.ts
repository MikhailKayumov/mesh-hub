import { AnimationClip, AnimationObjectGroup, Box3, Group } from 'three';
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ViewerAnimations {
  clips: AnimationClip[];
  objectGroup: AnimationObjectGroup;
}

export interface LoadedModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}

export type ViewerModel3D<T extends { [K in keyof T]: T[K] } = Record<any, any>> = Pick<
  LoadedModel3D,
  'scene' | 'associations'
> & {
  data: T;
  sceneBoundingBox: Box3;
  animations: ViewerAnimations | null;
};
