'use client';
import { CSSProperties, PropsWithChildren, useMemo } from 'react';
import { theme } from 'antd';
import { clsx } from 'clsx';

export interface PaperProps extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

export const Paper = ({ children, className, style }: PaperProps) => {
  const { token } = theme.useToken();

  const preservedStyle = useMemo<CSSProperties>(() => {
    return Object.assign(
      {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: token.colorBgContainer,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: token.colorBorder,
        padding: token.paddingLG,
        borderRadius: token.borderRadiusOuter,
      },
      style,
    );
  }, [token, style]);

  return (
    <div className={clsx(className)} style={preservedStyle}>
      {children}
    </div>
  );
};
