import { availableKaratTypes } from '@/data/mockData';
import { AddSupplierDialogProps, DiscountTier, KaratType } from '@/data/types';
import React, { useState } from 'react';
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

export function AddSupplierDialog({ 
  visible, 
  onClose, 
  onSubmitSupplier
}: AddSupplierDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [karatType, setKaratType] = useState<KaratType>('18');
  const [tiers, setTiers] = useState<DiscountTier[]>([
    { id: 'new-tier-1', name: '', threshold: 0, discountPercentage: 0, isProtected: false }
  ]);

  const generateUniqueId = () => `new-tier-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Update tiers when karat type changes
  const handleKaratTypeChange = (newKaratType: KaratType) => {
    setKaratType(newKaratType);
    // When switching karat types in AddSupplierDialog, reset tiers to a single empty tier
    setTiers([{ id: generateUniqueId(), name: '', threshold: 0, discountPercentage: 0, isProtected: false }]);
  };

  const handleSubmit = () => {
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
    const validTiers = tiers.filter(tier => 
      tier.name.trim() && tier.threshold >= 0 && tier.discountPercentage >= 0 && tier.discountPercentage <= 100
    );
    
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
      karat18: {
        discountTiers: karatType === '18' ? validTiers.map(tier => ({
          ...tier,
          name: tier.name.trim(),
        })) : [], // Empty if 21k is selected
        isActive: karatType === '18'
      },
      karat21: {
        discountTiers: karatType === '21' ? validTiers.map(tier => ({
          ...tier,
          name: tier.name.trim(),
        })) : [], // Empty if 18k is selected
        isActive: karatType === '21'
      },
      isActive: true // New suppliers are active by default
    });

    handleClose(); // Reset form and close
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setKaratType('18');
    setTiers([{ id: generateUniqueId(), name: '', threshold: 0, discountPercentage: 0, isProtected: false }]);
    onClose();
  };

  const addTier = () => {
    setTiers(prev => [...prev, { id: generateUniqueId(), name: '', threshold: 0, discountPercentage: 0, isProtected: false }]);
  };

  const removeTier = (tierId: string) => {
    if (tiers.length > 1) {
      setTiers(prev => prev.filter(tier => tier.id !== tierId));
    }
  };

  const updateTier = (tierId: string, field: keyof DiscountTier, value: string | number) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ));
  };

  if (!visible) return null;

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
            <Text style={styles.modalTitle}>Add New Supplier</Text>
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

            {/* Karat Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Karat Type *</Text>
              <View style={styles.radioGroup}>
                {availableKaratTypes.map((karat: KaratType) => (
                  <TouchableOpacity 
                    key={karat}
                    style={[
                      styles.radioOption,
                      karatType === karat && styles.radioOptionSelected
                    ]}
                    onPress={() => handleKaratTypeChange(karat)}
                  >
                    <View style={[
                      styles.radioButton,
                      karatType === karat && styles.radioButtonSelected
                    ]}>
                      {karatType === karat && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.radioLabel,
                      karatType === karat && styles.radioLabelSelected
                    ]}>{karat} Karat</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Discount Tiers */}
            <View style={styles.inputGroup}>
              <View style={styles.tierHeader}>
                <Text style={styles.inputLabel}>Discount Tiers</Text>
                <TouchableOpacity 
                  style={styles.addTierButton}
                  onPress={addTier}
                >
                  <Text style={styles.addTierButtonText}>+ Add Tier</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputSubLabel}>
                Configure discount tiers for the selected karat type.
              </Text>
              
              <View style={styles.tiersContainer}>
                {tiers.map((tier, index) => (
                  <View key={tier.id} style={styles.tierInputCard}>
                    <View style={styles.tierHeader}>
                      <View style={styles.tierTitleContainer}>
                        <Text style={styles.tierNumber}>Tier {index + 1}</Text>
                      </View>
                      {tiers.length > 1 && ( // Allow removing if more than one tier
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
                          value={tier.name}
                          onChangeText={(value) => updateTier(tier.id, 'name', value)}
                          placeholder="e.g., Basic, Premium"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      
                      <View style={styles.tierInputRow}>
                        <Text style={styles.tierInputLabel}>Threshold (g)</Text>
                        <TextInput
                          style={styles.tierTextInput}
                          value={tier.threshold.toString()}
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
                          value={tier.discountPercentage.toString()}
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
              <Text style={styles.infoCardTitle}>Adding Rules</Text>
              <Text style={styles.infoCardText}>
                • Configure discount tiers for the selected karat type.{'\n'}
                • Each karat type can have multiple discount tiers.{'\n'}
                • Thresholds determine minimum grams for each tier.{'\n'}
                • Discount percentages apply to fees for that tier.{'\n'}
                • All tier names and thresholds must be unique.
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
              <Text style={styles.confirmButtonText}>Add Supplier</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}