import { HistoryService, PurchaseService, refreshEvents } from '@/data';
import { MonthData, Purchase } from '@/data/types';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStores } from '../stores/hooks/useStores';

export default function HistoryScreen() {
  const { stores } = useStores();
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [refreshKey, setRefreshKey] = useState(0);

  // Get all purchases
  const allPurchases = useMemo(() => {
    return PurchaseService.getAllPurchases();
  }, [refreshKey]);

  // Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };

    refreshEvents.on('purchase-updated', handleRefresh);
    refreshEvents.on('payment-added', handleRefresh);
    refreshEvents.on('payment-deleted', handleRefresh);

    return () => {
      refreshEvents.off('purchase-updated', handleRefresh);
      refreshEvents.off('payment-added', handleRefresh);
      refreshEvents.off('payment-deleted', handleRefresh);
    };
  }, []);

  // Group purchases by month using HistoryService
  const monthlyData = useMemo(() => {
    return HistoryService.getMonthlyData(allPurchases, stores);
  }, [allPurchases, stores]);

  const filteredPurchases = useMemo(() => {
    if (!selectedMonth) return [];
    return HistoryService.filterPurchasesByStore(selectedMonth.purchases, selectedStore, stores);
  }, [selectedMonth, selectedStore, stores]);

  const filteredMonthlyData = useMemo(() => {
    return HistoryService.filterMonthlyDataByStore(monthlyData, selectedStore, stores);
  }, [monthlyData, selectedStore, stores]);

  const renderMonthCard = (monthData: MonthData) => {
    const isSelected = selectedMonth?.month === monthData.month && selectedMonth?.year === monthData.year;
    
    return (
      <TouchableOpacity
        key={`${monthData.year}-${monthData.month}`}
        style={[styles.monthCard, isSelected && styles.selectedMonthCard]}
        onPress={() => setSelectedMonth(isSelected ? null : monthData)}
      >
        <View style={styles.monthHeader}>
          <Text style={[styles.monthName, isSelected && styles.selectedMonthName]}>
            {monthData.monthName}
          </Text>
          <Text style={[styles.purchaseCount, isSelected && styles.selectedPurchaseCount]}>
            {monthData.purchases.length} purchase{monthData.purchases.length !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.monthStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isSelected && styles.selectedStatLabel]}>Total Grams</Text>
            <Text style={[styles.statValue, isSelected && styles.selectedStatValue]}>
              {monthData.totalGrams.toLocaleString()}g
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, isSelected && styles.selectedStatLabel]}>Net Fees</Text>
            <Text style={[
              styles.statValue, 
              isSelected && styles.selectedStatValue,
              { color: monthData.netFees < 0 ? '#3B82F6' : '#EF4444' }
            ]}>
              EGP {monthData.netFees.toLocaleString()}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.expandedContent}>
            <View style={styles.storeBreakdown}>
              <Text style={styles.breakdownTitle}>Store Breakdown</Text>
              {Object.entries(monthData.storeBreakdown).map(([storeName, data]) => (
                <View key={storeName} style={styles.storeItem}>
                  <Text style={styles.storeName}>{storeName}</Text>
                  <View style={styles.storeStats}>
                    <Text style={styles.storeStat}>
                      {data.purchases.length} purchase{data.purchases.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.storeStat}>
                      {data.totalGrams.toLocaleString()}g
                    </Text>
                    <Text style={[styles.storeStat, { color: (data.totalFees || 0) < 0 ? '#3B82F6' : '#EF4444' }]}>
                      EGP {(data.totalFees || 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPurchaseCard = (purchase: Purchase) => {
    const storeName = HistoryService.getStoreNameForPurchase(purchase, stores);
    const statusColor = HistoryService.getStatusColor(purchase.status);
    const formattedDate = HistoryService.formatPurchaseDate(purchase.date);
    const netFees = HistoryService.calculateNetFees(purchase);
    
    return (
      <View key={purchase.id} style={styles.purchaseCard}>
        <View style={styles.purchaseHeader}>
          <Text style={styles.purchaseDate}>
            {formattedDate}
          </Text>
          <Text style={[styles.purchaseStatus, { color: statusColor }]}>
            {purchase.status}
          </Text>
        </View>
        
        <Text style={styles.storeName}>{storeName}</Text>
        
        <View style={styles.purchaseStats}>
          <View style={styles.purchaseStat}>
            <Text style={styles.purchaseStatLabel}>Grams</Text>
            <Text style={styles.purchaseStatValue}>{purchase.totalGrams.toLocaleString()}g</Text>
          </View>
          <View style={styles.purchaseStat}>
            <Text style={styles.purchaseStatLabel}>Net Fees</Text>
            <Text style={[
              styles.purchaseStatValue,
              { color: netFees < 0 ? '#3B82F6' : '#EF4444' }
            ]}>
              EGP {netFees.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, selectedStore === 'All' && styles.activeFilter]}
              onPress={() => setSelectedStore('All')}
            >
              <Text style={[styles.filterText, selectedStore === 'All' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                style={[styles.filterButton, selectedStore === store.name && styles.activeFilter]}
                onPress={() => setSelectedStore(store.name)}
              >
                <Text style={[styles.filterText, selectedStore === store.name && styles.activeFilterText]}>
                  {store.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.monthsContainer}>
          {filteredMonthlyData.map(renderMonthCard)}
        </View>

        {selectedMonth && (
          <View style={styles.detailsSection}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>
                {selectedMonth.monthName} Details
              </Text>
            </View>

            <View style={styles.purchasesContainer}>
              {filteredPurchases.map(renderPurchaseCard)}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollView: {
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilter: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  monthsContainer: {
    padding: 16,
    gap: 12,
  },
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  selectedMonthCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedMonthName: {
    color: '#1E40AF',
  },
  purchaseCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedPurchaseCount: {
    color: '#3B82F6',
  },
  monthStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedStatLabel: {
    color: '#3B82F6',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  selectedStatValue: {
    color: '#1E40AF',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  storeBreakdown: {
    gap: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  storeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  storeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  storeStat: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 60,
    textAlign: 'right',
  },
  detailsSection: {
    padding: 16,
    paddingTop: 0,
  },
  detailsHeader: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  purchasesContainer: {
    gap: 12,
  },
  purchaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  purchaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  purchaseDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  purchaseStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  purchaseStats: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  purchaseStat: {
    flex: 1,
  },
  purchaseStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  purchaseStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});