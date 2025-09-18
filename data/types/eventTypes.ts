// Event and system-related types
import { Purchase } from './dataTypes';

// Refresh Events
export type RefreshEventType = 'purchase-updated' | 'payment-added' | 'payment-deleted' | 'supplier-updated' | 'store-updated';
export type RefreshEventListener = () => void;

// Recalculation Service Types
export interface RecalculationOptions {
  purchases: Purchase[];
  targetMonth?: number;
  targetYear?: number;
}

export interface RecalculationResult {
  updatedPurchases: Purchase[];
  monthlyTotalGrams: number;
  discountEligible: boolean;
}
