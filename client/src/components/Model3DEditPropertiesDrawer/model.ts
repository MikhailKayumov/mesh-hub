import { DrawerProps } from '@mantine/core';
import { JSONContent } from '@tiptap/react';
import { Model3DResponseDto } from '@/api/dto.ts';

export interface Model3DEditPropertiesDrawerProps extends Pick<DrawerProps, 'opened' | 'onClose'> {
  model: Model3DResponseDto;
}

export type Model3DPropertiesForm = {
  name: string;
  description: JSONContent | null;
  visible: boolean;
  categories: string[];
};
