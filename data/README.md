# Data Layer Architecture

This directory contains the organized data layer for the Receipt Tracker app. The structure is designed to be easily replaceable with real API calls in the future.

## File Structure

### `types.ts`
- Core TypeScript interfaces and types
- API request/response types for future API integration
- Filter and search types

### `constants.ts`
- Application configuration constants
- Available suppliers, stores, discount rates
- Status colors and thresholds
- All magic numbers and configuration values

### `utils.ts`
- Pure utility functions
- Date formatting and calculations
- Status calculations
- Progress bar logic
- No business logic, just helper functions

### `businessLogic.ts`
- Core business calculations
- Discount calculations
- Fee calculations
- Mock data storage (temporary)
- ID generation functions

### `services.ts`
- Main service classes for data operations
- `PurchaseService` - CRUD operations for purchases
- `PaymentService` - Payment operations and validation
- `AnalyticsService` - Statistics and reporting
- This is where API calls will be implemented

### `index.ts`
- Main export file
- Provides clean API for all data operations
- Legacy exports for backward compatibility
- Single point of change when switching to APIs

## Usage

```typescript
// Import everything you need from the main data module
import { 
  PurchaseService, 
  PaymentService, 
  AnalyticsService,
  formatCurrency,
  calculateStatus 
} from '@/data';

// Use services for data operations
const purchases = PurchaseService.getAllPurchases();
const purchase = PurchaseService.getPurchaseById('1');
const stats = AnalyticsService.getPurchaseStats();
```

## Migration to Real APIs

When ready to switch to real APIs:

1. **Update `services.ts`** - Replace mock data operations with actual API calls
2. **Update `businessLogic.ts`** - Move mock data to a separate file or remove entirely
3. **Update `index.ts`** - Remove legacy exports if no longer needed
4. **No changes needed** in components - they use the service layer

## Benefits

- **Separation of Concerns**: Each file has a single responsibility
- **Easy Testing**: Services can be easily mocked for testing
- **API Ready**: Clear structure for API integration
- **Type Safety**: Full TypeScript support throughout
- **Maintainable**: Easy to find and modify specific functionality
- **Scalable**: Easy to add new services and features

## Service Methods

### PurchaseService
- `getAllPurchases()` - Get all purchases
- `getPurchaseById(id)` - Get single purchase
- `createPurchase(data)` - Create new purchase
- `updatePurchase(id, updates)` - Update purchase
- `deletePurchase(id)` - Delete purchase
- `filterPurchases(filters)` - Filter purchases

### PaymentService
- `addPayment(purchaseId, paymentData)` - Add payment
- `getPayments(purchaseId)` - Get payment history
- `getPaymentTotals(purchaseId)` - Get payment totals
- `getRemainingAmounts(purchaseId)` - Get remaining amounts
- `validatePayment(purchaseId, grams, fees)` - Validate payment
- `deletePayment(purchaseId, paymentId)` - Delete payment

### AnalyticsService
- `getPurchaseStats()` - Get overall statistics
- `getMonthlyTrends()` - Get monthly trends
