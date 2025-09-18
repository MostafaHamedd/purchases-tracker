import { APP_CONFIG, StatusType } from '../constants';
import { Purchase } from '../types/dataTypes';

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

export const calculateStatus = (purchase: Purchase): StatusType => {
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
  // Ordered from most urgent (closest to deadline) to least urgent
  if (daysLeft <= 4) {
    return '#DC2626'; // Red-600 - Day 26-30 (Pending - final) - Most urgent
  } else if (daysLeft <= 6) {
    return '#DC2626'; // Red-600 - Day 21-25 (Pending - high) - Very urgent (5-6 days)
  } else if (daysLeft <= 9) {
    return '#EA580C'; // Orange-600 - Day 21-25 (Pending - high) - High urgency (7-9 days)
  } else if (daysLeft <= 19) {
    return '#F59E0B'; // Amber-500 - Day 11-20 (Pending - mid) - Mid urgency (10-19 days)
  } else {
    return '#2563EB'; // Blue-600 - Day 1-10 (Pending - early) - Least urgent (20+ days)
  }
};

// Debug utilities
export const debugDates = (): void => {
  console.log('Today:', getDateString(0));
  console.log('8 days ago:', getDateString(-8));
  console.log('22 days from now:', getDateString(22));
};
