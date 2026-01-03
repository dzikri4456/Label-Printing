import React, { useState, useEffect } from 'react';

interface BufferedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'onKeyDown' | 'onBlur'> {
  value: number;
  onCommit: (newValue: number) => void;
  min?: number;
  allowDecimals?: boolean; // New prop to control float vs integer
}

export const BufferedInput: React.FC<BufferedInputProps> = ({ 
  value, 
  onCommit, 
  min = 0, 
  allowDecimals = true, // Default to true for dimensions
  className, 
  ...props 
}) => {
  const [localValue, setLocalValue] = useState<string>(String(value));

  // Sync with external updates
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;

    // AGGRESSIVE SANITIZATION
    if (allowDecimals) {
      // Allow digits and one dot
      raw = raw.replace(/[^0-9.]/g, '');
      
      // Prevent multiple dots
      const parts = raw.split('.');
      if (parts.length > 2) {
        raw = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      // Integers only
      raw = raw.replace(/[^0-9]/g, '');
    }

    // Update local state immediately so user sees the restricted input
    setLocalValue(raw);
  };

  const commitChange = () => {
    let num = parseFloat(localValue);
    
    // Safety Fallback
    if (isNaN(num)) {
      setLocalValue(String(value)); 
      return;
    }

    // Clamp
    if (num < min) {
      num = min;
    }

    // Commit
    if (num !== value) {
      onCommit(num);
    }
    
    // Formatting cleanup (e.g., "05" -> "5", "10." -> "10")
    setLocalValue(String(num));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur(); 
    }
  };

  return (
    <input
      {...props}
      type="text" 
      inputMode={allowDecimals ? "decimal" : "numeric"}
      value={localValue}
      onChange={handleChange}
      onBlur={commitChange}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};