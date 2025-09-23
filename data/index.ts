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
    calculateBaseFee,
    calculateDiscountAmount, calculateDueDate, calculateNetFee, calculatePurchaseBaseFees, calculatePurchaseFees, calculatePurchaseTotalDiscount, generatePaymentId, generatePurchaseId, getCurrentMonthTotalGrams,
    getDiscountRate, shouldApplyDiscount
} from './business';

export {
    APP_CONFIG as BASE_FEE_PER_GRAM,
    APP_CONFIG as DEFAULT_PAYMENT_TERMS_DAYS, APP_CONFIG as MONTHLY_DISCOUNT_THRESHOLDS, APP_CONFIG as availableStores, APP_CONFIG as availableSuppliers, APP_CONFIG as discountRates
} from './constants';

export {
    calculateStatus,
    debugDates, formatCurrency, formatDate, getDaysLeft,
    getDaysLeftText,
    getProgressBarColor, getStatusColor
} from './utils';

// Re-export services for easy access
export { AnalyticsService, HistoryService, PaymentService, PurchaseService } from './services';

// Re-export recalculation service
export { RecalculationService, recalculateAfterPaymentChange, recalculateAfterPurchaseChange, recalculateCurrentMonth } from './services/recalculationService';

// Re-export refresh events
export { emitPaymentAdded, emitPaymentDeleted, emitPurchaseUpdated, emitStoreUpdated, emitSupplierUpdated, refreshEvents } from './services/refreshEvents';

// Mock Data - REMOVED - Using API only
