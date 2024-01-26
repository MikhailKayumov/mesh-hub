import { ColorInput, Group, Input, LoadingOverlay, NumberInput, rem, Select, Slider } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconFocus2 } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { isMesh } from '@/components/Model3DViewer/classes/utils';
import sleep from '@/utils/sleep.ts';
import {
  colorSpaceOptions,
  shadowMapTypeOptions,
  toneMappingOptions,
  transformFromForm,
  transformToForm,
} from './constants.ts';
import { RendererTabFormValues, RendererTabProps } from './model.ts';
import classes from './RendererTab.module.scss';

export function RendererTab({ className, viewer }: RendererTabProps) {
  const [isSubmitting, { open: submitStart, close: submitEnd }] = useDisclosure(false);

  const form = useForm<RendererTabFormValues>({
    initialValues: {},
  });

  useEffect(() => {
    if (!viewer) return;

    form.setInitialValues(transformToForm(viewer.renderer.getSettings()));
    form.reset();
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return;

    viewer.renderer.setSettings(transformFromForm(form.values));

    if (form.isDirty('shadowMapType')) {
      viewer.world.scene.traverse((object) => {
        if (isMesh(object)) {
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => {
              m.needsUpdate = true;
            });
          } else {
            object.material.needsUpdate = true;
          }
        }
      });
    }
  }, [form.values]);

  const onSubmit = form.onSubmit(async (values) => {
    try {
      submitStart();
      await sleep(0.9);
      console.log(values);
    } finally {
      submitEnd();
    }
  });

  return (
    <form className={clsx(classes.root, className)} onSubmit={onSubmit}>
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

      <LoadingOverlay zIndex={10} className={classes['viewer-loader']} visible={isSubmitting} />
    </form>
  );
}
