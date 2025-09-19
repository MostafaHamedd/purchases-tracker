import { SupplierReceiptCardProps } from '@/data/types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SupplierReceiptCard({ suppliers }: SupplierReceiptCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supplier Receipts</Text>
      <View style={styles.content}>
        {Object.entries(suppliers).map(([supplier, grams]) => {
          const baseFee = grams * 5; // 5 EGP per gram base fee
          const discountRate = supplier === 'ES18' ? 10 : supplier === 'EG18' ? 34 : 23;
          const discount = grams * discountRate;
          const netFee = baseFee - discount;
          
          return (
            <View key={supplier} style={styles.supplierCard}>
              <Text style={styles.supplierName}>{supplier}</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>Grams:</Text>
                <Text style={styles.value}>{grams}g</Text>
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
        })}
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
  greenText: {
    color: '#10B981',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
});
