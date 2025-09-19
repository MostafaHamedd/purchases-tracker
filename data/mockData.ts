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
    name: 'Egyptian Gold 18K',
    code: 'EG18',
    karatType: '18',
    discountTiers: [
      { id: 'tier1', name: 'Standard', threshold: 0, discountPercentage: 20, isProtected: true },
      { id: 'tier2', name: 'Premium', threshold: 500, discountPercentage: 26, isProtected: true },
      { id: 'tier3', name: 'VIP', threshold: 1000, discountPercentage: 34, isProtected: true },
    ],
    isActive: true,
  },
  {
    id: '2',
    name: 'Egyptian Gold 21K',
    code: 'EG21',
    karatType: '21',
    discountTiers: [
      { id: 'tier1', name: 'Basic', threshold: 0, discountPercentage: 15, isProtected: true },
      { id: 'tier2', name: 'Advanced', threshold: 750, discountPercentage: 20, isProtected: true },
      { id: 'tier3', name: 'Elite', threshold: 1500, discountPercentage: 23, isProtected: true },
    ],
    isActive: true,
  },
  {
    id: '3',
    name: 'Egyptian Silver 18K',
    code: 'ES18',
    karatType: '18',
    discountTiers: [
      { id: 'tier1', name: 'Regular', threshold: 0, discountPercentage: 5, isProtected: true },
      { id: 'tier2', name: 'Plus', threshold: 300, discountPercentage: 8, isProtected: true },
      { id: 'tier3', name: 'Max', threshold: 600, discountPercentage: 10, isProtected: true },
    ],
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
    storeId: '2', // Branch Store - Heliopolis
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
    storeId: '1', // Main Store - Downtown
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
    storeId: '2', // Branch Store - Heliopolis
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
    storeId: '1', // Main Store - Downtown
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
    storeId: '2', // Branch Store - Heliopolis
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
export const availableKaratTypes: KaratType[] = ['18', '21', '22', '24'];
