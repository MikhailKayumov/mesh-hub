import { IconBulb, IconCube, IconSettings } from '@tabler/icons-react';
import type { SceneResponseDto } from '@/app/api/dto.ts';
import type { SelectionState } from '../../hooks/model.ts';
import { SceneObjectsPanel } from '../../panels/SceneObjectsPanel';
import { SceneLightsPanel } from '../../panels/SceneLightsPanel';
import { SceneConfigPanel } from '../../panels/SceneConfigPanel';
import { SceneTabValues } from './constants.ts';
import type { SceneTabsConfig } from './model.ts';
import classes from './SceneNavbar.module.scss';

interface GetSceneTabsConfigOptions {
    scene: SceneResponseDto;
    selectionState: SelectionState;
    onSelectObject: (id: string | null) => void;
    onSelectLight: (id: string | null) => void;
    syncLights: (lights: SceneResponseDto['lights']) => void;
    updateBackgroundColor: (hex: string) => void;
    updateAmbientLight: (intensity: number) => void;
    loadHdri: (url: string) => void;
}

export function getSceneTabsConfig({
    scene,
    selectionState,
    onSelectObject,
    onSelectLight,
    syncLights,
    updateBackgroundColor,
    updateAmbientLight,
    loadHdri,
}: GetSceneTabsConfigOptions): SceneTabsConfig[] {
    const selectedObjectId = selectionState?.type === 'object' ? selectionState.id : null;
    const selectedLightId = selectionState?.type === 'light' ? selectionState.id : null;

    return [
        {
            value: SceneTabValues.Objects,
            title: <IconCube className={classes['tab-icon']} />,
            content: (
                <SceneObjectsPanel
                    scene={scene}
                    selectedObjectId={selectedObjectId}
                    onSelectObject={onSelectObject}
                />
            ),
        },
        {
            value: SceneTabValues.Lights,
            title: <IconBulb className={classes['tab-icon']} />,
            content: (
                <SceneLightsPanel
                    scene={scene}
                    selectedLightId={selectedLightId}
                    onSelectLight={onSelectLight}
                    syncLights={syncLights}
                />
            ),
        },
        {
            value: SceneTabValues.Config,
            title: <IconSettings className={classes['tab-icon']} />,
            content: (
                <SceneConfigPanel
                    scene={scene}
                    updateBackgroundColor={updateBackgroundColor}
                    updateAmbientLight={updateAmbientLight}
                    loadHdri={loadHdri}
                />
            ),
        },
    ];
}
