import { NumberInputProps } from '@mantine/core';

export interface ScalarFieldProps extends Omit<NumberInputProps, 'onChange'> {
  value: number;
  onChange?: (value: number) => void;
}

export interface UseScalarFieldWheelProps {
  value: number;
  min: number;
  max: number;
  step: number;
  allowNegative: boolean;
  onChange: (value: number) => void;
}
