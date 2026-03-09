import { NumberInput } from '@mantine/core';
import { mergeRefs } from '@mantine/hooks';
import { forwardRef, useState } from 'react';
import { useChangeScalarOnWheel } from '@/pages/Editor/hooks/useChangeScalarOnWheel.ts';
import { toFixed } from '@/shared/utils/number.ts';
import { type ScalarFieldProps } from './model.ts';

export const ScalarField = forwardRef<HTMLInputElement, ScalarFieldProps>(
  (
    {
      value,
      step = 1,
      allowNegative = true,
      decimalScale = 3,
      min = -Number.MAX_VALUE,
      max = Number.MAX_VALUE,
      size = 'xs',
      radius = 'xs',
      onChange,
      ...props
    },
    ref,
  ) => {
    const [localValue, setLocalValue] = useState(0);

    const onLocalChange = (newValue: number) => {
      setLocalValue(newValue);
      onChange?.(newValue);
    };
    const onInputChange = (newValue: string | number) => {
      if (typeof newValue !== 'number') {
        newValue = parseFloat(newValue);
      }

      if (isNaN(newValue)) return;

      onLocalChange(toFixed(newValue, decimalScale));
    };
    const onInputBlur = () => {
      if (!value) onLocalChange(0);
    };
    const onChangeScalarOnWheel = (delta: number) => {
      let newValue = value + delta;

      if (min > newValue) {
        newValue = min;
      } else if (!allowNegative) {
        newValue = Math.max(newValue, 0);
      } else if (max < newValue) {
        newValue = max;
      }

      onLocalChange(toFixed(newValue, decimalScale));
    };

    const localRef = useChangeScalarOnWheel({ step, onChange: onChangeScalarOnWheel });

    return (
      <NumberInput
        {...props}
        ref={mergeRefs(ref, localRef)}
        size={size}
        radius={radius}
        min={min}
        max={Math.max(max, min)}
        step={step}
        allowNegative={allowNegative}
        decimalScale={decimalScale}
        value={value ?? localValue}
        onChange={onInputChange}
        onBlur={onInputBlur}
      />
    );
  },
);
