import { NumberInput as MNumberInput } from '@mantine/core';
import { mergeRefs } from '@mantine/hooks';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { NumberInputProps } from './model.ts';

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, step, allowNegative = true, decimalScale = 3, onChange, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(0);

    const addValueRef = useRef<((delta: number) => void) | null>(null);
    const localRef = useRef<HTMLInputElement>(null);

    const onInputChange = (val: string | number) => {
      if (typeof val !== 'number') {
        val = parseFloat(val);
      }

      if (isNaN(val)) return;

      onChange?.(val);
      setLocalValue(val);
    };

    addValueRef.current = (delta: number) => {
      const result = allowNegative ? (value ?? localValue) + delta : Math.max((value ?? localValue) + delta, 0);

      onChange?.(result);
      setLocalValue(result);
    };

    useEffect(() => {
      const change = (e: WheelEvent) => {
        e.preventDefault();

        let multiplier = 1 * (e.deltaY < 0 ? 1 : -1);
        if (e.shiftKey) {
          multiplier *= 10;
        } else if (e.ctrlKey) {
          multiplier *= 0.1;
        }

        addValueRef.current?.((step ?? 1) * multiplier);
      };

      const moveIn = () => {
        localRef.current?.addEventListener('wheel', change);
      };
      const moveOut = () => {
        localRef.current?.addEventListener('wheel', change);
      };

      localRef.current?.addEventListener('mouseenter', moveIn);
      localRef.current?.addEventListener('mouseleave', moveOut);

      return () => {
        localRef.current?.removeEventListener('mouseenter', moveIn);
        localRef.current?.removeEventListener('mouseleave', moveOut);
      };
    }, [step]);

    return (
      <MNumberInput
        ref={mergeRefs(localRef, ref)}
        {...props}
        step={step}
        size="xs"
        radius="xs"
        allowNegative={allowNegative}
        allowLeadingZeros={false}
        decimalScale={decimalScale}
        value={value ?? localValue}
        onChange={onInputChange}
      />
    );
  },
);
