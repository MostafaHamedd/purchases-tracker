import { PaymentCardProps } from '@/data/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PaymentCard({ payment, onEdit, onDelete }: PaymentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{payment.date}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Grams Paid:</Text>
          <Text style={styles.amountValue}>{payment.gramsPaid}g</Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Fees Paid:</Text>
          <Text style={styles.amountValue}>EGP {payment.feesPaid.toLocaleString()}</Text>
        </View>
        {payment.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Note:</Text>
            <Text style={styles.noteText}>{payment.note}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteText: {
    color: '#EF4444',
  },
  content: {
    gap: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  noteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
});