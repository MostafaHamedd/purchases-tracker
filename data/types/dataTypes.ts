// Core data types for database objects
// These types represent the main entities that will be stored in the database

// Core Entity Types
export interface Payment {
  id: string;
  date: string;
  gramsPaid: number;
  feesPaid: number;
  note?: string;
}

export interface Purchase {
  id: string;
  date: string;
  storeId: string; // Reference to Store.id
  status: PurchaseStatus;
  totalGrams: number;
  totalFees: number;
  totalDiscount: number;
  dueDate: string;
  suppliers: Record<string, number>; // Dynamic supplier codes with gram amounts
  payments: {
    gramsPaid: number;
    feesPaid: number;
  };
  paymentHistory: Payment[];
}

export type KaratType = '18' | '21' | '22' | '24';
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
  karatType: KaratType;
  discountTiers: DiscountTier[];
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
