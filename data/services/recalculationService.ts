import { Purchase, Payment } from '../types/dataTypes';
import { RecalculationOptions, RecalculationResult } from '../types/eventTypes';
import { APP_CONFIG } from '../constants';
import { calculatePurchaseBaseFees, calculatePurchaseTotalDiscount } from '../business';
import { calculateStatus } from '../utils';

/**
 * Recalculation Service
 * 
 * This service handles recalculation of purchase data that depends on monthly totals
 * and other dynamic factors. It's designed to work independently of the data source
 * (mock data or API) so it can be easily adapted when switching to a real database.
 */

export class RecalculationService {
  /**
   * Recalculates all purchases in a given month
   * This is needed when:
   * - A new purchase is added (affects monthly totals and discounts)
   * - A purchase is deleted (affects monthly totals and discounts)
   * - Payments are made (affects status and progress)
   */
  static recalculateMonth(options: RecalculationOptions): RecalculationResult {
    const { purchases, targetMonth, targetYear } = options;
    
    // Determine target month/year
    const now = new Date();
    const month = targetMonth ?? now.getMonth();
    const year = targetYear ?? now.getFullYear();
    
    // Filter purchases for the target month
    const monthPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.date);
      return purchaseDate.getMonth() === month && purchaseDate.getFullYear() === year;
    });
    
    // Calculate monthly total grams
    const monthlyTotalGrams = monthPurchases.reduce((total, purchase) => {
      return total + purchase.totalGrams;
    }, 0);
    
    // Check if discount is eligible for this month
    const discountEligible = monthlyTotalGrams >= APP_CONFIG.MONTHLY_DISCOUNT_THRESHOLDS.MEDIUM;
    
    // Recalculate each purchase in the month
    const updatedPurchases = purchases.map(purchase => {
      const purchaseDate = new Date(purchase.date);
      const isInTargetMonth = purchaseDate.getMonth() === month && purchaseDate.getFullYear() === year;
      
      if (isInTargetMonth) {
        return this.recalculatePurchase(purchase, discountEligible);
      }
      
      return purchase; // Return unchanged if not in target month
    });
    
    return {
      updatedPurchases,
      monthlyTotalGrams,
      discountEligible
    };
  }
  
  /**
   * Recalculates a single purchase
   * This includes:
   * - Recalculating base fees and discounts
   * - Updating total fees
   * - Recalculating status based on payments
   */
  static recalculatePurchase(purchase: Purchase, discountEligible?: boolean): Purchase {
    // Calculate base fees
    const baseFees = calculatePurchaseBaseFees(purchase.suppliers);
    
    // Calculate total discount (this will use the current monthly total)
    const totalDiscount = calculatePurchaseTotalDiscount(purchase.suppliers, purchase.date);
    
    // Calculate net fees
    const totalFees = baseFees - totalDiscount;
    
    // Recalculate status based on current payments
    const updatedPurchase: Purchase = {
      ...purchase,
      totalFees,
      status: calculateStatus(purchase)
    };
    
    return updatedPurchase;
  }
  
  /**
   * Recalculates all purchases that might be affected by a change
   * This is a convenience method that recalculates the current month
   */
  static recalculateCurrentMonth(purchases: Purchase[]): RecalculationResult {
    return this.recalculateMonth({ purchases });
  }
  
  /**
   * Recalculates purchases after a payment is added/modified/deleted
   * This focuses on status recalculation rather than fee recalculation
   */
  static recalculateAfterPaymentChange(purchases: Purchase[], affectedPurchaseId: string): Purchase[] {
    return purchases.map(purchase => {
      if (purchase.id === affectedPurchaseId) {
        // Recalculate status for the affected purchase
        return {
          ...purchase,
          status: calculateStatus(purchase)
        };
      }
      return purchase;
    });
  }
  
  /**
   * Recalculates purchases after a new purchase is added
   * This recalculates the entire month to update discounts
   */
  static recalculateAfterPurchaseChange(purchases: Purchase[], newPurchaseDate: string): RecalculationResult {
    const purchaseDate = new Date(newPurchaseDate);
    return this.recalculateMonth({
      purchases,
      targetMonth: purchaseDate.getMonth(),
      targetYear: purchaseDate.getFullYear()
    });
  }
}

// Export convenience functions for easy use
export const recalculateCurrentMonth = (purchases: Purchase[]): RecalculationResult => {
  return RecalculationService.recalculateCurrentMonth(purchases);
};

export const recalculateAfterPaymentChange = (purchases: Purchase[], affectedPurchaseId: string): Purchase[] => {
  return RecalculationService.recalculateAfterPaymentChange(purchases, affectedPurchaseId);
};

export const recalculateAfterPurchaseChange = (purchases: Purchase[], newPurchaseDate: string): RecalculationResult => {
  return RecalculationService.recalculateAfterPurchaseChange(purchases, newPurchaseDate);
};
