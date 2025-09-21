# Purchases Page Backend Documentation

## Overview

This document outlines the complete backend requirements for the Purchases page functionality in the Receipt Tracker application. The system handles complex multi-receipt purchases with multiple suppliers, discount calculations, and payment tracking.

## Core Features

- **Multi-Supplier Purchases**: Each purchase can involve multiple suppliers
- **Multi-Receipt System**: Each supplier can have multiple receipts within a single purchase
- **Karat Conversion**: Automatic conversion between 18k and 21k gold (18k = 18/21 of 21k)
- **Dynamic Discounts**: Discount rates based on supplier tiers and monthly totals
- **Payment Tracking**: Multiple payments per purchase with different karat types
- **Status Management**: Purchase status based on payment progress and due dates

## Database Schema

### 1. STORES Table
```sql
CREATE TABLE stores (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    progress_bar_config JSON NOT NULL, -- {blue: 15, yellow: 5, orange: 5, red: 5}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Stores where purchases are made (e.g., Main Store Downtown, Branch Store Heliopolis)

**Sample Data**:
```json
{
  "id": "1",
  "name": "Main Store - Downtown",
  "code": "MSD",
  "is_active": true,
  "progress_bar_config": {"blue": 15, "yellow": 5, "orange": 5, "red": 5}
}
```

### 2. SUPPLIERS Table
```sql
CREATE TABLE suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Purpose**: Gold suppliers with unique codes (e.g., EGS, PGS, SGS)

**Sample Data**:
```json
{
  "id": "1",
  "name": "Egyptian Gold Supplier",
  "code": "EGS",
  "is_active": true
}
```

### 3. DISCOUNT_TIERS Table
```sql
CREATE TABLE discount_tiers (
    id VARCHAR(50) PRIMARY KEY,
    supplier_id VARCHAR(50) NOT NULL,
    karat_type ENUM('18', '21') NOT NULL,
    name VARCHAR(100) NOT NULL,
    threshold DECIMAL(10,2) NOT NULL, -- Minimum grams for this tier
    discount_percentage DECIMAL(5,2) NOT NULL, -- Discount percentage (0-100)
    is_protected BOOLEAN DEFAULT false, -- Main tiers cannot be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_supplier_karat_threshold (supplier_id, karat_type, threshold)
);
```

**Purpose**: Discount tiers for each supplier and karat type

**Sample Data**:
```json
{
  "id": "tier1",
  "supplier_id": "1",
  "karat_type": "21",
  "name": "Basic",
  "threshold": 0,
  "discount_percentage": 15,
  "is_protected": true
}
```

### 4. PURCHASES Table
```sql
CREATE TABLE purchases (
    id VARCHAR(50) PRIMARY KEY,
    store_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    status ENUM('Paid', 'Pending', 'Partial', 'Overdue') DEFAULT 'Pending',
    total_grams_21k_equivalent DECIMAL(10,2) NOT NULL, -- Sum of all suppliers
    total_base_fees DECIMAL(12,2) NOT NULL, -- Sum of all suppliers
    total_discount_amount DECIMAL(12,2) NOT NULL, -- Sum of all suppliers
    total_net_fees DECIMAL(12,2) NOT NULL, -- Sum of all suppliers
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT
);
```

**Purpose**: Main purchase records with aggregated totals

**Sample Data**:
```json
{
  "id": "PUR-001",
  "store_id": "1",
  "date": "2025-01-15",
  "status": "Pending",
  "total_grams_21k_equivalent": 500.00,
  "total_base_fees": 2500.00,
  "total_discount_amount": 10000.00,
  "total_net_fees": -7500.00,
  "due_date": "2025-02-15"
}
```

### 5. PURCHASE_SUPPLIERS Table
```sql
CREATE TABLE purchase_suppliers (
    id VARCHAR(50) PRIMARY KEY,
    purchase_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    total_grams_18k DECIMAL(10,2) DEFAULT 0, -- Sum of all receipts
    total_grams_21k DECIMAL(10,2) DEFAULT 0, -- Sum of all receipts
    total_grams_21k_equivalent DECIMAL(10,2) NOT NULL, -- Sum of all receipts
    total_base_fees DECIMAL(12,2) NOT NULL, -- Sum of all receipts
    total_discount_amount DECIMAL(12,2) NOT NULL, -- Sum of all receipts
    total_net_fees DECIMAL(12,2) NOT NULL, -- Sum of all receipts
    receipt_count INT NOT NULL DEFAULT 0, -- Number of receipts for this supplier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_purchase_supplier (purchase_id, supplier_id)
);
```

