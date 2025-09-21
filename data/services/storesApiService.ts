import { ApiResponse, apiService, SearchParams } from './apiService';

// Store data types matching the API
export interface Store {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  progress_bar_config: {
    blue: number;
    yellow: number;
    orange: number;
    red: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateStoreData {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  progress_bar_config: {
    blue: number;
    yellow: number;
    orange: number;
    red: number;
  };
}

export interface UpdateStoreData {
  name?: string;
  code?: string;
  is_active?: boolean;
  progress_bar_config?: {
    blue: number;
    yellow: number;
    orange: number;
    red: number;
  };
}

export interface StoresSearchParams extends SearchParams {
  is_active?: boolean;
}

class StoresApiService {
  // Get all stores
  async getStores(params?: StoresSearchParams): Promise<ApiResponse<Store[]>> {
    return apiService.get<Store[]>('/stores', params);
  }

  // Get store by ID
  async getStoreById(id: string): Promise<ApiResponse<Store>> {
    return apiService.get<Store>(`/stores/${id}`);
  }

  // Create new store
  async createStore(storeData: CreateStoreData): Promise<ApiResponse<Store>> {
    return apiService.post<Store>('/stores', storeData);
  }

  // Update store
  async updateStore(id: string, storeData: UpdateStoreData): Promise<ApiResponse<Store>> {
    return apiService.put<Store>(`/stores/${id}`, storeData);
  }

  // Delete store
  async deleteStore(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/stores/${id}`);
  }

  // Search stores by name or code
  async searchStores(query: string, params?: Omit<StoresSearchParams, 'search'>): Promise<ApiResponse<Store[]>> {
    return this.getStores({ ...params, search: query });
  }

  // Get active stores only
  async getActiveStores(params?: Omit<StoresSearchParams, 'is_active'>): Promise<ApiResponse<Store[]>> {
    return this.getStores({ ...params, is_active: true });
  }
}

// Create singleton instance
export const storesApiService = new StoresApiService();

// Export types
export type { CreateStoreData, Store, StoresSearchParams, UpdateStoreData };

