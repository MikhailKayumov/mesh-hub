import { Container } from '@mantine/core';
import type { PropsWithChildren } from 'react';
import { ErrorTitle, type ErrorTitleProps } from '../ErrorTitle';
import classes from './ErrorContainer.module.scss';

export interface ErrorContainerProps extends PropsWithChildren<ErrorTitleProps> {
  text: string;
  status: number;
}

export function ErrorContainer({ text, status, children }: ErrorContainerProps) {
  return (
    <Container className={classes.root} px={0}>
      <ErrorTitle status={status} text={text} />
      {children}
    </Container>
  );
}