**Purpose**: Aggregated data per supplier per purchase

**Sample Data**:
```json
{
  "id": "PS-001",
  "purchase_id": "PUR-001",
  "supplier_id": "1",
  "total_grams_18k": 300.00,
  "total_grams_21k": 50.00,
  "total_grams_21k_equivalent": 307.14,
  "total_base_fees": 1500.00,
  "total_discount_amount": 6142.80,
  "total_net_fees": -4642.80,
  "receipt_count": 2
}
```

### 6. PURCHASE_RECEIPTS Table (KEY TABLE)
```sql
CREATE TABLE purchase_receipts (
    id VARCHAR(50) PRIMARY KEY,
    purchase_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    receipt_number INT NOT NULL, -- 1, 2, 3, etc. per supplier
    grams_18k DECIMAL(10,2) DEFAULT 0,
    grams_21k DECIMAL(10,2) DEFAULT 0,
    total_grams_21k DECIMAL(10,2) NOT NULL, -- Calculated: grams_21k + (grams_18k * 18/21)
    base_fees DECIMAL(12,2) NOT NULL, -- Fees entered for this receipt
    discount_rate DECIMAL(5,2) NOT NULL, -- EGP per gram discount
    discount_amount DECIMAL(12,2) NOT NULL, -- Calculated: total_grams_21k * discount_rate
    net_fees DECIMAL(12,2) NOT NULL, -- Calculated: base_fees - discount_amount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_purchase_supplier_receipt (purchase_id, supplier_id, receipt_number)
);
```

**Purpose**: Individual receipts within a purchase for each supplier

**Sample Data**:
```json
{
  "id": "REC-001",
  "purchase_id": "PUR-001",
  "supplier_id": "1",
  "receipt_number": 1,
  "grams_18k": 100.00,
  "grams_21k": 50.00,
  "total_grams_21k": 135.71,
  "base_fees": 500.00,
  "discount_rate": 20.00,
  "discount_amount": 2714.20,
  "net_fees": -2214.20
}
```

### 7. PAYMENTS Table
```sql
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    purchase_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    grams_paid DECIMAL(10,2) NOT NULL, -- In original karat (18k or 21k)
    fees_paid DECIMAL(12,2) NOT NULL,
    karat_type ENUM('18', '21') NOT NULL, -- Track original karat for payment
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);
```

**Purpose**: Payment records for purchases

**Sample Data**:
```json
{
  "id": "PAY-001",
  "purchase_id": "PUR-001",
  "date": "2025-01-20",
  "grams_paid": 100.00,
  "fees_paid": 1000.00,
  "karat_type": "21",
  "note": "First payment installment"
}
```

## Business Logic

### 1. 21k Equivalent Calculation
```sql
-- Formula: grams_21k + (grams_18k * 18/21)
UPDATE purchase_receipts 
SET total_grams_21k = grams_21k + (grams_18k * 18/21);
```

### 2. Discount Calculation
```sql
-- Formula: total_grams_21k * discount_rate
UPDATE purchase_receipts 
SET discount_amount = total_grams_21k * discount_rate;
```

### 3. Net Fees Calculation
```sql
-- Formula: base_fees - discount_amount
UPDATE purchase_receipts 
SET net_fees = base_fees - discount_amount;
```

### 4. Monthly Discount Logic
- When total monthly grams ≥ 1000g, maximum discounts are applied
- Discount rates are determined by supplier tiers based on total grams
- Monthly totals are calculated across all purchases in the same month

### 5. Status Calculation
- **Paid**: All fees and grams are fully paid
- **Pending**: No payments made yet
- **Partial**: Some payments made but not complete
- **Overdue**: Due date has passed and not fully paid

## API Endpoints

### Purchases
```javascript
// Get all purchases with filters
GET /api/purchases?store=STORE_ID&search=QUERY&status=STATUS&page=1&limit=20

// Get single purchase with full details
GET /api/purchases/:purchaseId

// Create new purchase
POST /api/purchases
{
  "store_id": "1",
  "date": "2025-01-15",
  "due_date": "2025-02-15",
  "suppliers": [
    {
      "supplier_id": "1",
      "receipts": [
        {
          "grams_18k": 100,
          "grams_21k": 50,
          "base_fees": 500
        },
        {
          "grams_18k": 200,
          "grams_21k": 0,
          "base_fees": 1000
        }
      ]
    }
  ]
}

// Update purchase
PUT /api/purchases/:purchaseId

// Delete purchase
DELETE /api/purchases/:purchaseId
```

