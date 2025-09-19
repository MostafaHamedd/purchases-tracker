import { StoreCardProps } from '@/data/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function StoreCard({ store, onDelete, onEdit }: StoreCardProps) {
  return (
    <View style={styles.storeCard}>
      <View style={styles.storeCardContent}>
        <View style={styles.storeCardHeader}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeCode}>{store.code}</Text>
          </View>
          <View style={styles.storeCardActions}>
            <View style={[styles.statusBadge, { backgroundColor: store.isActive ? '#34D399' : '#EF4444' }]}>
              <Text style={styles.statusText}>{store.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
            <View style={styles.actionButtons}>
              {onEdit && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => onEdit(store)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => onDelete(store.id)}
                >
                  <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.storeDetails}>
          <Text style={styles.storeDetailsTitle}>Store Details</Text>
          <View style={styles.storeDetailsGrid}>
            <View style={styles.storeDetailItem}>
              <Text style={styles.storeDetailLabel}>Created</Text>
              <Text style={styles.storeDetailValue}>
                {new Date(store.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  storeCardContent: {
    padding: 20,
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeCode: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  storeAddress: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  storeCardActions: {
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
    fontWeight: 'bold',
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
  storeDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  storeDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  storeDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  storeDetailItem: {
    flex: 1,
    minWidth: 120,
  },
  storeDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  storeDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});
