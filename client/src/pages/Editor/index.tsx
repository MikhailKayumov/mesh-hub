import { Button } from '@mantine/core';
import { useState } from 'react';
import Viewer from '@/components/Viewer';

export function Component() {
  const [count, setCount] = useState(0);

  const onClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <div>
        <Viewer />
      </div>
      <div>
        <div>MainPageReRenders: {count}</div>
        <div>
          <Button size="sm" onClick={onClick}>
            Rerender
          </Button>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'EditorPage';
