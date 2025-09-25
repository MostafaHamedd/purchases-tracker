import { DeleteConfirmationDialog } from '@/app/(tabs)/purchases/components/DeleteConfirmationDialog';
import { PaymentService, PurchaseService } from '@/data';
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
import { AddPurchaseDialog } from './components/AddPurchaseDialog';
import { EditPaymentDialog } from './components/EditPaymentDialog';
import { PaymentCard } from './components/PaymentCard';
import { usePurchaseDetail } from './hooks/usePurchaseDetail';
import { styles } from './purchaseDetailStyles';
import { formatGrams, formatCurrency, formatDate, formatPaymentDate, roundGrams } from './utils/formatters';
import { STATUS_COLORS, DAYS_LEFT_COLORS } from './constants';

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { stores, loading: storesLoading } = useStores();
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditPurchaseDialog, setShowEditPurchaseDialog] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; date: string } | null>(null);
  
  const { purchase, payments, receipts, loading, error, refreshPurchase } = usePurchaseDetail(id!);
  
  // Find the store associated with this purchase
  const store = stores.find(s => s.id === purchase?.storeId);
  
  // Debug logging for store lookup
  console.log('Purchase detail - stores loading:', storesLoading);
  console.log('Purchase detail - stores count:', stores.length);
  console.log('Purchase detail - stores:', stores.map(s => ({ id: s.id, code: s.code, name: s.name })));
  console.log('Purchase detail - purchase storeId:', purchase?.storeId);
  console.log('Purchase detail - found store:', store);
  console.log('Purchase detail - store lookup result:', store ? `${store.code} (${store.name})` : 'NOT FOUND');
  

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
      setPaymentToDelete({ id: paymentId, date: formatPaymentDate(payment.date) });
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

  // Helper function to format grams display (rounding is handled at data level)
  const formatGrams = (grams: number): string => {
    if (grams === undefined || grams === null || isNaN(grams)) {
      return '0';
    }
    return grams % 1 === 0 ? grams.toString() : grams.toFixed(1);
  };

  // Helper function to format currency values consistently
  const formatCurrency = (amount: number): string => {
    return `EGP ${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    })}`;
  };

  // Get purchase data in a clean, organized way
  const purchaseData = {
    totalGrams: purchase?.totalGrams || 0,
    totalFees: purchase?.totalFees || 0,
    totalDiscount: purchase?.totalDiscount || 0,
    netFees: (purchase?.totalFees || 0) - (purchase?.totalDiscount || 0),
    dueDate: purchase?.dueDate,
    status: purchase?.status,
    suppliers: purchase?.suppliers || {},
    // Calculate remaining amounts
    remainingGrams: roundGrams((purchase?.totalGrams || 0) - (purchase?.payments?.gramsPaid || 0)),
    remainingFees: (purchase?.totalFees || 0) - (purchase?.payments?.feesPaid || 0),
  };

  // Debug logging for purchase data
  console.log('📊 Purchase Detail Data:');
  console.log('   - Raw purchase:', purchase);
  console.log('   - Clean purchaseData:', purchaseData);
  console.log('   - Suppliers data:', purchase?.suppliers);
  console.log('   - Suppliers keys:', Object.keys(purchase?.suppliers || {}));
  console.log('   - Receipts data:', receipts);
  console.log('   - Receipts count:', receipts?.length || 0);


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
        <View style={styles.headerContent}>
          <Text style={styles.purchaseTitle}>Purchase #{purchase.id}</Text>
          <Text style={styles.purchaseSubtitle}>
            {storesLoading ? 'Loading...' : (store?.code || `Store ${purchase.storeId}`)} • {formatDate(purchase.date)}
          </Text>
        </View>
        {(!purchase?.payments?.gramsPaid || purchase.payments.gramsPaid === 0) && 
         (!purchase?.payments?.feesPaid || purchase.payments.feesPaid === 0) && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditPurchaseDialog(true)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
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
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(purchaseData.status) }]}>
              <Text style={styles.statusText}>{purchaseData.status}</Text>
            </View>
          </View>

          <View style={styles.infoContent}>
            {/* Two Column Layout for Grams and Fees */}
            <View style={styles.twoColumnLayout}>
              {/* Left Column - Grams */}
              <View style={styles.column}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Grams (21k):</Text>
                  <Text style={styles.infoValue}>{formatGrams(purchaseData.totalGrams)}g</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Grams Due:</Text>
                  <Text style={[styles.infoValue, { color: '#EF4444', fontWeight: '700' }]}>{formatGrams(purchaseData.remainingGrams)}g</Text>
                </View>
              </View>
              
              {/* Right Column - Fees */}
              <View style={styles.column}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Base Fees:</Text>
                  <Text style={styles.infoValue}>{formatCurrency(purchaseData.totalFees)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Discount:</Text>
                  <Text style={[styles.infoValue, styles.discountValue]}>{formatCurrency(purchaseData.totalDiscount)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Net Fees:</Text>
                  <Text style={[styles.infoValue, { color: '#3B82F6', fontWeight: '700' }]}>{formatCurrency(purchaseData.netFees)}</Text>
                </View>
              </View>
            </View>
            
            {/* Date Information at Bottom */}
            <View style={styles.dateSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Due Date:</Text>
                <Text style={styles.infoValue}>{purchaseData.dueDate ? formatDate(purchaseData.dueDate) : 'Not set'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Days Left:</Text>
                <Text style={[styles.infoValue, getDaysLeftColor(purchaseData.dueDate)]}>
                  {getDaysLeftText(purchaseData.dueDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Receipts from purchase_receipts table */}
        {receipts && receipts.length > 0 && (
          <View style={styles.receiptsCard}>
            <View style={styles.receiptsHeader}>
              <Text style={styles.cardTitle}>Purchase Receipts</Text>
              <Text style={styles.receiptsCount}>{receipts.length} receipt{receipts.length !== 1 ? 's' : ''}</Text>
            </View>
            
            <View style={styles.receiptsList}>
              {receipts.map((receipt, index) => (
                <View key={receipt.id} style={styles.receiptItem}>
                  <View style={styles.receiptHeader}>
                    <Text style={styles.receiptTitle}>Receipt #{receipt.receipt_number}</Text>
                    <Text style={styles.receiptDate}>{formatDate(receipt.created_at)}</Text>
                  </View>
                  
                  <View style={styles.receiptDetails}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Supplier:</Text>
                      <Text style={styles.receiptValue}>{receipt.supplier_name || receipt.supplier_id}</Text>
                    </View>
                    
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>18k Grams:</Text>
                      <Text style={styles.receiptValue}>{formatGrams(receipt.grams_18k)}g</Text>
                    </View>
                    
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>21k Grams:</Text>
                      <Text style={styles.receiptValue}>{formatGrams(receipt.grams_21k)}g</Text>
                    </View>
                    
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Total (21k equivalent):</Text>
                      <Text style={[styles.receiptValue, { fontWeight: '600' }]}>{formatGrams(receipt.total_grams_21k)}g</Text>
                    </View>
                    
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Base Fee:</Text>
                      <Text style={styles.receiptValue}>{formatCurrency(receipt.base_fees)}</Text>
                    </View>
                    
                    {receipt.discount_amount > 0 && (
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Discount:</Text>
                        <Text style={[styles.receiptValue, styles.discountValue]}>{formatCurrency(receipt.discount_amount)}</Text>
                      </View>
                    )}
                    
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Net Fee:</Text>
                      <Text style={[styles.receiptValue, { color: '#3B82F6', fontWeight: '600' }]}>{formatCurrency(receipt.net_fees)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
          totalGrams: purchaseData.remainingGrams,
          netFees: purchaseData.netFees,
          totalFees: purchaseData.totalFees,
          totalDiscount: purchaseData.totalDiscount
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

      <AddPurchaseDialog
        visible={showEditPurchaseDialog}
        onClose={() => setShowEditPurchaseDialog(false)}
        editMode={true}
        existingPurchase={purchase}
        onSubmit={async (purchaseData) => {
          try {
            // Convert the purchase data to update format
            const updateData = {
              id: purchase.id,
              date: purchaseData.date,
              storeId: purchaseData.storeId,
              suppliers: purchaseData.suppliers,
            };
            
            const result = await PurchaseService.updatePurchase(purchase.id, updateData);
            setShowEditPurchaseDialog(false);
            
            if (result.success) {
              await refreshPurchase();
              Alert.alert('✅ Success', 'Purchase has been updated successfully!');
            } else {
              Alert.alert('❌ Error', result.error || 'Failed to update purchase. Please try again.');
            }
          } catch (error) {
            console.error('Error updating purchase:', error);
            Alert.alert('❌ Error', 'Failed to update purchase. Please try again.');
          }
        }}
      />
    </SafeAreaView>
  );
}