import { AddPurchaseDialogProps } from '@/data/types';
import { convertTo21kEquivalent } from '@/data/utils';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStores } from '../../stores/hooks/useStores';
import { useSuppliers } from '../../suppliers/hooks/useSuppliers';
import { styles } from './styles/AddPurchaseDialogStyles';

// Constants
const GRAMS_PRECISION = 1;
const DEFAULT_DISCOUNT_RATE = 0;

// Utility functions
const roundGrams = (grams: number): number => {
  return Math.round(grams * 10) / 10;
};

const getDefaultDiscountRate = (supplier: any): number => {
  return supplier.karat21.discountTiers.length > 0 
    ? supplier.karat21.discountTiers[0].discountPercentage 
    : DEFAULT_DISCOUNT_RATE;
};

export function AddPurchaseDialog({ visible, onClose, onSubmit, editMode = false, existingPurchase }: AddPurchaseDialogProps) {
  const { stores } = useStores();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Initialize suppliers data
  const initializeSuppliersData = () => {
    const suppliersData: Record<string, { grams: number; fees: number; discountRate: number }> = {};
    suppliers.forEach(supplier => {
      suppliersData[supplier.code] = { 
        grams: 0, 
        fees: 0, 
        discountRate: getDefaultDiscountRate(supplier)
      };
    });
    return suppliersData;
  };
  
  const [formData, setFormData] = useState({
    store: '',
    date: new Date(),
    totalGrams: 0,
    selectedSuppliers: [] as string[],
    suppliers: initializeSuppliersData(),
    supplierReceipts: {} as Record<string, string[]>,
    receiptData: {} as Record<string, { grams: number; fees: number; karatType: '18' | '21' }>
  });

  // Initialize form data when suppliers are loaded or when in edit mode
  useEffect(() => {
    if (suppliers.length > 0) {
      const suppliersData = initializeSuppliersData();
      
      if (editMode && existingPurchase) {
        // Pre-fill form with existing purchase data
        setSelectedStoreId(existingPurchase.storeId);
        setFormData(prev => ({
          ...prev,
          store: existingPurchase.storeId,
          date: new Date(existingPurchase.date),
          // Note: We'll need to reconstruct suppliers data from existing purchase
          // For now, we'll start with empty suppliers and let user re-enter
          selectedSuppliers: [],
          suppliers: suppliersData,
          supplierReceipts: {},
          receiptData: {}
        }));
      } else if (!editMode) {
        // Reset form for new purchase
        setSelectedStoreId('');
        setFormData(prev => ({
          ...prev,
          store: '',
          date: new Date(),
          totalGrams: 0,
          selectedSuppliers: [],
          suppliers: suppliersData,
          supplierReceipts: {},
          receiptData: {}
        }));
      }
    }
  }, [suppliers, editMode, existingPurchase]);

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
        ? { ...prev.receiptData, [supplier]: { grams: 0, fees: 0, karatType: supplier.includes('18') ? '18' : '21' } }
        : { ...prev.receiptData, [supplier]: { grams: 0, fees: 0, karatType: supplier.includes('18') ? '18' : '21' } }
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
          [newReceiptId]: { grams: 0, fees: 0, karatType: supplier.includes('18') ? '18' : '21' }
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

  // Calculate total grams from all receipt entries (converted to 21k equivalent)
  const calculateTotalGrams = () => {
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    const totalGrams = allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
      const grams21kEquivalent = convertTo21kEquivalent(data.grams, data.karatType);
      return sum + grams21kEquivalent;
    }, 0);
    
    return roundGrams(totalGrams); // Apply rounding to the total
  };

  const totalGrams = calculateTotalGrams();

  const handleSubmit = () => {
    if (!selectedStoreId) {
      Alert.alert('Error', 'Please select a store');
      return;
    }

    if (totalGrams <= 0) {
      Alert.alert('Error', 'Please enter grams for at least one receipt');
      return;
    }

    // Fees are optional, no validation needed

    if (formData.selectedSuppliers.length === 0) {
      Alert.alert('Error', 'Please select at least one supplier');
      return;
    }

    // Check if all receipts have valid data
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    const hasValidData = allReceipts.every(receiptId => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
      return data.grams > 0; // Only require grams, fees are optional
    });
    
    if (!hasValidData) {
      Alert.alert('Error', 'Please enter valid grams for all receipts');
      return;
    }

    // Calculate supplier totals from receipt data (converted to 21k equivalent)
    const selectedSuppliersData = formData.selectedSuppliers.reduce((acc, supplier) => {
      const supplierReceipts = formData.supplierReceipts[supplier] || [supplier];
      
      // Calculate 18k and 21k grams separately, then convert to 21k equivalent
      let grams18k = 0;
      let grams21k = 0;
      
      supplierReceipts.forEach(receiptId => {
        const data = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
        if (data.karatType === '18') {
          grams18k += data.grams;
        } else {
          grams21k += data.grams;
        }
      });
      
      const totalGrams21kEquivalent = roundGrams(convertTo21kEquivalent(grams18k, '18') + convertTo21kEquivalent(grams21k, '21'));
      
      acc[supplier] = {
        grams18k: grams18k,
        grams21k: grams21k,
        totalGrams21k: totalGrams21kEquivalent
      };
      return acc;
    }, {} as Record<string, { grams18k: number; grams21k: number; totalGrams21k: number }>);

    // Map supplier codes to API supplier IDs using real supplier data
    const supplierCodeToId: Record<string, string> = {};
    suppliers.forEach(supplier => {
      supplierCodeToId[supplier.code] = supplier.id;
    });
    
    // Get the first selected supplier ID (API requires a single supplier_id)
    const firstSupplierCode = formData.selectedSuppliers.length > 0 ? formData.selectedSuppliers[0] : suppliers[0]?.code;
    const firstSupplierId = supplierCodeToId[firstSupplierCode] || suppliers[0]?.id || '1';
    
    // Calculate discount based on suppliers and date
    const totalDiscount = getTotalDiscount();
    const totalFees = getTotalEnteredFees();
    const netFees = totalFees - totalDiscount;
    
    const purchaseData = {
      id: Date.now().toString(),
      storeId: selectedStoreId,
      supplierId: firstSupplierId, // Add supplier_id for API
      date: `${formData.date.getFullYear()}-${String(formData.date.getMonth() + 1).padStart(2, '0')}-${String(formData.date.getDate()).padStart(2, '0')}`,
      totalGrams: totalGrams,
      suppliers: selectedSuppliersData,
      totalFees: totalFees, // Sum of supplier fees
      totalDiscount: totalDiscount, // Calculated discount
      netFees: netFees, // Calculated net fees
      status: 'Pending',
      // Include receipt data for individual receipts
      supplierReceipts: formData.supplierReceipts,
      receiptData: formData.receiptData
    };

    console.log('📝 AddPurchaseDialog submitting purchaseData:', purchaseData);
    console.log('📝 AddPurchaseDialog supplierId:', purchaseData.supplierId);
    console.log('📝 AddPurchaseDialog firstSupplierId:', firstSupplierId);
    console.log('📝 AddPurchaseDialog supplierReceipts:', purchaseData.supplierReceipts);
    console.log('📝 AddPurchaseDialog receiptData:', purchaseData.receiptData);

    onSubmit(purchaseData);
  };

  // Helper functions for dynamic calculations
  const getTotalEnteredGrams = () => {
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    return allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
      const grams21kEquivalent = convertTo21kEquivalent(data.grams, data.karatType);
      return sum + grams21kEquivalent;
    }, 0);
  };

  const getTotalEnteredFees = () => {
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    return allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0 };
      return sum + data.fees;
    }, 0);
  };

  const getTotalDiscount = () => {
    const allReceipts = formData.selectedSuppliers.flatMap(supplier => 
      formData.supplierReceipts[supplier] || [supplier]
    );
    
    return allReceipts.reduce((sum, receiptId) => {
      const data = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
      const supplier = formData.selectedSuppliers.find(s => 
        formData.supplierReceipts[s]?.includes(receiptId) || s === receiptId
      );
      const supplierData = supplier ? formData.suppliers[supplier] : { discountRate: 0 };
      const grams21kEquivalent = convertTo21kEquivalent(data.grams, data.karatType);
      return sum + (grams21kEquivalent * supplierData.discountRate);
    }, 0);
  };

  const getEnteredGramsColor = () => {
    const entered = getTotalEnteredGrams();
    if (entered === 0) return '#6B7280';
    return '#10B981';
  };

  const getMaxGramsForReceipt = (receiptId: string) => {
    const currentGrams = formData.receiptData[receiptId]?.grams || 0;
    return currentGrams + 1000; // Allow up to 1000g more than current
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{editMode ? 'Edit Purchase' : 'Add Purchase'}</Text>
            <Text style={styles.sectionTitle}>Select Store</Text>
            <View style={styles.storeButtons}>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeButton,
                    selectedStoreId === store.id && styles.selectedStoreButton
                  ]}
                  onPress={() => {
                    setSelectedStoreId(store.id);
                    setFormData(prev => ({ ...prev, store: store.code }));
                  }}
                >
                  <Text style={[
                    styles.storeButtonText,
                    selectedStoreId === store.id && styles.selectedStoreButtonText
                  ]}>
                    {store.code}
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

            {/* Purchase Summary */}
            {totalGrams > 0 && (
              <View style={styles.gramsSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Grams:</Text>
                  <Text style={[styles.summaryValue, { color: getEnteredGramsColor() }]}>
                    {totalGrams}g
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Base Fees:</Text>
                  <Text style={styles.summaryValue}>EGP {getTotalEnteredFees().toLocaleString()}</Text>
                </View>
                {getTotalDiscount() > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Discount:</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>EGP {getTotalDiscount().toLocaleString()}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Net Fees:</Text>
                  <Text style={[styles.summaryValue, { color: (getTotalEnteredFees() - getTotalDiscount()) < 0 ? '#3B82F6' : '#EF4444' }]}>
                    EGP {(getTotalEnteredFees() - getTotalDiscount()).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Select Suppliers</Text>
            {suppliersLoading ? (
              <Text style={styles.loadingText}>Loading suppliers...</Text>
            ) : (
              <View style={styles.supplierButtons}>
                {suppliers.map((supplier) => (
                <TouchableOpacity
                  key={supplier.code}
                  style={[
                    styles.supplierButton,
                    formData.selectedSuppliers.includes(supplier.code) && styles.selectedSupplierButton
                  ]}
                  onPress={() => toggleSupplier(supplier.code)}
                >
                  <Text style={[
                    styles.supplierButtonText,
                    formData.selectedSuppliers.includes(supplier.code) && styles.selectedSupplierButtonText
                  ]}>
                    {supplier.code}
                  </Text>
                </TouchableOpacity>
              ))}
              </View>
            )}

            {formData.selectedSuppliers.length > 0 && (
              <Text style={styles.sectionTitle}>Enter Grams and Fees for Each Supplier</Text>
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
                    const receiptData = formData.receiptData[receiptId] || { grams: 0, fees: 0, karatType: '21' };
                    const grams21kEquivalent = convertTo21kEquivalent(receiptData.grams, receiptData.karatType);
                    const discount = grams21kEquivalent * (supplierData?.discountRate || 0);
                    
                    return (
                      <View key={receiptId} style={styles.receiptCard}>
                        <View style={styles.receiptHeader}>
                          <View>
                            <Text style={styles.receiptTitle}>
                              {receiptId === supplier ? 'Receipt 1' : `Receipt ${index + 1}`}
                            </Text>
                            <Text style={styles.karatTypeText}>
                              {receiptData.karatType}k Gold
                              {receiptData.karatType === '18' && (
                                <Text style={styles.equivalentText}> (≈{grams21kEquivalent.toFixed(1)}g 21k)</Text>
                              )}
                            </Text>
                          </View>
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
                            <Text style={styles.hintText}>
                              Max: {getMaxGramsForReceipt(receiptId)}g
                            </Text>
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
              <Text style={styles.submitText}>{editMode ? 'Update Purchase' : 'Add Purchase'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}