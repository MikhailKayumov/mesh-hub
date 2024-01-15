import { useContext } from 'react';
import { Viewer } from '../classes/Viewer';
import { ViewerContext } from '../context.tsx';

export default function useViewerContext(): Viewer | null {
  return useContext(ViewerContext);
}
