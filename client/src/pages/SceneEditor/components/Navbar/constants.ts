export const SceneTabValues = {
  Objects: 'objects',
  Lights: 'lights',
  Config: 'config',
  Animations: 'animations',
} as const;

export type SceneTabValue = (typeof SceneTabValues)[keyof typeof SceneTabValues];
