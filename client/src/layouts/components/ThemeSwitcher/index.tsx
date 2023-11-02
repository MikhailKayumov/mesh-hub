import { MouseEvent, useLayoutEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { userThemeSelector } from '@/store/user/selectors.ts';
import { userActions } from '@/store/user/reducer.ts';
import ThemeList from './components/List';
import { themeIconOptions } from './constants.ts';
import { ThemeMode } from './model.ts';

export default function ThemeSwitcher() {
  const dispatch = useDispatch();
  const theme = useSelector(userThemeSelector);
  const icon = theme && themeIconOptions[theme] ? themeIconOptions[theme] : themeIconOptions.light;
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const onThemeSelect = (newTheme: ThemeMode) => {
    dispatch(userActions.setTheme(newTheme));
    setOpen(false);
  };

  useLayoutEffect(() => {
    const preferTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const mode: ThemeMode = theme === 'system' ? preferTheme : theme;

    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [theme]);
  useOnClickOutside(ref, (event: MouseEvent<HTMLDivElement>) => {
    if (!open) return;

    event.stopPropagation();
    setOpen(false);
  });

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        className="flex h-[32px] w-[32px] items-center justify-center rounded-lg text-white transition active:bg-blue-100 dark:active:bg-blue-800"
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon && <icon.Icon width={icon.width} className={icon.className} />}
      </button>
      <ThemeList open={open} currentTheme={theme} onThemeSelect={onThemeSelect} />
    </div>
  );
}
