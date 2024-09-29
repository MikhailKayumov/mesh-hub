import { Button, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { RouterPaths } from '@/shared/router/paths.ts';
import { canNavigateBack } from '@/shared/utils/router';
import { ErrorContainer } from '@/widgets/Errors/ErrorContainer';

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