### Receipts
```javascript
// Get all receipts for a purchase
GET /api/purchases/:purchaseId/receipts

// Get receipts for a specific supplier in a purchase
GET /api/purchases/:purchaseId/suppliers/:supplierId/receipts

// Add new receipt to a supplier
POST /api/purchases/:purchaseId/suppliers/:supplierId/receipts
{
  "grams_18k": 100,
  "grams_21k": 50,
  "base_fees": 500
}

// Update receipt
PUT /api/receipts/:receiptId

// Delete receipt
DELETE /api/receipts/:receiptId
```

### Payments
```javascript
// Get payments for a purchase
GET /api/purchases/:purchaseId/payments

// Add payment to purchase
POST /api/purchases/:purchaseId/payments
{
  "date": "2025-01-20",
  "grams_paid": 100,
  "fees_paid": 1000,
  "karat_type": "21",
  "note": "First payment"
}

// Update payment
PUT /api/payments/:paymentId

// Delete payment
DELETE /api/payments/:paymentId
```

### Stores
```javascript
// Get all stores
GET /api/stores

// Get single store
GET /api/stores/:storeId
```

### Suppliers
```javascript
// Get all suppliers with discount tiers
GET /api/suppliers

// Get single supplier with discount tiers
GET /api/suppliers/:supplierId
```

## Data Flow Example

### Creating a Purchase with Multiple Receipts

1. **Input Data**:
```json
{
  "store_id": "1",
  "date": "2025-01-15",
  "suppliers": [
    {
      "supplier_id": "EGS",
      "receipts": [
        {"grams_18k": 100, "grams_21k": 50, "base_fees": 500},
        {"grams_18k": 200, "grams_21k": 0, "base_fees": 1000}
      ]
    },
    {
      "supplier_id": "PGS", 
      "receipts": [
        {"grams_18k": 0, "grams_21k": 300, "base_fees": 1500}
      ]
    }
  ]
}
```

2. **Processing Steps**:
   - Calculate 21k equivalent for each receipt
   - Determine discount rates based on supplier tiers
   - Calculate discount amounts and net fees
   - Aggregate totals per supplier
   - Aggregate totals per purchase
   - Determine purchase status

3. **Output Data**:
```json
{
  "purchase": {
    "id": "PUR-001",
    "total_grams_21k_equivalent": 500.00,
    "total_base_fees": 3000.00,
    "total_discount_amount": 10000.00,
    "total_net_fees": -7000.00,
    "status": "Pending"
  },
  "suppliers": [
    {
      "supplier_id": "EGS",
      "total_grams_21k_equivalent": 307.14,
      "total_net_fees": -4642.80,
      "receipt_count": 2
    },
    {
      "supplier_id": "PGS",
      "total_grams_21k_equivalent": 300.00,
      "total_net_fees": -3000.00,
      "receipt_count": 1
    }
  ]
}
```

## Key Considerations

1. **Data Integrity**: Use transactions when creating purchases with multiple receipts
2. **Performance**: Index frequently queried fields (purchase_id, supplier_id, date)
3. **Calculations**: Store calculated values to avoid real-time computation
4. **Audit Trail**: Track all changes with created_at/updated_at timestamps
5. **Validation**: Ensure receipt numbers are sequential per supplier
6. **Monthly Aggregation**: Consider caching monthly totals for performance

## Sample Queries

### Get Purchase with All Details
```sql
SELECT 
    p.*,
    s.name as store_name,
    s.code as store_code
FROM purchases p
JOIN stores s ON p.store_id = s.id
WHERE p.id = 'PUR-001';
```

### Get Receipts for a Purchase
```sql
SELECT 
    pr.*,
    sup.code as supplier_code,
    sup.name as supplier_name
FROM purchase_receipts pr
JOIN suppliers sup ON pr.supplier_id = sup.id
WHERE pr.purchase_id = 'PUR-001'
ORDER BY pr.supplier_id, pr.receipt_number;
```

### Get Monthly Totals by Supplier
```sql
SELECT 
    s.code as supplier_code,
    SUM(ps.total_grams_21k_equivalent) as total_grams,
    SUM(ps.total_net_fees) as total_net_fees
FROM purchase_suppliers ps
JOIN purchases p ON ps.purchase_id = p.id
JOIN suppliers s ON ps.supplier_id = s.id
WHERE YEAR(p.date) = 2025 AND MONTH(p.date) = 1
GROUP BY s.id, s.code;
```

This documentation provides a complete foundation for implementing the Purchases page backend with proper receipt handling, discount calculations, and payment tracking.
