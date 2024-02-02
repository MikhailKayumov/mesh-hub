import { Viewer } from '@/components/Model3DViewer/classes/Viewer';

export interface SceneLayer {
  value: number;
  label: string;
  checked: boolean;
}

export type SceneLayersFormValues = { layers: SceneLayer[] };

export interface LayersCheckboxGroupProps {
  viewer: Viewer | null;
  className?: string;
  defaultOpened?: boolean;
  onChange?: (layers: SceneLayer[]) => void;
}
