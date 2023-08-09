'use client';
import { PropsWithChildren } from 'react';
import styles from './LoginLayout.module.scss';

export const LoginLayout = ({ children }: PropsWithChildren) => {
  return <div className={styles.root}>{children}</div>;
};
