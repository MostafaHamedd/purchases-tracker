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
    totalGrams: 0,
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
        [supplier]: grams
      }
    }));
  };

  const handleClose = () => {
    setSelectedStore('');
    setSelectedSuppliers([]);
    setFormData({
      storeId: '',
      date: new Date().toISOString().split('T')[0],
      totalGrams: 0,
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

    if (!formData.totalGrams || formData.totalGrams <= 0) {
      Alert.alert('Error', 'Please enter total grams for this purchase');
      return;
    }

    if (selectedSuppliers.length === 0) {
      Alert.alert('Error', 'Please select at least one supplier');
      return;
    }

    // Calculate total fees and discount (simplified calculation)
    const totalFees = (formData.totalGrams || 0) * 5; // Base fee per gram
    const totalDiscount = (formData.totalGrams || 0) >= 1000 ? totalFees * 0.1 : 0; // 10% discount for 1000g+
    const netFees = totalFees - totalDiscount;

    const purchaseData: PurchaseFormData = {
      id: Date.now().toString(),
      storeId: selectedStore,
      date: formData.date || new Date().toISOString().split('T')[0],
      totalGrams: formData.totalGrams || 0,
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

            <Text style={styles.sectionTitle}>Total Grams</Text>
            <TextInput
              style={[styles.totalGramsInput, { fontSize: 14 }]}
              value={formData.totalGrams?.toString() || ''}
              onChangeText={(text) => setFormData(prev => ({ 
                ...prev, 
                totalGrams: parseFloat(text) || 0 
              }))}
              placeholder="Enter the total weight of gold in grams (e.g., 500)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />

            {selectedSuppliers.length > 0 && (
              <Text style={styles.sectionTitle}>Enter Grams for Each Supplier</Text>
            )}

            <View style={styles.supplierButtons}>
              {['ES18', 'EG18', 'EG21'].map((supplier) => (
                <TouchableOpacity
                  key={supplier}
                  style={[
                    styles.supplierButton,
                    selectedSuppliers.includes(supplier) && styles.selectedSupplierButton
                  ]}
                  onPress={() => toggleSupplier(supplier)}
                >
                  <Text style={[
                    styles.supplierButtonText,
                    selectedSuppliers.includes(supplier) && styles.selectedSupplierButtonText
                  ]}>
                    {supplier}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedSuppliers.map((supplier) => (
              <View key={supplier} style={styles.supplierInputGroup}>
                <Text style={styles.supplierLabel}>{supplier} Grams:</Text>
                <TextInput
                  style={[styles.input, { fontSize: 12 }]}
                  value={formData.suppliers?.[supplier]?.toString() || ''}
                  onChangeText={(text) => updateSupplierGrams(supplier, parseFloat(text) || 0)}
                  placeholder={`Enter grams for ${supplier}`}
                  placeholderTextColor="#6B7280"
                  keyboardType="numeric"
                />
              </View>
            ))}
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
  totalGramsInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
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