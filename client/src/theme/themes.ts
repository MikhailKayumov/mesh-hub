import { Container, createTheme, DEFAULT_THEME, mergeMantineTheme, rem, Tooltip } from '@mantine/core';
import { clsx } from 'clsx';
import {
  bluegrayColors,
  darkpinkColors,
  deepblueColors,
  deeporangeColors,
  greenColors,
  magentaColors,
  redColors,
  skyblueColors,
} from '@/theme/colors.ts';
import { ThemeData, ThemeName } from '@/theme/types.ts';

const appScale = Number(localStorage.getItem('mantine-scale') ?? 1);

export const baseTheme = mergeMantineTheme(
  DEFAULT_THEME,
  createTheme({
    breakpoints: {
      xs: '36em', // 576px
      sm: '48em', // 768px
      md: '62em', // 992px
      lg: '75em', // 1200px
      xl: '88em', // 1408px
    },
    scale: !isNaN(appScale) ? appScale : 1,
    colors: { red: redColors },
    fontFamily: `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji`,
    fontFamilyMonospace: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace`,
    headings: {
      fontFamily: `Rubik, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji`,
    },
    components: {
      Container: Container.extend({
        defaultProps: {
          size: 'responsive',
          px: 'xl',
        },
        classNames: (_, { size, fluid }) => ({
          root: clsx({ 'responsive-container': size === 'responsive' && !fluid }),
        }),
      }),
      Tooltip: Tooltip.extend({
        defaultProps: {
          withArrow: true,
          arrowSize: 6,
          arrowOffset: 17,
          fz: 12,
          lh: rem(17),
          multiline: true,
          maw: 320,
        },
      }),
    },
  }),
);

export const themes: Record<ThemeName, ThemeData> = {
  bluegray: {
    primaryShade: 7,
    primaryColor: 'primary',
    colors: { primary: bluegrayColors },
  },
  skyblue: {
    primaryColor: 'primary',
    primaryShade: 6,
    colors: { primary: skyblueColors },
  },
  deepblue: {
    primaryShade: 7,
    primaryColor: 'primary',
    colors: { primary: deepblueColors },
  },
  darkpink: {
    primaryShade: 7,
    primaryColor: 'primary',
    colors: { primary: darkpinkColors },
  },
  magenta: {
    primaryColor: 'primary',
    primaryShade: 6,
    colors: { primary: magentaColors },
  },
  deeporange: {
    primaryColor: 'primary',
    primaryShade: 6,
    colors: { primary: deeporangeColors },
  },
  green: {
    primaryColor: 'primary',
    primaryShade: 6,
    colors: { primary: greenColors },
  },
};
