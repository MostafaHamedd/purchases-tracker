import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { StoreCard } from './components/StoreCard';
import { AddStoreDialog } from './components/AddStoreDialog';
import { EditStoreDialog } from './components/EditStoreDialog';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { useStores, Store } from './hooks/useStores';
import { styles } from './styles';

export default function StoresScreen() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<{ id: string; name: string } | null>(null);
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);
  const { stores, addStore, updateStore, deleteStore, refreshStores } = useStores();

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

  const confirmDeleteStore = () => {
    if (storeToDelete) {
      deleteStore(storeToDelete.id);
      setShowDeleteDialog(false);
      setStoreToDelete(null);
      Alert.alert('Success', 'Store deleted successfully!');
    }
  };

  const handleSubmitNewStore = (storeData: {
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    manager?: string;
    isActive: boolean;
  }) => {
    addStore(storeData);
    setShowAddDialog(false);
    Alert.alert('Success', 'Store added successfully!');
  };

  const handleSubmitEditStore = (storeData: {
    id: string;
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    manager?: string;
    isActive: boolean;
  }) => {
    updateStore(storeData.id, storeData);
    setShowEditDialog(false);
    setStoreToEdit(null);
    Alert.alert('Success', 'Store updated successfully!');
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
        {stores.length > 0 ? (
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
          setStoreToEdit(null);
        }}
        onSubmitStore={handleSubmitEditStore}
        store={storeToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setStoreToDelete(null);
        }}
        onConfirm={confirmDeleteStore}
        title="Delete Store"
        message="Are you sure you want to delete this store? This action cannot be undone."
        itemName={storeToDelete ? storeToDelete.name : undefined}
      />
    </SafeAreaView>
  );
}
