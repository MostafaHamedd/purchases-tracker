import { useState, useEffect } from 'react';
import { refreshEvents } from '@/data';

export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data for stores
const mockStores: Store[] = [
  {
    id: '1',
    name: 'Main Store - Downtown',
    code: 'MSD',
    address: '123 Main Street, Downtown, Cairo',
    phone: '+20 2 1234 5678',
    email: 'downtown@store.com',
    manager: 'Ahmed Hassan',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Branch Store - Heliopolis',
    code: 'BSH',
    address: '456 Heliopolis Square, Heliopolis, Cairo',
    phone: '+20 2 2345 6789',
    email: 'heliopolis@store.com',
    manager: 'Fatma Ali',
    isActive: true,
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: '3',
    name: 'Branch Store - Nasr City',
    code: 'BSN',
    address: '789 Nasr City Plaza, Nasr City, Cairo',
    phone: '+20 2 3456 7890',
    email: 'nasrcity@store.com',
    manager: 'Omar Mahmoud',
    isActive: false,
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
