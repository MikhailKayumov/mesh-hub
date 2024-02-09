import { Object3D } from 'three';

export interface SelectedObject3D {
  object: Object3D;
  level: number;
}

export interface Object3DOutlinerProps {
  data: Object3D[];
  multiple?: boolean;
  className?: string;
  filterNode?: (value: Object3D) => boolean;
  onChange?: (value?: SelectedObject3D[]) => void;
}

export interface Object3DTreeProps {
  data: Object3D[];
  selected: SelectedObject3D[];
  selectNode: (value: SelectedObject3D) => void;
  filterNode?: (value: Object3D) => boolean;
}

export interface Object3DTreeNodeProps {
  item: Object3D;
  level: number;
  selected: SelectedObject3D[];
  isActive?: boolean;
  filterNode?: (item: Object3D) => boolean;
  selectNode?: (item: SelectedObject3D) => void;
}

export interface Object3DTreeGroupProps {
  item: Object3D;
  level: number;
  selected: SelectedObject3D[];
  filterNode?: (item: Object3D) => boolean;
  selectNode?: (item: SelectedObject3D) => void;
}

export interface Object3DTreeLeafProps {
  item: Object3D;
  level: number;
  isActive?: boolean;
  selectNode?: (item: SelectedObject3D) => void;
}
