import { Container, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { IconPhone, IconMail, IconCopyright } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { RouterPaths } from '@/shared/router/paths.ts';
import { FOOTER_MAIL, FOOTER_PHONE } from '@/widgets/Footer/constants.ts';
import { Logo } from '../Logo';

function onMailClick() {
  window.location.href = `mailto:${FOOTER_MAIL}`;
}

function onPhoneClick() {
  window.location.href = `tel:${FOOTER_PHONE.replace(/[ )(-]/g, '')}`;
}

export function Footer() {
  return (
    <Container>
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Link to={RouterPaths.Base}>
            <Logo width={280} />
          </Link>
          <Flex gap={4}>
            <IconCopyright />
            <Text>{new Date().getFullYear()} Все права защищены</Text>
          </Flex>
        </Stack>
        <Stack gap="sm">
          <Title order={4} fw={500}>
            Контакты:
          </Title>
          <Stack gap="xs">
            <Flex role="button" onClick={onPhoneClick} gap="xs">
              <IconPhone />
              <Text>{FOOTER_PHONE}</Text>
            </Flex>
            <Flex role="button" onClick={onMailClick} gap="xs">
              <IconMail />
              <Text>{FOOTER_MAIL}</Text>
            </Flex>
          </Stack>
        </Stack>
      </Group>
    </Container>
  );
}
