import { EditPaymentDialogProps } from '@/data/types';
import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles/EditPaymentDialogStyles';

export function EditPaymentDialog({ visible, onClose, onSubmit }: EditPaymentDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Edit Payment</Text>
          <Text style={styles.message}>Edit payment dialog will be implemented here</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={() => onSubmit({
              id: '',
              feesPaid: 0,
              gramsPaid: 0,
              date: new Date().toISOString().split('T')[0],
              karatType: '21' as const,
              note: ''
            })}>
              <Text style={styles.submitText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}