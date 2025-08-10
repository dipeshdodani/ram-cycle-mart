import React, { useState, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Languages, Type } from 'lucide-react';
import { transliterateToGujarati, isGujaratiText } from '@/lib/transliteration';
import { cn } from '@/lib/utils';

interface TransliterationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  type?: string;
}

export function TransliterationInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  type = "text"
}: TransliterationInputProps) {
  const [isTransliterationEnabled, setIsTransliterationEnabled] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (isTransliterationEnabled && !isGujaratiText(inputValue)) {
      // Real-time transliteration as user types
      const transliterated = transliterateToGujarati(inputValue);
      setDisplayValue(transliterated);
      onChange(transliterated);
    } else {
      setDisplayValue(inputValue);
      onChange(inputValue);
    }
  };

  const toggleTransliteration = () => {
    const newState = !isTransliterationEnabled;
    setIsTransliterationEnabled(newState);
    
    if (newState && displayValue && !isGujaratiText(displayValue)) {
      // Convert current text to Gujarati when enabling
      const transliterated = transliterateToGujarati(displayValue);
      setDisplayValue(transliterated);
      onChange(transliterated);
    }
  };

  return (
    <div className="relative">
      <Input
        type={type}
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleTransliteration}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0",
          isTransliterationEnabled ? "text-blue-600 bg-blue-50" : "text-gray-400"
        )}
        title={isTransliterationEnabled ? "Gujarati input enabled" : "Enable Gujarati input"}
      >
        {isTransliterationEnabled ? <Languages className="h-4 w-4" /> : <Type className="h-4 w-4" />}
      </Button>
    </div>
  );
}