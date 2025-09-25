import { PurchaseCardProps } from '@/data';
import { purchasesApiService } from '@/data/services/purchasesApiService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { useStores } from '../../stores/hooks/useStores';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { styles } from './styles/PurchaseCardStyles';

// Utility function for consistent grams rounding (matches services.ts)
const roundGrams = (grams: number): number => {
  return Math.round(grams * 10) / 10; // Round to 1 decimal place
};

export function PurchaseCard({ purchase, onRefresh }: PurchaseCardProps) {
  const router = useRouter();
  const { stores, loading: storesLoading } = useStores();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Find the store associated with this purchase
  const store = stores.find(s => s.id === purchase.storeId);
  
  // Debug logging for store lookup
  console.log('🛒 PurchaseCard debug:');
  console.log('  - stores loading:', storesLoading);
  console.log('  - stores count:', stores.length);
  console.log('  - stores:', stores.map(s => ({ id: s.id, code: s.code, name: s.name })));
  console.log('  - purchase storeId:', purchase.storeId);
  console.log('  - found store:', store);
  console.log('  - store lookup result:', store ? `${store.code} (${store.name})` : 'NOT FOUND');
  
  // Temporary: Show what we're actually displaying
  const displayText = storesLoading ? 'Loading...' : (store?.code || `Store ${purchase.storeId}`);
  console.log('  - DISPLAY TEXT:', displayText);

  const handlePress = () => {
    router.push(`/purchases/${purchase.id}`);
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation(); // Prevent triggering the card press
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      console.log(`🗑️ Deleting purchase: ${purchase.id}`);
      const result = await purchasesApiService.deletePurchase(purchase.id);
      
      if (result.success) {
        Alert.alert('✅ Success', 'Purchase has been deleted successfully!');
        onRefresh(); // Refresh the purchases list
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to delete purchase. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting purchase:', error);
      Alert.alert('❌ Error', 'Failed to delete purchase. Please try again.');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return '#10B981';
      case 'Pending': return '#3B82F6';
      case 'Partial': return '#F59E0B';
      case 'Overdue': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getProgressBarColor = (daysLeft: number) => {
    if (daysLeft <= 0) return '#EF4444'; // Red for close to deadline/overdue
    if (daysLeft <= 5) return '#EF4444'; // Red for urgent (4 days left)
    if (daysLeft <= 10) return '#F59E0B'; // Orange for warning (9 days left)
    return '#3B82F6'; // Blue for normal
  };

  const getProgressPercentage = (daysLeft: number) => {
    // Assuming a 30-day period for progress calculation
    const totalDays = 30;
    if (daysLeft <= 0) return 100; // Close to deadline/overdue = full bar
    if (daysLeft >= totalDays) return 0; // More than 30 days = empty bar
    return ((totalDays - daysLeft) / totalDays) * 100;
  };

  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysLeft(purchase.dueDate);
  
  // Debug logging to identify NaN issues
  console.log('🛒 PurchaseCard debug for purchase', purchase.id, ':');
  console.log('- Full purchase object:', purchase);
  console.log('- purchase.totalGrams:', purchase.totalGrams, typeof purchase.totalGrams);
  console.log('- purchase.payments.gramsPaid:', purchase.payments.gramsPaid, typeof purchase.payments.gramsPaid);
  console.log('- purchase.totalFees:', purchase.totalFees, typeof purchase.totalFees);
  console.log('- purchase.payments.feesPaid:', purchase.payments.feesPaid, typeof purchase.payments.feesPaid);
  console.log('- purchase.suppliers:', purchase.suppliers);
  
  // Helper function to format grams display (rounding is handled at data level)
  const formatGrams = (grams: number): string => {
    return grams % 1 === 0 ? grams.toString() : grams.toFixed(1);
  };

  // Ensure we have valid numbers, default to 0 if NaN or undefined
  const totalGrams = Number(purchase.totalGrams) || 0;
  const gramsPaid = Number(purchase.payments.gramsPaid) || 0;
  const totalFees = Number(purchase.totalFees) || 0;
  const feesPaid = Number(purchase.payments.feesPaid) || 0;
  
  const remainingGrams = roundGrams(totalGrams - gramsPaid);
  const remainingFees = totalFees - feesPaid;
  
  console.log('- calculated remainingGrams:', remainingGrams);
  console.log('- calculated remainingFees:', remainingFees);

  // Format date to show month name and day
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.dateSection}>
          <View style={styles.calendarIcon}>
            <Text style={styles.calendarText}>📅</Text>
            <Text style={styles.calendarDate}>JUL 17</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(purchase.date)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(purchase.status) }]}>
            <Text style={styles.statusText}>{purchase.status}</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleDeletePress}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storeSection}>
        <Text style={styles.storeIcon}>📍</Text>
        <Text style={styles.storeName}>
          {storesLoading ? 'Loading...' : (store?.code || `Store ${purchase.storeId}`)}
        </Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: getProgressBarColor(daysLeft), width: `${getProgressPercentage(daysLeft)}%` }]} />
        <View style={styles.progressContent}>
          <Text style={styles.progressGrams}>{formatGrams(totalGrams)}g</Text>
          <Text style={styles.progressDays}>
            {daysLeft <= 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
          </Text>
        </View>
      </View>

      <View style={styles.amountsSection}>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Grams Due</Text>
          <Text style={styles.amountValue}>{formatGrams(remainingGrams)}g</Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Fees Due</Text>
          <Text style={styles.amountValue}>EGP {remainingFees.toLocaleString()}</Text>
        </View>
      </View>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Purchase"
        message={`Are you sure you want to delete this purchase from ${formatDate(purchase.date)}? This action cannot be undone.`}
      />
    </TouchableOpacity>
  );
}