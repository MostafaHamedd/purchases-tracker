import { ApiResponse, apiService, SearchParams } from './apiService';

// Supplier data types matching the API
export interface Supplier {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

export interface UpdateSupplierData {
  name?: string;
  code?: string;
  is_active?: boolean;
}

export interface SuppliersSearchParams extends SearchParams {
  is_active?: boolean;
}

class SuppliersApiService {
  // Get all suppliers
  async getSuppliers(params?: SuppliersSearchParams): Promise<ApiResponse<Supplier[]>> {
    return apiService.get<Supplier[]>('/suppliers', params);
  }

  // Get supplier by ID
  async getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
    return apiService.get<Supplier>(`/suppliers/${id}`);
  }

  // Create new supplier
  async createSupplier(supplierData: CreateSupplierData): Promise<ApiResponse<Supplier>> {
    return apiService.post<Supplier>('/suppliers', supplierData);
  }

  // Update supplier
  async updateSupplier(id: string, supplierData: UpdateSupplierData): Promise<ApiResponse<Supplier>> {
    return apiService.put<Supplier>(`/suppliers/${id}`, supplierData);
  }

  // Delete supplier
  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/suppliers/${id}`);
  }

  // Search suppliers by name or code
  async searchSuppliers(query: string, params?: Omit<SuppliersSearchParams, 'search'>): Promise<ApiResponse<Supplier[]>> {
    return this.getSuppliers({ ...params, search: query });
  }

  // Get active suppliers only
  async getActiveSuppliers(params?: Omit<SuppliersSearchParams, 'is_active'>): Promise<ApiResponse<Supplier[]>> {
    return this.getSuppliers({ ...params, is_active: true });
  }
}

// Create singleton instance
export const suppliersApiService = new SuppliersApiService();

// Export types
export type { CreateSupplierData, Supplier, SuppliersSearchParams, UpdateSupplierData };
