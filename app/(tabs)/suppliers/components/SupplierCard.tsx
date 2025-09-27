import { SupplierCardProps } from '@/data/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function SupplierCard({ supplier, onDelete, onEdit }: SupplierCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.supplierInfo}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <View style={styles.supplierCodeRow}>
              <Text style={styles.supplierCode}>{supplier.code}</Text>
              <View style={styles.karatBadges}>
                <View style={[styles.karatBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.karatText}>21K</Text>
                </View>
                <View style={[styles.karatBadge, { backgroundColor: supplier.supplierKaratType === '18' ? '#F59E0B' : '#10B981' }]}>
                  <Text style={styles.karatText}>{supplier.supplierKaratType}K</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <View style={[styles.statusBadge, { backgroundColor: supplier.isActive ? '#34D399' : '#EF4444' }]}>
              <Text style={styles.statusText}>{supplier.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => onEdit(supplier)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => onDelete(supplier.id)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.discountTiers}>
          <Text style={styles.discountTiersTitle}>Discount Tiers</Text>
          <View style={styles.tiersContainer}>
            {/* 21k Tiers (All discount tiers are for 21k gold equivalent) */}
            {supplier.karat21.isActive && (
              <View style={styles.karatSection}>
                <Text style={styles.karatTitle}>21k Gold Equivalent</Text>
                <View style={styles.tiersRow}>
                  {supplier.karat21.discountTiers
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((tier) => (
                      <View key={`21k-${tier.id}`} style={styles.tier}>
                        <Text style={styles.tierLabel}>{tier.name}</Text>
                        <Text style={styles.tierThreshold}>≥{tier.threshold}g</Text>
                        <Text style={styles.tierValue}>{tier.discountPercentage}%</Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  supplierCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supplierCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  karatBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  karatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  karatText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  editButtonText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#EF4444',
  },
  discountTiers: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
  },
  discountTiersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  tiersContainer: {
    gap: 16,
  },
  karatSection: {
    marginBottom: 12,
  },
  karatTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tiersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tier: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tierLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  tierThreshold: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
    fontWeight: '400',
  },
  tierValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
