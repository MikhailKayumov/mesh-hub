import { TabValue } from './model.ts';

export const TabValues: Record<Capitalize<TabValue>, TabValue> = {
  Renderer: 'renderer',
  Scene: 'scene',
} as const;
