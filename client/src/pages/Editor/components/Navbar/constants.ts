import { type TabValue } from './model.ts';

export const TabValues = {
  DisplayConfig: 'display-config',
  Scene: 'scene',
  Lights: 'lights',
  Comments: 'comments',
  Annotations: 'annotations',
  Versions: 'versions',
  Materials: 'materials',
  Audio: 'audio',
} as const satisfies Record<string, TabValue>;
