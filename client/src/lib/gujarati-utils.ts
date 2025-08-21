// Utility functions for Gujarati language support

export const gujaratiTranslations = {
  // Navigation
  dashboard: 'ડેશબોર્ડ',
  customers: 'ગ્રાહકો',
  workOrders: 'કાર્ય આદેશો',
  technicians: 'ટેકનિશિયન',
  inventory: 'સ્ટોક',
  billing: 'બિલિંગ',
  reports: 'રિપોર્ટ્સ',
  salesReports: 'વેચાણ રિપોર્ટ્સ',
  
  // Common actions
  save: 'સેવ કરો',
  cancel: 'રદ કરો',
  delete: 'ડિલીટ કરો',
  edit: 'એડિટ કરો',
  view: 'જુઓ',
  search: 'શોધો',
  filter: 'ફિલ્ટર',
  export: 'એક્સપોર્ટ',
  print: 'પ્રિન્ટ',
  
  // Status
  pending: 'બાકી',
  inProgress: 'પ્રગતિમાં',
  completed: 'પૂર્ણ',
  onHold: 'રોકાયેલ',
  cancelled: 'રદ કરેલ',
  
  // Customer fields
  firstName: 'પ્રથમ નામ',
  lastName: 'અટક',
  email: 'ઇમેઇલ',
  phone: 'ફોન',
  address: 'સરનામું',
  city: 'શહેર',
  state: 'રાજ્ય',
  zipCode: 'પિન કોડ',
  
  // Messages
  loading: 'લોડ થઈ રહ્યું છે...',
  noData: 'કોઈ ડેટા ઉપલબ્ધ નથી',
  error: 'એરર આવ્યો છે',
  success: 'સફળ',
  
  // Business specific
  ramCycleMart: 'રામ સાયકલ માર્ટ',
  sewingMachine: 'સિલાઈ મશીન',
  repairService: 'રિપેર સર્વિસ',
};

export function getGujaratiText(key: keyof typeof gujaratiTranslations): string {
  const language = localStorage.getItem('ram-cycle-mart-language') || 'en';
  return language === 'gu' ? gujaratiTranslations[key] : key;
}

export function isGujaratiLanguage(): boolean {
  return localStorage.getItem('ram-cycle-mart-language') === 'gu';
}

// Convert English numbers to Gujarati numerals
export function toGujaratiNumerals(text: string): string {
  const numeralMap: { [key: string]: string } = {
    '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
    '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯'
  };
  
  return text.replace(/[0-9]/g, (match) => numeralMap[match] || match);
}

// Format currency in Gujarati context
export function formatGujaratiCurrency(amount: string | number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(Number(amount));
  
  return isGujaratiLanguage() ? toGujaratiNumerals(formatted) : formatted;
}

// Format date in Gujarati context  
export function formatGujaratiDate(dateString: string): string {
  const formatted = new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  return isGujaratiLanguage() ? toGujaratiNumerals(formatted) : formatted;
}