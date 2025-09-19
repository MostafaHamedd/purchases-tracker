import { PurchaseCardProps } from '@/data';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function PurchaseCard({ purchase, onRefresh }: PurchaseCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/purchases/${purchase.id}`);
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
  const remainingGrams = purchase.totalGrams - purchase.payments.gramsPaid;
  const remainingFees = purchase.totalFees - purchase.payments.feesPaid;

  // Format date to show month abbreviation and day
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
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
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storeSection}>
        <Text style={styles.storeIcon}>📍</Text>
        <Text style={styles.storeName}>{purchase.store}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { backgroundColor: getProgressBarColor(daysLeft), width: `${getProgressPercentage(daysLeft)}%` }]} />
        <View style={styles.progressContent}>
          <Text style={styles.progressGrams}>{remainingGrams}g</Text>
          <Text style={styles.progressDays}>
            {daysLeft <= 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
          </Text>
        </View>
      </View>

      <View style={styles.amountsSection}>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Grams Due</Text>
          <Text style={styles.amountValue}>{remainingGrams}g</Text>
        </View>
        <View style={styles.amountColumn}>
          <Text style={styles.amountLabel}>Fees Due</Text>
          <Text style={styles.amountValue}>EGP {remainingFees.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    alignItems: 'center',
    marginRight: 12,
  },
  calendarText: {
    fontSize: 16,
  },
  calendarDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  storeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  storeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 16,
  },
  progressContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  progressGrams: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  progressDays: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  amountsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountColumn: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});