import { Text, Tooltip } from '@mantine/core';
import parseUserAgent from '@/utils/parseUserAgent.ts';

export interface UserAgentColumnProps {
  userAgent: string | undefined;
}

export default function UserAgentColumn({ userAgent }: UserAgentColumnProps) {
  if (!userAgent) {
    return (
      <Text size="sm" c="dimmed">
        Нет данных
      </Text>
    );
  }

  return (
    <Tooltip withArrow multiline fz={12} position="bottom-start" w={430} label={userAgent}>
      <Text size="sm" truncate="end">
        {parseUserAgent(userAgent)}
      </Text>
    </Tooltip>
  );
}
