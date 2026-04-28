import { type TabValue } from './model.ts';

export const TabValues: Record<Capitalize<TabValue>, TabValue> = {
  DisplayConfig: 'display-config',
  Scene: 'scene',
  Lights: 'lights',
  Comments: 'comments',
  Annotations: 'annotations',
  Versions: 'versions',
  Materials: 'materials',
  Audio: 'audio',
} as const;
