import { type PropsWithChildren } from 'react';
import { type Viewer } from './classes/Viewer';
import { ViewerContext } from './context.ts';

export function ViewerContextProvider({ children, viewer }: PropsWithChildren<{ viewer: Viewer | null }>) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}
