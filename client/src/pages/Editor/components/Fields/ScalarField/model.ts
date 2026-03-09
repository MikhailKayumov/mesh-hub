import { type NumberInputProps } from '@mantine/core';

export interface ScalarFieldProps extends Omit<NumberInputProps, 'onChange'> {
  value: number;
  onChange?: (value: number) => void;
}

export interface UseScalarFieldWheelProps {
  step: number;
  onChange: (delta: number) => void;
}
