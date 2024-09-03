import { Container, Flex, Group, rem } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ColorSchemeSelect } from '@/components/ColorSchemeSelect';
import { Logo } from '@/components/Logo';
import { useSession } from '@/entities/user/hooks/useSession';
import { RouterPaths } from '@/router/paths.ts';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { AuthButtons } from './components/AuthButtons';
import { User } from './components/User';
import classes from './Header.module.scss';

export function Header() {
  const { isLight } = useCurrentColorScheme();
  const session = Boolean(useSession());

  return (
    <Container fluid h="100%">
      <Flex align="center" justify="space-between" h="100%" gap={rem(32)}>
        <Link to={RouterPaths.Base} className={classes['logo-link']}>
          <Logo width={200} />
        </Link>
        <Group gap={rem(16)}>
          <ColorSchemeSelect color={isLight ? 'black' : 'white'} />
          {session ? <User /> : <AuthButtons />}
        </Group>
      </Flex>
    </Container>
  );
}
