export const SceneTabValues = {
  Objects: 'objects',
  Lights: 'lights',
  Config: 'config',
  Animations: 'animations',
  Review: 'review',
} as const;

export type SceneTabValue = (typeof SceneTabValues)[keyof typeof SceneTabValues];
