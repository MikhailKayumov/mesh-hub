import { useLayoutEffect, useRef } from 'react';
import { type UseScalarFieldWheelProps } from '@/pages/Editor/components/Fields/ScalarField/model.ts';

export function useChangeScalarOnWheel({ step, onChange }: UseScalarFieldWheelProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const stepRef = useRef(step);

  useLayoutEffect(() => {
    onChangeRef.current = onChange;
    stepRef.current = step;
  });

  useLayoutEffect(() => {
    const wheel = (e: WheelEvent) => {
      e.preventDefault();

      let multiplier = e.deltaY < 0 ? 1 : -1;
      if (e.shiftKey) {
        multiplier *= 10;
      } else if (e.ctrlKey) {
        multiplier *= 0.1;
      }

      onChangeRef.current(stepRef.current * multiplier);
    };

    localRef.current?.addEventListener('wheel', wheel);

    return () => {
      localRef.current?.removeEventListener('wheel', wheel);
    };
  }, []);

  return localRef;
}
