import { createTheme, MantineProvider, mergeMantineTheme } from '@mantine/core';
import { PropsWithChildren, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { themeSelector } from '@/entities/user/store';
import { baseTheme, themes } from '@/shared/theme/themes.ts';

export function Theme({ children }: PropsWithChildren) {
  const themeName = useSelector(themeSelector);
  const theme = useMemo(() => {
    return mergeMantineTheme(baseTheme, createTheme(themes[themeName] ?? themes.deepblue));
  }, [themeName]);

  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      {children}
    </MantineProvider>
  );
}
