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
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, refreshSuppliers } = useSuppliers();

  const handleEditSupplier = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setShowEditDialog(true);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setSupplierToDelete({ id: supplierId, name: supplier.name });
      setShowDeleteDialog(true);
    }
  };

  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      setShowDeleteDialog(false);
      setSupplierToDelete(null);
      Alert.alert('Success', 'Supplier deleted successfully!');
    }
  };

  const handleSubmitNewSupplier = (supplierData: { name: string; code: string; karat18: any; karat21: any; isActive: boolean }) => {
    addSupplier(supplierData);
    setShowAddDialog(false);
    Alert.alert('Success', 'Supplier added successfully!');
  };

  const handleSubmitEditSupplier = (supplierData: { name: string; code: string; karat18: any; karat21: any; isActive: boolean }) => {
    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, supplierData);
      setShowEditDialog(false);
      setSupplierToEdit(null);
      Alert.alert('Success', 'Supplier updated successfully!');
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
        {suppliers.length > 0 ? (
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
