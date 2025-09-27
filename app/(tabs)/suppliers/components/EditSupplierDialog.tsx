import { DiscountTier, EditSupplierDialogProps, KaratType } from '@/data/types';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from '../styles';

// Only 21k karat type for discount tiers (18k is converted to 21k equivalent)
const availableKaratTypes: KaratType[] = ['21'];

export function EditSupplierDialog({ 
  visible, 
  onClose, 
  onSubmitSupplier,
  supplier
}: EditSupplierDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [supplierKaratType, setSupplierKaratType] = useState<'18' | '21'>('21');
  const [karatType, setKaratType] = useState<KaratType>('21');
  const [tiers, setTiers] = useState<DiscountTier[]>([]);

  // Initialize form when supplier changes
  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setCode(supplier.code || '');
      setSupplierKaratType(supplier.supplierKaratType || '21');
      // Default to 21k karat type and use its discount tiers
      setKaratType('21');
      const initialTiers = supplier.karat21?.discountTiers || [];
      setTiers(Array.isArray(initialTiers) ? [...initialTiers] : []);
    }
  }, [supplier]);

  // Update tiers when karat type changes (only 21k now)
  const handleKaratTypeChange = (newKaratType: KaratType) => {
    setKaratType(newKaratType);
    if (supplier) {
      // Only 21k karat type supported
      const tiers21k = supplier.karat21?.discountTiers || [];
      setTiers(Array.isArray(tiers21k) ? [...tiers21k] : []);
    }
  };

  const handleSubmit = () => {
    if (!supplier) return;

    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a supplier name');
      return;
    }
    
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter a supplier code');
      return;
    }

    // Validate tiers
    const validTiers = tiers.filter(tier => tier.name.trim() && tier.discountPercentage >= 0 && tier.discountPercentage <= 100);
    
    if (validTiers.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one valid discount tier');
      return;
    }

    // Check for duplicate tier names
    const tierNames = validTiers.map(tier => tier.name.trim().toLowerCase());
    const uniqueNames = new Set(tierNames);
    if (tierNames.length !== uniqueNames.size) {
      Alert.alert('Validation Error', 'Tier names must be unique');
      return;
    }

    // Check for duplicate thresholds
    const thresholds = validTiers.map(tier => tier.threshold);
    const uniqueThresholds = new Set(thresholds);
    if (thresholds.length !== uniqueThresholds.size) {
      Alert.alert('Validation Error', 'Tier thresholds must be unique');
      return;
    }

    // Submit supplier data
    onSubmitSupplier({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      supplierKaratType: supplierKaratType,
      karat21: {
        discountTiers: validTiers.map((tier, index) => ({
          ...tier,
          name: tier.name.trim(),
        })),
        isActive: validTiers.length > 0
      },
      isActive: supplier.isActive
    });

    // Reset form
    setName('');
    setCode('');
    setSupplierKaratType('21');
    setKaratType('21');
    setTiers([]);
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setKaratType('18');
    setTiers([]);
    onClose();
  };

  const addTier = () => {
    const newTier: DiscountTier = {
      id: `tier${tiers.length + 1}`,
      name: '',
      threshold: 0,
      discountPercentage: 0,
    };
    setTiers([...tiers, newTier]);
  };

  const removeTier = (tierId: string) => {
    const tierToRemove = tiers.find(tier => tier.id === tierId);
    if (tierToRemove?.isProtected) {
      Alert.alert('Cannot Delete', 'This is a main tier and cannot be deleted. You can only edit its values.');
      return;
    }
    
    if (tiers.length > 1) {
      setTiers(tiers.filter(tier => tier.id !== tierId));
    }
  };

  const updateTier = (tierId: string, field: keyof DiscountTier, value: string | number) => {
    setTiers(tiers.map(tier => 
      tier.id === tierId 
        ? { ...tier, [field]: value }
        : tier
    ));
  };

  if (!supplier) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.modalContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Supplier</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Supplier Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier Name</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter supplier name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Supplier Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier Code</Text>
              <TextInput
                style={styles.textInput}
                value={code}
                onChangeText={setCode}
                placeholder="e.g., ES18, EG18, EG21"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            {/* Supplier Karat Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier Karat Type *</Text>
              <Text style={styles.inputSubLabel}>
                Select the karat type this supplier typically deals with. This helps determine if 18k gold needs to be converted to 21k equivalent.
              </Text>
              <View style={styles.radioGroup}>
                {['18', '21'].map((karat) => (
                  <TouchableOpacity 
                    key={karat}
                    style={[
                      styles.radioOption,
                      supplierKaratType === karat && styles.radioOptionSelected
                    ]}
                    onPress={() => setSupplierKaratType(karat as '18' | '21')}
                  >
                    <View style={[
                      styles.radioButton,
                      supplierKaratType === karat && styles.radioButtonSelected
                    ]}>
                      {supplierKaratType === karat && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.radioLabel,
                      supplierKaratType === karat && styles.radioLabelSelected
                    ]}>{karat} Karat</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Discount Tiers Info */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Discount Tiers for 21k Gold</Text>
              <Text style={styles.inputSubLabel}>
                All discount tiers are calculated based on 21k gold equivalent. 
                18k gold is automatically converted to 21k equivalent (18k × 0.857 = 21k equivalent).
              </Text>
            </View>

            {/* Discount Tiers */}
            <View style={styles.inputGroup}>
              <View style={styles.tierHeader}>
                <Text style={styles.inputLabel}>Discount Tiers (21k)</Text>
                <TouchableOpacity 
                  style={styles.addTierButton}
                  onPress={addTier}
                >
                  <Text style={styles.addTierButtonText}>+ Add Tier</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputSubLabel}>
                Edit existing tiers or add new ones. Main tiers cannot be deleted. Currently showing {String(tiers.length)} tier(s) for 21k gold equivalent.
              </Text>
              
              <View style={styles.tiersContainer}>
                {tiers && tiers.filter(tier => tier && tier.id && typeof tier.id === 'string').map((tier, index) => (
                  <View key={tier.id} style={styles.tierInputCard}>
                    <View style={styles.tierHeader}>
                      <View style={styles.tierTitleContainer}>
                        <Text style={styles.tierNumber}>Tier {String(index + 1)}</Text>
                        {tier.isProtected === true && (
                          <Text style={styles.protectedBadge}>Main Tier</Text>
                        )}
                      </View>
                      {tier.isProtected !== true && (
                        <TouchableOpacity 
                          style={styles.removeTierButton}
                          onPress={() => removeTier(tier.id)}
                        >
                          <Text style={styles.removeTierButtonText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    
                    <View style={styles.tierInputs}>
                      <View style={styles.tierInputRow}>
                        <Text style={styles.tierInputLabel}>Name</Text>
                        <TextInput
                          style={styles.tierTextInput}
                          value={tier.name ? String(tier.name) : ''}
                          onChangeText={(value) => updateTier(tier.id, 'name', value)}
                          placeholder="e.g., Basic, Premium"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      
                      <View style={styles.tierInputRow}>
                        <Text style={styles.tierInputLabel}>Threshold (g)</Text>
                        <TextInput
                          style={styles.tierTextInput}
                          value={tier.threshold ? String(tier.threshold) : '0'}
                          onChangeText={(value) => updateTier(tier.id, 'threshold', parseInt(value) || 0)}
                          placeholder="0"
                          keyboardType="numeric"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      
                      <View style={styles.tierInputRow}>
                        <Text style={styles.tierInputLabel}>Discount (%)</Text>
                        <TextInput
                          style={styles.tierTextInput}
                          value={tier.discountPercentage ? String(tier.discountPercentage.toFixed(2)) : '0'}
                          onChangeText={(value) => updateTier(tier.id, 'discountPercentage', parseFloat(value) || 0)}
                          placeholder="0"
                          keyboardType="numeric"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Editing Rules</Text>
              <Text style={styles.infoCardText}>
                • Main tiers (marked with "Main Tier") cannot be deleted{'\n'}
                • You can edit all tier values including main tiers{'\n'}
                • Additional tiers can be added or removed freely{'\n'}
                • All tier names and thresholds must be unique
              </Text>
            </View>
          </View>

          {/* Footer Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
