import { BoxGeometry, Color, Object3D, Vector3, Mesh, MeshStandardMaterial } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { CameraController } from './Camera';
import { Renderer } from './Renderer';
import { World } from './World';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 0, 1);

export function fillWorld(world: World) {
  world.addGridHelper();
  world.addAxisHelper(1);

  const cubeGeometry = new BoxGeometry(1, 1, 1);
  const cubeMaterial = new MeshStandardMaterial({ color: '#958dd9' });
  const cube = new Mesh(cubeGeometry, cubeMaterial);

  return Promise.all([
    world.spawn(cube),
    world.spawnAmbientLight(0.05),
    world.spawnSpotLight(140, 100, 0.2, 28, new Vector3(60, -20, 40), new Vector3(0, 0, 10), false),
    world.spawnSpotLight(110, 100, 0.4, 30, new Vector3(78, 38, 2.37), new Vector3(0, 0, 18), false),
    world.spawnSpotLight(80, 100, 0.4, 30, new Vector3(8, -75, 10), new Vector3(0, 0, 10), false),
  ]);
}

export const run = async (place: HTMLDivElement) => {
  const world = new World();
  const cameraController = new CameraController();
  const renderer = new Renderer({
    world,
    cameraController,
    place,
    clearColor: new Color('rgb(2, 6, 23)'),
    antialias: true,
    precision: 'highp',
  });

  const stats = new Stats();
  stats.dom.style.position = 'absolute';
  stats.dom.style.zIndex = '100';
  place.appendChild(stats.dom);

  renderer.run(() => {
    stats.update();
  });

  await fillWorld(world);

  return {
    world,
    cameraController,
    renderer,
    stats,
  };
};
