import { useComputedColorScheme } from '@mantine/core';

export interface UseCurrentColorSchemeReturn {
  colorScheme: ReturnType<typeof useComputedColorScheme>;
  isLight: boolean;
  isDark: boolean;
}

export function useCurrentColorScheme(): UseCurrentColorSchemeReturn {
  const currentColorScheme = useComputedColorScheme('light');

  return {
    colorScheme: currentColorScheme,
    isLight: currentColorScheme === 'light',
    isDark: currentColorScheme === 'dark',
  };
}
