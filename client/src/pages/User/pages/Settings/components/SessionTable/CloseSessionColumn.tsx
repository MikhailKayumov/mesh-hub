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
    <ActionIcon variant="subtle" color="red" onClick={onClick} loading={isLoading}>
      <IconLogout color="red" size={18} />
    </ActionIcon>
  );
}
