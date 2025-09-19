import { AddPurchaseDialogProps } from '@/data/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function AddPurchaseDialog({ visible, onClose, onSubmit }: AddPurchaseDialogProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');
  const [formData, setFormData] = useState({
    store: '',
    date: new Date(),
    totalGrams: 0,
    selectedSuppliers: [] as string[],
    suppliers: {
      'ES18': { grams: 0, fees: 0, discountRate: 10 },
      'EG18': { grams: 0, fees: 0, discountRate: 34 },
      'EG21': { grams: 0, fees: 0, discountRate: 23 }
    } as Record<string, { grams: number; fees: number; discountRate: number }>,
    supplierReceipts: {} as Record<string, string[]>,
    receiptData: {} as Record<string, { grams: number; fees: number }>
  });

  const toggleSupplier = (supplier: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSuppliers: prev.selectedSuppliers.includes(supplier)
        ? prev.selectedSuppliers.filter(s => s !== supplier)
        : [...prev.selectedSuppliers, supplier],
      supplierReceipts: prev.selectedSuppliers.includes(supplier)
        ? { ...prev.supplierReceipts, [supplier]: [] }
        : { ...prev.supplierReceipts, [supplier]: [supplier] },
      receiptData: prev.selectedSuppliers.includes(supplier)
        ? { ...prev.receiptData, [supplier]: { grams: 0, fees: 0 } }
        : { ...prev.receiptData, [supplier]: { grams: 0, fees: 0 } }
    }));
  };

  const addReceipt = (supplier: string) => {
    setFormData(prev => {
      const currentReceipts = prev.supplierReceipts[supplier] || [supplier];
      const newReceiptNumber = currentReceipts.length + 1;
      const newReceiptId = `${supplier}-${newReceiptNumber}`;
      
      return {
        ...prev,
        supplierReceipts: {
          ...prev.supplierReceipts,
          [supplier]: [...currentReceipts, newReceiptId]
        },
        receiptData: {
          ...prev.receiptData,
          [newReceiptId]: { grams: 0, fees: 0 }
        }
      };
    });
  };

  const removeReceipt = (supplier: string, receiptId: string) => {
    setFormData(prev => {
      const currentReceipts = prev.supplierReceipts[supplier] || [supplier];
      // Don't allow removing the first receipt (the original supplier)
      if (receiptId === supplier || currentReceipts.length <= 1) {
        return prev;
      }
      
      const newReceiptData = { ...prev.receiptData };
      delete newReceiptData[receiptId];
      
      return {
        ...prev,
        supplierReceipts: {
          ...prev.supplierReceipts,
          [supplier]: currentReceipts.filter(id => id !== receiptId)
        },
        receiptData: newReceiptData
      };
    });
  };

  const updateSupplierData = (supplier: string, field: 'grams' | 'fees', value: number) => {
    setFormData(prev => ({
      ...prev,
      suppliers: {
        ...prev.suppliers,
        [supplier]: {
          ...prev.suppliers[supplier],
          [field]: value
        }
      }
    }));
  };

  const updateReceiptData = (receiptId: string, field: 'grams' | 'fees', value: number) => {
    setFormData(prev => ({
      ...prev,
      receiptData: {
        ...prev.receiptData,
        [receiptId]: {
          ...prev.receiptData[receiptId],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = () => {
    if (!selectedStore) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    if (formData.totalGrams <= 0) {
      Alert.alert('Error', 'Please enter total grams for this purchase');
      return;
    }


    if (formData.selectedSuppliers.length === 0) {
      Alert.alert('Error', 'Please select at least one supplier');
      return;
    }

    // Check if all receipts have valid data
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    const hasValidData = allReceipts.every(receiptId => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
      return data.grams > 0 && data.fees > 0;
    });

    if (!hasValidData) {
      Alert.alert('Error', 'Please enter valid grams and fees for all receipts');
      return;
    }

    // Validate that receipt grams sum equals total grams
    const totalReceiptGrams = allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
      return sum + data.grams;
    }, 0);

    if (totalReceiptGrams !== formData.totalGrams) {
      Alert.alert('Error', `Receipt grams (${totalReceiptGrams}) must equal total grams (${formData.totalGrams})`);
      return;
    }

    // Calculate supplier totals from receipt data
    const selectedSuppliersData = formData.selectedSuppliers.reduce((acc, supplier) => {
      const supplierReceipts = formData.supplierReceipts[supplier] || [supplier];
      const supplierTotalGrams = supplierReceipts.reduce((sum, receiptId) => {
        const data = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
        return sum + data.grams;
      }, 0);
      acc[supplier] = supplierTotalGrams;
      return acc;
    }, {} as Record<string, number>);

    const totalGrams = totalReceiptGrams;

    const purchaseData = {
      id: Date.now().toString(),
      store: selectedStore,
      date: formData.date.toISOString().split('T')[0],
      totalGrams: formData.totalGrams,
      suppliers: selectedSuppliersData,
      totalFees: totalSupplierGrams * 5,
      totalDiscount: totalSupplierGrams * 10,
      netFees: totalSupplierGrams * -5,
      status: 'Pending'
    };

    onSubmit(purchaseData);
  };

  // Helper functions for dynamic calculations
  const getTotalEnteredGrams = () => {
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    return allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
      return sum + data.grams;
    }, 0);
  };

  const getRemainingGrams = () => {
    return Math.max(0, formData.totalGrams - getTotalEnteredGrams());
  };

  const getEnteredGramsColor = () => {
    const entered = getTotalEnteredGrams();
    if (entered === 0) return '#6B7280';
    if (entered === formData.totalGrams) return '#10B981';
    if (entered > formData.totalGrams) return '#EF4444';
    return '#3B82F6';
  };

  const getRemainingGramsColor = () => {
    const remaining = getRemainingGrams();
    if (remaining === 0) return '#10B981';
    if (remaining === formData.totalGrams) return '#6B7280';
    return '#F59E0B';
  };

  const getMaxGramsForReceipt = (receiptId: string) => {
    const currentGrams = formData.receiptData[receiptId]?.grams || 0;
    const remaining = getRemainingGrams();
    return remaining + currentGrams;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Store</Text>
            <View style={styles.storeButtons}>
              {['Store A', 'Store B'].map((store) => (
                <TouchableOpacity
                  key={store}
                  style={[
                    styles.storeButton,
                    selectedStore === store && styles.selectedStoreButton
                  ]}
                  onPress={() => {
                    setSelectedStore(store);
                    setFormData(prev => ({ ...prev, store }));
                  }}
                >
                  <Text style={[
                    styles.storeButtonText,
                    selectedStore === store && styles.selectedStoreButtonText
                  ]}>
                    {store}
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

            <Text style={styles.sectionTitle}>Total Grams</Text>
            <TextInput
              style={[styles.totalGramsInput, { fontSize: 14 }]}
              value={formData.totalGrams > 0 ? formData.totalGrams.toString() : ''}
              onChangeText={(text) => setFormData(prev => ({ ...prev, totalGrams: parseInt(text) || 0 }))}
              placeholder="Enter the total weight of gold in grams (e.g., 500)"
              placeholderTextColor="#6B7280"
              keyboardType="numeric"
            />
            
            {formData.totalGrams > 0 && (
              <View style={styles.gramsSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Target:</Text>
                  <Text style={styles.summaryValue}>{formData.totalGrams}g</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Entered:</Text>
                  <Text style={[styles.summaryValue, { color: getEnteredGramsColor() }]}>
                    {getTotalEnteredGrams()}g
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Remaining:</Text>
                  <Text style={[styles.summaryValue, { color: getRemainingGramsColor() }]}>
                    {getRemainingGrams()}g
                  </Text>
                </View>
              </View>
            )}

            
            <Text style={styles.sectionTitle}>Select Suppliers</Text>
            <View style={styles.supplierButtons}>
              {['ES18', 'EG18', 'EG21'].map((supplier) => (
                <TouchableOpacity
                  key={supplier}
                  style={[
                    styles.supplierButton,
                    formData.selectedSuppliers.includes(supplier) && styles.selectedSupplierButton
                  ]}
                  onPress={() => toggleSupplier(supplier)}
                >
                  <Text style={[
                    styles.supplierButtonText,
                    formData.selectedSuppliers.includes(supplier) && styles.selectedSupplierButtonText
                  ]}>
                    {supplier}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.selectedSuppliers.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Enter Grams and Fees for Each Supplier</Text>
                {formData.totalGrams === 0 && (
                  <View style={styles.warningHint}>
                    <Text style={styles.warningText}>
                      ⚠️ Please enter total grams above to see helpful hints for each receipt
                    </Text>
                  </View>
                )}
              </>
            )}
            
            {formData.selectedSuppliers.map((supplier) => {
              const receipts = formData.supplierReceipts[supplier] || [supplier];
              const supplierData = formData.suppliers[supplier];
              
              return (
                <View key={supplier} style={styles.supplierCard}>
                  <View style={styles.supplierCardHeader}>
                    <Text style={styles.supplierName}>{supplier}</Text>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => addReceipt(supplier)}
                    >
                      <Text style={styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {receipts.map((receiptId, index) => {
                    const receiptData = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
                    const discount = receiptData.grams * supplierData.discountRate;
                    
                    return (
                      <View key={receiptId} style={styles.receiptCard}>
                        <View style={styles.receiptHeader}>
                          <Text style={styles.receiptTitle}>
                            {receiptId === supplier ? 'Receipt 1' : `Receipt ${index + 1}`}
                          </Text>
                          {receiptId !== supplier && receipts.length > 1 && (
                            <TouchableOpacity 
                              style={styles.removeButton}
                              onPress={() => removeReceipt(supplier, receiptId)}
                            >
                              <Text style={styles.removeButtonText}>−</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        <View style={styles.inputRow}>
                          <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Grams</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={receiptData.grams > 0 ? receiptData.grams.toString() : ''}
                              onChangeText={(text) => updateReceiptData(receiptId, 'grams', parseInt(text) || 0)}
                              placeholder="0"
                              placeholderTextColor="#6B7280"
                              keyboardType="numeric"
                            />
                            {formData.totalGrams > 0 && (
                              <Text style={styles.hintText}>
                                Max: {getMaxGramsForReceipt(receiptId)}g
                              </Text>
                            )}
                          </View>
                          
                          <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Fees (EGP)</Text>
                            <TextInput
                              style={[styles.input, { fontSize: 12 }]}
                              value={receiptData.fees > 0 ? receiptData.fees.toString() : ''}
                              onChangeText={(text) => updateReceiptData(receiptId, 'fees', parseInt(text) || 0)}
                              placeholder="0"
                              placeholderTextColor="#6B7280"
                              keyboardType="numeric"
                            />
                          </View>
                        </View>
                        
                        {receiptData.grams > 0 && (
                          <View style={styles.discountContainer}>
                            <View style={styles.discountLeftBar} />
                            <Text style={styles.discountText}>
                              Discount: {supplierData.discountRate} EGP/g = EGP {discount.toLocaleString()}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxWidth: 400,
    maxHeight: '90%',
  },
  scrollView: {
    maxHeight: 500,
  },
  dateDisplay: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
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
  supplierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  storeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  selectedStoreButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  storeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedStoreButtonText: {
    color: '#FFFFFF',
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
  gramsSummary: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  hintText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  warningHint: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },
  supplierButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  supplierButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
  },
  selectedSupplierButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  supplierButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedSupplierButtonText: {
    color: '#FFFFFF',
  },
  supplierCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#9CA3AF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  receiptContainer: {
    marginBottom: 12,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  removeButton: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  discountLeftBar: {
    width: 4,
    height: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginRight: 8,
  },
  discountText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
    flex: 1,
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
