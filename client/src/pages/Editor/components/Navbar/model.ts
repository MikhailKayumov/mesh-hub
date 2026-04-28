import { type ReactNode } from 'react';

export type TabValue = 'display-config' | 'scene' | 'lights' | 'comments' | 'annotations' | 'versions' | 'materials' | 'audio';

export interface TabsConfig {
  value: TabValue;
  title: ReactNode;
  content: ReactNode;
}
