import { MantineColorShade, MantineColorsTuple } from '@mantine/core';

export type ThemeName = 'deepblue' | 'bluegray' | 'darkpink' | 'skyblue' | 'green' | 'deeporange' | 'magenta';

export type ThemeData = {
  primaryShade: MantineColorShade;
  primaryColor: 'primary';
  colors: {
    primary: MantineColorsTuple;
  };
};
