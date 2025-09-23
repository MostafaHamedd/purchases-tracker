import { APP_CONFIG } from '../constants/constants';
import { PurchaseFees } from '../types/apiTypes';

// These functions are no longer needed - using API only

// ID generation functions - using timestamp-based IDs
export const generatePurchaseId = (): string => {
  return Date.now().toString();
};

export const generatePaymentId = (purchaseId: string): string => {
  return `${purchaseId}-${Date.now()}`;
};

// Business logic calculations
export const calculateBaseFee = (grams: number): number => {
  return grams * APP_CONFIG.BASE_FEE_PER_GRAM;
};

// This function will need to be updated to use API data
// For now, returning 0 to avoid errors
export const getCurrentMonthTotalGrams = (): number => {
  console.warn('⚠️ getCurrentMonthTotalGrams: This function needs to be updated to use API data');
  return 0;
};

export const getDiscountRate = (supplier: string): number => {
  // Debug logging
  console.log('🔍 getDiscountRate called with supplier:', supplier);
  console.log('🔍 APP_CONFIG:', APP_CONFIG);
  console.log('🔍 APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS:', APP_CONFIG?.MONTHLY_DISCOUNT_THRESHOLDS);
  
  // Defensive check for APP_CONFIG
  if (!APP_CONFIG || !APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS || !APP_CONFIG.DISCOUNT_RATES) {
    console.warn('⚠️ APP_CONFIG is not properly loaded, using default discount rate');
    return 0; // Return 0 discount if config is not available
  }
  
  const monthlyTotal = getCurrentMonthTotalGrams();
  let tier: 'low' | 'medium' | 'high';
  
  if (monthlyTotal >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.HIGH) {
    tier = 'high';
  } else if (monthlyTotal >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.MEDIUM) {
    tier = 'medium';
  } else {
    tier = 'low';
  }
  
  const discountRate = APP_CONFIG.DISCOUNT_RATES[supplier as keyof typeof APP_CONFIG.DISCOUNT_RATES]?.[tier] || 0;
  console.log('🔍 Calculated discount rate:', discountRate, 'for supplier:', supplier, 'tier:', tier);
  
  return discountRate;
};

export const shouldApplyDiscount = (purchaseDate: string): boolean => {
  // Defensive check for APP_CONFIG
  if (!APP_CONFIG || !APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS) {
    console.warn('⚠️ APP_CONFIG is not properly loaded in shouldApplyDiscount, returning false');
    return false; // Return false if config is not available
  }
  
  // For now, always apply discount since we can't calculate monthly totals without API data
  // This function will need to be updated to fetch monthly totals from API
  console.warn('⚠️ shouldApplyDiscount: This function needs to be updated to use API data for monthly totals');
  return true; // Always apply discount for now
};

export const calculateDiscountAmount = (supplier: string, grams: number, purchaseDate: string): number => {
  if (!shouldApplyDiscount(purchaseDate)) {
    return 0;
  }
  const discountRate = getDiscountRate(supplier);
  return grams * discountRate;
};

export const calculateNetFee = (supplier: string, grams: number, purchaseDate: string): number => {
  const baseFee = calculateBaseFee(grams);
  const discountAmount = calculateDiscountAmount(supplier, grams, purchaseDate);
  return baseFee - discountAmount;
};

export const calculateDueDate = (purchaseDate: string): string => {
  // Defensive check for APP_CONFIG
  if (!APP_CONFIG || !APP_CONFIG.DEFAULT_PAYMENT_TERMS_DAYS) {
    console.warn('⚠️ APP_CONFIG is not properly loaded in calculateDueDate, using default 30 days');
    const dueDate = new Date(purchaseDate);
    dueDate.setDate(dueDate.getDate() + 30); // Default to 30 days
    return dueDate.toISOString().split('T')[0];
  }
  
  const dueDate = new Date(purchaseDate);
  dueDate.setDate(dueDate.getDate() + APP_CONFIG.DEFAULT_PAYMENT_TERMS_DAYS);
  return dueDate.toISOString().split('T')[0];
};

export const calculatePurchaseBaseFees = (suppliers: { [key: string]: { grams18k: number; grams21k: number; totalGrams21k: number } }): number => {
  let totalBaseFees = 0;
  
  Object.entries(suppliers).forEach(([supplier, supplierData]) => {
    // Use totalGrams21k which is already converted to 21k equivalent
    totalBaseFees += calculateBaseFee(supplierData.totalGrams21k);
  });
  
  return totalBaseFees;
};

export const calculatePurchaseTotalDiscount = (suppliers: { [key: string]: { grams18k: number; grams21k: number; totalGrams21k: number } }, purchaseDate: string): number => {
  let totalDiscount = 0;
  
  Object.entries(suppliers).forEach(([supplier, supplierData]) => {
    // Use totalGrams21k which is already converted to 21k equivalent
    totalDiscount += calculateDiscountAmount(supplier, supplierData.totalGrams21k, purchaseDate);
  });
  
  return totalDiscount;
};

export const calculatePurchaseFees = (suppliers: { [key: string]: { grams18k: number; grams21k: number; totalGrams21k: number } }, purchaseDate: string): PurchaseFees => {
  const baseFees = calculatePurchaseBaseFees(suppliers);
  const totalDiscount = calculatePurchaseTotalDiscount(suppliers, purchaseDate);
  
  return {
    totalFees: baseFees - totalDiscount,
    totalDiscount: totalDiscount,
    baseFees: baseFees
  };
};
