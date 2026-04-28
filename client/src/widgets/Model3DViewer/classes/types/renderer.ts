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

export interface PostProcessConfig {
  ssao?: {
    enabled: boolean;
    kernelRadius?: number;
    minDistance?: number;
    maxDistance?: number;
  };
  bloom?: {
    enabled: boolean;
    strength?: number;
    radius?: number;
    threshold?: number;
  };
  dof?: {
    enabled: boolean;
    focus?: number;
    aperture?: number;
    maxblur?: number;
  };
  vignette?: {
    enabled: boolean;
    offset?: number;
    darkness?: number;
  };
  colorCorrection?: {
    enabled: boolean;
    powRGB?: [number, number, number];
    mulRGB?: [number, number, number];
    addRGB?: [number, number, number];
  };
}

export interface FogConfig {
  enabled: boolean;
  type: 'linear' | 'exp2';
  color: string;
  near?: number;
  far?: number;
  density?: number;
}

export type RenderCallback = (delta: number, elapsed: number, clock: Clock) => any | Promise<any>;
