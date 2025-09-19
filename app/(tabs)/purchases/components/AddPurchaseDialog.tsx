import { mockSuppliers } from '@/data/mockData';
import { AddPurchaseDialogProps, PurchaseFormData, Store } from '@/data/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStores } from '../../stores/hooks/useStores';

export function AddPurchaseDialog({ visible, onClose, onSubmit }: AddPurchaseDialogProps) {
  const { stores } = useStores();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<PurchaseFormData>>({
    storeId: '',
    date: new Date().toISOString().split('T')[0],
    suppliers: {},
    totalFees: 0,
    totalDiscount: 0,
    netFees: 0,
    status: 'Pending'
  });

  const toggleSupplier = (supplier: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplier)
        ? prev.filter(s => s !== supplier)
        : [...prev, supplier]
    );
  };

  const updateSupplierGrams = (supplier: string, grams: number) => {
    setFormData(prev => ({
      ...prev,
      suppliers: {
        ...prev.suppliers,
        [supplier]: {
          grams18k: 0,
          grams21k: grams,
          totalGrams21k: grams
        }
      }
    }));
  };

  // Calculate total grams from all supplier entries
  const calculateTotalGrams = () => {
    let total = 0;
    Object.values(formData.suppliers || {}).forEach(supplier => {
      if (supplier && typeof supplier === 'object') {
        total += supplier.totalGrams21k || 0;
      }
    });
    return Math.round(total * 10) / 10; // Round to 1 decimal place
  };

  const totalGrams = calculateTotalGrams();

  const handleClose = () => {
    setSelectedStore('');
    setSelectedSuppliers([]);
    setFormData({
      storeId: '',
      date: new Date().toISOString().split('T')[0],
      suppliers: {},
      totalFees: 0,
      totalDiscount: 0,
      netFees: 0,
      status: 'Pending'
    });
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedStore) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    if (totalGrams <= 0) {
      Alert.alert('Error', 'Please enter grams for at least one supplier');
      return;
    }

    if (selectedSuppliers.length === 0) {
      Alert.alert('Error', 'Please select at least one supplier');
      return;
    }

    // Calculate total fees and discount (simplified calculation)
    const totalFees = totalGrams * 5; // Base fee per gram
    const totalDiscount = totalGrams >= 1000 ? totalFees * 0.1 : 0; // 10% discount for 1000g+
    const netFees = totalFees - totalDiscount;

    const purchaseData: PurchaseFormData = {
      id: Date.now().toString(),
      storeId: selectedStore,
      date: formData.date || new Date().toISOString().split('T')[0],
      totalGrams,
      suppliers: formData.suppliers || {},
      totalFees,
      totalDiscount,
      netFees,
      status: 'Pending'
    };

    onSubmit(purchaseData);
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Store</Text>
            <View style={styles.storeButtons}>
              {stores.map((store: Store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeButton,
                    selectedStore === store.id && styles.selectedStoreButton
                  ]}
                  onPress={() => {
                    setSelectedStore(store.id);
                    setFormData(prev => ({ ...prev, storeId: store.id }));
                  }}
                >
                  <Text style={[
                    styles.storeButtonText,
                    selectedStore === store.id && styles.selectedStoreButtonText
                  ]}>
                    {store.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Select Purchase Date</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.datePickerButtonText}>
                {formData.date || 'Select Date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={new Date(formData.date || new Date())}
                  mode="date"
                  display="spinner"
                  textColor="#000000"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setFormData(prev => ({ 
                        ...prev, 
                        date: selectedDate.toISOString().split('T')[0] 
                      }));
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

            {/* Purchase Summary */}
            {totalGrams > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Purchase Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Grams (21k equivalent):</Text>
                  <Text style={styles.summaryValue}>{totalGrams}g</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fees:</Text>
                  <Text style={styles.summaryValue}>EGP {(totalGrams * 5).toLocaleString()}</Text>
                </View>
                {totalGrams >= 1000 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount (10%):</Text>
                    <Text style={[styles.summaryValue, styles.discountValue]}>-EGP {(totalGrams * 5 * 0.1).toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Fees:</Text>
                  <Text style={[styles.summaryValue, styles.netFeesValue]}>
                    EGP {((totalGrams * 5) - (totalGrams >= 1000 ? totalGrams * 5 * 0.1 : 0)).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            {selectedSuppliers.length > 0 && (
              <Text style={styles.sectionTitle}>Enter Grams for Each Supplier</Text>
            )}

            <View style={styles.supplierButtons}>
              {mockSuppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.code}
                  style={[
                    styles.supplierButton,
                    selectedSuppliers.includes(supplier.code) && styles.selectedSupplierButton
                  ]}
                  onPress={() => toggleSupplier(supplier.code)}
                >
                  <Text style={[
                    styles.supplierButtonText,
                    selectedSuppliers.includes(supplier.code) && styles.selectedSupplierButtonText
                  ]}>
                    {supplier.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSuppliers.map((supplierCode) => {
              const supplierData = formData.suppliers?.[supplierCode];
              const grams21k = supplierData && typeof supplierData === 'object' ? supplierData.grams21k : 0;
              const supplier = mockSuppliers.find(s => s.code === supplierCode);
              const supplierName = supplier ? supplier.name : supplierCode;
              
              return (
                <View key={supplierCode} style={styles.supplierInputGroup}>
                  <Text style={styles.supplierLabel}>{supplierName} Grams (21k):</Text>
                  <TextInput
                    style={[styles.input, { fontSize: 12 }]}
                    value={grams21k.toString()}
                    onChangeText={(text) => updateSupplierGrams(supplierCode, parseFloat(text) || 0)}
                    placeholder={`Enter grams for ${supplierName}`}
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                  />
                  {grams21k > 0 && (
                    <Text style={styles.supplierHint}>
                      {supplierName}: {grams21k}g (21k equivalent)
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Add Purchase</Text>
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
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
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
    marginTop: 16,
  },
  storeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  storeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  selectedStoreButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  storeButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedStoreButtonText: {
    color: '#FFFFFF',
  },
  datePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#1F2937',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerDoneButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  discountValue: {
    color: '#10B981',
  },
  netFeesValue: {
    color: '#1E40AF',
    fontSize: 16,
  },
  supplierButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  supplierButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  selectedSupplierButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  supplierButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  selectedSupplierButtonText: {
    color: '#FFFFFF',
  },
  supplierInputGroup: {
    marginBottom: 16,
  },
  supplierLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  supplierHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});