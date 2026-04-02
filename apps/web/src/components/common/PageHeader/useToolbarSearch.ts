import { useState, useEffect, useRef } from 'react';

interface UseToolbarSearchOptions {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function useToolbarSearch({ value, onChange, debounceMs = 300 }: UseToolbarSearchOptions) {
  const [inputValue, setInputValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync external value changes into local state
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounce local input -> external onChange
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (inputValue !== value) {
        onChangeRef.current(inputValue);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, value, debounceMs]);

  return { inputValue, setInputValue };
}
