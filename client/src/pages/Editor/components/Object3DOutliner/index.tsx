import { ScrollArea } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Tree } from './components/Tree';
import { Object3DOutlinerProps, SelectedObject3D } from './model.ts';
import classes from './Object3DOutliner.module.scss';

export const Object3DOutliner = memo(
  ({ data, multiple = false, className, onSelect, initialSelected = [], filterNode }: Object3DOutlinerProps) => {
    const [selected, setSelected] = useState<SelectedObject3D[]>(initialSelected);

    const selectedSet = useMemo(() => new Set(selected.map((i) => i.object.uuid)), [selected]);

    useEffect(() => onSelect?.(selected), [selected, onSelect]);

    const onClick = useCallback(
      (item: SelectedObject3D) => {
        setSelected((prev) => {
          const hasItem = prev.some((i) => i.object.uuid === item.object.uuid);

          if (hasItem) {
            return prev.filter((i) => i.object !== item.object);
          } else {
            return multiple ? [...prev, item] : [item];
          }
        });
      },
      [multiple],
    );

    if (!data) {
      return null;
    }

    const onClear = () => {
      setSelected([]);
    };

    return (
      <ScrollArea h={260} scrollbarSize={8} className={clsx(classes.root, className)} onClick={onClear}>
        <Tree data={data} selectedSet={selectedSet} selected={selected} selectNode={onClick} filterNode={filterNode} />
      </ScrollArea>
    );
  },
);
