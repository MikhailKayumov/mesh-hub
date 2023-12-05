import { Box, Container, Flex } from '@mantine/core';
import { PropsWithChildren } from 'react';
import UserSidebar from '@/modules/UserSidebar';
import classes from './UserLayout.module.scss';

export default function UserLayout({ children }: PropsWithChildren) {
  return (
    <Container className={classes.root}>
      {/*todo: breadcrumbs*/}
      <Flex align="start" className={classes.main} gap="xl">
        <UserSidebar />
        <Box className={classes.main}>{children}</Box>
      </Flex>
    </Container>
  );
}
