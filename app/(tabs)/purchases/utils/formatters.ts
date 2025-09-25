// Utility functions for formatting data in purchase components

export const formatGrams = (grams: number): string => {
  if (grams === undefined || grams === null || isNaN(grams)) {
    return '0';
  }
  return grams % 1 === 0 ? grams.toString() : grams.toFixed(1);
};

export const formatCurrency = (amount: number): string => {
  return `EGP ${Math.abs(amount).toLocaleString('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

export const formatPaymentDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

export const roundGrams = (grams: number): number => {
  return Math.round(grams * 10) / 10;
};
