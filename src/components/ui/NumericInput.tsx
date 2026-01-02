import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from './Input';

interface NumericInputProps {
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'decimal-pad';
}

/**
 * NumericInput Component
 *
 * Isolated numeric input that manages its own string state
 * to prevent parent re-renders from affecting focus
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  keyboardType = 'decimal-pad',
}) => {
  // Local string state to preserve input while typing
  const [inputText, setInputText] = useState(value?.toString() || '');
  const isFocused = useRef(false);
  const lastValue = useRef(value);

  // Only update inputText when value changes externally AND input is not focused
  useEffect(() => {
    if (!isFocused.current && value !== lastValue.current) {
      setInputText(value?.toString() || '');
      lastValue.current = value;
    }
  }, [value]);

  const handleChange = useCallback((text: string) => {
    // Update local text immediately
    const displayText = text.replace(',', '.');
    setInputText(displayText);

    // Parse and notify parent
    const numericValue = displayText === '' ? null : parseFloat(displayText) || null;
    lastValue.current = numericValue;
    onValueChange(numericValue);
  }, [onValueChange]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    // Sync with actual value on blur
    setInputText(value?.toString() || '');
    lastValue.current = value;
  }, [value]);

  return (
    <Input
      label={label}
      value={inputText}
      onChangeText={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType={keyboardType}
      placeholder={placeholder}
    />
  );
};
