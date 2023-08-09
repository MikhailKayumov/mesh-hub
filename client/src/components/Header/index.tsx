'use client';
import { Layout, Switch, Typography } from 'antd';
import { clsx } from 'clsx';
import { useTheme } from '~/theme';
import styles from './Header.module.scss';

export const Header = () => {
  const { current, setCurrentTheme } = useTheme();
  const isDark = current === 'dark';

  const onChange = (checked: boolean) => {
    setCurrentTheme(checked ? 'dark' : 'light');
  };

  return (
    <Layout.Header className={styles.root}>
      <div className={styles.left}>
        <Typography.Title level={2} className={styles['logo-title']}>
          MeshHub
        </Typography.Title>
      </div>
      <div className={styles.right}>
        <div className={styles['theme-names']}>
          <Typography.Text className={clsx(styles['theme-name'], !isDark && styles['light-active'])}>
            Ночь
          </Typography.Text>
          <Typography.Text className={clsx(styles['theme-name'], !isDark && styles['light-active'])}>
            День
          </Typography.Text>
        </div>
        <Switch checked={isDark} loading={false} size={'default'} onChange={onChange} />
      </div>
    </Layout.Header>
  );
};
