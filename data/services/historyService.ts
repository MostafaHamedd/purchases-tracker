import { MonthData, Purchase, Store } from '../types';

export class HistoryService {
  /**
   * Groups purchases by month and calculates monthly statistics
   */
  static getMonthlyData(purchases: Purchase[], stores: Store[]): MonthData[] {
    const monthMap = new Map<string, MonthData>();

    purchases.forEach(purchase => {
      const date = new Date(purchase.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthKey = `${year}-${month}`;
      
      const monthName = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          year,
          month,
          monthName,
          purchases: [],
          totalGrams: 0,
          totalFees: 0,
          totalDiscount: 0,
          netFees: 0,
          storeBreakdown: {}
        });
      }

      const monthData = monthMap.get(monthKey)!;
      monthData.purchases.push(purchase);
      monthData.totalGrams += purchase.totalGrams;
      monthData.totalFees += purchase.totalFees;
      monthData.totalDiscount += purchase.totalDiscount;
      monthData.netFees += purchase.totalFees - purchase.totalDiscount;

      // Store breakdown
      const store = stores.find(s => s.id === purchase.storeId);
      const storeName = store?.name || 'Unknown Store';
      
      if (!monthData.storeBreakdown[storeName]) {
        monthData.storeBreakdown[storeName] = {
          purchases: [],
          totalGrams: 0,
          totalFees: 0
        };
      }
      
      monthData.storeBreakdown[storeName].purchases.push(purchase);
      monthData.storeBreakdown[storeName].totalGrams += purchase.totalGrams;
      monthData.storeBreakdown[storeName].totalFees += purchase.totalFees;
    });

    // Sort by date (newest first)
    return Array.from(monthMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }

  /**
   * Filters monthly data by store
   */
  static filterMonthlyDataByStore(monthlyData: MonthData[], storeName: string, stores: Store[]): MonthData[] {
    if (storeName === 'All') {
      return monthlyData;
    }
    
    return monthlyData.map(monthData => ({
      ...monthData,
      purchases: monthData.purchases.filter(purchase => {
        const store = stores.find(s => s.id === purchase.storeId);
        return store?.name === storeName;
      })
    })).filter(monthData => monthData.purchases.length > 0);
  }

  /**
   * Filters purchases by store within a selected month
   */
  static filterPurchasesByStore(purchases: Purchase[], storeName: string, stores: Store[]): Purchase[] {
    if (storeName === 'All') {
      return purchases;
    }
    
    return purchases.filter(purchase => {
      const store = stores.find(s => s.id === purchase.storeId);
      return store?.name === storeName;
    });
  }

  /**
   * Gets store name for a purchase
   */
  static getStoreNameForPurchase(purchase: Purchase, stores: Store[]): string {
    const store = stores.find(s => s.id === purchase.storeId);
    return store?.name || 'Unknown Store';
  }

  /**
   * Gets status color for a purchase
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'Paid':
        return '#10B981';
      case 'Pending':
        return '#F59E0B';
      case 'Overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  /**
   * Formats purchase date for display
   */
  static formatPurchaseDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Calculates net fees for a purchase
   */
  static calculateNetFees(purchase: Purchase): number {
    return purchase.totalFees - purchase.totalDiscount;
  }
}
