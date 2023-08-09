'use client';
import './globals.scss';
import { createContext, PropsWithChildren, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { ConfigProvider } from 'antd';
import { ThemeModeName } from '~/theme/type';
import { LocalStorageService } from '~/services/local-storage';
import { buildConfig } from './config';

export const ThemeContext = createContext<{
  current: ThemeModeName;
  setCurrentTheme: (name: ThemeModeName) => void;
}>({
  current: 'dark',
  setCurrentTheme: () => null,
});

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [currentThemeName, setCurrentThemeName] = useState<ThemeModeName>('light');

  const value = useMemo(
    () => ({
      current: currentThemeName,
      setCurrentTheme: (name: ThemeModeName) => {
        LocalStorageService.setTheme(name);
        setCurrentThemeName(name);
      },
    }),
    [currentThemeName],
  );

  useLayoutEffect(() => {
    const preservedTheme = LocalStorageService.getTheme();
    if (preservedTheme) setCurrentThemeName(preservedTheme);
  }, []);

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider theme={buildConfig(currentThemeName)}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
