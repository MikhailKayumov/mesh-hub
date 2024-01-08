import Stats from 'three/addons/libs/stats.module.js';
import { Viewer } from '@/components/Viewer/classes/types';
import { CameraController } from './Camera/Camera.ts';
import { Renderer } from './Renderer/Renderer.ts';
import { World } from './World';

export function initViewer(place: HTMLDivElement): Viewer {
  const world = new World();
  const camera = new CameraController();
  const renderer = new Renderer({
    world,
    cameraController: camera,
    place,
    antialias: true,
    precision: 'highp',
    preserveDrawingBuffer: true,
    alpha: true,
  });

  let stats = null;
  if (import.meta.env.MODE === 'development') {
    stats = new Stats();
    stats.dom.style.position = 'absolute';
    stats.dom.style.top = 'initial';
    stats.dom.style.right = '0';
    stats.dom.style.top = '0';
    stats.dom.style.left = 'initial';
    stats.dom.style.zIndex = '50';
    stats.dom.style.opacity = '0.70';
    place.appendChild(stats.dom);
  }

  return {
    world,
    camera,
    renderer,
    stats,
  };
}
