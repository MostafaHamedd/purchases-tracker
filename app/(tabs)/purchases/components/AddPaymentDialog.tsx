import { AddPaymentDialogProps } from '@/data/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from './styles/AddPaymentDialogStyles';

export function AddPaymentDialog({ visible, onClose, onSubmit, purchase }: AddPaymentDialogProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    feesPaid: '',
    gramsPaid: '',
    date: new Date(),
    note: '' // Changed from 'notes' to 'note' to match PaymentFormData interface
  });

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const feesPaid = parseFloat(formData.feesPaid) || 0;
    const gramsPaid = parseFloat(formData.gramsPaid) || 0;
    
    // Check if at least one payment type is entered
    if (feesPaid === 0 && gramsPaid === 0) {
      errors.payment = 'Please enter either fees paid or grams paid (or both).';
    }
    
    // Validate fees paid is a valid number
    if (formData.feesPaid && (isNaN(feesPaid) || feesPaid < 0)) {
      errors.feesPaid = 'Please enter a valid amount for fees paid.';
    }
    
    // Validate grams paid is a valid number
    if (formData.gramsPaid && (isNaN(gramsPaid) || gramsPaid < 0)) {
      errors.gramsPaid = 'Please enter a valid amount for grams paid.';
    }

    // Validate grams payment doesn't exceed total grams due
    if (purchase && gramsPaid > 0 && gramsPaid > purchase.totalGrams) {
      errors.gramsPaid = `Cannot pay more grams (${gramsPaid}g) than total due (${purchase.totalGrams}g).`;
    }
    
    // Validate date is selected
    if (!formData.date) {
      errors.date = 'Please select a payment date.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      const firstError = Object.values(validationErrors)[0];
      Alert.alert('❌ Validation Error', firstError);
      return;
    }

    const paymentData = {
      id: Date.now().toString(),
      feesPaid: parseFloat(formData.feesPaid) || 0,
      gramsPaid: parseFloat(formData.gramsPaid) || 0,
      date: `${formData.date.getFullYear()}-${String(formData.date.getMonth() + 1).padStart(2, '0')}-${String(formData.date.getDate()).padStart(2, '0')}`, // Format: YYYY-MM-DD
      karatType: '21' as const, // Default to 21k for now
      note: formData.note || '' // Ensure note is always a string, not undefined
    };

    console.log('💳 AddPaymentDialog paymentData:', paymentData);
    console.log('💳 Form data:', formData);

    onSubmit(paymentData);
    setFormData({
      feesPaid: '',
      gramsPaid: '',
      date: new Date(),
      note: '' // Changed from 'notes' to 'note'
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
                  <Text style={[styles.summaryValue, { color: '#EF4444', fontWeight: '700' }]}>{purchase.totalGrams}g</Text>
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

            <Text style={styles.sectionTitle}>Select Payment Date *</Text>
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

            <Text style={styles.sectionTitle}>Fees Paid (EGP) *</Text>
            <TextInput
              style={[
                styles.totalGramsInput, 
                { fontSize: 14 },
                validationErrors.feesPaid && styles.errorInput
              ]}
              value={formData.feesPaid}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, feesPaid: text }));
                // Clear validation error when user starts typing
                if (validationErrors.feesPaid) {
                  setValidationErrors(prev => ({ ...prev, feesPaid: '' }));
                }
              }}
              placeholder="Enter the amount paid in EGP (e.g., 5000)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {validationErrors.feesPaid && (
              <Text style={styles.errorText}>{validationErrors.feesPaid}</Text>
            )}
            {formData.feesPaid && (
              <View style={styles.paymentHint}>
                <Text style={styles.hintText}>
                  💰 You're paying EGP {parseFloat(formData.feesPaid) || 0} in fees
                </Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Grams Paid *</Text>
            <TextInput
              style={[
                styles.totalGramsInput, 
                { fontSize: 14 },
                validationErrors.gramsPaid && styles.errorInput
              ]}
              value={formData.gramsPaid}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, gramsPaid: text }));
                // Clear validation error when user starts typing
                if (validationErrors.gramsPaid) {
                  setValidationErrors(prev => ({ ...prev, gramsPaid: '' }));
                }
              }}
              placeholder="Enter the weight of gold paid in grams (e.g., 100)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {validationErrors.gramsPaid && (
              <Text style={styles.errorText}>{validationErrors.gramsPaid}</Text>
            )}
            {purchase && (
              <Text style={styles.validationHint}>
                Max: {purchase.totalGrams}g (cannot exceed total due)
              </Text>
            )}
            
            {/* General payment validation error */}
            {validationErrors.payment && (
              <View style={styles.generalErrorContainer}>
                <Text style={styles.errorText}>{validationErrors.payment}</Text>
              </View>
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
              value={formData.note}
              onChangeText={(text) => setFormData(prev => ({ ...prev, note: text }))}
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