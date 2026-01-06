import { useEffect, useRef, useState } from 'react';

export function useDebounced<T = any>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<A extends any[]>(callback: (...args: A) => void, delay = 300) {
  const argsRef = useRef<A | undefined>(undefined);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cleanup = () => timeout.current && clearTimeout(timeout.current);

  useEffect(() => cleanup, []);

  return (...args: A) => {
    argsRef.current = args;

    cleanup();

    timeout.current = setTimeout(() => {
      if (argsRef.current) callback(...argsRef.current);
    }, delay);
  };
}
