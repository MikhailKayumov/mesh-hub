import {
  Color,
  FrontSide,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three/src/Three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import { Camera } from './Camera';
import { World } from './World';
import { isMaterial, isMesh, isMeshStandardMaterial } from './utils';

Object3D.DEFAULT_UP = new Vector3(0, 0, 1);

export const run = async (place: HTMLDivElement) => {
  place.innerHTML = '';
  const placeSize = place.getBoundingClientRect();

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setSize(placeSize.width, placeSize.height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(new Color('#141414'));
  renderer.setAnimationLoop(animate);

  place.appendChild(renderer.domElement);

  Camera.create(placeSize.width, placeSize.height, renderer.domElement);

  const scene = new World();
  scene.addAxisHelper(60);
  scene.addGridHelper();
  scene.spawnAmbientLight(0.05);
  scene.spawnSpotLight(140, 0, 0.2, 28, new Vector3(60, -20, 40), new Vector3(0, 0, 10), false);
  scene.spawnSpotLight(110, 0, 0.4, 30, new Vector3(78, 38, 2.37), new Vector3(0, 0, 18), false);
  scene.spawnSpotLight(80, 0, 0.4, 30, new Vector3(8, -75, 10), new Vector3(0, 0, 10), false);

  const stats = new Stats();
  stats.dom.style.position = 'absolute';
  stats.dom.style.zIndex = '100';
  place.appendChild(stats.dom);

  function animate() {
    Camera.camera.updateProjectionMatrix();
    Camera.control.update();
    stats.update();

    renderer.render(scene, Camera.camera);
  }

  const loader = new GLTFLoader();
  const data: GLTF = await loader.loadAsync('/meshes/test_scene_simple.gltf');
  console.log(data);

  data.scene.traverse(object => {
    if (!isMesh(object)) return;

    object.castShadow = true;
    object.receiveShadow = true;

    if (isMeshStandardMaterial(object.material)) {
      object.material.side = FrontSide;
      object.material.flatShading = false;
      object.material.roughness = 0.9;
      object.material.metalness = 0;
      object.material.dithering = true;
      object.material.transparent = false;
      object.material.opacity = 0.2;
      object.material.color = new Color(0x84d6f4);
      object.material.normalScale = new Vector2(1, 1);
      object.material.needsUpdate = true;
    }
  });
  scene.spawn(data.scene);
};

const diffObjects = (a: Record<any, any>, b: Record<any, any>) => {
  const keys = new Set(Object.keys(a).concat(Object.keys(b)));

  const same: Record<any, any> = {};
  const diff: Record<any, any> = {};

  keys.forEach(key => {
    if (a[key] === b[key]) {
      same[key] = a[key];
    } else {
      diff[key] = [a[key], b[key]];
    }
  });

  return {
    same,
    diff,
  };
};
