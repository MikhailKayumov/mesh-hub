import { HiComputerDesktop, HiMoon, HiSun } from 'react-icons/hi2';
import { ThemeIconOption, ThemeMode, ThemeOption } from './model.ts';

export const themes: ThemeOption[] = [
  {
    name: 'light',
    title: 'Светлая',
    Icon: HiSun,
  },
  {
    name: 'dark',
    title: 'Темная',
    Icon: HiMoon,
  },
  {
    name: 'system',
    title: 'Системная',
    Icon: HiComputerDesktop,
  },
];

export const themeIconOptions: Record<ThemeMode, ThemeIconOption | undefined> = {
  light: {
    Icon: HiSun,
    className: 'text-amber-500 w-[24px] h-[24px]',
  },
  dark: {
    Icon: HiMoon,
    className: 'text-yellow-400 w-[20px] h-[20px]',
  },
  system: undefined,
};
