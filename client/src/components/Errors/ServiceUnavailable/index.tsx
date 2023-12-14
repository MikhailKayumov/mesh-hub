import { Button, Text } from '@mantine/core';
import ErrorContainer from '@/components/Errors/ErrorContainer';

export function ServiceUnavailableError() {
  return (
    <ErrorContainer status={500} text="Сервис не доступен">
      <Text mt={24} mb={36} size="lg">
        Кажется что-то пошло не так! Попробуйте обновить страницу позже.
      </Text>
      <Button onClick={() => window.location.reload()} size="md">
        Перезагрузить
      </Button>
    </ErrorContainer>
  );
}
