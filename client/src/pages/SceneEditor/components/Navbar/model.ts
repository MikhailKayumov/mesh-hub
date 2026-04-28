import type { ReactNode } from 'react';
import type { SceneTabValue } from './constants.ts';

export interface SceneTabsConfig {
  value: SceneTabValue;
  title: ReactNode;
  content: ReactNode;
}
