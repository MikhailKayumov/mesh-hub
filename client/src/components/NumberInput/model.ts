export interface NumberInputProps {
  value?: number;

  label?: string;
  error?: any;
  id?: string;
  className?: string;

  min?: number;
  max?: number;
  step?: number;

  allowNegative?: boolean;
  decimalScale?: number;

  onChange?: (value: number) => void;
  onFocus?: any;
  onBlur?: any;
}
