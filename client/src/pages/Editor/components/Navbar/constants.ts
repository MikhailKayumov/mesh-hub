import { type TabValue } from './model.ts';

export const TabValues: Record<Capitalize<TabValue>, TabValue> = {
  Renderer: 'renderer',
  Scene: 'scene',
  Lights: 'lights',
} as const;
