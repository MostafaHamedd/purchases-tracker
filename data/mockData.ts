import { DiscountTier, KaratType, ProgressBarConfig, Purchase, Store, Supplier } from './types/dataTypes';
import { getCurrentMonthDate, getDateString, getPreviousMonthDate } from './utils';

// Mock Stores Data
export const mockStores: Store[] = [
  {
    id: '1',
    name: 'Main Store - Downtown',
    code: 'MSD',
    isActive: true,
    progressBarConfig: {
      blue: 15,
      yellow: 5,
      orange: 5,
      red: 5,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Branch Store - Heliopolis',
    code: 'BSH',
    isActive: true,
    progressBarConfig: {
      blue: 15,
      yellow: 5,
      orange: 5,
      red: 5,
    },
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '3',
    name: 'Branch Store - Nasr City',
    code: 'BSN',
    isActive: false,
    progressBarConfig: {
      blue: 15,
      yellow: 5,
      orange: 5,
      red: 5,
    },
    createdAt: '2024-02-15T09:15:00Z',
    updatedAt: '2024-03-01T16:45:00Z',
  },
];

// Mock Suppliers Data
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Egyptian Gold Supplier',
    code: 'EGS',
    karat18: {
      discountTiers: [
        { id: 'tier1', name: 'Standard', threshold: 0, discountPercentage: 20, isProtected: true },
        { id: 'tier2', name: 'Premium', threshold: 500, discountPercentage: 26, isProtected: true },
        { id: 'tier3', name: 'VIP', threshold: 1000, discountPercentage: 34, isProtected: true },
      ],
      isActive: true,
    },
    karat21: {
      discountTiers: [
        { id: 'tier1', name: 'Basic', threshold: 0, discountPercentage: 15, isProtected: true },
        { id: 'tier2', name: 'Advanced', threshold: 750, discountPercentage: 20, isProtected: true },
        { id: 'tier3', name: 'Elite', threshold: 1500, discountPercentage: 23, isProtected: true },
      ],
      isActive: true,
    },
    isActive: true,
  },
  {
    id: '2',
    name: 'Premium Gold Supplier',
    code: 'PGS',
    karat18: {
      discountTiers: [
        { id: 'tier1', name: 'Regular', threshold: 0, discountPercentage: 18, isProtected: true },
        { id: 'tier2', name: 'Plus', threshold: 400, discountPercentage: 24, isProtected: true },
        { id: 'tier3', name: 'Max', threshold: 800, discountPercentage: 30, isProtected: true },
      ],
      isActive: true,
    },
    karat21: {
      discountTiers: [
        { id: 'tier1', name: 'Standard', threshold: 0, discountPercentage: 12, isProtected: true },
        { id: 'tier2', name: 'Premium', threshold: 600, discountPercentage: 18, isProtected: true },
        { id: 'tier3', name: 'VIP', threshold: 1200, discountPercentage: 25, isProtected: true },
      ],
      isActive: true,
    },
    isActive: true,
  },
  {
    id: '3',
    name: 'Silver Gold Supplier',
    code: 'SGS',
    karat18: {
      discountTiers: [
        { id: 'tier1', name: 'Basic', threshold: 0, discountPercentage: 5, isProtected: true },
        { id: 'tier2', name: 'Plus', threshold: 300, discountPercentage: 8, isProtected: true },
        { id: 'tier3', name: 'Max', threshold: 600, discountPercentage: 10, isProtected: true },
      ],
      isActive: true,
    },
    karat21: {
      discountTiers: [
        { id: 'tier1', name: 'Regular', threshold: 0, discountPercentage: 3, isProtected: true },
        { id: 'tier2', name: 'Advanced', threshold: 500, discountPercentage: 6, isProtected: true },
        { id: 'tier3', name: 'Elite', threshold: 1000, discountPercentage: 8, isProtected: true },
      ],
      isActive: true,
    },
    isActive: true,
  },
];

