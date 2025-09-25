import { SupplierReceiptCardProps } from '@/data/types';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles/SupplierReceiptCardStyles';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';

export function SupplierReceiptCard({ suppliers }: SupplierReceiptCardProps) {
  const { suppliers: apiSuppliers } = useSuppliers();
  
  // Debug logging
  console.log('🏪 SupplierReceiptCard received suppliers:', suppliers);
  console.log('🏪 SupplierReceiptCard suppliers keys:', Object.keys(suppliers || {}));
  
  // Function to get the correct discount rate based on supplier and grams
  const getDiscountRate = (supplierCode: string, grams: number) => {
    const supplier = apiSuppliers.find(s => s.code === supplierCode);
    if (!supplier) return 0;
    
    // Use 21k discount tiers since we're working with 21k equivalent
    const tiers = supplier.karat21.discountTiers;
    
    // Find the appropriate tier based on grams
    let applicableTier = tiers[0]; // Default to first tier
    for (const tier of tiers) {
      if (grams >= tier.threshold) {
        applicableTier = tier;
      } else {
        break;
      }
    }
    
    return applicableTier.discountPercentage;
  };

  // Filter suppliers that have receipts (grams > 0)
  const suppliersWithReceipts = Object.entries(suppliers).filter(([supplierCode, supplierData]) => {
    const hasReceipts = supplierData && supplierData.totalGrams21k > 0;
    console.log(`🏪 Supplier ${supplierCode}:`, supplierData, `hasReceipts: ${hasReceipts}`);
    return hasReceipts;
  });
  
  console.log('🏪 Suppliers with receipts:', suppliersWithReceipts);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supplier Receipts</Text>
      <View style={styles.content}>
        {suppliersWithReceipts.length > 0 ? (
          suppliersWithReceipts.map(([supplierCode, supplierData]) => {
          // Use totalGrams21k for calculations (already converted to 21k equivalent)
          const grams = Math.round(supplierData.totalGrams21k * 10) / 10; // Round to 1 decimal place
          const baseFee = grams * 5; // 5 EGP per gram base fee
          const discountRate = getDiscountRate(supplierCode, grams); // Get discount rate from supplier configuration
          const discount = grams * discountRate;
          const netFee = baseFee - discount;
          
          return (
            <View key={supplierCode} style={styles.supplierCard}>
              <Text style={styles.supplierName}>{supplierCode}</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>18k Grams:</Text>
                <Text style={styles.value}>{supplierData.grams18k}g</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>21k Grams:</Text>
                <Text style={styles.value}>{supplierData.grams21k}g</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.label}>Total (21k equivalent):</Text>
                <Text style={[styles.value, styles.totalValue]}>{grams}g</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>Base Fee:</Text>
                <Text style={styles.value}>EGP {baseFee.toLocaleString()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>Discount ({discountRate} EGP/g):</Text>
                <Text style={[styles.value, styles.greenText]}>-EGP {discount.toLocaleString()}</Text>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>Net Fee:</Text>
                <Text style={[styles.value, styles.greenText]}>-EGP {netFee.toLocaleString()}</Text>
              </View>
            </View>
          );
        })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No supplier receipts found</Text>
          </View>
        )}
      </View>
    </View>
  );
}