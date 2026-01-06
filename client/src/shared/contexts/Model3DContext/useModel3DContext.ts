import { useContext } from 'react';
import type { Model3DResponseDto } from '@/app/api/dto.ts';
import { Model3DContext } from './context';

export function useModel3DContext(): Model3DResponseDto | null {
  return useContext(Model3DContext);
}
