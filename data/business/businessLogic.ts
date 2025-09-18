import { APP_CONFIG } from '../constants';
import { Purchase } from '../types/dataTypes';
import { PurchaseFees } from '../types/apiTypes';
import { getCurrentMonthDate, getPreviousMonthDate, getDateString } from '../utils';

// Mock data - this will be replaced with API calls
let mockPurchases: Purchase[] = [
  // Current month purchases (should have discount applied if total >= 1000g)
  {
    id: '1',
    date: getCurrentMonthDate(5), // 5th of current month
    store: 'Store A',
    status: 'Pending',
    totalGrams: 300,
    totalFees: -5200, // With discount: 1500 - 6700 = -5200 (ES18: 1000, EG18: 3400, EG21: 2300)
    totalDiscount: 6700,
    dueDate: getDateString(25),
    suppliers: {
      ES18: 100,
      EG18: 100,
      EG21: 100,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
  {
    id: '2',
    date: getCurrentMonthDate(8), // 8th of current month
    store: 'Store B',
    status: 'Partial',
    totalGrams: 400,
    totalFees: -6900, // With discount: 2000 - 8900 = -6900 (ES18: 1500, EG18: 5100, EG21: 2300)
    totalDiscount: 8900,
    dueDate: getDateString(22),
    suppliers: {
      ES18: 150,
      EG18: 150,
      EG21: 100,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
  {
    id: '3',
    date: getCurrentMonthDate(12), // 12th of current month
    store: 'Store A',
    status: 'Paid',
    totalGrams: 500,
    totalFees: -8600, // With discount: 2500 - 11100 = -8600 (ES18: 2000, EG18: 6800, EG21: 2300)
    totalDiscount: 11100,
    dueDate: getDateString(18),
    suppliers: {
      ES18: 200,
      EG18: 200,
      EG21: 100,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
  // Previous month purchases (no discount applied)
  {
    id: '4',
    date: getPreviousMonthDate(15), // 15th of previous month
    store: 'Store B',
    status: 'Overdue',
    totalGrams: 300,
    totalFees: 1500, // No discount: 300*5 = 1500
    totalDiscount: 0,
    dueDate: getDateString(15),
    suppliers: {
      ES18: 100,
      EG18: 100,
      EG21: 100,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
  {
    id: '5',
    date: getPreviousMonthDate(20), // 20th of previous month
    store: 'Store A',
    status: 'Pending',
    totalGrams: 200,
    totalFees: 1000, // No discount: 200*5 = 1000
    totalDiscount: 0,
    dueDate: getDateString(10),
    suppliers: {
      ES18: 100,
      EG18: 50,
      EG21: 50,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
  {
    id: '6',
    date: getPreviousMonthDate(25), // 25th of previous month
    store: 'Store B',
    status: 'Partial',
    totalGrams: 250,
    totalFees: 1250, // No discount: 250*5 = 1250
    totalDiscount: 0,
    dueDate: getDateString(5),
    suppliers: {
      ES18: 100,
      EG18: 100,
      EG21: 50,
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
];

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

export const calculatePurchaseBaseFees = (suppliers: { [key: string]: number }): number => {
  let totalBaseFees = 0;
  
  Object.entries(suppliers).forEach(([supplier, grams]) => {
    totalBaseFees += calculateBaseFee(grams);
  });
  
  return totalBaseFees;
};

export const calculatePurchaseTotalDiscount = (suppliers: { [key: string]: number }, purchaseDate: string): number => {
  let totalDiscount = 0;
  
  Object.entries(suppliers).forEach(([supplier, grams]) => {
    totalDiscount += calculateDiscountAmount(supplier, grams, purchaseDate);
  });
  
  return totalDiscount;
};

export const calculatePurchaseFees = (suppliers: { [key: string]: number }, purchaseDate: string): PurchaseFees => {
  const baseFees = calculatePurchaseBaseFees(suppliers);
  const totalDiscount = calculatePurchaseTotalDiscount(suppliers, purchaseDate);
  
  return {
    totalFees: baseFees - totalDiscount,
    totalDiscount: totalDiscount,
    baseFees: baseFees
  };
};
