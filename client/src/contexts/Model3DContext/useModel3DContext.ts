import { useContext } from 'react';
import { UseModel3DDataReturn } from '@/pages/Models3D/pages/Model3D/useModel3DData.ts';
import Model3DContext from './context';

export default function useModel3DContext(): Partial<UseModel3DDataReturn> {
  return useContext(Model3DContext);
}
