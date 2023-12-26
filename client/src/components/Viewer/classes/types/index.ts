import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationClip, Group } from 'three/src/Three.js';
import { CameraController } from '../Camera/Camera.ts';
import { Renderer } from '../Renderer/Renderer.ts';
import { World } from '../World';

export interface Viewer {
  world: World;
  camera: CameraController;
  renderer: Renderer;
  stats: Stats;
}

export interface ViewerModel3D {
  scene: Group;
  animations?: AnimationClip[];
  associations?: GLTFParser['associations'];
}
