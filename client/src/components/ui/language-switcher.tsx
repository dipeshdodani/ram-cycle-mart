import { Languages, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<'en' | 'gu'>(() => {
    const saved = localStorage.getItem('ram-cycle-mart-language');
    return (saved as 'en' | 'gu') || 'en';
  });

  const handleLanguageChange = (newLang: 'en' | 'gu') => {
    setLanguage(newLang);
    localStorage.setItem('ram-cycle-mart-language', newLang);
    
    // Apply font family for Gujarati text
    if (newLang === 'gu') {
      document.documentElement.style.setProperty('--font-gujarati', 'Noto Sans Gujarati, serif');
      document.documentElement.classList.add('gujarati-locale');
    } else {
      document.documentElement.classList.remove('gujarati-locale');
    }
    
    // Don't refresh page - just notify that language has changed
    // Components can react to localStorage changes or context updates
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[120px] h-8">
          <SelectValue placeholder="Language">
            {language === 'gu' ? 'ગુજરાતી' : 'English'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="gu">ગુજરાતી</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}