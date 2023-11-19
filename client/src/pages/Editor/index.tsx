import { useState } from 'react';
import Viewer from '@/modules/Viewer';
import Button from '@/components/Button';

export function Component() {
  const [count, setCount] = useState(0);

  const onClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <div className="grid w-full flex-1 grid-rows-[1fr_auto] flex-col gap-4 overflow-hidden p-4">
      <div className="flex-1 overflow-hidden rounded border border-white bg-white shadow dark:border-slate-600 dark:bg-transparent dark:shadow-none">
        <Viewer />
      </div>
      <div
        className={`
          flex h-full w-full items-center gap-3 rounded border
          border-white bg-white p-3 text-xs shadow dark:border-slate-600
          dark:bg-transparent dark:shadow-none
        `}
      >
        <div>MainPageReRenders: {count}</div>
        <div>
          <Button size="sm" className="py-0.5" onClick={onClick}>
            Rerender
          </Button>
        </div>
      </div>
    </div>
  );
}

Component.displayName = 'EditorPage';
