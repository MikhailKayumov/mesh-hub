import { type DrawerProps } from '@mantine/core';
import { type JSONContent } from '@tiptap/react';

export type Model3DEditPropertiesDrawerProps = Pick<DrawerProps, 'opened' | 'onClose'>;

export type Model3DPropertiesForm = {
  name: string;
  description: JSONContent | null;
  visible: boolean;
  categories: string[];
};
