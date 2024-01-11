import { DrawerProps } from '@mantine/core';
import { JSONContent } from '@tiptap/react';

export interface Model3DEditPropertiesDrawerProps extends Pick<DrawerProps, 'opened' | 'onClose'> {}

export type Model3DPropertiesForm = {
  name: string;
  description: JSONContent | null;
  visible: boolean;
  categories: string[];
};
