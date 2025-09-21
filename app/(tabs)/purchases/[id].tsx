import { DeleteConfirmationDialog } from '@/app/(tabs)/purchases/components/DeleteConfirmationDialog';
import { PaymentService } from '@/data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStores } from '../stores/hooks/useStores';
import { AddPaymentDialog } from './components/AddPaymentDialog';
import { EditPaymentDialog } from './components/EditPaymentDialog';
import { PaymentCard } from './components/PaymentCard';
import { SupplierReceiptCard } from './components/SupplierReceiptCard';
import { usePurchaseDetail } from './hooks/usePurchaseDetail';
import { styles } from './purchaseDetailStyles';

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { stores, loading: storesLoading } = useStores();
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; date: string } | null>(null);
  
  const { purchase, payments, loading, error, refreshPurchase } = usePurchaseDetail(id!);
  
  // Find the store associated with this purchase
  const store = stores.find(s => s.id === purchase?.storeId);
  
  // Debug logging for store lookup
  console.log('Purchase detail - stores loading:', storesLoading);
  console.log('Purchase detail - stores count:', stores.length);
  console.log('Purchase detail - stores:', stores.map(s => ({ id: s.id, code: s.code, name: s.name })));
  console.log('Purchase detail - purchase storeId:', purchase?.storeId);
  console.log('Purchase detail - found store:', store);
  console.log('Purchase detail - store lookup result:', store ? `${store.code} (${store.name})` : 'NOT FOUND');
  
  // Format date to show month name and day
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Format payment date to be shorter and cleaner
  const formatPaymentDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  if (!purchase) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Purchase not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/purchases')}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEditPayment = (payment: any) => {
    setPaymentToEdit(payment);
    setShowEditPaymentDialog(true);
  };

  const handleDeletePayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setPaymentToDelete({ id: paymentId, date: payment.date });
      setShowDeleteDialog(true);
    }
  };

  const confirmDeletePayment = async () => {
    if (paymentToDelete) {
      const result = await PaymentService.deletePayment(purchase.id, paymentToDelete.id);
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
      await refreshPurchase();
      
      if (result.success) {
        Alert.alert('✅ Success', 'Payment has been deleted successfully!');
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to delete payment. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Partial': return '#3B82F6';
      case 'Overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDaysLeft = (dueDate: string): number => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftText = (dueDate: string): string => {
    if (!dueDate) return 'Not set';
    const daysLeft = getDaysLeft(dueDate);
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)} days overdue`;
    } else if (daysLeft === 0) {
      return 'Due today';
    } else if (daysLeft === 1) {
      return '1 day left';
    } else {
      return `${daysLeft} days left`;
    }
  };

  const getDaysLeftColor = (dueDate: string) => {
    if (!dueDate) return { color: '#6B7280' };
    const daysLeft = getDaysLeft(dueDate);
    if (daysLeft < 0) {
      return { color: '#EF4444' }; // Red for overdue
    } else if (daysLeft <= 3) {
      return { color: '#F59E0B' }; // Orange for urgent
    } else if (daysLeft <= 7) {
      return { color: '#FDE047' }; // Yellow for warning
    } else {
      return { color: '#10B981' }; // Green for good
    }
  };

  // Calculate total grams from suppliers (21k equivalent)
  const calculateTotalGramsFromSuppliers = () => {
    console.log('🔍 Purchase detail - calculating total grams from suppliers:');
    console.log('- purchase:', purchase);
    console.log('- purchase.suppliers:', purchase?.suppliers);
    
    if (!purchase?.suppliers) {
      console.log('- No suppliers found, returning 0');
      return 0;
    }
    
    let total = 0;
    Object.entries(purchase.suppliers).forEach(([supplierCode, supplier]) => {
      console.log(`- Supplier ${supplierCode}:`, supplier);
      if (supplier && typeof supplier === 'object') {
        const grams = supplier.totalGrams21k || 0;
        console.log(`  - totalGrams21k: ${grams}`);
        total += grams;
      }
    });
    
    const result = Math.round(total * 10) / 10; // Round to 1 decimal place
    console.log(`- Total calculated: ${result}`);
    return result;
  };

  const calculatedTotalGrams = calculateTotalGramsFromSuppliers();


  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.topBackButton}
        onPress={() => router.push('/(tabs)/purchases')}
      >
        <Text style={styles.topBackButtonText}>← Back</Text>
      </TouchableOpacity>

      {/* Purchase Header */}
      <View style={styles.purchaseHeader}>
        <Text style={styles.purchaseTitle}>Purchase #{purchase.id}</Text>
        <Text style={styles.purchaseSubtitle}>
          {storesLoading ? 'Loading...' : (store?.code || `Store ${purchase.storeId}`)} • {formatDate(purchase.date)}
        </Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading purchase details...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={refreshPurchase}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Purchase Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.cardTitle}>Purchase Information</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(purchase.status) }]}>
              <Text style={styles.statusText}>{purchase.status}</Text>
            </View>
          </View>

          <View style={styles.infoContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Grams (21k equivalent):</Text>
              <Text style={styles.infoValue}>{calculatedTotalGrams}g</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base Fees:</Text>
              <Text style={styles.infoValue}>EGP {(purchase.totalFees || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Discount:</Text>
              <Text style={[styles.infoValue, styles.discountValue]}>EGP {(purchase.totalDiscount || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Net Fees:</Text>
              <Text style={styles.infoValue}>EGP {((purchase.totalFees || 0) - (purchase.totalDiscount || 0)).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{purchase.dueDate || 'Not set'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Days Left:</Text>
              <Text style={[styles.infoValue, getDaysLeftColor(purchase.dueDate)]}>
                {getDaysLeftText(purchase.dueDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier Receipts Card */}
        <SupplierReceiptCard suppliers={purchase.suppliers} />

        {/* Payment History */}
        <View style={styles.paymentsCard}>
          <View style={styles.paymentsHeader}>
            <Text style={styles.cardTitle}>Payment History</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddPaymentDialog(true)}
            >
              <Text style={styles.addButtonText}>+ Add Payment</Text>
            </TouchableOpacity>
          </View>
          
          {payments.length > 0 ? (
            <View style={styles.paymentsList}>
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={{
                    ...payment,
                    date: formatPaymentDate(payment.date)
                  }}
                  onEdit={() => handleEditPayment(payment)}
                  onDelete={() => handleDeletePayment(payment.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPayments}>
              <Text style={styles.emptyText}>No payments recorded yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <AddPaymentDialog
        visible={showAddPaymentDialog}
        onClose={() => setShowAddPaymentDialog(false)}
        onSubmit={async (paymentData) => {
          const result = await PaymentService.addPayment(purchase.id, paymentData);
          setShowAddPaymentDialog(false);
          await refreshPurchase();
          
          if (result.success) {
            Alert.alert('✅ Success', 'Payment has been added successfully!');
          } else {
            Alert.alert('❌ Error', result.error || 'Failed to add payment. Please try again.');
          }
        }}
        purchaseId={purchase.id}
        purchase={{
          totalGrams: calculatedTotalGrams,
          netFees: (purchase.totalFees || 0) - (purchase.totalDiscount || 0),
          totalFees: purchase.totalFees || 0,
          totalDiscount: purchase.totalDiscount || 0
        }}
      />

      <EditPaymentDialog
        visible={showEditPaymentDialog}
        onClose={() => setShowEditPaymentDialog(false)}
        onSubmit={(paymentData) => {
          // PaymentService.updatePayment(purchase.id, paymentToEdit.id, paymentData);
          setShowEditPaymentDialog(false);
          setPaymentToEdit(null);
          refreshPurchase();
          Alert.alert('Success', 'Payment updated successfully!');
        }}
        payment={paymentToEdit}
      />

      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeletePayment}
        title="Delete Payment"
        message={`Are you sure you want to delete the payment from ${paymentToDelete?.date}?`}
      />
    </SafeAreaView>
  );
}