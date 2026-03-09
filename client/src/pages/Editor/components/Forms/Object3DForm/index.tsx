import { Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { Vector3Field } from '@/pages/Editor/components/Fields';
import { CollapseSection } from '../../CollapseSection/index.tsx';
import { type Object3DFormProps, type Object3DFormValues } from './model.ts';
import classes from './Object3DForm.module.scss';

export function Object3DForm({ selected, className }: Object3DFormProps) {
  const form = useForm<Object3DFormValues>({
    name: 'Object3DForm',
    initialValues: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [0, 0, 0],
    },
  });

  useEffect(() => {
    if (!selected?.length) return;

    const { position, scale, rotation } = form.values;

    selected[0].object.position.set(...position);
    selected[0].object.scale.set(...scale);
    selected[0].object.rotation.set(...rotation);
  }, [form.values]);
  useEffect(() => {
    if (!selected.length) return;

    const { object: object3d } = selected[0];

    form.setInitialValues({
      position: [object3d.position.x, object3d.position.y, object3d.position.z],
      rotation: [object3d.rotation.x, object3d.rotation.y, object3d.rotation.z],
      scale: [object3d.scale.x, object3d.scale.y, object3d.scale.z],
    });

    form.reset();
  }, [selected]);

  if (!selected.length) return null;

  return (
    <>
      <div className={clsx(classes.root, className)}>
        {/*<Select
          label="Tone mapping"
          placeholder="Pick tone mapping"
          size="xs"
          unselectable="on"
          radius="xs"
          data={toneMappingOptions}
          {...form.getInputProps('toneMapping')}
        />*/}

        <CollapseSection title="Transfrom" defaultOpened={true}>
          <Stack gap={8}>
            <Vector3Field title="Position" {...form.getInputProps('position')} />
            <Vector3Field step={0.1} title="Rotation" {...form.getInputProps('rotation')} />
            <Vector3Field withLock defaultLocked step={0.1} title="Scale" {...form.getInputProps('scale')} />
          </Stack>
        </CollapseSection>

        {/*<ColorInput
          eyeDropperIcon={<IconFocus2 style={{ width: rem(18), height: rem(18) }} stroke={1.5} />}
          label="Clear color"
          placeholder="Pick color"
          size="xs"
          radius="xs"
          mb={8}
          fixOnBlur
          {...form.getInputProps('clearColor')}
        />*/}
      </div>
    </>
  );
}
