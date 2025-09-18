// Core data types for database objects
// These types represent the main entities that will be stored in the database

import { StatusType } from '../constants';

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
  store: 'Store A' | 'Store B';
  status: StatusType;
  totalGrams: number;
  totalFees: number;
  totalDiscount: number;
  dueDate: string;
  suppliers: {
    ES18: number;
    EG18: number;
    EG21: number;
  };
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
  karatType: KaratType;
  discountTiers: DiscountTier[];
  isActive: boolean;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
