import { mockStores as initialMockStores, refreshEvents } from '@/data';
import { Store } from '@/data/types';
import { useState } from 'react';

export type { Store };

export function useStores() {
  const [stores, setStores] = useState<Store[]>(initialMockStores);

  const addStore = (storeData: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStore: Store = {
      ...storeData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setStores(prev => [...prev, newStore]);
    refreshEvents.emit('store-updated');
  };

  const updateStore = (storeId: string, storeData: Partial<Store>) => {
    setStores(prev => prev.map(store => 
      store.id === storeId 
        ? { ...store, ...storeData, updatedAt: new Date().toISOString() }
        : store
    ));
    refreshEvents.emit('store-updated');
  };

  const deleteStore = (storeId: string) => {
    setStores(prev => prev.filter(store => store.id !== storeId));
    refreshEvents.emit('store-updated');
  };

  const refreshStores = () => {
    // In a real app, this would fetch from API
    setStores([...initialMockStores]);
  };

  return {
    stores,
    addStore,
    updateStore,
    deleteStore,
    refreshStores,
  };
}
