import { Group, Input, NumberInput, Slider } from '@mantine/core';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type NumberInputSliderProps } from './model.ts';
import classes from './NumberInputSlider.module.scss';

// @refresh reset
export const NumberInputSlider = ({
  label,
  value,
  min,
  minSlider,
  max,
  maxSlider,
  step,
  stepSlider,
  allowNegative = true,
  decimalScale = 3,
  onChange,
  onFocus,
  onBlur,
}: NumberInputSliderProps) => {
  const [localValue, setLocalValue] = useState(value ?? 0);

  const ref = useRef<HTMLDivElement>(null);
  const addValueRef = useRef<NumberInputSliderProps['onChange']>(onChange);

  useLayoutEffect(() => {
    addValueRef.current = (delta: number) => {
      const result = allowNegative ? localValue + delta : Math.max(localValue + delta, 0);

      onChange?.(result);
      setLocalValue(result);
    };
  });

  useEffect(() => {
    if (value !== localValue) {
      queueMicrotask(() => setLocalValue(value ?? 0));
    }
  }, [value, localValue]);

  const onInputChange = (val: string | number) => {
    if (typeof val !== 'number') {
      val = parseFloat(val);
    }

    if (isNaN(val)) return;

    onChange?.(val);
    setLocalValue(val);
  };
  const onSliderChange = (val: number) => {
    onChange?.(val);
    setLocalValue(val);
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
      ref.current?.addEventListener('wheel', change);
    };
    const moveOut = () => {
      ref.current?.addEventListener('wheel', change);
    };

    ref.current?.addEventListener('mouseenter', moveIn);
    ref.current?.addEventListener('mouseleave', moveOut);

    return () => {
      ref.current?.removeEventListener('mouseenter', moveIn);
      ref.current?.removeEventListener('mouseleave', moveOut);
    };
  }, [step]);

  return (
    <Input.Wrapper label={label} size="xs">
      <Group ref={ref} className={classes.root} gap={8}>
        <Slider
          size="sm"
          className={classes.slider}
          defaultValue={value}
          min={minSlider ?? min}
          max={maxSlider ?? max}
          step={stepSlider ?? step}
          value={localValue}
          onChange={onSliderChange}
        />
        <NumberInput
          min={min}
          max={max}
          step={step}
          size="xs"
          radius="xs"
          allowNegative={allowNegative}
          allowLeadingZeros={false}
          decimalScale={decimalScale}
          className={classes.input}
          value={localValue}
          onChange={onInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Group>
    </Input.Wrapper>
  );
};
