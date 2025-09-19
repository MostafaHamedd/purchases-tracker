import { defaultDiscountTier } from '@/data/mockData';
import { AddSupplierDialogProps, DiscountTier } from '@/data/types';
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
  const [karat18Tiers, setKarat18Tiers] = useState<DiscountTier[]>([defaultDiscountTier]);
  const [karat21Tiers, setKarat21Tiers] = useState<DiscountTier[]>([defaultDiscountTier]);
  const [karat18Active, setKarat18Active] = useState(true);
  const [karat21Active, setKarat21Active] = useState(true);

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

    // Validate tiers for both karats
    const validKarat18Tiers = karat18Tiers.filter(tier => 
      tier.name.trim() && tier.threshold >= 0 && tier.discountPercentage >= 0 && tier.discountPercentage <= 100
    );
    const validKarat21Tiers = karat21Tiers.filter(tier => 
      tier.name.trim() && tier.threshold >= 0 && tier.discountPercentage >= 0 && tier.discountPercentage <= 100
    );
    
    if (validKarat18Tiers.length === 0 && validKarat21Tiers.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one discount tier for either 18k or 21k');
      return;
    }

    // Check for duplicate tier names in each karat
    const tierNames18 = validKarat18Tiers.map(tier => tier.name.trim().toLowerCase());
    const tierNames21 = validKarat21Tiers.map(tier => tier.name.trim().toLowerCase());
    const uniqueNames18 = new Set(tierNames18);
    const uniqueNames21 = new Set(tierNames21);
    
    if (tierNames18.length !== uniqueNames18.size || tierNames21.length !== uniqueNames21.size) {
      Alert.alert('Validation Error', 'Tier names must be unique within each karat type');
      return;
    }

    // Check for duplicate thresholds in each karat
    const thresholds18 = validKarat18Tiers.map(tier => tier.threshold);
    const thresholds21 = validKarat21Tiers.map(tier => tier.threshold);
    const uniqueThresholds18 = new Set(thresholds18);
    const uniqueThresholds21 = new Set(thresholds21);
    
    if (thresholds18.length !== uniqueThresholds18.size || thresholds21.length !== uniqueThresholds21.size) {
      Alert.alert('Validation Error', 'Tier thresholds must be unique within each karat type');
      return;
    }

    // Submit supplier data
    onSubmitSupplier({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      karat18: {
        discountTiers: validKarat18Tiers.map((tier, index) => ({
          ...tier,
          id: `tier18_${index + 1}`,
          name: tier.name.trim(),
        })),
        isActive: karat18Active,
      },
      karat21: {
        discountTiers: validKarat21Tiers.map((tier, index) => ({
          ...tier,
          id: `tier21_${index + 1}`,
          name: tier.name.trim(),
        })),
        isActive: karat21Active,
      },
      isActive: true
    });

    // Reset form
    setName('');
    setCode('');
    setKarat18Tiers([{ id: 'tier1', name: '', threshold: 0, discountPercentage: 0 }]);
    setKarat21Tiers([{ id: 'tier1', name: '', threshold: 0, discountPercentage: 0 }]);
    setKarat18Active(true);
    setKarat21Active(true);
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setKarat18Tiers([{ id: 'tier1', name: '', threshold: 0, discountPercentage: 0 }]);
    setKarat21Tiers([{ id: 'tier1', name: '', threshold: 0, discountPercentage: 0 }]);
    setKarat18Active(true);
    setKarat21Active(true);
    onClose();
  };

  const addTier = (karatType: '18' | '21') => {
    const newTier: DiscountTier = {
      id: `tier${karatType}_${karatType === '18' ? karat18Tiers.length + 1 : karat21Tiers.length + 1}`,
      name: '',
      threshold: 0,
      discountPercentage: 0,
    };

    if (karatType === '18') {
      setKarat18Tiers([...karat18Tiers, newTier]);
    } else {
      setKarat21Tiers([...karat21Tiers, newTier]);
    }
  };

  const removeTier = (karatType: '18' | '21', index: number) => {
    if (karatType === '18') {
      if (karat18Tiers.length > 1) {
        setKarat18Tiers(karat18Tiers.filter((_, i) => i !== index));
      }
    } else {
      if (karat21Tiers.length > 1) {
        setKarat21Tiers(karat21Tiers.filter((_, i) => i !== index));
      }
    }
  };

  const updateTier = (karatType: '18' | '21', index: number, field: keyof DiscountTier, value: string | number) => {
    if (karatType === '18') {
      const updatedTiers = [...karat18Tiers];
      updatedTiers[index] = { ...updatedTiers[index], [field]: value };
      setKarat18Tiers(updatedTiers);
    } else {
      const updatedTiers = [...karat21Tiers];
      updatedTiers[index] = { ...updatedTiers[index], [field]: value };
      setKarat21Tiers(updatedTiers);
    }
  };

  const renderTierSection = (karatType: '18' | '21', tiers: DiscountTier[], isActive: boolean, setIsActive: (active: boolean) => void) => (
    <View style={styles.inputGroup}>
      <View style={styles.karatHeader}>
        <Text style={styles.inputLabel}>{karatType}K Karat Configuration</Text>
        <TouchableOpacity
          style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
          onPress={() => setIsActive(!isActive)}
        >
          <Text style={[styles.toggleButtonText, isActive && styles.toggleButtonTextActive]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isActive && (
        <>
          {tiers.map((tier, index) => (
            <View key={tier.id} style={styles.tierRow}>
              <View style={styles.tierInputs}>
                <TextInput
                  style={[styles.tierInput, styles.tierNameInput]}
                  value={tier.name}
                  onChangeText={(text) => updateTier(karatType, index, 'name', text)}
                  placeholder="Tier name"
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  style={[styles.tierInput, styles.tierThresholdInput]}
                  value={tier.threshold.toString()}
                  onChangeText={(text) => updateTier(karatType, index, 'threshold', parseInt(text) || 0)}
                  placeholder="Threshold"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.tierInput, styles.tierDiscountInput]}
                  value={tier.discountPercentage.toString()}
                  onChangeText={(text) => updateTier(karatType, index, 'discountPercentage', parseInt(text) || 0)}
                  placeholder="Discount %"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              {tiers.length > 1 && (
                <TouchableOpacity
                  style={styles.removeTierButton}
                  onPress={() => removeTier(karatType, index)}
                >
                  <Text style={styles.removeTierButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.addTierButton}
            onPress={() => addTier(karatType)}
          >
            <Text style={styles.addTierButtonText}>+ Add {karatType}K Tier</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.dialog}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              <Text style={styles.dialogTitle}>Add New Supplier</Text>
              
              {/* Basic Information */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter supplier name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier Code *</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="Enter supplier code (e.g., EGS)"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>

              {/* 18K Karat Configuration */}
              {renderTierSection('18', karat18Tiers, karat18Active, setKarat18Active)}

              {/* 21K Karat Configuration */}
              {renderTierSection('21', karat21Tiers, karat21Active, setKarat21Active)}

              {/* Info Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Supplier Configuration</Text>
                <Text style={styles.infoCardText}>
                  • Configure discount tiers for both 18K and 21K karat types{'\n'}
                  • Each karat type can have multiple discount tiers{'\n'}
                  • Thresholds determine minimum grams for each tier{'\n'}
                  • Discount percentages apply to fees for that tier{'\n'}
                  • You can activate/deactivate each karat type independently
                </Text>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Add Supplier</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}