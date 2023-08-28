'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { LocalStorageService } from '~/services/local-storage';
import { ThemeMode } from '~/common/types';
import ThemeList from '~/app/components/ThemeList';

export interface ThemeButtonProps {
  initialMode?: ThemeMode;
}

const modeIcons: Record<ThemeMode, { Icon: typeof SunIcon; className: string; width: number } | undefined> = {
  light: {
    Icon: SunIcon,
    className: 'text-amber-500',
    width: 20,
  },
  dark: {
    Icon: MoonIcon,
    className: 'text-yellow-400',
    width: 16,
  },
  system: undefined,
};

export default function ThemeButton({ initialMode }: ThemeButtonProps) {
  const ref = useRef<{ open: () => void }>(null);
  const [mode, setMode] = useState<ThemeMode | undefined>(initialMode);
  const icon = mode && modeIcons[mode] ? modeIcons[mode] : modeIcons.light;

  const onThemeSelect = (theme?: ThemeMode) => {
    if (theme === mode) {
      return;
    }

    LocalStorageService.setTheme(theme);
    // todo: API save

    setMode(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  useLayoutEffect(() => {
    const preferTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme: ThemeMode =
      initialMode === 'system' ? preferTheme : initialMode ?? LocalStorageService.getTheme() ?? preferTheme;

    setMode(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [initialMode]);

  return (
    <div className="relative flex items-center">
      <ThemeList ref={ref} mode={mode ?? 'dark'} onThemeSelect={onThemeSelect} />
      <button
        className="flex h-[24px] w-[24px] items-center justify-center rounded-lg text-white transition active:bg-blue-100 dark:active:bg-blue-800"
        onClick={() => ref.current?.open()}
      >
        {icon && <icon.Icon width={icon.width} className={icon.className} />}
      </button>
    </div>
  );
}
