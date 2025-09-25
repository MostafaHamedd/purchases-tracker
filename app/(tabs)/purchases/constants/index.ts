// Constants for purchase-related components

export const PURCHASE_CONSTANTS = {
  GRAMS_PRECISION: 1,
  DEFAULT_DISCOUNT_RATE: 0,
  BASE_FEE_PER_GRAM: 5, // EGP per gram
  KARAT_CONVERSION_RATE: 0.857, // 18k to 21k conversion
} as const;

export const STATUS_COLORS = {
  Pending: '#F59E0B',
  Paid: '#10B981',
  Partial: '#3B82F6',
  Overdue: '#EF4444',
} as const;

export const DAYS_LEFT_COLORS = {
  overdue: '#EF4444',
  urgent: '#F59E0B',
  good: '#10B981',
} as const;
