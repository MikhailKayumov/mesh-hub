import { RefObject, useLayoutEffect, useRef, MouseEvent } from 'react';

export default function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent<T>) => void,
): void {
  const localHandler = useRef(handler);
  if (localHandler.current !== handler) {
    localHandler.current = handler;
  }

  useLayoutEffect(() => {
    const onClick = (event: MouseEvent<T>) => {
      const el = ref?.current;
      if (!el || el.contains(event.target as Node)) {
        return;
      }

      localHandler.current(event);
    };

    document.body.addEventListener('click', onClick as any);

    return () => {
      document.body.removeEventListener('click', onClick as any);
    };
  }, [ref]);
}
