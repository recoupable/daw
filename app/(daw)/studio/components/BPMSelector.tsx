import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Input } from '@/components/ui/input';
import { useBPMContext } from '../hooks/useBPM';
import { cn } from '@/lib/utils';

interface BPMSelectorProps {
  className?: string;
}

export function BPMSelector({ className }: BPMSelectorProps) {
  const { bpm, setBpm, MIN_BPM, MAX_BPM } = useBPMContext();

  // Local state for input value - allows for smoother typing experience
  const [inputValue, setInputValue] = useState<string>(bpm.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input when bpm changes from external sources
  useEffect(() => {
    setInputValue(bpm.toString());
  }, [bpm]);

  // Handle direct input changes
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Allow empty string for better typing experience
      setInputValue(e.target.value);
    },
    [],
  );

  // Apply BPM change after user finishes typing
  const handleInputBlur = useCallback(() => {
    const newValue = Number.parseInt(inputValue, 10);

    // Validate and apply BPM if number is valid
    if (!Number.isNaN(newValue)) {
      // setBpm will handle min/max constraints
      setBpm(newValue);
    } else {
      // Reset to current BPM if invalid
      setInputValue(bpm.toString());
    }
  }, [inputValue, bpm, setBpm]);

  // Handle keyboard submission
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleInputBlur();
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        // Reset to current value on escape
        setInputValue(bpm.toString());
        inputRef.current?.blur();
      }
    },
    [handleInputBlur, bpm],
  );

  return (
    <div className={cn('flex items-center', className)}>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        className="w-16 text-center h-8 bg-background"
        aria-label="BPM value"
      />
    </div>
  );
}
