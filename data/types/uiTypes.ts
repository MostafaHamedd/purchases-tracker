// UI and filter-related types

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
