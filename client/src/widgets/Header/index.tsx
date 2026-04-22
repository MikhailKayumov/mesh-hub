import { Container, Flex, Group, rem } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useSession } from '@/entities/user/hooks/useSession';
import { useCurrentColorScheme } from '@/shared/hooks/useCurrentColorScheme.ts';
import { RouterPaths } from '@/shared/router/paths.ts';
import { ColorSchemeSelect } from '../../widgets/ColorSchemeSelect';
import { Logo } from '../../widgets/Logo';
import { OrgSwitcher } from '../../widgets/OrgSwitcher';
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
          {session && <OrgSwitcher />}
          {session ? <User /> : <AuthButtons />}
        </Group>
      </Flex>
    </Container>
  );
}
