import { AnimationClip, AnimationObjectGroup, Group } from 'three';
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CameraController } from '../Camera/Camera.ts';
import { Renderer } from '../Renderer/Renderer.ts';
import { World } from '../World';

export interface Viewer {
  world: World;
  camera: CameraController;
  renderer: Renderer;
  stats: Stats;
  animations?: {
    clips: AnimationClip[];
    objectGroup: AnimationObjectGroup;
  };
}

export interface ViewerModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}
