import { AppShell, Tabs } from '@mantine/core';
import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { TabValues } from '@/pages/Editor/components/Navbar/constants.ts';
import { type TabValue } from '@/pages/Editor/components/Navbar/model.ts';
import { type Viewer } from '@/widgets/Model3DViewer/classes/Viewer';
import classes from './Navbar.module.scss';
import { getTabsConfig } from './utils.tsx';

export interface NavbarProps {
  className?: string;
  viewer: Viewer | null;
  modelId?: string;
  defaultTab?: TabValue;
}

export function Navbar({ className, viewer, modelId, defaultTab = TabValues.Scene }: NavbarProps) {
  const [tabValue, setTabValue] = useState<TabValue | undefined | null>(undefined);
  const config = useMemo(() => getTabsConfig(viewer, modelId), [viewer, modelId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTabValue(defaultTab), [defaultTab]);

  return (
    <AppShell.Navbar p={0} withBorder className={clsx(classes.root, className)}>
      <Tabs value={tabValue} onChange={(v) => setTabValue(v as TabValue)}>
        <Tabs.List className={classes.tabs}>
          {config?.map((c) => (
            <Tabs.Tab
              key={c.value}
              value={c.value}
              className={clsx(classes.tab, tabValue === c.value && classes.active)}
            >
              {c.title}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {config?.map((c) => (
          <Tabs.Panel key={c.value} value={c.value} className={classes.content}>
            {c.content}
          </Tabs.Panel>
        ))}
      </Tabs>
    </AppShell.Navbar>
  );
}
