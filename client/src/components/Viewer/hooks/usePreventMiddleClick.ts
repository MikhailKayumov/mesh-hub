import { useEffect, useMemo, useState } from 'react';

const onMousedown = (event: MouseEvent) => {
  if (event.button == 1) {
    event.preventDefault();
    return false;
  }
};

export default function usePreventMiddleClick() {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    if (isOn) {
      document.body.addEventListener('mousedown', onMousedown);
    }

    return () => {
      document.body.removeEventListener('mousedown', onMousedown);
    };
  }, [isOn]);

  return useMemo(
    () => ({
      onMouseEnter: () => setIsOn(true),
      onMouseLeave: () => setIsOn(false),
    }),
    [],
  );
}
