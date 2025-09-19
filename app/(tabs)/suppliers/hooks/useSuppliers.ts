import { refreshEvents } from '@/data';
import { Supplier } from '@/data/types';
import { useEffect, useState } from 'react';

// Mock data - this will be replaced with API calls
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Egyptian Gold 18K',
    code: 'EG18',
    karatType: '18',
    discountTiers: [
      { id: 'tier1', name: 'Standard', threshold: 0, discountPercentage: 20, isProtected: true },
      { id: 'tier2', name: 'Premium', threshold: 500, discountPercentage: 26, isProtected: true },
      { id: 'tier3', name: 'VIP', threshold: 1000, discountPercentage: 34, isProtected: true },
    ],
    isActive: true,
  },
  {
    id: '2',
    name: 'Egyptian Gold 21K',
    code: 'EG21',
    karatType: '21',
    discountTiers: [
      { id: 'tier1', name: 'Basic', threshold: 0, discountPercentage: 15, isProtected: true },
      { id: 'tier2', name: 'Advanced', threshold: 750, discountPercentage: 20, isProtected: true },
      { id: 'tier3', name: 'Elite', threshold: 1500, discountPercentage: 23, isProtected: true },
    ],
    isActive: true,
  },
  {
    id: '3',
    name: 'Egyptian Silver 18K',
    code: 'ES18',
    karatType: '18',
    discountTiers: [
      { id: 'tier1', name: 'Regular', threshold: 0, discountPercentage: 5, isProtected: true },
      { id: 'tier2', name: 'Plus', threshold: 300, discountPercentage: 8, isProtected: true },
      { id: 'tier3', name: 'Max', threshold: 600, discountPercentage: 10, isProtected: true },
    ],
    isActive: true,
  },
];

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [refreshKey, setRefreshKey] = useState(0);

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
    };
    
    setSuppliers(prev => [...prev, newSupplier]);
    refreshEvents.emit('supplier-updated');
  };

  const updateSupplier = (supplierId: string, supplierData: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === supplierId 
        ? { ...supplier, ...supplierData }
        : supplier
    ));
    refreshEvents.emit('supplier-updated');
  };

  const deleteSupplier = (supplierId: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
    refreshEvents.emit('supplier-updated');
  };

  const refreshSuppliers = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Listen to refresh events
  useEffect(() => {
    const handleSupplierUpdated = () => {
      setRefreshKey(prev => prev + 1);
    };

    refreshEvents.on('supplier-updated', handleSupplierUpdated);

    return () => {
      refreshEvents.off('supplier-updated', handleSupplierUpdated);
    };
  }, []);

  return {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refreshSuppliers,
  };
}
