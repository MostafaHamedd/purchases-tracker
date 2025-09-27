import { ApiResponse, apiService, SearchParams } from './apiService';

// Purchase data types matching the API
export interface ApiPurchase {
  id: string;
  date: string;
  store_id: string;
  status: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  total_grams_21k_equivalent: number;
  total_base_fees: number;
  total_discount_amount: number;
  total_net_fees: number;
  due_date: string;
  created_at: string;
  updated_at: string;
  // Additional fields from API response
  store_name?: string;
  store_code?: string;
}

export interface CreatePurchaseData {
  id: string;
  date: string;
  store_id: string;
  supplier_id: string;
  total_grams_21k_equivalent: number;
  total_base_fees: number;
  total_discount_amount: number;
  total_net_fees: number;
  due_date: string;
  receipts?: any[]; // Array of receipt objects
}

export interface UpdatePurchaseData extends Partial<CreatePurchaseData> {
  status?: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
}

export interface PurchasesSearchParams extends SearchParams {
  store_id?: string;
  status?: 'Paid' | 'Pending' | 'Partial' | 'Overdue';
  date_from?: string;
  date_to?: string;
}

// Purchase Supplier data types
export interface ApiPurchaseSupplier {
  id: string;
  purchase_id: string;
  supplier_code: string;
  grams_18k: number;
  grams_21k: number;
  total_grams_21k_equivalent: number;
}

export interface CreatePurchaseSupplierData {
  purchase_id: string;
  supplier_code: string;
  grams_18k: number;
  grams_21k: number;
  total_grams_21k_equivalent: number;
}

class PurchasesApiService {
  private readonly endpoint = '/purchases';
  private readonly purchaseSuppliersEndpoint = '/purchase-suppliers';

  // Get all purchases (with optional filters)
  async getPurchases(params?: PurchasesSearchParams): Promise<ApiResponse<ApiPurchase[]>> {
    return apiService.get<ApiPurchase[]>(this.endpoint, params);
  }

  // Get all purchases with discount verification
  async getPurchasesWithDiscountVerification(params?: PurchasesSearchParams): Promise<ApiResponse<ApiPurchase[]>> {
    const verifyParams = { ...params, verify_discounts: 'true' };
    return apiService.get<ApiPurchase[]>(this.endpoint, verifyParams);
  }

  // Get purchase by ID
  async getPurchaseById(id: string): Promise<ApiResponse<ApiPurchase>> {
    return apiService.get<ApiPurchase>(`${this.endpoint}/${id}`);
  }

  // Create new purchase
  async createPurchase(data: CreatePurchaseData): Promise<ApiResponse<ApiPurchase>> {
    return apiService.post<ApiPurchase>(this.endpoint, data);
  }

  // Update purchase
  async updatePurchase(id: string, data: UpdatePurchaseData): Promise<ApiResponse<ApiPurchase>> {
    return apiService.put<ApiPurchase>(`${this.endpoint}/${id}`, data);
  }

  // Delete purchase
  async deletePurchase(id: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  // Purchase Suppliers methods
  async getPurchaseSuppliers(purchaseId: string): Promise<ApiResponse<ApiPurchaseSupplier[]>> {
    return apiService.get<ApiPurchaseSupplier[]>(this.purchaseSuppliersEndpoint, { purchase_id: purchaseId });
  }

  async createPurchaseSupplier(data: CreatePurchaseSupplierData): Promise<ApiResponse<ApiPurchaseSupplier>> {
    return apiService.post<ApiPurchaseSupplier>(this.purchaseSuppliersEndpoint, data);
  }

  async updatePurchaseSupplier(id: string, data: Partial<CreatePurchaseSupplierData>): Promise<ApiResponse<ApiPurchaseSupplier>> {
    return apiService.put<ApiPurchaseSupplier>(`${this.purchaseSuppliersEndpoint}/${id}`, data);
  }

  async deletePurchaseSupplier(id: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.purchaseSuppliersEndpoint}/${id}`);
  }

  // Purchase Receipts methods
  async createBulkPurchaseReceipts(purchaseId: string, receipts: any[]): Promise<ApiResponse<any[]>> {
    return apiService.post<any[]>(`/purchase-receipts/bulk`, { purchase_id: purchaseId, receipts });
  }

  async getPurchaseReceipts(purchaseId: string): Promise<ApiResponse<any[]>> {
    return apiService.get<any[]>(`/purchase-receipts/purchase/${purchaseId}`);
  }
}

export const purchasesApiService = new PurchasesApiService();
