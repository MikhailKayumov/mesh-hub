export interface NumberInputSliderProps {
  value?: number;

  label?: string;
  error?: any;

  min?: number;
  max?: number;
  step?: number;
  minSlider?: number;
  maxSlider?: number;
  stepSlider?: number;

  allowNegative?: boolean;
  decimalScale?: number;

  onChange?: (value: number) => void;
  onFocus?: any;
  onBlur?: any;
}
