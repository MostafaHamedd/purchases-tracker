import { AddPaymentDialogProps } from '@/data/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function AddPaymentDialog({ visible, onClose, onSubmit, purchase }: AddPaymentDialogProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    feesPaid: '',
    gramsPaid: '',
    date: new Date(),
    notes: ''
  });

  const handleSubmit = () => {
    if (!formData.feesPaid && !formData.gramsPaid) {
      Alert.alert('Error', 'Please enter either fees or grams paid');
      return;
    }

    // Validate grams payment doesn't exceed total grams due
    if (purchase && formData.gramsPaid) {
      const gramsPaid = parseFloat(formData.gramsPaid) || 0;
      if (gramsPaid > purchase.totalGrams) {
        Alert.alert('Validation Error', `Cannot pay more grams (${gramsPaid}g) than total due (${purchase.totalGrams}g)`);
        return;
      }
    }

    const paymentData = {
      id: Date.now().toString(),
      feesPaid: parseFloat(formData.feesPaid) || 0,
      gramsPaid: parseFloat(formData.gramsPaid) || 0,
      date: formData.date.toISOString().split('T')[0],
      notes: formData.notes
    };

    onSubmit(paymentData);
    setFormData({
      feesPaid: '',
      gramsPaid: '',
      date: new Date(),
      notes: ''
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Purchase Summary */}
            {purchase && (
              <View style={styles.purchaseSummary}>
                <Text style={styles.summaryTitle}>Payment Due Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Grams Due:</Text>
                  <Text style={styles.summaryValue}>{purchase.totalGrams}g</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fees:</Text>
                  <Text style={styles.summaryValue}>EGP {purchase.totalFees.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>EGP {purchase.totalDiscount.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Fees Due:</Text>
                  <Text style={[styles.summaryValue, styles.netFeesValue]}>EGP {purchase.netFees.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Select Payment Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.datePickerButtonText}>
                {formData.date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="spinner"
                  textColor="#000000"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, date: selectedDate }));
                    }
                  }}
                />
                <TouchableOpacity 
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>Fees Paid (EGP)</Text>
            <TextInput
              style={[styles.totalGramsInput, { fontSize: 14 }]}
              value={formData.feesPaid}
              onChangeText={(text) => setFormData(prev => ({ ...prev, feesPaid: text }))}
              placeholder="Enter the amount paid in EGP (e.g., 5000)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {formData.feesPaid && (
              <View style={styles.paymentHint}>
                <Text style={styles.hintText}>
                  💰 You're paying EGP {parseFloat(formData.feesPaid) || 0} in fees
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Grams Paid</Text>
            <TextInput
              style={[styles.totalGramsInput, { fontSize: 14 }]}
              value={formData.gramsPaid}
              onChangeText={(text) => setFormData(prev => ({ ...prev, gramsPaid: text }))}
              placeholder="Enter the weight of gold paid in grams (e.g., 100)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {purchase && (
              <Text style={styles.validationHint}>
                Max: {purchase.totalGrams}g (cannot exceed total due)
              </Text>
            )}
            {formData.gramsPaid && (
              <View style={styles.paymentHint}>
                <Text style={styles.hintText}>
                  ⚖️ You're paying {parseFloat(formData.gramsPaid) || 0}g of gold
                  {purchase && parseFloat(formData.gramsPaid) > purchase.totalGrams && (
                    <Text style={styles.errorText}> - Exceeds total due!</Text>
                  )}
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Note (Optional)</Text>
            <TextInput
              style={[styles.totalGramsInput, styles.notesInput, { fontSize: 14 }]}
              value={formData.notes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
              placeholder="Add payment details or reference..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={3}
            />

            {(formData.feesPaid || formData.gramsPaid) && (
              <View style={styles.paymentSummary}>
                <Text style={styles.summaryTitle}>Payment Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fees Paid:</Text>
                  <Text style={[styles.summaryValue, { color: formData.feesPaid ? '#10B981' : '#6B7280' }]}>
                    {formData.feesPaid ? `EGP ${parseFloat(formData.feesPaid).toLocaleString()}` : 'None'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Grams Paid:</Text>
                  <Text style={[styles.summaryValue, { color: formData.gramsPaid ? '#10B981' : '#6B7280' }]}>
                    {formData.gramsPaid ? `${parseFloat(formData.gramsPaid)}g` : 'None'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment Date:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Add Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 400,
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: 500,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  datePickerDoneButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  totalGramsInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#1F2937',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  paymentHint: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  hintText: {
    fontSize: 12,
    color: '#1E40AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  purchaseSummary: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  paymentSummary: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  discountValue: {
    color: '#10B981',
  },
  netFeesValue: {
    color: '#1F2937',
    fontWeight: '700',
  },
  validationHint: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});