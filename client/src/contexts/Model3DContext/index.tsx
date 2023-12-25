import { PropsWithChildren } from 'react';
import { Model3DResponseDto } from '@/api/dto.ts';
import Model3DContext from './context.ts';

export interface Model3DContextProviderProps {
  model?: Model3DResponseDto | null;
}

export const Model3DContextProvider = ({ children, model }: PropsWithChildren<Model3DContextProviderProps>) => {
  return <Model3DContext.Provider value={model ?? null}>{children}</Model3DContext.Provider>;
};
