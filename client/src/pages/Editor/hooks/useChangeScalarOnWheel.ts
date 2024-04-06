import { useLayoutEffect, useRef } from 'react';
import { UseScalarFieldWheelProps } from '@/pages/Editor/components/Fields/ScalarField/model.ts';

export function useChangeScalarOnWheel({ step, onChange }: UseScalarFieldWheelProps) {
  const localRef = useRef<HTMLInputElement>(null);

  const onWheel = useRef<(e: WheelEvent) => void>();
  onWheel.current = (e: WheelEvent) => {
    e.preventDefault();

    let multiplier = e.deltaY < 0 ? 1 : -1;
    if (e.shiftKey) {
      multiplier *= 10;
    } else if (e.ctrlKey) {
      multiplier *= 0.1;
    }

    onChange(step * multiplier);
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
