import { Button, Drawer, DrawerProps, Group, ScrollArea, TextInput } from '@mantine/core';
import { Model3DResponseDto } from '@/api/dto.ts';
import useModel3DEditPropertiesForm from '@/components/Model3DEditPropertiesDrawer/useModel3DEditPropertiesForm.ts';
import WysiwygEditor from '@/components/WysiwygEditor';
import classes from './Model3DEditPropertiesDrawer.module.scss';

export interface Model3DEditPropertiesDrawerProps extends Pick<DrawerProps, 'opened' | 'onClose'> {
  model: Model3DResponseDto;
}

// @refresh reset
export default function Model3DEditPropertiesDrawer({ model, opened, onClose }: Model3DEditPropertiesDrawerProps) {
  const { form, onSubmit } = useModel3DEditPropertiesForm(model);

  return (
    <Drawer
      opened={opened}
      position="left"
      size="xl"
      title="Редактирование информации о модели"
      onClose={onClose}
      scrollAreaComponent={ScrollArea}
      closeOnEscape={false}
      padding={24}
      className={classes.root}
    >
      <form onSubmit={onSubmit} className={classes.form}>
        <TextInput
          label="Название модели"
          placeholder="Введите название модели"
          withAsterisk
          {...form.getInputProps('name')}
          mb={16}
        />
        <WysiwygEditor label="Описание" className={classes.wysiwyg} {...form.getInputProps('description')} />
        <Group justify="flex-end" className={classes.buttons}>
          <Button variant="outline" className={classes.button} onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" className={classes.button}>
            Сохранить
          </Button>
        </Group>
      </form>
    </Drawer>
  );
}
