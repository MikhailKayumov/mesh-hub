import { Box, Container, Flex } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { UserSidebar } from '@/components/UserSidebar';
import classes from './UserLayout.module.scss';

export function UserLayout({ children }: PropsWithChildren) {
  return (
    <Container className={classes.root}>
      {/*todo: breadcrumbs*/}
      <Flex align="start" className={classes.wrapper} gap="xl">
        <UserSidebar />
        <Box className={classes.main}>{children}</Box>
      </Flex>
    </Container>
  );
}
