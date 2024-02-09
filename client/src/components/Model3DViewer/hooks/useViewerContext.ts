import { useContext } from 'react';
import { Viewer } from '../classes/Viewer';
import { ViewerContext } from '../context.tsx';

export function useViewerContext(): Viewer | null {
  return useContext(ViewerContext);
}
