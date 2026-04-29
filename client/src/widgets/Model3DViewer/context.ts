import { createContext } from 'react';
import { type Viewer } from './classes/Viewer';

export const ViewerContext = createContext<Viewer | null>(null);
