// Core data types for database objects
// These types represent the main entities that will be stored in the database

// Core Entity Types
export interface Payment {
  id: string;
  date: string;
  gramsPaid: number; // In original karat (18k or 21k)
  feesPaid: number;
  karatType: KaratType; // Track original karat for payment
  note?: string;
}

export interface Purchase {
  id: string;
  date: string;
  storeId: string; // Reference to Store.id
  status: PurchaseStatus;
  totalGrams: number; // Always in 21k equivalent
  totalFees: number;
  totalDiscount: number;
  dueDate: string;
  suppliers: Record<string, {
    grams18k: number;
    grams21k: number;
    totalGrams21k: number; // Converted total for calculations
  }>;
  payments: {
    gramsPaid: number;
    feesPaid: number;
  };
  paymentHistory: Payment[];
}

export type KaratType = '18' | '21';
export type PurchaseStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue';

export interface DiscountTier {
  id: string;
  name: string;
  threshold: number; // Minimum grams for this tier
  discountPercentage: number;
  isProtected?: boolean; // Main tiers cannot be deleted
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  karat18: {
    discountTiers: DiscountTier[];
    isActive: boolean;
  };
  karat21: {
    discountTiers: DiscountTier[];
    isActive: boolean;
  };
  isActive: boolean;
}

export interface ProgressBarConfig {
  blue: number;    // First 15 days - Good status
  yellow: number;  // Next 5 days - Warning
  orange: number;  // Next 5 days - Urgent
  red: number;     // Last 5 days - Critical/Overdue
}

export interface Store {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  progressBarConfig: ProgressBarConfig;
  createdAt: string;
  updatedAt: string;
}

// History/Analytics Types
export interface MonthData {
  year: number;
  month: number;
  monthName: string;
  purchases: Purchase[];
  totalGrams: number;
  totalFees: number;
  totalDiscount: number;
  netFees: number;
  storeBreakdown: Record<string, {
    purchases: Purchase[];
    totalGrams: number;
    totalFees: number;
  }>;
}
