'use client';

import { clsx } from 'clsx';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { forwardRef, MouseEvent, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import useOnClickOutside from '~/hooks/useOnClickOutside';
import { ThemeMode } from '~/common/types';

export interface ThemeListProps {
  mode: ThemeMode;
  onThemeSelect: (mode: ThemeMode) => void;
}

const themes: { name: ThemeMode; title: string; Icon: typeof MoonIcon }[] = [
  { name: 'light', title: 'Светлая', Icon: SunIcon },
  { name: 'dark', title: 'Темная', Icon: MoonIcon },
  { name: 'system', title: 'Системная', Icon: ComputerDesktopIcon },
];

const ThemeList = forwardRef<{ open: () => void }, ThemeListProps>(({ mode, onThemeSelect }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [isTransitionOn, setIsTransitionOn] = useState(false);

  useOnClickOutside(listRef, (event: MouseEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    event.stopPropagation();
    setIsOpen(false);
  });
  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
  }));
  useEffect(() => {
    setTimeout(() => setIsTransitionOn(true), 100);
  }, []);

  return (
    <div
      ref={listRef}
      style={!isTransitionOn ? { transform: 'scale(0)' } : undefined}
      className={clsx(
        'shadow-2x transition-no absolute right-0 top-[100%] origin-top-right rounded-md bg-white shadow-xl transition-transform duration-[320ms] dark:bg-slate-900',
        { 'scale-1': isOpen, 'scale-0': !isOpen },
      )}
    >
      <ul className="m-0 flex list-none flex-col gap-1 px-2 py-3">
        {themes.map(({ name, title, Icon }) => (
          <li
            key={name}
            className={clsx(
              'm-0 flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-blue-800 hover:text-white active:bg-blue-700',
              { 'bg-blue-800': mode === name, 'text-white': mode === name },
            )}
            onClick={() => {
              onThemeSelect?.(name);
              setIsOpen(false);
            }}
          >
            <Icon height={24} />
            <span>{title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default ThemeList;
