// Currency formatting utilities for Indian market
export const INDIA_GST_RATE = 0.18; // 18% GST in India

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbol and commas, then parse
  const cleanAmount = formattedAmount.replace(/[₹,\s]/g, '');
  return parseFloat(cleanAmount) || 0;
}

export function calculateGST(amount: number, rate: number = INDIA_GST_RATE): number {
  return amount * rate;
}

export function calculateTotal(subtotal: number, taxRate: number = INDIA_GST_RATE, discount: number = 0): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
} {
  const discountAmount = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = calculateGST(taxableAmount, taxRate);
  const total = taxableAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total
  };
}