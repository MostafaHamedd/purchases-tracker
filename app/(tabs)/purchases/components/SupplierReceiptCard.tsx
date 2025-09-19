import { mockSuppliers } from '@/data/mockData';
import { SupplierReceiptCardProps } from '@/data/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SupplierReceiptCard({ suppliers }: SupplierReceiptCardProps) {
  // Function to get the correct discount rate based on supplier and grams
  const getDiscountRate = (supplierCode: string, grams: number) => {
    const supplier = mockSuppliers.find(s => s.code === supplierCode);
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
    return supplierData && supplierData.totalGrams21k > 0;
  });

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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  supplierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  totalValue: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  greenText: {
    color: '#10B981',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
