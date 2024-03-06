import { ActionIcon, Group, Input, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLock, IconLockOpen } from '@tabler/icons-react';
import { useId, useState } from 'react';
import { ScalarField } from '@/components/ScalarField';
import { getFieldLabel } from './utils.ts';
import classes from './Vector3Field.module.scss';

export interface Vector3FieldProps {
  value?: [number, number, number];
  title?: string;
  step?: number;

  withLock?: boolean;
  defaultLocked?: boolean;

  onChange?: (value: [number, number, number]) => void;
}

export function Vector3Field({ value, step, title, onChange, withLock, defaultLocked }: Vector3FieldProps) {
  const htmlFor = useId();
  const [localValue, setLocalValue] = useState<[number, number, number]>([0, 0, 0]);
  const [isLocked, { toggle }] = useDisclosure(defaultLocked);

  const onLocalChange = (newValue: number, index: number) => {
    const result = isLocked
      ? [newValue, newValue, newValue]
      : (value ?? localValue).map((v, i) => (i === index ? newValue : v));

    setLocalValue(result as [number, number, number]);
    onChange?.(result as [number, number, number]);
  };

  return (
    <Input.Wrapper size="xs" className={classes.root}>
      {title && (
        <Group justify="space-between" align="center">
          <Input.Label htmlFor={htmlFor}>{title}</Input.Label>
          {withLock && (
            <ActionIcon size="xs" variant="transparent" color="text" className={classes.lock} onClick={toggle}>
              {isLocked ? (
                <IconLock className={classes['lock-icon']} />
              ) : (
                <IconLockOpen className={classes['lock-icon']} />
              )}
            </ActionIcon>
          )}
        </Group>
      )}

      <Group className={classes.inputs} wrap="nowrap" gap={8}>
        {(value ?? localValue).map((val, index) => {
          return (
            <ScalarField
              key={index}
              id={index === 0 ? htmlFor : undefined}
              step={step}
              decimalScale={2}
              className={classes.input}
              value={val}
              onChange={(v) => onLocalChange(v, index)}
              fixedDecimalScale
              leftSection={
                <Text size="xs" ff="mono" inline>
                  {getFieldLabel(index).toLocaleUpperCase()}
                </Text>
              }
            />
          );
        })}
      </Group>
    </Input.Wrapper>
  );
}
