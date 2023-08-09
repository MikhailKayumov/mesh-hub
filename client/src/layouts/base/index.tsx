'use client';
import { PropsWithChildren } from 'react';
import { Layout } from 'antd';
import { ThemeProvider } from '~/theme';
import { Header } from '~/components/Header';
import styles from './BaseLayout.module.scss';

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <ThemeProvider>
      <Layout className={styles.root}>
        <Header />
        <Layout.Content className={styles.main}>{children}</Layout.Content>
      </Layout>
    </ThemeProvider>
  );
};
