import { PropsWithChildren, useEffect, useState } from 'react';
import { UseModel3DDataReturn } from '@/pages/Models3D/pages/Model3D/useModel3DData.ts';
import Model3DContext from './context.ts';

export interface Model3DContextProviderProps {
  model?: UseModel3DDataReturn;
}

export const Model3DContextProvider = ({ children, model }: PropsWithChildren<Model3DContextProviderProps>) => {
  const [localModel, setLocalModel] = useState(model ?? {});

  useEffect(() => {
    if (!model) return;

    setLocalModel(model);
  }, [model]);

  return <Model3DContext.Provider value={localModel}>{children}</Model3DContext.Provider>;
};
