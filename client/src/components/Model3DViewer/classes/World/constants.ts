export const DEFAULT_LAYER = 0;

export const WorldEventNames = {
  WorldSceneChange: 'world-scene-change',
} as const;

export type WorldEventName = keyof typeof WorldEventNames;

export type WorldEvent = (typeof WorldEventNames)[WorldEventName];
