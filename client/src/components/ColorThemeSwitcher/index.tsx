import { ColorSwatch, Group } from '@mantine/core';
import { clsx } from 'clsx';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '@/store/user/reducer.ts';
import { themeSelector } from '@/store/user/selectors.ts';
import { themes } from '@/theme/themes.ts';
import classes from './ColorThemeSwitcher.module.scss';

export interface ColorThemeSwitcherProps {
  space?: number;
  size?: number;
}

export default function ColorThemeSwitcher({ size = 36, space = 12 }: ColorThemeSwitcherProps) {
  const dispatch = useDispatch();
  const currentThemeName = useSelector(themeSelector);

  return (
    <Group gap={space} className={classes.root}>
      {Object.entries(themes).map(([name, theme]) => {
        const color = theme.colors[theme.primaryColor][theme.primaryShade];

        return (
          <ColorSwatch
            key={name}
            size={size}
            withShadow={false}
            color={color}
            style={{ '--shadow-color': color }}
            className={clsx(classes['color-swatch'], name === currentThemeName && classes.active)}
            onClick={() => dispatch(userActions.setTheme(name as any))}
          />
        );
      })}
    </Group>
  );
}
