import { createContext } from 'react';
import { UseModel3DDataReturn } from '@/pages/Models3D/pages/Model3D/useModel3DData.ts';

const Model3DContext = createContext<Partial<UseModel3DDataReturn>>({});

export default Model3DContext;
