import { Button, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import ErrorContainer from '@/components/Errors/ErrorContainer';
import RouterPaths from '@/router/paths.ts';

export function NotFoundError() {
  return (
    <ErrorContainer status={404} text="Страница не найдена">
      <Text mt={24} mb={36} size="lg">
        Кажется что-то пошло не так! Страница, которую вы запрашиваете, не существует. Возможно она устарела, удалена
        или был введен неверный адрес в адресной строке.
      </Text>
      <Button component={Link} to={RouterPaths.Base} size="md">
        Перейти на главную
      </Button>
    </ErrorContainer>
  );
}
