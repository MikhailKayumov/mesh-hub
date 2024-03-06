import { NumberInput } from '@mantine/core';
import { mergeRefs } from '@mantine/hooks';
import { forwardRef } from 'react';
import { useScalarFieldWheel } from '@/components/ScalarField/useScalarFieldWheel.ts';
import { ScalarFieldProps } from './model.ts';

export const ScalarField = forwardRef<HTMLInputElement, ScalarFieldProps>(
  (
    {
      value,
      step = 1,
      allowNegative = true,
      decimalScale = 3,
      onChange,
      min = -Number.MAX_VALUE,
      max = Number.MAX_VALUE,
      size = 'xs',
      radius = 'xs',
      ...props
    },
    ref,
  ) => {
    const onInputChange = (val: string | number) => {
      if (typeof val !== 'number') {
        val = parseFloat(val);
      }

      if (isNaN(val)) return;

      const scale = 10 ** decimalScale;

      onChange?.(Math.round(val * scale) / scale);
    };
    const localRef = useScalarFieldWheel({ value, min, max, step, allowNegative, onChange: onInputChange });

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
        value={value}
        onChange={onInputChange}
        onWheel={undefined}
      />
    );
  },
);
