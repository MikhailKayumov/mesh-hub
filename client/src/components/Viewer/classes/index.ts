import { BoxGeometry, Color, DirectionalLight, MathUtils, Object3D, PlaneGeometry, Vector3 } from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { Mesh, MeshStandardMaterial } from 'three/src/Three.js';
import { Viewer } from '@/components/Viewer/classes/types';
import { CameraController } from './Camera';
import { Renderer } from './Renderer';
import { World } from './World';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export function fillWorld(world: World) {
  // world.addGridHelper();
  // world.addAxisHelper(1);

  const planeMaterial = new MeshStandardMaterial({ color: '#f8f9fa' });
  const planeGeometry = new PlaneGeometry(10000, 10000);

  const plane = new Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, 0, -0.05);
  plane.rotateX(MathUtils.degToRad(-90));
  plane.receiveShadow = true;
  plane.material.needsUpdate = true;

  const cubeGeometry = new BoxGeometry(1, 1, 1);
  const cubeMaterial = new MeshStandardMaterial({ color: '#958dd9' });
  const cube = new Mesh(cubeGeometry, cubeMaterial);
  cube.castShadow = true;
  cube.position.set(0, 0, 0.51);

  const directionalLight = new DirectionalLight(0xffffff, 1.55);
  directionalLight.position.set(1000, 1000, 1000);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 5000;

  const directionalLight2 = new DirectionalLight(0xffffff, 2.15);
  directionalLight2.position.set(-10, 400, -10);
  directionalLight2.castShadow = true;
  directionalLight2.shadow.mapSize.width = 2048;
  directionalLight2.shadow.mapSize.height = 2048;
  directionalLight2.shadow.camera.near = 0.01;
  directionalLight2.shadow.camera.far = 5000;

  return Promise.all([
    world.spawn(plane),
    // world.spawn(cube),
    world.spawn(directionalLight),
    world.spawn(directionalLight2),
    world.spawnAmbientLight(0.05),
    // world.spawnSpotLight(140, 100, 0.2, 28, new Vector3(60, -20, 40), new Vector3(0, 0, 10), false),
    // world.spawnSpotLight(110, 100, 0.4, 30, new Vector3(78, 38, 2.37), new Vector3(0, 0, 18), false),
    // world.spawnSpotLight(80, 100, 0.4, 30, new Vector3(8, -75, 10), new Vector3(0, 0, 10), false),
  ]);
}

export const run = async (place: HTMLDivElement): Promise<Viewer> => {
  const world = new World();
  const cameraController = new CameraController();
  const renderer = new Renderer({
    world,
    cameraController,
    place,
    clearColor: new Color('#f8f9fa'),
    antialias: true,
    precision: 'highp',
    preserveDrawingBuffer: true,
  });

  const stats = new Stats();
  stats.dom.style.position = 'absolute';
  stats.dom.style.zIndex = '1';
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