// Mock Purchases Data
export const mockPurchases: Purchase[] = [
  // Current month purchases (should have discount applied if total >= 1000g)
  {
    id: '1',
    date: getCurrentMonthDate(5), // 5th of current month
    storeId: '1', // Main Store - Downtown
    status: 'Pending',
    totalGrams: 300, // All converted to 21k equivalent
    totalFees: -5200, // With discount: 1500 - 6700 = -5200
    totalDiscount: 6700,
    dueDate: getDateString(25),
    suppliers: {
      EGS: {
        grams18k: 100,
        grams21k: 100,
        totalGrams21k: 100 + (100 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 50,
        grams21k: 50,
        totalGrams21k: 50 + (50 * 18/21), // Convert 18k to 21k equivalent
      },
      SGS: {
        grams18k: 0,
        grams21k: 100,
        totalGrams21k: 100,
      },
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
    storeId: '2', // Branch Store - Heliopolis
    status: 'Partial',
    totalGrams: 400, // All converted to 21k equivalent
    totalFees: -6900, // With discount: 2000 - 8900 = -6900
    totalDiscount: 8900,
    dueDate: getDateString(22),
    suppliers: {
      EGS: {
        grams18k: 150,
        grams21k: 100,
        totalGrams21k: 100 + (150 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 0,
        grams21k: 150,
        totalGrams21k: 150,
      },
      SGS: {
        grams18k: 0,
        grams21k: 0,
        totalGrams21k: 0,
      },
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
    storeId: '1', // Main Store - Downtown
    status: 'Paid',
    totalGrams: 500, // All converted to 21k equivalent
    totalFees: -8600, // With discount: 2500 - 11100 = -8600
    totalDiscount: 11100,
    dueDate: getDateString(18),
    suppliers: {
      EGS: {
        grams18k: 200,
        grams21k: 100,
        totalGrams21k: 100 + (200 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 0,
        grams21k: 200,
        totalGrams21k: 200,
      },
      SGS: {
        grams18k: 0,
        grams21k: 0,
        totalGrams21k: 0,
      },
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
    storeId: '2', // Branch Store - Heliopolis
    status: 'Overdue',
    totalGrams: 300, // All converted to 21k equivalent
    totalFees: 1500, // No discount: 300*5 = 1500
    totalDiscount: 0,
    dueDate: getDateString(15),
    suppliers: {
      EGS: {
        grams18k: 100,
        grams21k: 100,
        totalGrams21k: 100 + (100 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 0,
        grams21k: 0,
        totalGrams21k: 0,
      },
      SGS: {
        grams18k: 0,
        grams21k: 100,
        totalGrams21k: 100,
      },
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
    storeId: '1', // Main Store - Downtown
    status: 'Pending',
    totalGrams: 200, // All converted to 21k equivalent
    totalFees: 1000, // No discount: 200*5 = 1000
    totalDiscount: 0,
    dueDate: getDateString(10),
    suppliers: {
      EGS: {
        grams18k: 50,
        grams21k: 50,
        totalGrams21k: 50 + (50 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 0,
        grams21k: 0,
        totalGrams21k: 0,
      },
      SGS: {
        grams18k: 0,
        grams21k: 100,
        totalGrams21k: 100,
      },
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
    storeId: '2', // Branch Store - Heliopolis
    status: 'Partial',
    totalGrams: 250, // All converted to 21k equivalent
    totalFees: 1250, // No discount: 250*5 = 1250
    totalDiscount: 0,
    dueDate: getDateString(5),
    suppliers: {
      EGS: {
        grams18k: 100,
        grams21k: 50,
        totalGrams21k: 50 + (100 * 18/21), // Convert 18k to 21k equivalent
      },
      PGS: {
        grams18k: 0,
        grams21k: 0,
        totalGrams21k: 0,
      },
      SGS: {
        grams18k: 0,
        grams21k: 100,
        totalGrams21k: 100,
      },
    },
    payments: {
      gramsPaid: 0,
      feesPaid: 0,
    },
    paymentHistory: [],
  },
];

// Default form data for components
export const defaultDiscountTier: DiscountTier = {
  id: 'tier1',
  name: '',
  threshold: 0,
  discountPercentage: 0,
  isProtected: false,
};

export const defaultProgressBarConfig: ProgressBarConfig = {
  blue: 15,
  yellow: 5,
  orange: 5,
  red: 5,
};

// Available karat types
export const availableKaratTypes: KaratType[] = ['18', '21'];
