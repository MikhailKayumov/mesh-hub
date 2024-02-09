import { ReactNode } from 'react';

export type TabValue = 'renderer' | 'scene' | 'lights';

export interface TabsConfig {
  value: TabValue;
  title: ReactNode;
  content: ReactNode;
}
