import { AnimationClip, AnimationObjectGroup, Group } from 'three';
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CameraController } from '../Camera';
import { Renderer } from '../Renderer';
import { World } from '../World';

export interface ViewerAnimations {
  clips: AnimationClip[];
  objectGroup: AnimationObjectGroup;
}

export interface Viewer {
  world: World;
  camera: CameraController;
  renderer: Renderer;
  stats: Stats | null;
  animations?: ViewerAnimations;
}

export interface ViewerModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}
