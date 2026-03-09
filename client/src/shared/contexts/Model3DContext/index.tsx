import type { Model3DResponseDto } from '@/app/api/dto.ts';
import type { PropsWithChildren } from 'react';
import { Model3DContext } from './context.ts';

export interface Model3DContextProviderProps {
  model: Model3DResponseDto | null;
}

export function Model3DContextProvider({ children, model }: PropsWithChildren<Model3DContextProviderProps>) {
  return <Model3DContext.Provider value={model}>{children}</Model3DContext.Provider>;
}
