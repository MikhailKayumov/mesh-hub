import { IconType } from 'react-icons/lib';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeOption {
  name: ThemeMode;
  title: string;
  Icon: IconType;
}

export interface ThemeIconOption {
  className: string;
  Icon: IconType;
}

export interface ThemeListProps {
  open: boolean;
  currentTheme: ThemeMode;
  onThemeSelect: (theme: ThemeMode) => void;
}
