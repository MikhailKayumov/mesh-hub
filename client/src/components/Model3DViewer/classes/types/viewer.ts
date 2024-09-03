import { AnimationClip, AnimationObjectGroup, Box3, Group } from 'three';
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Model3DResponseDto } from '@/app/api/dto.ts';

export interface ViewerAnimations {
  clips: AnimationClip[];
  objectGroup: AnimationObjectGroup;
}

export interface LoadedModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}

export interface ViewerModel3D extends Pick<LoadedModel3D, 'scene' | 'associations'> {
  data: Model3DResponseDto;
  sceneBoundingBox: Box3;
  animations: ViewerAnimations | null;
}
