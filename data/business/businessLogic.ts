import { APP_CONFIG } from '../constants';
import { mockPurchases as initialMockPurchases } from '../mockData';
import { PurchaseFees } from '../types/apiTypes';
import { Purchase } from '../types/dataTypes';

// Mock data - this will be replaced with API calls
let mockPurchases: Purchase[] = [...initialMockPurchases];

// Data access functions (will be replaced with API calls)
export const getMockPurchases = (): Purchase[] => {
  console.log('getMockPurchases called, returning:', mockPurchases.length, 'purchases');
  return mockPurchases;
};

export const setMockPurchases = (purchases: Purchase[]): void => {
  console.log('setMockPurchases called with:', purchases.length, 'purchases');
  mockPurchases = purchases;
  console.log('mockPurchases updated, new length:', mockPurchases.length);
};

// ID generation functions
export const generatePurchaseId = (): string => {
  return (mockPurchases.length + 1).toString();
};

export const generatePaymentId = (purchaseId: string): string => {
  const purchase = mockPurchases.find(p => p.id === purchaseId);
  return `${purchaseId}-${(purchase?.paymentHistory.length || 0) + 1}`;
};

// Business logic calculations
export const calculateBaseFee = (grams: number): number => {
  return grams * APP_CONFIG.BASE_FEE_PER_GRAM;
};

export const getCurrentMonthTotalGrams = (): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  return mockPurchases.reduce((total, purchase) => {
    const purchaseDate = new Date(purchase.date);
    if (purchaseDate.getMonth() === currentMonth && purchaseDate.getFullYear() === currentYear) {
      return total + purchase.totalGrams;
    }
    return total;
  }, 0);
};

export const getDiscountRate = (supplier: string): number => {
  const monthlyTotal = getCurrentMonthTotalGrams();
  let tier: 'low' | 'medium' | 'high';
  
  if (monthlyTotal >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.HIGH) {
    tier = 'high';
  } else if (monthlyTotal >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.MEDIUM) {
    tier = 'medium';
  } else {
    tier = 'low';
  }
  
  return APP_CONFIG.DISCOUNT_RATES[supplier as keyof typeof APP_CONFIG.DISCOUNT_RATES][tier];
};

export const shouldApplyDiscount = (purchaseDate: string): boolean => {
  const purchaseDateObj = new Date(purchaseDate);
  const purchaseMonth = purchaseDateObj.getMonth();
  const purchaseYear = purchaseDateObj.getFullYear();
  
  // Calculate total grams for that specific month
  const monthlyTotal = mockPurchases.reduce((total, purchase) => {
    const otherPurchaseDate = new Date(purchase.date);
    if (otherPurchaseDate.getMonth() === purchaseMonth && otherPurchaseDate.getFullYear() === purchaseYear) {
      return total + purchase.totalGrams;
    }
    return total;
  }, 0);
  
  return monthlyTotal >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.MEDIUM;
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
