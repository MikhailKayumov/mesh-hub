import { Container, Flex, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ColorSchemeSelect } from '@/components/ColorSchemeSelect';
import { Logo } from '@/components/Logo';
import { useCurrentColorScheme } from '@/hooks/useCurrentColorScheme.ts';
import { useSession } from '@/hooks/useSession.ts';
import { RouterPaths } from '@/router/paths.ts';
import { AuthButtons } from './components/AuthButtons';
import { User } from './components/User';
import classes from './Header.module.scss';

export function Header() {
  const { isLight } = useCurrentColorScheme();
  const session = Boolean(useSession());

  return (
    <Container h="100%">
      <Flex align="center" justify="space-between" h="100%">
        <Link to={RouterPaths.Base} className={classes['logo-link']}>
          <Logo width={200} />
        </Link>
        <Group gap={12}>
          <ColorSchemeSelect color={isLight ? 'black' : 'white'} />
          {session ? <User /> : <AuthButtons />}
        </Group>
      </Flex>
    </Container>
  );
}
