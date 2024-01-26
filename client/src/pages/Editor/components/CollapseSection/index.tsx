import { Box, Button, Collapse } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconCaretDownFilled } from '@tabler/icons-react';
import { clsx } from 'clsx';
import classes from './CollapseSection.module.scss';
import { CollapseSectionProps } from './model.ts';

export const CollapseSection = ({ title, children, defaultOpened = false, className }: CollapseSectionProps) => {
  const [opened, { toggle }] = useDisclosure(defaultOpened);

  return (
    <Box className={clsx(classes.root, className)}>
      <Button
        variant="transparent"
        size="xs"
        lh="xs"
        fw={500}
        className={classes.label}
        onClick={toggle}
        rightSection={<IconCaretDownFilled className={clsx(classes['label-icon'], opened && classes.opened)} />}
      >
        {title}
      </Button>
      <Collapse in={opened}>
        <Box mt={6} pb={6} px={6} className={classes.collapsed}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};
