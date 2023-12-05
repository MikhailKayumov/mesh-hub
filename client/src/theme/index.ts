import { Container, createTheme, DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import { clsx } from 'clsx';
import { deepblueColors, redColors } from '@/theme/colors.ts';

const appScale = Number(localStorage.getItem('mantine-scale') ?? 1);

const theme = mergeMantineTheme(
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
    primaryColor: 'primary',
    primaryShade: 7,
    colors: {
      primary: deepblueColors,
      red: redColors,
    },
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
    },
  }),
);

export default theme;
