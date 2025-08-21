import React, { useState, useEffect } from 'react';
import { Textarea } from './textarea';
import { Button } from './button';
import { Languages, Type } from 'lucide-react';
import { transliterateToGujarati, isGujaratiText } from '@/lib/transliteration';
import { cn } from '@/lib/utils';

interface TransliterationTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
}

export function TransliterationTextarea({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  rows = 3
}: TransliterationTextareaProps) {
  const [isTransliterationEnabled, setIsTransliterationEnabled] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    
    // Check if Gujarati is selected as the app language
    const appLanguage = localStorage.getItem('ram-cycle-mart-language');
    const autoTransliterate = appLanguage === 'gu' || isTransliterationEnabled;
    
    if (autoTransliterate && !isGujaratiText(inputValue)) {
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

  // Auto-enable transliteration if Gujarati is selected as app language
  useEffect(() => {
    const appLanguage = localStorage.getItem('ram-cycle-mart-language');
    if (appLanguage === 'gu' && !isTransliterationEnabled) {
      setIsTransliterationEnabled(true);
    }
  }, []);

  return (
    <div className="relative">
      <Textarea
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn("pr-12", className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleTransliteration}
        className={cn(
          "absolute right-2 top-2 h-8 w-8 p-0",
          isTransliterationEnabled ? "text-blue-600 bg-blue-50" : "text-gray-400"
        )}
        title={isTransliterationEnabled ? "ગુજરાતી ઇનપુટ ચાલુ છે" : "ગુજરાતી ઇનપુટ ચાલુ કરો"}
      >
        {isTransliterationEnabled ? <Languages className="h-4 w-4" /> : <Type className="h-4 w-4" />}
      </Button>
    </div>
  );
}