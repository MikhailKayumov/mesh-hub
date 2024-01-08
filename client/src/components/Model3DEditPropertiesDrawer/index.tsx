import { Badge, Button, Drawer, Group, Input, MultiSelect, ScrollArea, Switch, TextInput } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { Model3DEditPropertiesDrawerProps } from '@/components/Model3DEditPropertiesDrawer/model.ts';
import useModel3DEditPropertiesForm from '@/components/Model3DEditPropertiesDrawer/useModel3DEditPropertiesForm.ts';
import WysiwygEditor from '@/components/WysiwygEditor';
import { MAX_MODEL_3D_CATEGORIES_LENGTH, MAX_MODEL_3D_NAME_LENGTH } from '@/constants';
import classes from './Model3DEditPropertiesDrawer.module.scss';

export default function Model3DEditPropertiesDrawer({ model, opened, onClose }: Model3DEditPropertiesDrawerProps) {
  const { form, categories, isSubmitting, onSubmit } = useModel3DEditPropertiesForm(model);

  const onCancel = () => {
    form.reset();
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      position="left"
      size="xl"
      title="Редактирование информации о модели"
      onClose={onClose}
      scrollAreaComponent={ScrollArea}
      padding={24}
      className={classes.root}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      withCloseButton={!isSubmitting}
    >
      <form onSubmit={onSubmit} className={classes.form}>
        <Group gap={24} mb={24}>
          <TextInput
            label="Название модели"
            placeholder="Введите название модели"
            withAsterisk
            maxLength={MAX_MODEL_3D_NAME_LENGTH}
            className={classes['model-name-field']}
            rightSection={
              <Badge className={classes['model-name-field-remaining']}>
                {MAX_MODEL_3D_NAME_LENGTH - form.values.name.length}
              </Badge>
            }
            {...form.getInputProps('name')}
          />
          <Input.Wrapper>
            <Input.Label />
            <Switch
              size="lg"
              checked={form.values.visible}
              className={classes['model-visible-field']}
              thumbIcon={
                form.values.visible ? (
                  <IconEye className={classes['eye-icon']} />
                ) : (
                  <IconEyeOff className={classes['eye-off-icon']} />
                )
              }
              {...form.getInputProps('visible')}
            />
          </Input.Wrapper>
        </Group>
        <MultiSelect
          mb={24}
          label={`Категории (максимум ${MAX_MODEL_3D_CATEGORIES_LENGTH})`}
          placeholder="Выберите категории"
          maxValues={MAX_MODEL_3D_CATEGORIES_LENGTH}
          data={categories}
          {...form.getInputProps('categories')}
        />
        <WysiwygEditor label="Описание" className={classes.wysiwyg} {...form.getInputProps('description')} />
        <Group justify="flex-end" className={classes.buttons}>
          <Button variant="outline" className={classes.button} onClick={onCancel} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" className={classes.button} loading={isSubmitting}>
            Сохранить
          </Button>
        </Group>
      </form>
    </Drawer>
  );
}
