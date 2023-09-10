import { MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { LocalStorageService } from '../../../services/local-storage';
import useOnClickOutside from '../../../hooks/useOnClickOutside';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeButtonProps {
  initialMode?: ThemeMode;
}

const themes: { name: ThemeMode; title: string; Icon: typeof MoonIcon }[] = [
  {
    name: 'light',
    title: 'Светлая',
    Icon: SunIcon,
  },
  {
    name: 'dark',
    title: 'Темная',
    Icon: MoonIcon,
  },
  {
    name: 'system',
    title: 'Системная',
    Icon: ComputerDesktopIcon,
  },
];

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

export default function ThemeSwitcher({ initialMode }: ThemeButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ThemeMode | null>(initialMode ?? LocalStorageService.getTheme());
  const icon = mode && modeIcons[mode] ? modeIcons[mode] : modeIcons.light;

  const onThemeSelect = (theme?: ThemeMode) => {
    if (theme === mode) {
      return;
    }

    LocalStorageService.setTheme(theme);
    // todo: API save

    setMode(theme ?? null);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  useLayoutEffect(() => {
    const preferTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme: ThemeMode =
      initialMode === 'system' ? preferTheme : initialMode ?? LocalStorageService.getTheme() ?? preferTheme;

    setMode(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [initialMode]);
  useOnClickOutside(ref, (event: MouseEvent<HTMLDivElement>) => {
    if (!isOpen) return;

    event.stopPropagation();
    setIsOpen(false);
  });

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        className="flex h-[24px] w-[24px] items-center justify-center rounded-lg text-white transition active:bg-blue-100 dark:active:bg-blue-800"
        onClick={() => setIsOpen((prev) => !prev)}>
        {icon && <icon.Icon width={icon.width} className={icon.className} />}
      </button>
      <div
        className={clsx(
          'shadow-2x transition-no absolute right-0 top-[100%] origin-top-right rounded-md bg-white shadow-xl transition-transform duration-[320ms] dark:bg-slate-900',
          { 'scale-1': isOpen, 'scale-0': !isOpen },
        )}>
        <ul className="m-0 flex list-none flex-col gap-1 px-2 py-3">
          {themes.map(({ name, title, Icon }) => (
            <li key={name} className="m-0 p-0">
              <button
                className={clsx(
                  'w-full flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-blue-800 hover:text-white active:bg-blue-700',
                  { 'bg-blue-800': mode === name, 'text-white': mode === name },
                )}
                onClick={() => {
                  onThemeSelect(name);
                  setIsOpen(false);
                }}>
                <Icon height={24} />
                <span>{title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
