import { Color, WebGLRendererParameters } from 'three';
import { CameraController } from '../Camera';
import { World } from '../World';

export interface RendererParameters extends WebGLRendererParameters {
  world: World;
  cameraController: CameraController;
  place?: HTMLDivElement;
  pixelRatio?: number;
  clearColor?: Color;
}
