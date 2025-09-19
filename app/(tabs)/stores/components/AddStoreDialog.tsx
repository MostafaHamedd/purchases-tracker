import { AddStoreDialogProps } from '@/data/types';
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

export function AddStoreDialog({ 
  visible, 
  onClose, 
  onSubmitStore
}: AddStoreDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [progressBarConfig, setProgressBarConfig] = useState({
    red: 5,
    orange: 10,
    yellow: 15,
    green: 20
  });

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

    // Validate progress bar configuration
    if (progressBarConfig.red <= 0 || progressBarConfig.orange <= 0 || 
        progressBarConfig.yellow <= 0 || progressBarConfig.green <= 0) {
      Alert.alert('Validation Error', 'All progress bar days must be greater than 0');
      return;
    }

    // Submit store data
    onSubmitStore({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      isActive,
      progressBarConfig,
    });

    // Reset form
    setName('');
    setCode('');
    setIsActive(true);
    setProgressBarConfig({
      red: 5,
      orange: 10,
      yellow: 15,
      green: 20
    });
  };

  const handleClose = () => {
    setName('');
    setCode('');
    setIsActive(true);
    setProgressBarConfig({
      red: 5,
      orange: 10,
      yellow: 15,
      green: 20
    });
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

            {/* Progress Bar Configuration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Progress Bar Color Configuration</Text>
              <Text style={styles.sectionDescription}>
                Configure how many days each color should show for this store
              </Text>
              
              {/* Red Progress Bar */}
              <View style={styles.colorConfigRow}>
                <View style={[styles.colorIndicator, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.colorLabel}>Red (Close to Deadline/Overdue):</Text>
                <TextInput
                  style={styles.daysInput}
                  value={progressBarConfig.red.toString()}
                  onChangeText={(text) => setProgressBarConfig(prev => ({ 
                    ...prev, 
                    red: parseInt(text) || 0 
                  }))}
                  placeholder="5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>

              {/* Orange Progress Bar */}
              <View style={styles.colorConfigRow}>
                <View style={[styles.colorIndicator, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.colorLabel}>Orange (Urgent):</Text>
                <TextInput
                  style={styles.daysInput}
                  value={progressBarConfig.orange.toString()}
                  onChangeText={(text) => setProgressBarConfig(prev => ({ 
                    ...prev, 
                    orange: parseInt(text) || 0 
                  }))}
                  placeholder="10"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>

              {/* Yellow Progress Bar */}
              <View style={styles.colorConfigRow}>
                <View style={[styles.colorIndicator, { backgroundColor: '#FDE047' }]} />
                <Text style={styles.colorLabel}>Yellow (Warning):</Text>
                <TextInput
                  style={styles.daysInput}
                  value={progressBarConfig.yellow.toString()}
                  onChangeText={(text) => setProgressBarConfig(prev => ({ 
                    ...prev, 
                    yellow: parseInt(text) || 0 
                  }))}
                  placeholder="15"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>

              {/* Green Progress Bar */}
              <View style={styles.colorConfigRow}>
                <View style={[styles.colorIndicator, { backgroundColor: '#10B981' }]} />
                <Text style={styles.colorLabel}>Green (Good):</Text>
                <TextInput
                  style={styles.daysInput}
                  value={progressBarConfig.green.toString()}
                  onChangeText={(text) => setProgressBarConfig(prev => ({ 
                    ...prev, 
                    green: parseInt(text) || 0 
                  }))}
                  placeholder="20"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.daysLabel}>days</Text>
              </View>
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
              <Text style={styles.infoCardTitle}>Store Configuration</Text>
              <Text style={styles.infoCardText}>
                • Store code must be unique and will be used for identification{'\n'}
                • Progress bar colors help you track payment urgency{'\n'}
                • Red = Close to Deadline/Overdue, Orange = Urgent, Yellow = Warning, Green = Good{'\n'}
                • Configure days based on each store's payment behavior
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
