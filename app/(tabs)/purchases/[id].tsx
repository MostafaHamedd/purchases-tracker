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
import { AddPaymentDialog } from './components/AddPaymentDialog';
import { EditPaymentDialog } from './components/EditPaymentDialog';
import { PaymentCard } from './components/PaymentCard';
import { SupplierReceiptCard } from './components/SupplierReceiptCard';
import { usePurchaseDetail } from './hooks/usePurchaseDetail';
import { styles } from './purchaseDetailStyles';

export default function PurchaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<any>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; date: string } | null>(null);
  
  const { purchase, payments, refreshPurchase } = usePurchaseDetail(id!);

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

  const confirmDeletePayment = () => {
    if (paymentToDelete) {
      PaymentService.deletePayment(purchase.id, paymentToDelete.id);
      setShowDeleteDialog(false);
      setPaymentToDelete(null);
      refreshPurchase();
      Alert.alert('Success', 'Payment deleted successfully!');
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
        <Text style={styles.purchaseSubtitle}>{purchase.store} • {purchase.date}</Text>
      </View>

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
              <Text style={styles.infoLabel}>Total Grams:</Text>
              <Text style={styles.infoValue}>{purchase.totalGrams || 0}g</Text>
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
                  payment={payment}
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
        onSubmit={(paymentData) => {
          PaymentService.addPayment(purchase.id, paymentData);
          setShowAddPaymentDialog(false);
          refreshPurchase();
          Alert.alert('Success', 'Payment added successfully!');
        }}
        purchaseId={purchase.id}
        purchase={{
          totalGrams: purchase.totalGrams || 0,
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