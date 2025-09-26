# Monthly Discount System Documentation

## Overview

This system implements a **monthly threshold-based discount system** where discounts are calculated based on the total 21k equivalent grams purchased in the current month across all suppliers, with each supplier having their own specific thresholds and discount rates.

## Key Features

### 1. **Monthly Total Calculation**
- Calculates total 21k equivalent grams for the current month
- Includes all suppliers and all purchases in the month
- Automatically converts 18k to 21k equivalent (18k × 0.857 = 21k equivalent)

### 2. **Supplier-Specific Thresholds**
- Each supplier has their own discount thresholds (low/medium/high)
- Each supplier has their own discount rates for each tier
- Stored in database for easy configuration

### 3. **Database-Driven Calculations**
- Uses stored procedures for complex calculations
- Reduces frontend business logic complexity
- Ensures consistency and reduces errors

## Database Schema Changes

### 1. **Suppliers Table Enhancement**
```sql
ALTER TABLE suppliers 
ADD COLUMN discount_thresholds JSON NOT NULL DEFAULT '{"low": 0, "medium": 500, "high": 1000}',
ADD COLUMN discount_rates JSON NOT NULL DEFAULT '{"low": 0, "medium": 5, "high": 10}';
```

### 2. **Monthly Totals View**
```sql
CREATE OR REPLACE VIEW monthly_totals AS
SELECT 
    DATE_FORMAT(p.date, '%Y-%m') as month_year,
    SUM(
        CASE 
            WHEN pr.karat_type = '18' THEN pr.grams_18k * 0.857
            WHEN pr.karat_type = '21' THEN pr.grams_21k
            ELSE 0
        END
    ) as total_grams_21k_equivalent,
    COUNT(DISTINCT p.id) as total_purchases,
    COUNT(pr.id) as total_receipts
FROM purchases p
JOIN purchase_receipts pr ON p.id = pr.purchase_id
WHERE p.date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(p.date, '%Y-%m')
ORDER BY month_year DESC;
```

### 3. **Discount Calculation Stored Procedure**
```sql
CREATE PROCEDURE CalculateDiscount(
    IN p_purchase_id VARCHAR(50),
    IN p_supplier_id VARCHAR(50),
    IN p_grams DECIMAL(10,2),
    IN p_karat_type ENUM('18', '21'),
    OUT p_discount_rate DECIMAL(5,2),
    OUT p_discount_amount DECIMAL(10,2)
)
```

## API Endpoints

### 1. **Get Current Month Total**
```
GET /api/monthly-totals/current
```
Returns:
```json
{
  "success": true,
  "data": {
    "total_grams_21k_equivalent": 1250.5,
    "total_purchases": 15,
    "total_receipts": 45
  }
}
```

### 2. **Get Monthly History**
```
GET /api/monthly-totals/history
```
Returns:
```json
{
  "success": true,
  "data": [
    {
      "month_year": "2024-09",
      "total_grams_21k_equivalent": 1250.5,
      "total_purchases": 15,
      "total_receipts": 45
    }
  ]
}
```

### 3. **Calculate Receipt Discount**
```
POST /api/monthly-totals/calculate-discount
```
Request:
```json
{
  "purchaseId": "123",
  "supplierId": "456",
  "grams": 100.5,
  "karatType": "21"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "discountRate": 8.5,
    "discountAmount": 8.54
  }
}
```

## Frontend Integration

### 1. **Service Usage**
```typescript
import { monthlyTotalsApiService } from '@/data/services/monthlyTotalsApiService';

// Get current month total
const currentMonth = await monthlyTotalsApiService.getCurrentMonthTotal();

// Calculate discount for a receipt
const discount = await monthlyTotalsApiService.calculateReceiptDiscount({
  purchaseId: '123',
  supplierId: '456',
  grams: 100.5,
  karatType: '21'
});
```

### 2. **Business Logic Functions**
```typescript
import { calculateReceiptDiscountFromDB, getCurrentMonthTotalFromDB } from '@/data/business/businessLogic';

// Calculate discount using database
const { discountRate, discountAmount } = await calculateReceiptDiscountFromDB(
  purchaseId, supplierId, grams, karatType
);

// Get current month total
const monthlyTotal = await getCurrentMonthTotalFromDB();
```

## How It Works

### 1. **Monthly Total Calculation**
1. Query all purchases in the current month
2. Sum all 21k equivalent grams (convert 18k to 21k equivalent)
3. This total is used for all supplier threshold comparisons

### 2. **Discount Calculation for Each Receipt**
1. Get the monthly total (21k equivalent)
2. Get supplier's discount thresholds and rates
3. Determine tier based on monthly total vs supplier thresholds
4. Apply the appropriate discount rate to the receipt

### 3. **Example Scenario**
- **Monthly Total**: 1,200 grams (21k equivalent)
- **Supplier ES18**: Thresholds {low: 0, medium: 750, high: 1000}
- **Result**: ES18 gets "high" tier discount (10 EGP/gram)
- **Supplier EG18**: Thresholds {low: 0, medium: 500, high: 1000}  
- **Result**: EG18 gets "high" tier discount (34 EGP/gram)

## Benefits

### 1. **Reduced Business Logic Complexity**
- Database handles complex calculations
- Frontend just calls API endpoints
- Consistent calculations across all clients

### 2. **Easy Configuration**
- Supplier thresholds stored in database
- Can be updated without code changes
- Different thresholds per supplier

### 3. **Performance**
- Database views for fast monthly totals
- Stored procedures for efficient calculations
- Cached results where appropriate

### 4. **Error Reduction**
- Single source of truth in database
- Consistent karat conversion logic
- Automatic 21k equivalent calculations

## Migration Steps

1. **Run Database Migrations**
   ```bash
   mysql -u username -p database_name < database/migrations/add_supplier_discount_thresholds.sql
   mysql -u username -p database_name < database/views/monthly_totals.sql
   mysql -u username -p database_name < database/procedures/calculate_discount.sql
   ```

2. **Update Backend**
   - Add new routes to server.js
   - Test API endpoints

3. **Update Frontend**
   - Use new API service functions
   - Replace old business logic with database calls

4. **Test System**
   - Verify monthly totals calculation
   - Test discount calculations
   - Ensure backward compatibility

## Configuration Examples

### Supplier ES18
```json
{
  "discount_thresholds": {"low": 0, "medium": 750, "high": 1000},
  "discount_rates": {"low": 5, "medium": 8, "high": 10}
}
```

### Supplier EG18
```json
{
  "discount_thresholds": {"low": 0, "medium": 500, "high": 1000},
  "discount_rates": {"low": 20, "medium": 26, "high": 34}
}
```

### Supplier EG21
```json
{
  "discount_thresholds": {"low": 0, "medium": 600, "high": 1200},
  "discount_rates": {"low": 15, "medium": 20, "high": 23}
}
```

This system provides a robust, database-driven approach to discount calculations that reduces complexity and errors while providing flexibility for different supplier configurations.
