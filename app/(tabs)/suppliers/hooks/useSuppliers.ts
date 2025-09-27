import { refreshEvents } from '@/data';
import { DiscountTier as ApiDiscountTier, discountTiersApiService } from '@/data/services/discountTiersApiService';
import { Supplier as ApiSupplier, CreateSupplierData, suppliersApiService, UpdateSupplierData } from '@/data/services/suppliersApiService';
import { DiscountTier, Supplier } from '@/data/types';
import { useCallback, useEffect, useState } from 'react';

export type { Supplier };

// Convert API discount tier to app discount tier format
const convertApiDiscountTierToAppDiscountTier = (apiTier: ApiDiscountTier): DiscountTier => ({
  id: String(apiTier.id || ''),
  name: String(apiTier.name || ''),
  threshold: Number(apiTier.threshold || 0),
  discountPercentage: Math.round((Number(apiTier.discount_percentage || 0) * 100) * 100) / 100, // Convert decimal to percentage with proper rounding (0.1 -> 10.00)
  isProtected: Boolean(apiTier.is_protected)
});

// Convert API supplier to app supplier format
const convertApiSupplierToAppSupplier = (apiSupplier: ApiSupplier, discountTiers: ApiDiscountTier[] = []): Supplier => {
  // Only 21k discount tiers are supported now
  const tiers21k = discountTiers.filter(tier => tier.karat_type === '21');

  return {
    id: String(apiSupplier.id || ''),
    name: String(apiSupplier.name || ''),
    code: String(apiSupplier.code || ''),
    supplierKaratType: (apiSupplier.supplier_karat_type as '18' | '21') || '21', // Default to 21k if not specified
    isActive: Boolean(apiSupplier.is_active),
    karat21: {
      discountTiers: tiers21k.map(convertApiDiscountTierToAppDiscountTier),
      isActive: tiers21k.length > 0
    }
  };
};

