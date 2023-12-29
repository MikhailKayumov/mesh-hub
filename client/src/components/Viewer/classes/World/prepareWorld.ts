import { Vector3 } from 'three';
import { buildAmbientLight, buildDirectionalLight } from '../Lights';
import { World } from './World.ts';

export function prepareWorld(world: World) {
  const al = buildAmbientLight({ intensity: 0.05 });
  const widthHelper = false;

  const [dl1, dlh1] = buildDirectionalLight({
    at: new Vector3(20, 60, 30),
    intensity: 2.17,
    widthHelper,
  });
  const [dl2, dlh2] = buildDirectionalLight({
    at: new Vector3(-40, 4, 50),
    to: new Vector3(0, 6, 0),
    intensity: 1.26,
    widthHelper,
  });
  const [dl3, dlh3] = buildDirectionalLight({
    at: new Vector3(-10, 5, -50),
    to: new Vector3(6, 6, 0),
    intensity: 2.01,
    widthHelper,
  });
  const [dl4, dlh4] = buildDirectionalLight({
    at: new Vector3(-0, -60, -0),
    intensity: 0.8,
    widthHelper,
  });

  return Promise.all([world.spawn([al, dl1, dlh1, dl2, dlh2, dl3, dlh3, dl4, dlh4])]);
}
