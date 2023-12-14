import { Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import RouterPaths from '@/router/paths.ts';
import { buildAbsolutePath } from '@/router/utils';

export default function AuthButtons() {
  return (
    <>
      <Button component={Link} variant="default" to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Register])}>
        Регистрация
      </Button>
      <Button component={Link} to={buildAbsolutePath([RouterPaths.Auth, RouterPaths.Login])}>
        Войти
      </Button>
    </>
  );
}
