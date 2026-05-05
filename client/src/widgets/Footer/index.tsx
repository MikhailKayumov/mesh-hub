import { Anchor, Container, Divider, Flex, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconCopyright, IconMail, IconPhone } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { RouterPaths } from '@/shared/router/paths.ts';
import { FOOTER_MAIL, FOOTER_PHONE } from '@/widgets/Footer/constants.ts';
import { Logo } from '../Logo';

function buildAuthPath(sub: string) {
  return `/${RouterPaths.Auth}/${sub}`;
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <Container>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="xl">
        {/* Brand */}
        <Stack gap="sm">
          <Link to={RouterPaths.Base} style={{ display: 'inline-flex' }}>
            <Logo width={200} />
          </Link>
          <Text size="sm" c="dimmed" maw={200}>
            Открытая библиотека 3D-контента для дизайнеров и разработчиков
          </Text>
        </Stack>

        {/* Content */}
        <Stack gap="sm">
          <Title order={6} tt="uppercase" c="dimmed" fw={600} fz="xs">
            Контент
          </Title>
          <Stack gap="xs">
            <Anchor component={Link} to={`/${RouterPaths.Models}`} c="inherit" size="sm" underline="hover">
              Модели
            </Anchor>
            <Anchor component={Link} to={`/?tab=scenes`} c="inherit" size="sm" underline="hover">
              Сцены
            </Anchor>
            <Anchor
              component={Link}
              to={`/${RouterPaths.User}/${RouterPaths.Profile}`}
              c="inherit"
              size="sm"
              underline="hover"
            >
              Загрузить модель
            </Anchor>
          </Stack>
        </Stack>

        {/* Platform */}
        <Stack gap="sm">
          <Title order={6} tt="uppercase" c="dimmed" fw={600} fz="xs">
            Платформа
          </Title>
          <Stack gap="xs">
            <Anchor component={Link} to={buildAuthPath(RouterPaths.Login)} c="inherit" size="sm" underline="hover">
              Войти
            </Anchor>
            <Anchor component={Link} to={buildAuthPath(RouterPaths.Register)} c="inherit" size="sm" underline="hover">
              Регистрация
            </Anchor>
            <Anchor
              component={Link}
              to={`/${RouterPaths.Org}/${RouterPaths.OrgCreate}`}
              c="inherit"
              size="sm"
              underline="hover"
            >
              Организации
            </Anchor>
          </Stack>
        </Stack>

        {/* Contacts */}
        <Stack gap="sm">
          <Title order={6} tt="uppercase" c="dimmed" fw={600} fz="xs">
            Контакты
          </Title>
          <Stack gap="xs">
            <Anchor href={`tel:${FOOTER_PHONE.replace(/[ )(-]/g, '')}`} c="inherit" size="sm" underline="hover">
              <Flex align="center" gap="xs">
                <IconPhone size={14} />
                {FOOTER_PHONE}
              </Flex>
            </Anchor>
            <Anchor href={`mailto:${FOOTER_MAIL}`} c="inherit" size="sm" underline="hover">
              <Flex align="center" gap="xs">
                <IconMail size={14} />
                {FOOTER_MAIL}
              </Flex>
            </Anchor>
          </Stack>
        </Stack>
      </SimpleGrid>

      <Divider my="xl" />

      <Flex justify="center" align="center" gap={4} pb="sm">
        <IconCopyright size={14} style={{ opacity: 0.5 }} />
        <Text size="xs" c="dimmed">
          {year} MeshHub · Все права защищены
        </Text>
      </Flex>
    </Container>
  );
}
