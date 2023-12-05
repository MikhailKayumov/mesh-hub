import { Container } from '@mantine/core';
import { PropsWithChildren } from 'react';
import ErrorTitle, { ErrorTitleProps } from '../ErrorTitle';
import classes from './ErrorContainer.module.scss';

export interface ErrorContainerProps extends PropsWithChildren<ErrorTitleProps> {
  text: string;
  status: number;
}

export default function ErrorContainer({ text, status, children }: ErrorContainerProps) {
  return (
    <Container className={classes.root} px={0}>
      <ErrorTitle status={status} text={text} />
      {children}
    </Container>
  );
}
