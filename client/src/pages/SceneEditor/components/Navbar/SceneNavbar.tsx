import { clsx } from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { AppShell, Tabs, Tooltip } from '@mantine/core';
import type { AnimationClip, AnimationMixer } from 'three';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import type { SelectionState } from '../../hooks/model.ts';
import { SceneTabValues, type SceneTabValue } from './constants.ts';
import { getSceneTabsConfig } from './utils.tsx';
import classes from './SceneNavbar.module.scss';

interface SceneNavbarProps {
    className?: string;
    scene: SceneResponseDto;
    selectionState: SelectionState;
    onSelectObject: (id: string | null) => void;
    onSelectLight: (id: string | null) => void;
    syncLights: (lights: SceneResponseDto['lights']) => void;
    updateBackgroundColor: (hex: string) => void;
    updateAmbientLight: (intensity: number) => void;
    loadHdri: (url: string) => void;
    getObjectAnimations: (id: string) => AnimationClip[];
    getObjectMixer: (id: string) => AnimationMixer | undefined;
    getAnimatedObjectIds: () => string[];
    isSceneLoading: boolean;
}

const TAB_TOOLTIPS: Record<SceneTabValue, string> = {
    objects: 'Objects',
    lights: 'Lights',
    config: 'Scene Config',
    animations: 'Animations',
};

export function SceneNavbar({
    className,
    scene,
    selectionState,
    onSelectObject,
    onSelectLight,
    syncLights,
    updateBackgroundColor,
    updateAmbientLight,
    loadHdri,
    getObjectAnimations,
    getObjectMixer,
    getAnimatedObjectIds,
    isSceneLoading,
}: SceneNavbarProps) {
    const [tabValue, setTabValue] = useState<SceneTabValue>(SceneTabValues.Objects);

    // Auto-switch to Lights tab when a light is selected
    useEffect(() => {
        if (selectionState?.type === 'light') {
            setTabValue(SceneTabValues.Lights);
        }
    }, [selectionState]);

    const config = useMemo(
        () =>
            getSceneTabsConfig({
                scene,
                selectionState,
                onSelectObject,
                onSelectLight,
                syncLights,
                updateBackgroundColor,
                updateAmbientLight,
                loadHdri,
                getObjectAnimations,
                getObjectMixer,
                getAnimatedObjectIds,
                isSceneLoading,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [scene, selectionState, isSceneLoading],
    );

    return (
        <AppShell.Navbar p={0} withBorder className={clsx(classes.root, className)}>
            <Tabs value={tabValue} onChange={(v) => setTabValue(v as SceneTabValue)}>
                <Tabs.List className={classes.tabs}>
                    {config.map((c) => (
                        <Tooltip key={c.value} label={TAB_TOOLTIPS[c.value]} position="right" withArrow>
                            <Tabs.Tab
                                value={c.value}
                                className={clsx(classes.tab, tabValue === c.value && classes.active)}
                            >
                                {c.title}
                            </Tabs.Tab>
                        </Tooltip>
                    ))}
                </Tabs.List>
                {config.map((c) => (
                    <Tabs.Panel key={c.value} value={c.value} className={classes.content}>
                        {c.content}
                    </Tabs.Panel>
                ))}
            </Tabs>
        </AppShell.Navbar>
    );
}
