// Gujarati transliteration utility
// Maps English characters to Gujarati script

const englishToGujarati: { [key: string]: string } = {
  // Vowels
  'a': 'અ', 'aa': 'આ', 'i': 'ઇ', 'ii': 'ઈ', 'u': 'ઉ', 'uu': 'ઊ',
  'e': 'એ', 'ai': 'ઐ', 'o': 'ઓ', 'au': 'ઔ',
  
  // Consonants
  'ka': 'ક', 'kha': 'ખ', 'ga': 'ગ', 'gha': 'ઘ', 'nga': 'ઙ',
  'cha': 'ચ', 'chha': 'છ', 'ja': 'જ', 'jha': 'ઝ', 'nja': 'ઞ',
  'ta': 'ટ', 'tha': 'ઠ', 'da': 'ડ', 'dha': 'ઢ', 'na': 'ણ',
  'pa': 'પ', 'pha': 'ફ', 'ba': 'બ', 'bha': 'ભ', 'ma': 'મ',
  'ya': 'ય', 'ra': 'ર', 'la': 'લ', 'va': 'વ', 'sha': 'શ',
  'sa': 'સ', 'ha': 'હ', 'ksha': 'ક્ષ', 'tra': 'ત્ર', 'gya': 'જ્ઞ',
  
  // Simple consonants (without vowels)
  'k': 'ક્', 'kh': 'ખ્', 'g': 'ગ્', 'gh': 'ઘ્',
  'ch': 'ચ્', 'j': 'જ્', 'jh': 'ઝ્',
  't': 'ત્', 'th': 'થ્', 'd': 'દ્', 'dh': 'ધ્', 'n': 'ન્',
  'p': 'પ્', 'ph': 'ફ્', 'b': 'બ્', 'bh': 'ભ્', 'm': 'મ્',
  'y': 'ય્', 'r': 'ર્', 'l': 'લ્', 'v': 'વ્',
  'sh': 'શ્', 's': 'સ્', 'h': 'હ્',
  
  // Numbers
  '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
  '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯',
};

// Common name mappings for better transliteration
const commonNameMappings: { [key: string]: string } = {
  'amit': 'અમિત',
  'raj': 'રાજ',
  'shah': 'શાહ',
  'patel': 'પટેલ',
  'modi': 'મોદી',
  'bhavnagar': 'ભાવનગર',
  'ahmedabad': 'અમદાવાદ',
  'surat': 'સુરત',
  'rajkot': 'રાજકોટ',
  'vadodara': 'વડોદરા',
  'gandhinagar': 'ગાંધીનગર',
  'gujarat': 'ગુજરાત',
  'india': 'ભારત',
};

export function transliterateToGujarati(englishText: string): string {
  if (!englishText) return '';
  
  let result = englishText.toLowerCase().trim();
  
  // First, check for common name/place mappings
  for (const [english, gujarati] of Object.entries(commonNameMappings)) {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    result = result.replace(regex, gujarati);
  }
  
  // Then apply character-by-character transliteration
  // Sort by length (longest first) to avoid partial matches
  const sortedKeys = Object.keys(englishToGujarati).sort((a, b) => b.length - a.length);
  
  for (const english of sortedKeys) {
    const gujarati = englishToGujarati[english];
    result = result.replace(new RegExp(english, 'g'), gujarati);
  }
  
  return result;
}

export function isGujaratiText(text: string): boolean {
  // Check if text contains Gujarati characters
  const gujaratiRange = /[\u0A80-\u0AFF]/;
  return gujaratiRange.test(text);
}

import { useState } from 'react';

// Hook to toggle transliteration mode
export function useTransliteration() {
  const [isEnabled, setIsEnabled] = useState(false);
  
  const toggleTransliteration = () => {
    setIsEnabled(prev => !prev);
  };
  
  const transliterate = (text: string) => {
    return isEnabled ? transliterateToGujarati(text) : text;
  };
  
  return {
    isEnabled,
    toggleTransliteration,
    transliterate,
  };
}