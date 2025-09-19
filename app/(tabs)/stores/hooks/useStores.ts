import { refreshEvents } from '@/data';
import { Store } from '@/data/types';
import { useState } from 'react';

// Mock data for stores
const mockStores: Store[] = [
  {
    id: '1',
    name: 'Main Store - Downtown',
    code: 'MSD',
    isActive: true,
    progressBarConfig: {
      red: 5,
      orange: 10,
      yellow: 15,
      green: 20,
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Branch Store - Heliopolis',
    code: 'BSH',
    isActive: true,
    progressBarConfig: {
      red: 3,
      orange: 7,
      yellow: 12,
      green: 18,
    },
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '3',
    name: 'Branch Store - Nasr City',
    code: 'BSN',
    isActive: false,
    progressBarConfig: {
      red: 7,
      orange: 14,
      yellow: 21,
      green: 28,
    },
    createdAt: '2024-02-15T09:15:00Z',
    updatedAt: '2024-03-01T16:45:00Z',
  },
];

export function useStores() {
  const [stores, setStores] = useState<Store[]>(mockStores);

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
    setStores([...mockStores]);
  };

  return {
    stores,
    addStore,
    updateStore,
    deleteStore,
    refreshStores,
  };
}
