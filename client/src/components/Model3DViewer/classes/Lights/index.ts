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

export * from './LightBuilder.ts';

export function buildAmbientLight({ color = 0xffffff, intensity = 0.2 }: BuildAmbientLightOptions = {}): AmbientLight {
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
    dl.shadow.bias = shadow.bias ?? 0;
    dl.shadow.blurSamples = shadow.blurSamples ?? 0;
    dl.shadow.camera.near = shadow.near ?? 1;
    dl.shadow.camera.far = shadow.far ?? 1000;

    dl.shadow.camera.top = shadow.top ?? 10;
    dl.shadow.camera.bottom = shadow.bottom ?? -10;
    dl.shadow.camera.right = shadow.right ?? 10;
    dl.shadow.camera.left = shadow.left ?? -10;

    dl.shadow.needsUpdate = true;
  }

  let helper: DirectionalLightHelper | null = null;
  if (widthHelper) {
    helper = new DirectionalLightHelper(dl, 2);
    helper.layers.disableAll();
    helper.layers.set(3);
  }

  return [dl, helper];
}

export function buildSpotLight({
  color = 0xffffff,
  intensity = 1,
  power = 18.75,
  distance = 100,
  penumbra = 0.2,
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
