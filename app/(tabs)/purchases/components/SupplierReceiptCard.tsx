import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SupplierReceiptCardProps {
  suppliers: { [key: string]: number };
}

export function SupplierReceiptCard({ suppliers }: SupplierReceiptCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Suppliers</Text>
      <View style={styles.content}>
        {Object.entries(suppliers).map(([supplier, grams]) => (
          <View key={supplier} style={styles.supplierRow}>
            <Text style={styles.supplierName}>{supplier}:</Text>
            <Text style={styles.supplierGrams}>{grams}g</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  supplierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  supplierName: {
    fontSize: 16,
    color: '#6B7280',
  },
  supplierGrams: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
