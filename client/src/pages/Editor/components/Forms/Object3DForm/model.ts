import { SelectedObject3D } from '@/pages/Editor/components/Object3DOutliner/model.ts';

export type Object3DFormValues = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

export interface Object3DFormProps {
  selected: SelectedObject3D[];
  className?: string;
}