// Convert app supplier to API supplier format
const convertAppSupplierToApiSupplier = (appSupplier: Omit<Supplier, 'id'>): CreateSupplierData => ({
  id: Date.now().toString(), // Generate ID for new suppliers
  name: appSupplier.name,
  code: appSupplier.code,
  supplier_karat_type: appSupplier.supplierKaratType,
  is_active: appSupplier.isActive,
});

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch suppliers from API
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch suppliers
      const suppliersResponse = await suppliersApiService.getActiveSuppliers();
      
      if (suppliersResponse.success) {
        // Fetch discount tiers for all suppliers
        const discountTiersResponse = await discountTiersApiService.getDiscountTiers();
        
        if (discountTiersResponse.success) {
          // Group discount tiers by supplier ID
          const tiersBySupplier = discountTiersResponse.data.reduce((acc, tier) => {
            if (!acc[tier.supplier_id]) {
              acc[tier.supplier_id] = [];
            }
            acc[tier.supplier_id].push(tier);
            return acc;
          }, {} as Record<string, ApiDiscountTier[]>);

          // Convert suppliers with their discount tiers
          const convertedSuppliers = suppliersResponse.data.map(supplier => 
            convertApiSupplierToAppSupplier(supplier, tiersBySupplier[supplier.id] || [])
          );
          
          setSuppliers(convertedSuppliers);
        } else {
          // If discount tiers fail, still show suppliers without tiers
          const convertedSuppliers = suppliersResponse.data.map(supplier => 
            convertApiSupplierToAppSupplier(supplier, [])
          );
          setSuppliers(convertedSuppliers);
          console.warn('Failed to fetch discount tiers, showing suppliers without tiers');
        }
      } else {
        setError('Failed to fetch suppliers');
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      setError(null);
      const apiSupplierData = convertAppSupplierToApiSupplier(supplierData);
      const response = await suppliersApiService.createSupplier(apiSupplierData);
      
      if (response.success) {
        const newSupplier = convertApiSupplierToAppSupplier(response.data);
        setSuppliers(prev => [...prev, newSupplier]);
        refreshEvents.emit('supplier-updated');
        return { success: true };
      } else {
        setError('Failed to create supplier');
        return { success: false, error: 'Failed to create supplier' };
      }
    } catch (err) {
      console.error('Error creating supplier:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create supplier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const updateSupplier = async (supplierId: string, supplierData: Partial<Supplier>) => {
    try {
      setError(null);
      const updateData: UpdateSupplierData = {};
      
      if (supplierData.name !== undefined) updateData.name = supplierData.name;
      if (supplierData.code !== undefined) updateData.code = supplierData.code;
      if (supplierData.isActive !== undefined) updateData.is_active = supplierData.isActive;

      const response = await suppliersApiService.updateSupplier(supplierId, updateData);
      
      if (response.success) {
        // Update discount tiers if provided
        if (supplierData.karat21?.discountTiers) {
          await updateDiscountTiers(supplierId, supplierData);
        }
        
        // Refresh suppliers to get updated data
        await fetchSuppliers();
        refreshEvents.emit('supplier-updated');
        return { success: true };
      } else {
        setError('Failed to update supplier');
        return { success: false, error: 'Failed to update supplier' };
      }
    } catch (err) {
      console.error('Error updating supplier:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update supplier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Function to get fresh supplier data for editing
  const getSupplierForEdit = async (supplierId: string): Promise<Supplier | null> => {
    try {
      // Fetch fresh data from API
      const suppliersResponse = await suppliersApiService.getActiveSuppliers();
      
      if (suppliersResponse.success) {
        // Fetch discount tiers for all suppliers
        const discountTiersResponse = await discountTiersApiService.getDiscountTiers();
        
        if (discountTiersResponse.success) {
          // Group discount tiers by supplier ID
          const tiersBySupplier = discountTiersResponse.data.reduce((acc, tier) => {
            if (!acc[tier.supplier_id]) {
              acc[tier.supplier_id] = [];
            }
            acc[tier.supplier_id].push(tier);
            return acc;
          }, {} as Record<string, ApiDiscountTier[]>);

          // Find the specific supplier
          const supplier = suppliersResponse.data.find(s => s.id === supplierId);
          
          if (supplier) {
            const convertedSupplier = convertApiSupplierToAppSupplier(supplier, tiersBySupplier[supplier.id] || []);
            console.log('Converted supplier for edit:', convertedSupplier);
            return convertedSupplier;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching fresh supplier data:', error);
      return null;
    }
  };

  // Helper function to update discount tiers
  const updateDiscountTiers = async (supplierId: string, supplierData: Partial<Supplier>) => {
    try {
      // Update 21k tiers (only 21k supported now)
      if (supplierData.karat21?.discountTiers) {
        for (const tier of supplierData.karat21.discountTiers) {
          // Check if this is a new tier (frontend-generated ID) or existing tier (database ID)
          // New tiers have IDs like "tier1", "tier2", etc. (from addTier function)
          // Existing tiers have IDs like "tier-003", "tier-004", etc. (from database)
          const isNewTier = tier.id.match(/^tier\d+$/); // Matches "tier1", "tier2", etc.
          
          if (isNewTier) {
            // New tier - create it
            await discountTiersApiService.createDiscountTier({
              id: tier.id, // Include the ID for new tiers
              supplier_id: supplierId,
              karat_type: '21',
              name: tier.name,
              threshold: tier.threshold,
              discount_percentage: Math.round((tier.discountPercentage / 100) * 10000) / 10000, // Convert percentage to decimal with proper rounding
              is_protected: tier.isProtected || false
            });
          } else {
            // Existing tier - update it
            await discountTiersApiService.updateDiscountTier(tier.id, {
              name: tier.name,
              threshold: tier.threshold,
              discount_percentage: Math.round((tier.discountPercentage / 100) * 10000) / 10000, // Convert percentage to decimal with proper rounding
              is_protected: tier.isProtected
            });
          }
        }
      }
    } catch (err) {
      console.error('Error updating discount tiers:', err);
      throw err;
    }
  };

  const deleteSupplier = async (supplierId: string) => {
    try {
      setError(null);
      const response = await suppliersApiService.deleteSupplier(supplierId);
      
      if (response.success) {
        setSuppliers(prev => prev.filter(supplier => supplier.id !== supplierId));
        refreshEvents.emit('supplier-updated');
        return { success: true };
      } else {
        // Extract detailed error message from backend response
        let errorMessage = response.error || response.message || 'Failed to delete supplier';
        
        // Make error message more user-friendly
        if (errorMessage.includes('foreign key constraint') || errorMessage.includes('Cannot delete')) {
          errorMessage = '⚠️ This supplier cannot be deleted because it has active data.\n\nTo delete this supplier, you must first:\n• Delete all purchases from this supplier, AND\n• Remove all discount tiers for this supplier';
        }
        
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Error deleting supplier:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete supplier';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const refreshSuppliers = () => {
    fetchSuppliers();
  };

  return {
    suppliers,
    loading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refreshSuppliers,
    getSupplierForEdit,
  };
}
