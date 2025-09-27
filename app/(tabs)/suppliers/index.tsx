import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddSupplierDialog } from './components/AddSupplierDialog';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { EditSupplierDialog } from './components/EditSupplierDialog';
import { SupplierCard } from './components/SupplierCard';
import { Supplier, useSuppliers } from './hooks/useSuppliers';
import { styles } from './styles';

export default function SuppliersScreen() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<{ id: string; name: string } | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const { suppliers, loading, error, addSupplier, updateSupplier, deleteSupplier, refreshSuppliers, getSupplierForEdit } = useSuppliers();

  const handleEditSupplier = async (supplier: Supplier) => {
    try {
      // Get fresh supplier data from the database
      const freshSupplier = await getSupplierForEdit(supplier.id);
      setSupplierToEdit(freshSupplier || supplier);
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error fetching fresh supplier data:', error);
      // Fallback to cached data if API fails
      setSupplierToEdit(supplier);
      setShowEditDialog(true);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSupplierToDelete({ id: supplierId, name: supplier.name });
      setShowDeleteDialog(true);
    }
  };

  const confirmDeleteSupplier = async () => {
    if (supplierToDelete) {
      const result = await deleteSupplier(supplierToDelete.id);
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
      
      if (result.success) {
        Alert.alert('✅ Success', 'Supplier has been deleted successfully!');
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to delete supplier. Please try again.');
      }
    }
  };

  const handleSubmitNewSupplier = async (supplierData: { name: string; code: string; supplierKaratType: '18' | '21'; karat21: any; isActive: boolean }) => {
    const result = await addSupplier(supplierData);
    setShowAddDialog(false);
    
    if (result.success) {
      Alert.alert('✅ Success', 'Supplier has been added successfully!');
    } else {
      Alert.alert('❌ Error', result.error || 'Failed to add supplier. Please try again.');
    }
  };

  const handleSubmitEditSupplier = async (supplierData: { name: string; code: string; supplierKaratType: '18' | '21'; karat21: any; isActive: boolean }) => {
    if (supplierToEdit) {
      const result = await updateSupplier(supplierToEdit.id, supplierData);
      setShowEditDialog(false);
      setSupplierToEdit(null);
      
      if (result.success) {
        Alert.alert('✅ Success', 'Supplier has been updated successfully!');
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to update supplier. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navContent}>
          <Text style={styles.title}>Suppliers</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddDialog(true)}
          >
            <Text style={styles.addButtonText}>+ Add Supplier</Text>
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
            <Text style={styles.loadingText}>Loading suppliers...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorTitle}>Error Loading Suppliers</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshSuppliers}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : suppliers.length > 0 ? (
          suppliers.map((supplier) => (
            <SupplierCard 
              key={supplier.id} 
              supplier={supplier} 
              onEdit={handleEditSupplier}
              onDelete={handleDeleteSupplier}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Suppliers Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first supplier to start managing discount tiers and rates.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Supplier Dialog */}
      <AddSupplierDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmitSupplier={handleSubmitNewSupplier}
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        visible={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSupplierToEdit(null);
        }}
        onSubmitSupplier={handleSubmitEditSupplier}
        supplier={supplierToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSupplierToDelete(null);
        }}
        onConfirm={confirmDeleteSupplier}
        title="Delete Supplier"
        message="Are you sure you want to delete this supplier?"
        itemName={supplierToDelete ? supplierToDelete.name : undefined}
      />
    </SafeAreaView>
  );
}
