import { ColorInput, LoadingOverlay, rem, Select } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { IconFocus2 } from '@tabler/icons-react';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { sleep } from '@/shared/utils/sleep.ts';
import { isMesh } from '@/widgets/Model3DViewer/classes/utils';
import { NumberInputSlider } from '../../../../../../widgets/NumberInputSlider';
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
      <>
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
      </>

      <>
        <NumberInputSlider
          label="Tone mapping exposure"
          min={0}
          max={10}
          step={0.1}
          {...form.getInputProps('toneMappingExposure')}
        />
        <NumberInputSlider label="Clear alpha" min={0} max={1} step={0.01} {...form.getInputProps('clearAlpha')} />
      </>

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
