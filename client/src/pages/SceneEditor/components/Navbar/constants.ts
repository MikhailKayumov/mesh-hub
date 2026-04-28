export const SceneTabValues = {
  Objects: 'objects',
  Lights: 'lights',
  Config: 'config',
} as const;

export type SceneTabValue = (typeof SceneTabValues)[keyof typeof SceneTabValues];
