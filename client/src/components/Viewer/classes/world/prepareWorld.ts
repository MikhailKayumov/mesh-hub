import {
  Object3D,
  Vector3,
  BoxGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three/src/Three.js';
import { buildAmbientLight, buildDirectionalLight } from '@/components/Viewer/classes/lights';
import { World } from './World.ts';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export function prepareWorld(world: World) {
  world.addGridHelper(24, 24);
  world.addAxisHelper(0.25);

  const planeMaterial = new MeshStandardMaterial({ color: '#f8f9fa' });
  const planeGeometry = new PlaneGeometry(10000, 10000);
  const plane = new Mesh(planeGeometry, planeMaterial);
  plane.position.set(0, 0, 0);
  plane.rotateX(MathUtils.degToRad(-90));
  plane.receiveShadow = true;
  plane.material.needsUpdate = true;

  const cubeGeometry = new BoxGeometry(1, 1, 1);
  const cubeMaterial = new MeshStandardMaterial({ color: '#958dd9' });
  const cube = new Mesh(cubeGeometry, cubeMaterial);
  cube.position.set(0.5, 0, 0.5);
  cube.castShadow = true;

  const [dl1, dlh1] = buildDirectionalLight({
    at: new Vector3(20, 60, 30),
    intensity: 2.17,
    shadow: { size: 4096, near: 1, far: 1000 },
  });
  const [dl2, dlh2] = buildDirectionalLight({
    at: new Vector3(-40, 4, 50),
    to: new Vector3(0, 6, 0),
    intensity: 1.26,
    // shadow: { size: 2048, near: 1, far: 1000 },
  });
  const [dl3, dlh3] = buildDirectionalLight({
    at: new Vector3(-10, 5, -50),
    to: new Vector3(6, 6, 0),
    intensity: 2.01,
    // shadow: { size: 2048, near: 1, far: 1000 },
  });
  const al = buildAmbientLight({ intensity: 0.05 });

  return Promise.all([
    // world.spawn(plane),
    // world.spawn(cube),
    world.spawn([al, dl1, dlh1, dl2, dlh2, dl3, dlh3]),
    // world.spawnSpotLight(140, 100, 0.2, 28, new Vector3(60, -20, 40), new Vector3(0, 0, 10), false),
    // world.spawnSpotLight(110, 100, 0.4, 30, new Vector3(78, 38, 2.37), new Vector3(0, 0, 18), false),
    // world.spawnSpotLight(80, 100, 0.4, 30, new Vector3(8, -75, 10), new Vector3(0, 0, 10), false),
  ]);
}
