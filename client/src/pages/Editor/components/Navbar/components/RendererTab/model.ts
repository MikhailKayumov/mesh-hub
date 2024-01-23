import { Viewer } from '@/components/Model3DViewer/classes/Viewer';

export interface RendererTabProps {
  className?: string;
  viewer: Viewer | null;
}

export type RendererTabFormValues = {
  outputColorSpace?: string;
  toneMapping?: string;
  shadowMapType?: string;
  toneMappingExposure?: number;
  clearAlpha?: number;
  clearColor?: string;
};
