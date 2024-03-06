import { ScrollArea } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Tree } from './components/Tree';
import { Object3DOutlinerProps, SelectedObject3D } from './model.ts';
import classes from './Object3DOutliner.module.scss';

export const Object3DOutliner = memo(
  ({ data, multiple = false, className, onSelect, initialSelected = [], filterNode }: Object3DOutlinerProps) => {
    const selectedRef = useRef<Set<string>>(new Set(initialSelected?.map((i) => i.object.uuid)));
    const [selected, setSelected] = useState<SelectedObject3D[]>(initialSelected);

    useEffect(() => onSelect?.(selected), [selected]);

    const onClick = useCallback((item: SelectedObject3D) => {
      setSelected((prev) => {
        if (selectedRef.current.has(item.object.uuid)) {
          selectedRef.current.delete(item.object.uuid);

          return prev.filter((i) => i.object !== item.object);
        } else {
          if (!multiple) {
            selectedRef.current.clear();
          }

          selectedRef.current.add(item.object.uuid);

          return multiple ? [...prev, item] : [item];
        }
      });
    }, []);

    if (!data) {
      return null;
    }

    const onClear = () => {
      selectedRef.current.clear();
      setSelected([]);
    };

    return (
      <ScrollArea h={260} scrollbarSize={8} className={clsx(classes.root, className)} onClick={onClear}>
        <Tree data={data} selectedRef={selectedRef} selected={selected} selectNode={onClick} filterNode={filterNode} />
      </ScrollArea>
    );
  },
);
