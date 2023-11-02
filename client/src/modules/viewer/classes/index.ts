import { BoxGeometry, Color, Object3D, Vector3, Mesh, MeshStandardMaterial } from 'three/src/Three.js';
import Stats from 'three/addons/libs/stats.module.js';
import { World } from './World';
import { Renderer } from './Renderer';
import { CameraController } from './Camera';

// setting up axis
Object3D.DEFAULT_UP = new Vector3(0, 0, 1);

export const run = async (place: HTMLDivElement) => {
  const world = new World();
  const cameraController = new CameraController('orthographic');
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

  world.addGridHelper();
  world.addAxisHelper(60);

  const cubeGeometry = new BoxGeometry(1, 1, 1);
  const cubeMaterial = new MeshStandardMaterial({ color: '#655f93' });
  const cube = new Mesh(cubeGeometry, cubeMaterial);

  world.spawn(cube);

  world.spawnAmbientLight(0.05);
  world.spawnSpotLight(140, 100, 0.2, 28, new Vector3(60, -20, 40), new Vector3(0, 0, 10), false);
  world.spawnSpotLight(110, 100, 0.4, 30, new Vector3(78, 38, 2.37), new Vector3(0, 0, 18), false);
  world.spawnSpotLight(80, 100, 0.4, 30, new Vector3(8, -75, 10), new Vector3(0, 0, 10), false);

  try {
    // const loader = new GLTFLoader();
    // const data: GLTF = await loader.loadAsync('/meshes/test_scene_simple.gltf');
    // console.log(data);
  } catch (e) {
    console.log(e);
  }

  // data.scene.traverse((object) => {
  //   if (!isMesh(object)) return;
  //
  //   object.castShadow = true;
  //   object.receiveShadow = true;
  //
  //   if (isMeshStandardMaterial(object.material)) {
  //     object.material.side = FrontSide;
  //     object.material.flatShading = false;
  //     object.material.roughness = 0.9;
  //     object.material.metalness = 0;
  //     object.material.dithering = true;
  //     object.material.transparent = false;
  //     object.material.opacity = 0.2;
  //     object.material.color = new Color(0x84d6f4);
  //     object.material.normalScale = new Vector2(1, 1);
  //     object.material.needsUpdate = true;
  //   }
  // });
  // scene.spawn(data.scene);
};
