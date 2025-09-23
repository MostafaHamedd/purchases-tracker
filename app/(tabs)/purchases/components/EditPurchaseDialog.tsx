import { calculateDueDate, shouldApplyDiscount } from '@/data/business';
import { EditPurchaseDialogProps } from '@/data/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function EditPurchaseDialog({ visible, onClose, onSubmit, purchase }: EditPurchaseDialogProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    totalGrams: '',
    totalFees: '',
    date: new Date(),
  });

  // Initialize form data when purchase changes
  useEffect(() => {
    if (purchase) {
      setFormData({
        totalGrams: purchase.totalGrams?.toString() || '',
        totalFees: purchase.totalFees?.toString() || '',
        date: purchase.date ? new Date(purchase.date) : new Date(),
      });
    }
  }, [purchase]);

  // Calculate discount based on grams and fees
  const calculateDiscount = (grams: number, fees: number, date: string): number => {
    if (!shouldApplyDiscount(date)) {
      return 0;
    }
    // Use a simplified discount calculation for editing
    // This assumes an average discount rate based on the total grams
    const averageDiscountRate = 20; // EGP per gram - simplified approach
    return grams * averageDiscountRate;
  };

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const totalGrams = parseFloat(formData.totalGrams) || 0;
    const totalFees = parseFloat(formData.totalFees) || 0;
    
    // Validate total grams
    if (totalGrams <= 0) {
      errors.totalGrams = 'Total grams must be greater than 0.';
    }
    
    // Validate total fees
    if (totalFees < 0) {
      errors.totalFees = 'Total fees cannot be negative.';
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

    const totalGrams = parseFloat(formData.totalGrams);
    const totalFees = parseFloat(formData.totalFees);
    const purchaseDate = formData.date.toISOString().split('T')[0];
    const calculatedDiscount = calculateDiscount(totalGrams, totalFees, purchaseDate);

    const updatedPurchase = {
      id: purchase?.id || '',
      totalGrams: totalGrams,
      totalFees: totalFees,
      totalDiscount: calculatedDiscount, // Auto-calculated discount
      date: purchaseDate,
      dueDate: calculateDueDate(purchaseDate), // Auto-calculate due date
    };

    console.log('📝 EditPurchaseDialog updatedPurchase:', updatedPurchase);

    onSubmit(updatedPurchase);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Edit Purchase</Text>

            <Text style={styles.sectionTitle}>Purchase Date *</Text>
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


            <Text style={styles.sectionTitle}>Total Grams (21k equivalent) *</Text>
            <TextInput
              style={[
                styles.input, 
                validationErrors.totalGrams && styles.errorInput
              ]}
              value={formData.totalGrams}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, totalGrams: text }));
                if (validationErrors.totalGrams) {
                  setValidationErrors(prev => ({ ...prev, totalGrams: '' }));
                }
              }}
              placeholder="Enter total grams"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {validationErrors.totalGrams && (
              <Text style={styles.errorText}>{validationErrors.totalGrams}</Text>
            )}

            <Text style={styles.sectionTitle}>Base Fees (EGP) *</Text>
            <TextInput
              style={[
                styles.input, 
                validationErrors.totalFees && styles.errorInput
              ]}
              value={formData.totalFees}
              onChangeText={(text) => {
                setFormData(prev => ({ ...prev, totalFees: text }));
                if (validationErrors.totalFees) {
                  setValidationErrors(prev => ({ ...prev, totalFees: '' }));
                }
              }}
              placeholder="Enter base fees"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            {validationErrors.totalFees && (
              <Text style={styles.errorText}>{validationErrors.totalFees}</Text>
            )}


            {/* Summary */}
            {formData.totalGrams && formData.totalFees && (
              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Updated Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Purchase Date:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Due Date (Auto):</Text>
                  <Text style={[styles.summaryValue, { color: '#3B82F6', fontWeight: '600' }]}>
                    {calculateDueDate(formData.date.toISOString().split('T')[0])}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Grams:</Text>
                  <Text style={styles.summaryValue}>{parseFloat(formData.totalGrams) || 0}g</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fees:</Text>
                  <Text style={styles.summaryValue}>EGP {(parseFloat(formData.totalFees) || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Discount (Auto):</Text>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    EGP {calculateDiscount(parseFloat(formData.totalGrams) || 0, parseFloat(formData.totalFees) || 0, formData.date.toISOString().split('T')[0]).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Fees:</Text>
                  <Text style={[styles.summaryValue, { color: '#3B82F6', fontWeight: '700' }]}>
                    EGP {((parseFloat(formData.totalFees) || 0) - calculateDiscount(parseFloat(formData.totalGrams) || 0, parseFloat(formData.totalFees) || 0, formData.date.toISOString().split('T')[0])).toLocaleString()}
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
              <Text style={styles.submitText}>Update Purchase</Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
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
  summary: {
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
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  errorInput: {
    borderColor: '#EF4444',
    borderWidth: 1,
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
