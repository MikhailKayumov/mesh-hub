import { type ReactNode } from 'react';

export type TabValue = 'renderer' | 'scene' | 'lights' | 'comments' | 'annotations' | 'versions';

export interface TabsConfig {
  value: TabValue;
  title: ReactNode;
  content: ReactNode;
}
