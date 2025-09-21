import { ApiResponse, apiService, SearchParams } from './apiService';

// Discount Tier data types matching the API
export interface DiscountTier {
  id: string;
  supplier_id: string;
  karat_type: '18' | '21';
  name: string;
  threshold: number;
  discount_percentage: number;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountTierData {
  id: string;
  supplier_id: string;
  karat_type: '18' | '21';
  name: string;
  threshold: number;
  discount_percentage: number;
  is_protected: boolean;
}

export interface UpdateDiscountTierData {
  name?: string;
  threshold?: number;
  discount_percentage?: number;
  is_protected?: boolean;
}

export interface DiscountTiersSearchParams extends SearchParams {
  supplier?: string;
  karat_type?: '18' | '21';
}

class DiscountTiersApiService {
  // Get all discount tiers
  async getDiscountTiers(params?: DiscountTiersSearchParams): Promise<ApiResponse<DiscountTier[]>> {
    return apiService.get<DiscountTier[]>('/discount-tiers', params);
  }

  // Get discount tier by ID
  async getDiscountTierById(id: string): Promise<ApiResponse<DiscountTier>> {
    return apiService.get<DiscountTier>(`/discount-tiers/${id}`);
  }

  // Create new discount tier
  async createDiscountTier(tierData: CreateDiscountTierData): Promise<ApiResponse<DiscountTier>> {
    return apiService.post<DiscountTier>('/discount-tiers', tierData);
  }

  // Update discount tier
  async updateDiscountTier(id: string, tierData: UpdateDiscountTierData): Promise<ApiResponse<DiscountTier>> {
    return apiService.put<DiscountTier>(`/discount-tiers/${id}`, tierData);
  }

  // Delete discount tier
  async deleteDiscountTier(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/discount-tiers/${id}`);
  }

  // Get discount tiers for a specific supplier
  async getDiscountTiersBySupplier(supplierId: string, params?: Omit<DiscountTiersSearchParams, 'supplier'>): Promise<ApiResponse<DiscountTier[]>> {
    return this.getDiscountTiers({ ...params, supplier: supplierId });
  }

  // Get discount tiers for a specific karat type
  async getDiscountTiersByKaratType(karatType: '18' | '21', params?: Omit<DiscountTiersSearchParams, 'karat_type'>): Promise<ApiResponse<DiscountTier[]>> {
    return this.getDiscountTiers({ ...params, karat_type: karatType });
  }

  // Get discount tiers for a specific supplier and karat type
  async getDiscountTiersBySupplierAndKarat(supplierId: string, karatType: '18' | '21'): Promise<ApiResponse<DiscountTier[]>> {
    return this.getDiscountTiers({ supplier: supplierId, karat_type: karatType });
  }

  // Search discount tiers by name
  async searchDiscountTiers(query: string, params?: Omit<DiscountTiersSearchParams, 'search'>): Promise<ApiResponse<DiscountTier[]>> {
    return this.getDiscountTiers({ ...params, search: query });
  }
}

// Create singleton instance
export const discountTiersApiService = new DiscountTiersApiService();

// Export types
export type { CreateDiscountTierData, DiscountTier, DiscountTiersSearchParams, UpdateDiscountTierData };
