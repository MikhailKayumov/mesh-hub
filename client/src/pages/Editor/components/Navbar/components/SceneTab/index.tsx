import { useForm } from '@mantine/form';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Object3D } from 'three';
import { isObject3D } from '@/components/Model3DViewer/classes/utils';
import { WorldEventNames } from '@/components/Model3DViewer/classes/World';
import { LayersCheckboxGroup } from '@/pages/Editor/components/LayersCheckboxGroup';
import { Object3DOutliner } from '@/pages/Editor/components/Object3DOutliner';
import { initialValues } from './constants.ts';
import { SceneTabProps, SceneTabFormValues } from './model.ts';
import classes from './SceneTab.module.scss';

// @refresh reset
export function SceneTab({ className, viewer }: SceneTabProps) {
  const [key, setKey] = useState(0);
  const form = useForm<SceneTabFormValues>({
    initialValues,
    onValuesChange: (values) => {
      values.layers.forEach((layer) => {
        layer.checked ? viewer?.camera.enableLayer(layer.value) : viewer?.camera.disableLayer(layer.value);
      });
      setKey((prev) => ++prev);
    },
  });

  useEffect(() => {
    if (!viewer) return;

    viewer.camera.disableLayers();
    viewer.camera.enableLayer(
      form.values.layers.reduce<number[]>((acc, l) => {
        if (l.checked) acc.push(l.value);
        return acc;
      }, []),
    );

    const onWorldChange = () => setKey((prev) => ++prev);

    viewer.world.addEventListener(WorldEventNames.WorldSceneChange, onWorldChange);

    return () => {
      viewer.world.removeEventListener(WorldEventNames.WorldSceneChange, onWorldChange);
    };
  }, [viewer]);

  const filterNode = useCallback(
    (item: Object3D) => {
      return !!viewer && (!!item.children?.length || isObject3D(item)) && viewer.camera.testLayers(item.layers);
    },
    [viewer],
  );

  return (
    <div className={clsx(classes.root, className)}>
      <Object3DOutliner key={key} data={viewer?.world.scene.children ?? []} filterNode={filterNode} />
      <LayersCheckboxGroup defaultOpened={false} form={form} />
    </div>
    /*<div className={clsx(classes.root, className)}>
      <Select
        label="Color space"
        placeholder="Pick color space"
        size="xs"
        radius="xs"
        data={colorSpaceOptions}
        {...form.getInputProps('outputColorSpace')}
      />

      <Select
        label="Shadow map type"
        placeholder="Pick shadow map type"
        size="xs"
        radius="xs"
        data={shadowMapTypeOptions}
        {...form.getInputProps('shadowMapType')}
      />

      <Select
        label="Tone mapping"
        placeholder="Pick tone mapping"
        size="xs"
        unselectable="on"
        radius="xs"
        data={toneMappingOptions}
        {...form.getInputProps('toneMapping')}
      />

      <Input.Wrapper label="Tone mapping exposure" size="xs">
        <Group className={classes['slider-row']} gap={8}>
          <Slider
            size="sm"
            className={classes['slider-row-slider']}
            defaultValue={60}
            min={0}
            max={10}
            step={0.05}
            {...form.getInputProps('toneMappingExposure')}
          />
          <NumberInput
            min={0}
            max={100}
            step={0.1}
            size="xs"
            radius="xs"
            allowNegative={false}
            decimalScale={2}
            className={classes['slider-row-input']}
            {...form.getInputProps('toneMappingExposure')}
          />
        </Group>
      </Input.Wrapper>

      <Input.Wrapper label="Clear alpha" size="xs">
        <Group className={classes['slider-row']} gap={8}>
          <Slider
            size="sm"
            className={classes['slider-row-slider']}
            defaultValue={60}
            min={0}
            max={1}
            step={0.01}
            {...form.getInputProps('clearAlpha')}
          />
          <NumberInput
            min={0}
            max={1}
            step={0.01}
            size="xs"
            radius="xs"
            allowNegative={false}
            decimalScale={2}
            className={classes['slider-row-input']}
            {...form.getInputProps('clearAlpha')}
          />
        </Group>
      </Input.Wrapper>

      <ColorInput
        eyeDropperIcon={<IconFocus2 style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
        label="Clear color"
        placeholder="Pick color"
        size="xs"
        radius="xs"
        fixOnBlur
        {...form.getInputProps('clearColor')}
      />
    </div>*/
  );
}
