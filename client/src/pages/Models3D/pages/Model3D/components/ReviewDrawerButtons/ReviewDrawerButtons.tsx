import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconMapPin, IconMessageCircle } from '@tabler/icons-react';
import classes from './ReviewDrawerButtons.module.scss';

interface ReviewDrawerButtonsProps {
    onComments: () => void;
    onAnnotations: () => void;
}

export function ReviewDrawerButtons({ onComments, onAnnotations }: ReviewDrawerButtonsProps) {
    return (
        <Group className={classes.root} gap="xs">
            <Tooltip label="Комментарии">
                <ActionIcon variant="default" size="lg" onClick={onComments}>
                    <IconMessageCircle size={18} />
                </ActionIcon>
            </Tooltip>
            <Tooltip label="Аннотации">
                <ActionIcon variant="default" size="lg" onClick={onAnnotations}>
                    <IconMapPin size={18} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );
}
