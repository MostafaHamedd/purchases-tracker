import { mockSuppliers as initialMockSuppliers, refreshEvents } from '@/data';
import { Supplier } from '@/data/types';
import { useEffect, useState } from 'react';

export type { Supplier };

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialMockSuppliers);
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
