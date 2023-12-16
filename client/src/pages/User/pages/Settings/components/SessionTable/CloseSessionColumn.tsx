import { ActionIcon } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import { useCloseCurrentUserSessionMutation } from '@/api/auth.ts';

export interface CloseSessionColumnProps {
  id: string;
}

export default function CloseSessionColumn({ id }: CloseSessionColumnProps) {
  const [close, { isLoading }] = useCloseCurrentUserSessionMutation();

  const onClick = () => close(id);

  return (
    <ActionIcon w={26} h={26} variant="subtle" c="red" color="red" onClick={onClick} loading={isLoading}>
      <IconLogout size={18} />
    </ActionIcon>
  );
}
