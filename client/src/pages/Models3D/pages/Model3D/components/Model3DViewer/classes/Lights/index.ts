import {
  DirectionalLightHelper,
  DirectionalLight,
  Vector3,
  AmbientLight,
  SpotLight,
  SpotLightHelper,
  MathUtils,
} from 'three';
import { BuildAmbientLightOptions, BuildDirectionLightOptions, BuildSpotLightOptions } from './types.ts';

export function buildAmbientLight({ color = 0x000000, intensity = 0.2 }: BuildAmbientLightOptions = {}): AmbientLight {
  return new AmbientLight(color, intensity);
}

export function buildDirectionalLight({
  at = new Vector3(0, 1, 0),
  to = new Vector3(0, 0, 0),
  color = 0xffffff,
  intensity = 1,
  shadow,
  widthHelper = false,
}: BuildDirectionLightOptions = {}): [DirectionalLight, DirectionalLightHelper | null] {
  const dl = new DirectionalLight(color, intensity);

  dl.position.copy(at);
  dl.target.position.copy(to);

  if (shadow) {
    dl.castShadow = true;
    dl.shadow.mapSize.setScalar(shadow.size ?? 512);
    dl.shadow.camera.near = shadow.near ?? 1;
    dl.shadow.camera.far = shadow.far ?? 1000;
  }

  return [dl, widthHelper ? new DirectionalLightHelper(dl, 2) : null];
}

export function buildSpotLight({
  color = 0x000000,
  intensity = 1,
  power = 18.75,
  distance = 100,
  penumbra = 0,
  angel = 45,
  at = new Vector3(0, 1, 0),
  to = new Vector3(0, 0, 0),
  shadow,
  widthHelper = false,
}: BuildSpotLightOptions = {}): [SpotLight, SpotLightHelper | null] {
  const sl = new SpotLight(color, intensity);

  sl.intensity = intensity;
  sl.power = power * 60; // Fluorescent / LED (watts), 1 watt === 60 lumens
  sl.distance = distance;
  sl.penumbra = penumbra;
  sl.angle = MathUtils.degToRad(angel);

  sl.position.copy(at);
  sl.target.position.copy(to);

  if (shadow) {
    sl.castShadow = true;
    sl.shadow.mapSize.setScalar(shadow.size ?? 512);
    sl.shadow.camera.near = shadow.near ?? 1;
    sl.shadow.camera.far = shadow.far ?? 1000;
  }

  return [sl, widthHelper ? new SpotLightHelper(sl) : null];
}
