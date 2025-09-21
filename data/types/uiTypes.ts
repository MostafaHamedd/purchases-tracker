// UI and filter-related types
import { DiscountTier, KaratType, Payment, ProgressBarConfig, Purchase, Store, Supplier } from './dataTypes';

// Filter and search types
export interface PurchaseFilters {
  store?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export interface PurchaseSortOptions {
  field: 'date' | 'totalGrams' | 'totalFees' | 'dueDate';
  direction: 'asc' | 'desc';
}

// Component Props Interfaces

// Purchase-related component props
export interface AddPurchaseDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseFormData) => void;
}

export interface AddPaymentDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => void;
  purchaseId: string;
  purchase?: PurchaseSummaryData;
}

export interface EditPaymentDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentFormData) => void;
  payment?: Payment;
}

export interface PurchaseCardProps {
  purchase: Purchase;
  onRefresh: () => void;
}

export interface PaymentCardProps {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
}

export interface SupplierReceiptCardProps {
  suppliers: { [key: string]: { grams18k: number; grams21k: number; totalGrams21k: number } };
}

// Store-related component props
export interface AddStoreDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmitStore: (storeData: StoreFormData) => void;
}

export interface EditStoreDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmitStore: (storeData: StoreFormData & { id: string }) => void;
  store?: Store;
}

export interface StoreCardProps {
  store: Store;
  onDelete?: (storeId: string) => void;
  onEdit?: (store: Store) => void;
}

// Supplier-related component props
export interface AddSupplierDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSupplier: (supplierData: SupplierFormData) => void;
}

export interface EditSupplierDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSupplier: (supplierData: SupplierFormData) => void;
  supplier?: Supplier;
}

export interface SupplierCardProps {
  supplier: Supplier;
  onDelete?: (supplierId: string) => void;
  onEdit?: (supplier: Supplier) => void;
}

// Common dialog props
export interface DeleteConfirmationDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
}

// Form Data Types
export interface PurchaseFormData {
  id: string;
  storeId: string;
  date: string;
  totalGrams: number; // Always in 21k equivalent (calculated automatically)
  suppliers: Record<string, {
    grams18k: number;
    grams21k: number;
    totalGrams21k: number;
  }>;
  totalFees: number;
  totalDiscount: number;
  netFees: number;
  status: string;
}

export interface PaymentFormData {
  id: string;
  feesPaid: number;
  gramsPaid: number;
  date: string;
  karatType: KaratType;
  note: string; // Changed from 'notes' to 'note' to match Payment interface
}

export interface StoreFormData {
  name: string;
  code: string;
  isActive: boolean;
  progressBarConfig: ProgressBarConfig;
}

export interface SupplierFormData {
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

export interface PurchaseSummaryData {
  totalGrams: number;
  netFees: number;
  totalFees: number;
  totalDiscount: number;
}

// Re-export types that might be used in components
export type { DiscountTier } from './dataTypes';
