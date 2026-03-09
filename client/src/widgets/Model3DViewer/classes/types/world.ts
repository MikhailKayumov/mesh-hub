import { type AmbientLight, type Light, type Object3D, type Scene, type SpotLight, type SpotLightHelper } from 'three';

// new
export type WorldObject3D = Object3D | Promise<Object3D>;

export type WorldObjects3D = Array<WorldObject3D | WorldObject3D[]>;

// methods
export type WorldSpawnOptions = {
  layer?: number;
  silent?: boolean;
};

// events
export type WorldEventListener = (event: CustomEvent<Scene>) => void;

// old

export type WorldLight<T extends Light = Light, H extends Object3D | undefined = undefined> = { light: T; helper?: H };

export type WorldSpotLight = WorldLight<SpotLight, SpotLightHelper>;

export interface WorldLights {
  ambient: AmbientLight | null;
  spot: WorldSpotLight[];
}
