import { styles } from '@/app/(tabs)/purchases/styles';
import { ThemedText } from '@/components/themed-text';
import { PurchaseFilters, PurchaseService, refreshEvents } from '@/data';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStores } from '../stores/hooks/useStores';
import { AddPurchaseDialog } from './components/AddPurchaseDialog';
import { PurchaseCard } from './components/PurchaseCard';

export default function PurchasesScreen() {
  const { stores, loading: storesLoading } = useStores();
  
  // Debug logging for stores
  console.log('Purchases screen - stores loading:', storesLoading);
  console.log('Purchases screen - stores:', stores);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get purchases with filters
  const filters: PurchaseFilters = useMemo(() => ({
    store: selectedStore === 'All' ? undefined : selectedStore,
    searchQuery: searchQuery || undefined,
  }), [selectedStore, searchQuery]);

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);

  // Fetch purchases from API
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setPurchasesLoading(true);
        const filteredPurchases = await PurchaseService.filterPurchases(filters);
        console.log('Purchases filter debug:');
        console.log('- selectedStore:', selectedStore);
        console.log('- filters:', filters);
        console.log('- filtered purchases count:', filteredPurchases.length);
        console.log('- stores:', stores.map(s => ({ id: s.id, code: s.code })));
        setPurchases(filteredPurchases);
      } catch (error) {
        console.error('Error fetching purchases:', error);
        setPurchases([]);
      } finally {
        setPurchasesLoading(false);
      }
    };

    fetchPurchases();
  }, [filters, refreshKey, selectedStore, stores]);

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

  const handleAddPurchase = async (purchaseData: any) => {
    try {
      const result = await PurchaseService.createPurchase(purchaseData);
      if (result.success) {
        setShowAddDialog(false);
        setRefreshKey(prev => prev + 1);
        Alert.alert('Success', 'Purchase created successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to create purchase. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create purchase. Please try again.');
    }
  };

  // Calculate monthly totals for September 2025
  const currentMonthPurchases = purchases.filter(p => {
    const date = new Date(p.date);
    return date.getMonth() === 8 && date.getFullYear() === 2025; // September 2025
  });
  
  const monthlyTotalGrams = currentMonthPurchases.reduce((sum, p) => sum + p.totalGrams, 0);
  const hasDiscount = monthlyTotalGrams >= 1000;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>Purchases</ThemedText>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddDialog(true)}
        >
          <Text style={styles.addButtonText}>+ Add Purchase</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Summary Card */}
      <View style={styles.monthlySummaryCard}>
        <View style={styles.monthlySummaryHeader}>
          <Text style={styles.monthlySummaryTitle}>September 2025 Total</Text>
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>Discount Applied</Text>
            </View>
          )}
        </View>
        <Text style={styles.monthlyTotalGrams}>{monthlyTotalGrams}g</Text>
        {hasDiscount && (
          <View style={styles.discountInfo}>
            <Text style={styles.discountInfoText}>✓ High tier reached - maximum discounts applied to all September 2025 purchases.</Text>
          </View>
        )}
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search purchases..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
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
                style={[styles.filterButton, selectedStore === store.id && styles.activeFilter]}
                onPress={() => setSelectedStore(store.id)}
              >
                <Text style={[styles.filterText, selectedStore === store.id && styles.activeFilterText]}>
                  {store.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Purchases List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {purchasesLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading purchases...</Text>
          </View>
        ) : (
          purchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              onRefresh={() => setRefreshKey(prev => prev + 1)}
            />
          ))
        )}
        
        {purchases.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No purchases found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Purchase Dialog */}
      <AddPurchaseDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddPurchase}
      />
    </SafeAreaView>
  );
}