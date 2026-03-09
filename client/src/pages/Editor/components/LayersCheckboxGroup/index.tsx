import { Checkbox, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { type ChangeEvent, useEffect } from 'react';
import { CollapseSection } from '../CollapseSection';
import classes from './LayersCheckboxGroup.module.scss';
import { type LayersCheckboxGroupProps, type SceneLayersFormValues } from './model.ts';

export const LayersCheckboxGroup = ({
  viewer,
  onChange,
  defaultOpened = false,
  className,
}: LayersCheckboxGroupProps) => {
  const form = useForm<SceneLayersFormValues>({
    initialValues: {
      layers: Array.from(new Array(32), (_, index) => ({
        checked: index < 10,
        value: index,
        label: `${index}`,
      })),
    },
  });

  useEffect(() => {
    if (!viewer) return;

    viewer.camera.disableLayers();
    viewer.camera.enableLayer(
      form.values.layers.reduce<number[]>((acc, l) => {
        if (l.checked) acc.push(l.value);
        return acc;
      }, []),
    );
  }, [viewer]);

  useEffect(() => {
    form.values.layers.forEach((layer) => {
      layer.checked ? viewer?.camera.enableLayer(layer.value) : viewer?.camera.disableLayer(layer.value);
    });
    onChange?.(form.values.layers);
  }, [form.values.layers]);

  return (
    <CollapseSection title="Layers" defaultOpened={defaultOpened} className={className}>
      <Group gap={6} className={classes.root}>
        {form.values.layers.map((item, index) => {
          const { onChange } = form.getInputProps(`layers.${index}`);

          const onLocalChange = (event: ChangeEvent<HTMLInputElement>) => {
            onChange({ ...item, checked: event.currentTarget.checked ?? false });
          };

          return (
            <Checkbox
              key={item.value}
              radius="xs"
              size="xs"
              w={38}
              label={
                <Text size="xs" className={classes['checkbox-label']}>
                  {item.label}
                </Text>
              }
              checked={item.checked}
              onChange={onLocalChange}
            />
          );
        })}
      </Group>
    </CollapseSection>
  );
};
