import { AppShell, Tabs } from '@mantine/core';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { Viewer } from '@/components/Model3DViewer/classes/Viewer';
import { TabValue } from '@/pages/Editor/components/Navbar/model.ts';
import classes from './Navbar.module.scss';
import { createTabsElements, getTabsConfig } from './utils.tsx';
export interface NavbarProps {
  className?: string;
  viewer: Viewer | null;
}

export default function Navbar({ className, viewer }: NavbarProps) {
  const [tabValue, setTabValue] = useState<TabValue | undefined | null>(undefined);
  const [lists, panels, defaultValue] = useMemo(() => {
    const config = getTabsConfig(viewer);
    if (!config) {
      return [null, null, undefined];
    }

    return [...createTabsElements(config), config[0].value];
  }, [viewer]);

  useEffect(() => {
    setTabValue(defaultValue);
  }, [defaultValue]);

  return (
    <AppShell.Navbar p={0} withBorder className={clsx(classes.root, className)}>
      <Tabs value={tabValue} onChange={(v) => setTabValue(v as TabValue)}>
        <Tabs.List className={classes.tabs}>{lists}</Tabs.List>
        {panels}
      </Tabs>
    </AppShell.Navbar>
  );
}
