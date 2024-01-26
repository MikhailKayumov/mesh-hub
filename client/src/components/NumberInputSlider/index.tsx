import { Group, Input, NumberInput, Slider } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { NumberInputSliderProps } from './model.ts';
import classes from './NumberInputSlider.module.scss';

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
  onChange,
  onFocus,
  onBlur,
}: NumberInputSliderProps) => {
  const [localValue, setLocalValue] = useState(value ?? 0);

  const ref = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value ?? 0);
    }
  }, [value]);
  useEffect(() => {
    if (value !== localValue) {
      onChange?.(localValue);
    }
  }, [localValue, onChange]);

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

      let multiplier = 100;
      if (e.shiftKey) {
        multiplier /= 10;
      } else if (e.ctrlKey) {
        multiplier *= 10;
      }

      setLocalValue((prev) => {
        const result = prev + e.deltaY / -multiplier;
        return allowNegative ? result : Math.max(result, 0);
      });
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
  }, [allowNegative]);

  return (
    <Input.Wrapper label={label} size="xs">
      <Group ref={ref} className={classes.root} gap={8}>
        <Slider
          ref={sliderRef}
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
          ref={inputRef}
          min={min}
          max={max}
          step={step}
          size="xs"
          radius="xs"
          allowNegative={allowNegative}
          decimalScale={2}
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
