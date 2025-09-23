// API-related types for requests, responses, and service operations

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Request types for API calls
export interface CreatePurchaseRequest {
  date: string;
  storeId: string;
  supplierId: string;
  suppliers: { [key: string]: { grams18k: number; grams21k: number; totalGrams21k: number } };
}

export interface CreatePaymentRequest {
  purchaseId: string;
  date: string;
  gramsPaid: number;
  feesPaid: number;
  note?: string;
}

export interface UpdatePurchaseRequest {
  id: string;
  date?: string;
  store?: 'Store A' | 'Store B';
  suppliers?: { [key: string]: number };
}

// Service return types
export interface PaymentTotals {
  gramsPaid: number;
  feesPaid: number;
}

export interface RemainingAmounts {
  gramsDue: number;
  feesDue: number;
}

export interface PaymentValidation {
  valid: boolean;
  error?: string;
}

export interface PurchaseStats {
  totalPurchases: number;
  totalGrams: number;
  totalFees: number;
  totalPaid: number;
  pendingAmount: number;
  overdueCount: number;
}

export interface MonthlyTrends {
  currentMonth: { grams: number; fees: number; purchases: number };
  previousMonth: { grams: number; fees: number; purchases: number };
}

export interface PurchaseFees {
  totalFees: number;
  totalDiscount: number;
  baseFees: number;
}
