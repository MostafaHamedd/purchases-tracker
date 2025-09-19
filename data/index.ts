// Main data module exports
// This file provides a clean API for all data operations
// When switching to real APIs, only this file needs to be updated

// Types
export * from './types';

// Constants
export * from './constants';

// Utilities
export * from './utils';

// Business Logic
export * from './business';

// Services (main API)
export * from './services';

// Legacy exports for backward compatibility
export { 
  getMockPurchases as mockPurchases,
  getCurrentMonthTotalGrams,
  getDiscountRate,
  shouldApplyDiscount,
  generatePurchaseId,
  generatePaymentId,
  calculateBaseFee,
  calculateDiscountAmount,
  calculateNetFee,
  calculateDueDate,
  calculatePurchaseBaseFees,
  calculatePurchaseTotalDiscount,
  calculatePurchaseFees
} from './business';

export {
  APP_CONFIG as availableSuppliers,
  APP_CONFIG as availableStores,
  APP_CONFIG as BASE_FEE_PER_GRAM,
  APP_CONFIG as DEFAULT_PAYMENT_TERMS_DAYS,
  APP_CONFIG as discountRates,
  APP_CONFIG as MONTHLY_DISCOUNT_THRESHOLDS
} from './constants';

export {
  getStatusColor,
  formatDate,
  formatCurrency,
  getDaysLeft,
  getDaysLeftText,
  getProgressBarColor,
  calculateStatus,
  debugDates
} from './utils';

// Re-export services for easy access
export { PurchaseService, PaymentService, AnalyticsService } from './services';

// Re-export recalculation service
export { RecalculationService, recalculateCurrentMonth, recalculateAfterPaymentChange, recalculateAfterPurchaseChange } from './services/recalculationService';

// Re-export refresh events
export { refreshEvents, emitPurchaseUpdated, emitPaymentAdded, emitPaymentDeleted, emitSupplierUpdated, emitStoreUpdated } from './services/refreshEvents';

// Mock Data
export * from './mockData';
