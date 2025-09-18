import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { styles } from '../styles';

interface AddStoreDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmitStore: (storeData: {
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    manager?: string;
    isActive: boolean;
  }) => void;
}

export function AddStoreDialog({ 
  visible, 
  onClose, 
  onSubmitStore
}: AddStoreDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [manager, setManager] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a store name');
      return;
    }
    
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Please enter a store code');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Validation Error', 'Please enter a store address');
      return;
    }

    // Validate email format if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone format if provided
    if (phone.trim() && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }

    // Submit store data
    onSubmitStore({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      manager: manager.trim() || undefined,
      isActive,
    });

    // Reset form
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setEmail('');
    setManager('');
    setIsActive(true);
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setAddress('');
    setPhone('');
    setEmail('');
    setManager('');
    setIsActive(true);
    onClose();
  };

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
            <Text style={styles.modalTitle}>Add New Store</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Store Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter store name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Store Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Code *</Text>
              <TextInput
                style={styles.textInput}
                value={code}
                onChangeText={setCode}
                placeholder="e.g., MSD, BSH, BSN"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>

            {/* Store Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address *</Text>
              <TextInput
                style={styles.textArea}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter complete store address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="+20 2 1234 5678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="store@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Manager */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Manager Name</Text>
              <TextInput
                style={styles.textInput}
                value={manager}
                onChangeText={setManager}
                placeholder="Enter manager name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Status Toggle */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Status</Text>
              <TouchableOpacity 
                style={[
                  styles.statusToggle,
                  { backgroundColor: isActive ? '#34D399' : '#EF4444' }
                ]}
                onPress={() => setIsActive(!isActive)}
              >
                <Text style={styles.statusToggleText}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Store Information</Text>
              <Text style={styles.infoCardText}>
                • Store code must be unique and will be used for identification{'\n'}
                • Address should include complete location details{'\n'}
                • Phone and email are optional but recommended{'\n'}
                • Manager name helps with store management
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
              <Text style={styles.confirmButtonText}>Add Store</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
