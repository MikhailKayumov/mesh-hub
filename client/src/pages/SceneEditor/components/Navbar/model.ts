import type { SceneTabValue } from './constants.ts';
import type { ReactNode } from 'react';

export interface SceneTabsConfig {
  value: SceneTabValue;
  title: ReactNode;
  content: ReactNode;
}
