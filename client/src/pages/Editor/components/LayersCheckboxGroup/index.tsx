import { Checkbox, Group, Text } from '@mantine/core';
import { ChangeEvent } from 'react';
import { CollapseSection } from '../CollapseSection';
import classes from './LayersCheckboxGroup.module.scss';
import { LayersCheckboxGroupProps } from './model.ts';

export const LayersCheckboxGroup = ({ form, defaultOpened = false, className }: LayersCheckboxGroupProps) => {
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
