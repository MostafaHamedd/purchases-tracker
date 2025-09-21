import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoreFormData } from '../../../data/types';
import { AddStoreDialog } from './components/AddStoreDialog';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { EditStoreDialog } from './components/EditStoreDialog';
import { StoreCard } from './components/StoreCard';
import { Store, useStores } from './hooks/useStores';
import { styles } from './styles';

export default function StoresScreen() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: string; name: string } | undefined>(undefined);
  const [storeToEdit, setStoreToEdit] = useState<Store | undefined>(undefined);
  const { stores, loading, error, addStore, updateStore, deleteStore, refreshStores } = useStores();

  const handleEditStore = (store: Store) => {
    setStoreToEdit(store);
    setShowEditDialog(true);
  };

  const handleDeleteStore = (storeId: string) => {
    const store = stores.find(s => s.id === storeId);
    if (store) {
      setStoreToDelete({ id: storeId, name: store.name });
      setShowDeleteDialog(true);
    }
  };

  const confirmDeleteStore = async () => {
    if (storeToDelete) {
      const result = await deleteStore(storeToDelete.id);
      setShowDeleteDialog(false);
      setStoreToDelete(undefined);
      
      if (result.success) {
        Alert.alert('✅ Success', 'Store has been deleted successfully!');
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to delete store. Please try again.');
      }
    }
  };

  const handleSubmitNewStore = async (storeData: StoreFormData) => {
    const result = await addStore(storeData);
    setShowAddDialog(false);
    
    if (result.success) {
      Alert.alert('✅ Success', 'Store has been added successfully!');
    } else {
      Alert.alert('❌ Error', result.error || 'Failed to add store. Please try again.');
    }
  };

  const handleSubmitEditStore = async (storeData: StoreFormData & { id: string }) => {
    const result = await updateStore(storeData.id, storeData);
    setShowEditDialog(false);
    setStoreToEdit(undefined);
    
    if (result.success) {
      Alert.alert('✅ Success', 'Store has been updated successfully!');
    } else {
      Alert.alert('❌ Error', result.error || 'Failed to update store. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navContent}>
          <Text style={styles.title}>Stores</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Text style={styles.addButtonText}>+ Add Store</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading stores...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Error Loading Stores</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshStores}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : stores.length > 0 ? (
          stores.map((store) => (
            <StoreCard 
              key={store.id} 
              store={store} 
              onEdit={handleEditStore}
              onDelete={handleDeleteStore}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Stores Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first store to start managing locations and branches.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Store Dialog */}
      <AddStoreDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmitStore={handleSubmitNewStore}
      />

      {/* Edit Store Dialog */}
      <EditStoreDialog
        visible={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setStoreToEdit(undefined);
        }}
        onSubmitStore={handleSubmitEditStore}
        store={storeToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setStoreToDelete(undefined);
        }}
        onConfirm={confirmDeleteStore}
        title="Delete Store"
        message="Are you sure you want to delete this store? This action cannot be undone."
        itemName={storeToDelete ? storeToDelete.name : undefined}
      />
    </SafeAreaView>
  );
}
