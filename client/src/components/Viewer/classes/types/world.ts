import { AmbientLight, Light, Object3D, SpotLight, SpotLightHelper } from 'three';

export type PromiseWorldObject3D = Promise<Object3D | Object3D[]>;

export type WorldObject3D = Object3D | PromiseWorldObject3D;

export type WorldLight<T extends Light = Light, H extends Object3D | undefined = undefined> = { light: T; helper?: H };

export type WorldSpotLight = WorldLight<SpotLight, SpotLightHelper>;

export interface WorldLights {
  ambient: AmbientLight | null;
  spot: WorldSpotLight[];
}
