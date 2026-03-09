import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';

export interface SceneTabProps {
  className?: string;
  viewer: Viewer | null;
}

export interface SceneTabLayer {
  value: number;
  label: string;
  checked: boolean;
}

export type SceneTabFormValues = {
  layers: SceneTabLayer[];
};
