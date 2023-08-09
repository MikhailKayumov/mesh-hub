'use client';
import { createElement, PropsWithChildren } from 'react';
import { Breadcrumb, Layout, Menu, MenuProps } from 'antd';
import { LaptopOutlined, NotificationOutlined, UserOutlined } from '@ant-design/icons';
import styles from './MainLayout.module.scss';

const sidebarItems: MenuProps['items'] = [UserOutlined, LaptopOutlined, NotificationOutlined].map((icon, index) => {
  const key = String(index + 1);

  return {
    key: `sub${key}`,
    icon: createElement(icon),
    label: `Subnav ${key}`,

    children: new Array(4).fill(null).map((_, j) => {
      const subKey = index * 4 + j + 1;
      return {
        key: subKey,
        label: `Option ${subKey}`,
      };
    }),
  };
});

export const MainLayout = ({ children }: PropsWithChildren) => {
  return (
    <Layout className={styles.root}>
      <Layout.Sider width={200} collapsible={true} defaultCollapsed={true}>
        <Menu mode='inline' defaultSelectedKeys={['1']} className={styles.sidebar} items={sidebarItems} />
      </Layout.Sider>
      <Layout.Content className={styles.main}>
        {/*<Breadcrumb*/}
        {/*  className={styles.breadcrumbs}*/}
        {/*  separator={'/'}*/}
        {/*  items={[{ title: 'Model' }, { title: 'Test Scene 1' }]}*/}
        {/*/>*/}
        <div className={styles.content}>{children}</div>
      </Layout.Content>
    </Layout>
  );
};
