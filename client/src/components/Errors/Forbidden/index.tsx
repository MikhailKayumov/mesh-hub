import { Button, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import ErrorContainer from '@/components/Errors/ErrorContainer';
import RouterPaths from '@/router/paths.ts';
import { canNavigateBack } from '@/router/utils';

export function ForbiddenError() {
  const navigate = useNavigate();
  const onClick = () => navigate(canNavigateBack() ? -1 : (RouterPaths.Base as any), { replace: true });

  return (
    <ErrorContainer status={403} text="Доступ запрещен">
      <Text mt={24} mb={36} size="lg">
        У вашего пользователя нет прав для просмотра данной страницы.
      </Text>
      <Button onClick={onClick} size="md">
        Назад
      </Button>
    </ErrorContainer>
  );
}
