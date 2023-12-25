import Stats from 'three/addons/libs/stats.module.js';
import { Viewer } from '@/components/Viewer/classes/types';
import { CameraController } from './Camera';
import { Renderer } from './Renderer';
import { prepareWorld } from './world/prepareWorld.ts';
import { World } from './world/World.ts';

export const run = async (place: HTMLDivElement): Promise<Viewer> => {
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

  const stats = new Stats();
  stats.dom.style.position = 'absolute';
  stats.dom.style.top = 'initial';
  stats.dom.style.right = '0';
  stats.dom.style.bottom = '0';
  stats.dom.style.left = 'initial';
  stats.dom.style.zIndex = '1';
  stats.dom.style.opacity = '0.46';
  place.appendChild(stats.dom);

  renderer.addCallback(() => {
    stats.update();
  });

  await prepareWorld(world);

  return {
    world,
    camera,
    renderer,
    stats,
  };
};
