import { type Clock, type Color, type WebGLRenderer, type WebGLRendererParameters } from 'three';
import { type CameraController } from '../Camera';
import { type World } from '../World';

export interface RendererParameters extends WebGLRendererParameters {
  world: World;
  cameraController: CameraController;
  place?: HTMLDivElement;
  pixelRatio?: number;
  clearColor?: Color;
}

export interface RendererSettings {
  clearAlpha?: number;
  clearColor?: string;
  outputColorSpace?: WebGLRenderer['outputColorSpace'];
  toneMapping?: WebGLRenderer['toneMapping'];
  toneMappingExposure?: WebGLRenderer['toneMappingExposure'];
  shadowMapType?: WebGLRenderer['shadowMap']['type'];
}

export type RenderCallback = (delta: number, elapsed: number, clock: Clock) => any | Promise<any>;
