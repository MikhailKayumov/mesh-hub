import { useState } from 'react';
import Viewer from '@/modules/viewer';
import Button from '@/components/Button';

export default function MainPage() {
  const [count, setCount] = useState(0);

  const onClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <div className="grid grid-rows-[1fr_auto] flex-col gap-4 w-full h-full overflow-hidden p-4">
      <div className="flex-1 rounded border border-slate-200 dark:border-slate-600 overflow-hidden">
        <Viewer />
      </div>
      <div
        className={`
          flex rounded border border-slate-200 items-center
          dark:border-slate-600 gap-3 w-full h-full
          p-3 text-xs
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
