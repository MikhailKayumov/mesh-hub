import { Paper, Title, TextInput, Button, Textarea, Group, Tooltip, TagsInput, Loader, Center } from '@mantine/core';
import PhoneInput from '@/components/PhoneInput';
import useDocumentTitle from '@/hooks/useDocumentTitle.ts';
import { softwares } from '@/pages/Profile/constants.ts';
import classes from './ProfilePage.module.scss';
import useProfileForm from './useProfileForm.ts';

export default function ProfilePage() {
  useDocumentTitle('Профиль');

  const { form, isSubmitting, isLoading, onSubmit } = useProfileForm();

  return (
    <>
      <Title mb="lg">Профиль</Title>
      {isLoading ? (
        <Center mt={80}>
          <Loader />
        </Center>
      ) : (
        <Paper withBorder p="lg" className={classes.root}>
          <form onSubmit={onSubmit} className={classes.form}>
            <TextInput {...form.getInputProps('lastName')} label="Фамилия" placeholder="Введите вашу фамилию" mb={16} />
            <TextInput {...form.getInputProps('firstName')} label="Имя" placeholder="Введите ваше имя" mb={16} />
            <TextInput
              {...form.getInputProps('middleName')}
              label="Отчество"
              placeholder="Введите ваше отчество"
              mb={16}
            />
            <PhoneInput
              {...form.getInputProps('phone')}
              label="Телефон"
              placeholder="Введите ваш номер телефона"
              mb={16}
            />
            <Tooltip label="Email изменить нельзя" position="right" withArrow offset={0} fz={12}>
              <TextInput {...form.getInputProps('email')} readOnly label="Email" placeholder="your@email.ru" mb={16} />
            </Tooltip>
            <Textarea
              {...form.getInputProps('aboutYourself')}
              placeholder="Напишите немного о себе"
              label="О себе"
              autosize
              minRows={4}
              maxRows={10}
              mb={16}
            />
            <TagsInput
              {...form.getInputProps('favoriteSoft')}
              label="Программное обеспечение"
              placeholder="Выберите или добавьте любимый софт"
              maxDropdownHeight={102}
              clearable
              clearButtonProps={{ 'aria-label': 'Clear input' }}
              data={softwares}
            />
            <Group mt={24} gap={16}>
              <Button type="submit" loading={isSubmitting} disabled={!form.isDirty()}>
                Сохранить
              </Button>
              <Button variant="transparent" disabled={isSubmitting}>
                Изменить пароль
              </Button>
            </Group>
          </form>
        </Paper>
      )}
    </>
  );
}
