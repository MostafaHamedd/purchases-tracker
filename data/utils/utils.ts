import { APP_CONFIG, StatusType } from '../constants';
import { Purchase, PurchaseStatus } from '../types/dataTypes';

// Date utility functions
export const getDateString = (daysFromToday: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
};

export const getCurrentMonthDate = (day: number): string => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const date = new Date(currentYear, currentMonth, day);
  return date.toISOString().split('T')[0];
};

export const getPreviousMonthDate = (day: number): string => {
  const now = new Date();
  const prevMonth = now.getMonth() - 1;
  const currentYear = now.getFullYear();
  const date = new Date(currentYear, prevMonth, day);
  return date.toISOString().split('T')[0];
};

// Formatting utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Date calculation utilities
export const getDaysLeft = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getDaysLeftText = (dueDate: string): string => {
  const daysLeft = getDaysLeft(dueDate);
  if (daysLeft < 0) {
    return `${Math.abs(daysLeft)} days overdue`;
  } else if (daysLeft === 0) {
    return 'Due today';
  } else if (daysLeft === 1) {
    return '1 day left';
  } else {
    return `${daysLeft} days left`;
  }
};

// Status utilities
export const getStatusColor = (status: StatusType): string => {
  return APP_CONFIG.STATUS_COLORS[status] || APP_CONFIG.STATUS_COLORS.default;
};

export const calculateStatus = (purchase: Purchase): PurchaseStatus => {
  const daysLeft = getDaysLeft(purchase.dueDate);
  
  // Calculate remaining amounts (not percentages)
  const gramsDue = purchase.totalGrams - purchase.payments.gramsPaid;
  const feesDue = purchase.totalFees - purchase.payments.feesPaid;
  
  // If fully paid (0 grams due and 0 or less fees due - allowing for overpayment/credit)
  if (gramsDue <= 0 && feesDue <= 0) {
    return 'Paid';
  }
  
  // If overdue
  if (daysLeft < 0) {
    return 'Overdue';
  }
  
  // If partially paid
  if (purchase.payments.gramsPaid > 0 || purchase.payments.feesPaid > 0) {
    return 'Partial';
  }
  
  // If no payments made yet
  return 'Pending';
};

// Progress bar color logic
export const getProgressBarColor = (purchase: Purchase): string => {
  const daysLeft = getDaysLeft(purchase.dueDate);
  
  // Calculate remaining amounts (not percentages)
  const gramsDue = purchase.totalGrams - purchase.payments.gramsPaid;
  const feesDue = purchase.totalFees - purchase.payments.feesPaid;
  
  // If fully paid (0 grams due and 0 or less fees due - allowing for overpayment/credit)
  // ALWAYS show green regardless of due date when fully paid
  if (gramsDue <= 0 && feesDue <= 0) {
    return '#4ADE80'; // Green-400 - Fully paid (lighter)
  }
  
  // If overdue (after day 30 with any outstanding)
  if (daysLeft < 0) {
    return '#B91C1C'; // Red-700 - Overdue
  }
  
  // Color progression based on days remaining (30-day payment terms)
  // New structure: Blue (15 days) -> Yellow (5 days) -> Orange (5 days) -> Red (5 days)
  if (daysLeft <= 5) {
    return '#EF4444'; // Red - Last 5 days (Critical)
  } else if (daysLeft <= 10) {
    return '#F59E0B'; // Orange - Next 5 days (Urgent)
  } else if (daysLeft <= 15) {
    return '#FDE047'; // Yellow - Next 5 days (Warning)
  } else {
    return '#3B82F6'; // Blue - First 15 days (Good)
  }
};

// Karat conversion utilities
export const convertTo21kEquivalent = (grams: number, karatType: '18' | '21'): number => {
  // Safety checks for invalid inputs
  if (typeof grams !== 'number' || isNaN(grams) || grams < 0) {
    console.warn('Invalid grams value in convertTo21kEquivalent:', grams);
    return 0;
  }
  
  if (!karatType || (karatType !== '18' && karatType !== '21')) {
    console.warn('Invalid karatType in convertTo21kEquivalent:', karatType);
    return grams; // Default to treating as 21k
  }
  
  if (karatType === '21') {
    return grams; // Already 21k
  } else {
    // Convert 18k to 21k equivalent: 18k * (18/21) = 21k equivalent
    return grams * (18 / 21);
  }
};

// Debug utilities
export const debugDates = (): void => {
  console.log('Today:', getDateString(0));
  console.log('8 days ago:', getDateString(-8));
  console.log('22 days from now:', getDateString(22));
};
