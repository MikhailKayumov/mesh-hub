import { createContext, type PropsWithChildren } from 'react';
import { Viewer } from './classes/Viewer';

export const ViewerContext = createContext<Viewer | null>(null);

export function ViewerContextProvider({ children, viewer }: PropsWithChildren<{ viewer: Viewer | null }>) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}
