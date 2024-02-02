import { Group, Input } from '@mantine/core';
import { useId, useState } from 'react';
import { NumberInput } from '@/components/NumberInput';
import { getFieldLabel } from './utils.ts';
import classes from './Vector3Field.module.scss';

export interface Vector3FieldProps {
  value?: [number, number, number];
  title?: string;
  step?: number;

  onChange?: (value: [number, number, number]) => void;
}

export function Vector3Field({ value, step = 0.01, title, onChange }: Vector3FieldProps) {
  const htmlFor = useId();
  const [localValue, setLocalValue] = useState<[number, number, number]>([0, 0, 0]);

  const onLocalChange = (newValue: number | string, index: number) => {
    const result = (value ?? localValue).map((v, i) => (i === index ? newValue : v)) as [number, number, number];

    setLocalValue(result);
    onChange?.(result);
  };

  return (
    <Input.Wrapper size="xs" className={classes.root}>
      {title && (
        <Input.Label htmlFor={htmlFor} lh={1}>
          {title}
        </Input.Label>
      )}
      <Group className={classes.inputs} wrap="nowrap" gap={8}>
        {(value ?? localValue).map((val, index) => {
          return (
            <NumberInput
              key={index}
              id={index === 0 ? htmlFor : undefined}
              step={step}
              label={getFieldLabel(index)}
              decimalScale={2}
              className={classes.input}
              value={val}
              onChange={(v) => onLocalChange(v, index)}
            />
          );
        })}
      </Group>
    </Input.Wrapper>
  );
}
