import { Input, InputProps } from '@mantine/core';
import { forwardRef, useState } from 'react';
import { IMaskInput, IMaskInputProps } from 'react-imask';

export interface PhoneInputProps extends InputProps {
  value: string;
  mask?: string;
  error?: any;
  placeholder?: string;
  label?: string;
  onChange?: (value: string) => void;
  onFocus?: any;
  onBlur?: any;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, onChange, mask = '+7 (000) 000-00-00', value, ...props }, ref) => {
    const [localValue, setLocalValue] = useState(value ?? '');

    const onAccept: IMaskInputProps<HTMLInputElement>['onAccept'] = (_, maskRef) => {
      if (!onChange) {
        return setLocalValue(maskRef.unmaskedValue);
      }

      onChange(maskRef.unmaskedValue);
    };

    return (
      <Input.Wrapper label={label} error={error}>
        <Input
          {...props}
          value={value ?? localValue}
          ref={ref}
          component={IMaskInput}
          mask={mask}
          onAccept={onAccept}
        />
      </Input.Wrapper>
    );
  },
);

export default PhoneInput;
