// Application constants and configuration
export const APP_CONFIG = {
  // Available suppliers
  AVAILABLE_SUPPLIERS: ['ES18', 'EG18', 'EG21'] as const,
  
  // Available stores
  AVAILABLE_STORES: ['Store A', 'Store B'] as const,
  
  // Base fee rate per gram
  BASE_FEE_PER_GRAM: 5,
  
  // Default payment terms (days)
  DEFAULT_PAYMENT_TERMS_DAYS: 30,
  
  // Monthly discount thresholds (grams)
  MONTHLY_DISCOUNT_THRESHOLDS: {
    LOW: 0,      // No discount
    MEDIUM: 750, // Medium discount
    HIGH: 1000   // High discount
  },
  
  // Discount rates based on monthly tiers (low/medium/high)
  DISCOUNT_RATES: {
    ES18: { low: 5, medium: 8, high: 10 },
    EG18: { low: 20, medium: 26, high: 34 },
    EG21: { low: 15, medium: 20, high: 23 }
  },
  
  // Status colors
  STATUS_COLORS: {
    Paid: '#34D399',    // Green (lighter)
    Pending: '#3B82F6', // Blue
    Partial: '#F59E0B', // Yellow/Orange
    Overdue: '#EF4444', // Red
    default: '#6B7280'  // Gray
  }
} as const;

// Type exports for better TypeScript support
export type SupplierType = typeof APP_CONFIG.AVAILABLE_SUPPLIERS[number];
export type StoreType = typeof APP_CONFIG.AVAILABLE_STORES[number];
export type StatusType = keyof typeof APP_CONFIG.STATUS_COLORS;
