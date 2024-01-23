import { ReactNode } from 'react';

export type TabValue = 'renderer' | 'scene';

export interface TabsConfig {
  value: TabValue;
  title: ReactNode;
  content: ReactNode;
}
