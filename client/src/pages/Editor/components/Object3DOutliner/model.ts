import { RefObject } from 'react';
import { Object3D } from 'three';

export interface SelectedObject3D {
  object: Object3D;
  level: number;
}

export interface Object3DOutlinerProps {
  data?: Object3D[];
  multiple?: boolean;
  className?: string;
  filterNode?: (value: Object3D) => boolean;
  initialSelected?: SelectedObject3D[];
  onSelect?: (value?: SelectedObject3D[]) => void;
}

export interface Object3DTreeProps {
  data: Object3D[];
  selected: SelectedObject3D[];
  selectedRef: RefObject<Set<string>>;
  selectNode: (value: SelectedObject3D) => void;
  filterNode?: (value: Object3D) => boolean;
}

export interface Object3DTreeNodeProps {
  item: Object3D;
  level: number;
  selected: SelectedObject3D[];
  selectedRef: RefObject<Set<string>>;
  isActive?: boolean;
  filterNode?: (item: Object3D) => boolean;
  selectNode?: (item: SelectedObject3D) => void;
}

export interface Object3DTreeGroupProps {
  item: Object3D;
  level: number;
  selected: SelectedObject3D[];
  selectedRef: RefObject<Set<string>>;
  filterNode?: (item: Object3D) => boolean;
  selectNode?: (item: SelectedObject3D) => void;
}

export interface Object3DTreeLeafProps {
  item: Object3D;
  level: number;
  isActive?: boolean;
  filterNode?: (item: Object3D) => boolean;
  selectNode?: (item: SelectedObject3D) => void;
}
