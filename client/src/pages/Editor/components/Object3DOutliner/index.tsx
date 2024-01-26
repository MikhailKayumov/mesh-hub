import { ScrollArea } from '@mantine/core';
import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useState } from 'react';
import { Tree } from './components/Tree';
import { Object3DOutlinerProps, SelectedObject3D } from './model.ts';
import classes from './Object3DOutliner.module.scss';

export const Object3DOutliner = memo(
  ({ data, multiple = false, className, onChange, filterNode }: Object3DOutlinerProps) => {
    const [selected, setSelected] = useState<SelectedObject3D[]>([]);

    useEffect(() => {
      if (!selected.length) return;
      setSelected(selected.filter((select) => data.find((d) => d.uuid === select.object.uuid)));
    }, [data]);

    useEffect(() => {
      onChange?.(selected);
    }, [selected]);

    const onClick = useCallback((item: SelectedObject3D) => {
      const index = selected.findIndex((i) => i.object.uuid === item.object.uuid);

      if (~index) {
        setSelected((prev) => prev.filter((i) => i.object !== item.object));
      } else {
        setSelected((prev) => (multiple ? [...prev, item] : [item]));
      }
    }, []);

    return (
      <ScrollArea h={260} className={clsx(classes.root, className)} scrollbarSize={8}>
        <Tree data={data} selected={selected} selectNode={onClick} filterNode={filterNode} />
      </ScrollArea>
    );
  },
);
