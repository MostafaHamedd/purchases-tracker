import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { PurchaseService, PurchaseFilters } from '@/data';
import { refreshEvents } from '@/data';
import { PurchaseCard } from './components/PurchaseCard';
import { AddPurchaseDialog } from './components/AddPurchaseDialog';
import { styles } from '@/app/(tabs)/purchases/styles';

export default function PurchasesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('All');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get purchases with filters
  const filters: PurchaseFilters = useMemo(() => ({
    store: selectedStore === 'All' ? undefined : selectedStore,
    searchQuery: searchQuery || undefined,
  }), [selectedStore, searchQuery]);

  const purchases = useMemo(() => {
    return PurchaseService.filterPurchases(filters);
  }, [filters, refreshKey]);

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

  const handleAddPurchase = (purchaseData: any) => {
    try {
      PurchaseService.createPurchase(purchaseData);
      setShowAddDialog(false);
      setRefreshKey(prev => prev + 1);
      Alert.alert('Success', 'Purchase created successfully!');
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
            <TouchableOpacity
              style={[styles.filterButton, selectedStore === 'Store A' && styles.activeFilter]}
              onPress={() => setSelectedStore('Store A')}
            >
              <Text style={[styles.filterText, selectedStore === 'Store A' && styles.activeFilterText]}>
                Store A
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedStore === 'Store B' && styles.activeFilter]}
              onPress={() => setSelectedStore('Store B')}
            >
              <Text style={[styles.filterText, selectedStore === 'Store B' && styles.activeFilterText]}>
                Store B
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Purchases List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {purchases.map((purchase) => (
          <PurchaseCard
            key={purchase.id}
            purchase={purchase}
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        ))}
        
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