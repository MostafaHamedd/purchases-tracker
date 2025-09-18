import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Link } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoIcon}>💎</Text>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Jewelry Store Manager
            </ThemedText>
            <ThemedText style={styles.heroSubtitle}>
              Track purchases, payments, and discounts across your stores with precision and elegance
            </ThemedText>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🛒</Text>
              </View>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Active Purchases</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statNumber}>2.4K</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🏪</Text>
              </View>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Stores</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>📈</Text>
              </View>
              <Text style={styles.statNumber}>15%</Text>
              <Text style={styles.statLabel}>Growth</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <Link href="/purchases" asChild>
              <TouchableOpacity style={[styles.actionCard, styles.primaryAction]}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🛒</Text>
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>View Purchases</Text>
                  <Text style={styles.actionSubtitle}>Manage all purchases and payments</Text>
                </View>
                <View style={styles.actionArrow}>
                  <Text style={styles.arrowIcon}>→</Text>
                </View>
              </TouchableOpacity>
            </Link>
            
            <View style={[styles.actionCard, styles.disabledAction]}>
              <View style={[styles.actionIconContainer, styles.disabledIconContainer]}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.disabledText]}>Analytics</Text>
                <Text style={[styles.actionSubtitle, styles.disabledSubtext]}>Coming soon</Text>
              </View>
              <View style={[styles.actionArrow, styles.disabledArrow]}>
                <Text style={[styles.arrowIcon, styles.disabledArrowText]}>→</Text>
              </View>
            </View>
            
            <View style={[styles.actionCard, styles.disabledAction]}>
              <View style={[styles.actionIconContainer, styles.disabledIconContainer]}>
                <Text style={styles.actionIcon}>⚙️</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.disabledText]}>Settings</Text>
                <Text style={[styles.actionSubtitle, styles.disabledSubtext]}>Coming soon</Text>
              </View>
              <View style={[styles.actionArrow, styles.disabledArrow]}>
                <Text style={[styles.arrowIcon, styles.disabledArrowText]}>→</Text>
              </View>
            </View>
            
            <View style={[styles.actionCard, styles.disabledAction]}>
              <View style={[styles.actionIconContainer, styles.disabledIconContainer]}>
                <Text style={styles.actionIcon}>📱</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.disabledText]}>Support</Text>
                <Text style={[styles.actionSubtitle, styles.disabledSubtext]}>Coming soon</Text>
              </View>
              <View style={[styles.actionArrow, styles.disabledArrow]}>
                <Text style={[styles.arrowIcon, styles.disabledArrowText]}>→</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>✅</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Payment Received</Text>
                <Text style={styles.activitySubtitle}>Purchase #3 - 500g gold</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>🆕</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>New Purchase</Text>
                <Text style={styles.activitySubtitle}>Store A - 300g mixed gold</Text>
                <Text style={styles.activityTime}>5 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>💰</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Discount Applied</Text>
                <Text style={styles.activitySubtitle}>Monthly tier reached</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  // Hero Section
  heroSection: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 24,
    backgroundColor: '#667eea',
  },
  heroContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  // Stats Section
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: -30,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  // Actions Section
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  actionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  // Activity Section
  activitySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // Disabled action styles
  disabledAction: {
    opacity: 0.6,
  },
  disabledIconContainer: {
    backgroundColor: '#F8FAFC',
  },
  disabledText: {
    color: '#94A3B8',
  },
  disabledSubtext: {
    color: '#CBD5E1',
  },
  disabledArrow: {
    backgroundColor: '#F1F5F9',
  },
  disabledArrowText: {
    color: '#CBD5E1',
  },
});