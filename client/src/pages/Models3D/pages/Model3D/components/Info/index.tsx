import { Avatar, Box, Group, Text, Tooltip } from '@mantine/core';
import { IconCategory } from '@tabler/icons-react';
import { useModel3DContext } from '@/contexts/Model3DContext/useModel3DContext.ts';
import { Model3DDescription } from '@/pages/Models3D/pages/Model3D/components/Info/components/Description';
import { getAvatarSrcByString } from '@/utils/user.ts';
import classes from './Model3DPageInfo.module.scss';

export function Model3DPageInfo() {
  const model = useModel3DContext();
  if (!model) return;

  return (
    <Box p={24} className={classes.root}>
      <Group>
        <Avatar radius="sm" src={getAvatarSrcByString(model.ownerAvatar)} color="primary" size={36} />
        <Text>{model.ownerName}</Text>
      </Group>
      {!!model.categories?.length && (
        <Group mt={12} gap={12}>
          <Tooltip label="Категории" openDelay={300} position="bottom-start">
            <IconCategory className={classes['category-icon']} />
          </Tooltip>
          <Group className={classes.categories}>
            {model.categories.map(({ name, id }) => (
              <Text c="dimmed" key={id} size="xs" lh="1.5" className={classes.category}>
                {name}
              </Text>
            ))}
          </Group>
        </Group>
      )}
      {model?.description && (
        <Box mt={16}>
          <Model3DDescription />
        </Box>
      )}
    </Box>
  );
}
