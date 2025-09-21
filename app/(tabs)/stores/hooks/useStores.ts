import { refreshEvents } from '@/data';
import { mockStores } from '@/data/mockData';
import { Store as ApiStore, CreateStoreData, storesApiService, UpdateStoreData } from '@/data/services/storesApiService';
import { Store } from '@/data/types';
import { useCallback, useEffect, useState } from 'react';

export type { Store };

// Convert API store to app store format
const convertApiStoreToAppStore = (apiStore: ApiStore): Store => ({
  id: apiStore.id,
  name: apiStore.name,
  code: apiStore.code,
  isActive: apiStore.is_active,
  progressBarConfig: apiStore.progress_bar_config,
  createdAt: apiStore.created_at,
  updatedAt: apiStore.updated_at,
});

// Convert app store to API store format
const convertAppStoreToApiStore = (appStore: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): CreateStoreData => ({
  id: Date.now().toString(), // Generate ID for new stores
  name: appStore.name,
  code: appStore.code,
  is_active: appStore.isActive,
  progress_bar_config: appStore.progressBarConfig,
});

export function useStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stores from API
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching stores from API...');
      const response = await storesApiService.getActiveStores();
      
      if (response.success) {
        console.log('✅ API stores loaded:', response.data);
        const convertedStores = response.data.map(convertApiStoreToAppStore);
        setStores(convertedStores);
      } else {
        // Fallback to mock data if API fails
        console.warn('⚠️ Stores API not available, falling back to mock data');
        console.log('📦 Mock stores:', mockStores);
        setStores(mockStores);
        setError(null); // Clear error since we have fallback data
      }
    } catch (err) {
      console.error('❌ Error fetching stores:', err);
      // Fallback to mock data if API fails
      console.warn('⚠️ Stores API not available, falling back to mock data');
      console.log('📦 Mock stores:', mockStores);
      setStores(mockStores);
      setError(null); // Clear error since we have fallback data
    } finally {
      setLoading(false);
    }
  }, []);

  // Load stores on mount
  useEffect(() => {
    // Temporary: Force fallback to mock data for testing
    console.log('🚀 Forcing mock stores for testing...');
    setStores(mockStores);
    setLoading(false);
    setError(null);
    
    // Uncomment this line to test API again:
    // fetchStores();
  }, [fetchStores]);

  const addStore = async (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const apiStoreData = convertAppStoreToApiStore(storeData);
      const response = await storesApiService.createStore(apiStoreData);
      
      if (response.success) {
        const newStore = convertApiStoreToAppStore(response.data);
        setStores(prev => [...prev, newStore]);
        refreshEvents.emit('store-updated');
        return { success: true };
      } else {
        setError('Failed to create store');
        return { success: false, error: 'Failed to create store' };
      }
    } catch (err) {
      console.error('Error creating store:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create store';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateStore = async (storeId: string, storeData: Partial<Store>) => {
    try {
      setError(null);
      const updateData: UpdateStoreData = {};
      
      if (storeData.name !== undefined) updateData.name = storeData.name;
      if (storeData.code !== undefined) updateData.code = storeData.code;
      if (storeData.isActive !== undefined) updateData.is_active = storeData.isActive;
      if (storeData.progressBarConfig !== undefined) updateData.progress_bar_config = storeData.progressBarConfig;

      const response = await storesApiService.updateStore(storeId, updateData);
      
      if (response.success) {
        const updatedStore = convertApiStoreToAppStore(response.data);
        setStores(prev => prev.map(store => 
          store.id === storeId ? updatedStore : store
        ));
        refreshEvents.emit('store-updated');
        return { success: true };
      } else {
        setError('Failed to update store');
        return { success: false, error: 'Failed to update store' };
      }
    } catch (err) {
      console.error('Error updating store:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update store';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      setError(null);
      const response = await storesApiService.deleteStore(storeId);
      
      if (response.success) {
        setStores(prev => prev.filter(store => store.id !== storeId));
        refreshEvents.emit('store-updated');
        return { success: true };
      } else {
        // Extract detailed error message from backend response
        let errorMessage = response.error || response.message || 'Failed to delete store';
        
        // Make error message more user-friendly
        if (errorMessage.includes('foreign key constraint') || errorMessage.includes('Cannot delete')) {
          errorMessage = '⚠️ This store cannot be deleted because it has active purchases.\n\nTo delete this store, you must first:\n• Delete all purchases from this store, OR\n• Transfer purchases to another store';
        }
        
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Error deleting store:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete store';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshStores = () => {
    fetchStores();
  };

  // Debug logging for stores state
  console.log('🏪 useStores hook state:', {
    storesCount: stores.length,
    stores: stores.map(s => ({ id: s.id, code: s.code, name: s.name })),
    loading,
    error
  });

  return {
    stores,
    loading,
    error,
    addStore,
    updateStore,
    deleteStore,
    refreshStores,
  };
}
