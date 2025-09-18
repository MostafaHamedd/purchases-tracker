import React, { useState, useEffect } from 'react';
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
import { PurchaseService, PaymentService } from '@/data';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaymentCard } from './components/PaymentCard';
import { AddPaymentDialog } from './components/AddPaymentDialog';
import { EditPaymentDialog } from './components/EditPaymentDialog';
import { DeleteConfirmationDialog } from '@/app/(tabs)/purchases/components/DeleteConfirmationDialog';
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
            onPress={() => router.back()}
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

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysLeft(purchase.dueDate);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.title}>Purchase #{purchase.id}</ThemedText>
          <Text style={styles.subtitle}>{purchase.store} • {purchase.date}</Text>
        </View>
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
              <Text style={styles.infoValue}>{purchase.totalGrams}g</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Base Fees:</Text>
              <Text style={styles.infoValue}>EGP {purchase.totalFees.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, styles.discountLabel]}>Discount:</Text>
              <Text style={[styles.infoValue, styles.discountValue]}>-EGP {(purchase.totalFees - purchase.totalDiscount).toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, styles.netFeeLabel]}>Net Fees:</Text>
              <Text style={[styles.infoValue, styles.netFeeValue]}>-EGP {purchase.totalDiscount.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{purchase.dueDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Days Left:</Text>
              <Text style={[styles.infoValue, daysLeft < 0 && styles.overdueText]}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier Receipts Card */}
        <View style={styles.suppliersCard}>
          <Text style={styles.cardTitle}>Supplier Receipts</Text>
          <View style={styles.suppliersContent}>
            {Object.entries(purchase.suppliers).map(([supplier, grams]) => (
              <View key={supplier} style={styles.supplierSection}>
                <Text style={styles.supplierTitle}>{supplier}</Text>
                <View style={styles.supplierDetails}>
                  <View style={styles.supplierRow}>
                    <Text style={styles.supplierLabel}>Grams:</Text>
                    <Text style={styles.supplierValue}>{grams}g</Text>
                  </View>
                  <View style={styles.supplierRow}>
                    <Text style={styles.supplierLabel}>Base Fee:</Text>
                    <Text style={styles.supplierValue}>EGP {(grams * 5).toLocaleString()}</Text>
                  </View>
                  <View style={styles.supplierRow}>
                    <Text style={[styles.supplierLabel, styles.discountLabel]}>Discount (10 EGP/g):</Text>
                    <Text style={[styles.supplierValue, styles.discountValue]}>-EGP {(grams * 10).toLocaleString()}</Text>
                  </View>
                  <View style={styles.supplierRow}>
                    <Text style={[styles.supplierLabel, styles.netFeeLabel]}>Net Fee:</Text>
                    <Text style={[styles.supplierValue, styles.netFeeValue]}>-EGP {(grams * 5).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

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