import { useLayoutEffect, useRef } from 'react';
import { UseScalarFieldWheelProps } from '@/components/ScalarField/model.ts';

export function useScalarFieldWheel({ value, min, max, step, allowNegative, onChange }: UseScalarFieldWheelProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const onWheel = useRef<(e: WheelEvent) => void>();

  onWheel.current = (e: WheelEvent) => {
    e.preventDefault();

    let multiplier = 1 * (e.deltaY < 0 ? 1 : -1);
    if (e.shiftKey) {
      multiplier *= 10;
    } else if (e.ctrlKey) {
      multiplier *= 0.1;
    }

    let next = value + step * multiplier;
    if (min > next) {
      next = min;
    } else if (!allowNegative) {
      next = Math.max(next, 0);
    } else if (max < next) {
      next = max;
    }

    onChange(next);
  };

  useLayoutEffect(() => {
    const wheel = (e: WheelEvent) => onWheel.current?.(e);

    localRef.current?.addEventListener('wheel', wheel);

    return () => {
      localRef.current?.removeEventListener('wheel', wheel);
    };
  }, []);

  return localRef;
}
