import { calculateDueDate, calculatePurchaseFees, generatePaymentId, generatePurchaseId, getMockPurchases, setMockPurchases } from '../business';
import { CreatePurchaseRequest, MonthlyTrends, Payment, PaymentTotals, PaymentValidation, Purchase, PurchaseFilters, PurchaseStats, RemainingAmounts } from '../types';
import { calculateStatus, getDaysLeft } from '../utils';
import { RecalculationService } from './recalculationService';
import { emitPaymentAdded, emitPaymentDeleted } from './refreshEvents';

// Purchase Service
export class PurchaseService {
  // Get all purchases
  static getAllPurchases(): Purchase[] {
    return getMockPurchases();
  }

  // Get purchase by ID
  static getPurchaseById(id: string): Purchase | undefined {
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === id);
    console.log(`PurchaseService.getPurchaseById(${id}): found purchase with ${purchase?.paymentHistory?.length || 0} payments`);
    return purchase;
  }

  // Create new purchase
  static createPurchase(purchaseData: CreatePurchaseRequest): Purchase {
    const purchases = getMockPurchases();
    const newId = generatePurchaseId();
    
    const fees = calculatePurchaseFees(purchaseData.suppliers, purchaseData.date);
    // Calculate total grams from the new karat structure (sum of totalGrams21k for all suppliers)
    const totalGrams = Math.round(Object.values(purchaseData.suppliers).reduce((sum, supplierData) => {
      if (supplierData && typeof supplierData === 'object') {
        return sum + (supplierData.totalGrams21k || 0);
      }
      return sum;
    }, 0) * 10) / 10; // Round to 1 decimal place
    
    const newPurchase: Purchase = {
      id: newId,
      date: purchaseData.date,
      storeId: purchaseData.storeId,
      status: 'Pending',
      totalGrams,
      totalFees: fees.totalFees,
      totalDiscount: fees.totalDiscount,
      dueDate: calculateDueDate(purchaseData.date),
      suppliers: purchaseData.suppliers,
      payments: {
        gramsPaid: 0,
        feesPaid: 0,
      },
      paymentHistory: [],
    };

    // Add new purchase to the list
    const updatedPurchases = [...purchases, newPurchase];
    
    // Recalculate all purchases in the month after adding new purchase
    const recalculatedResult = RecalculationService.recalculateAfterPurchaseChange(updatedPurchases, purchaseData.date);
    
    // Update mock data with recalculated purchases
    setMockPurchases(recalculatedResult.updatedPurchases);
    
    return newPurchase;
  }

  // Update purchase
  static updatePurchase(id: string, updates: Partial<Purchase>): boolean {
    const purchases = getMockPurchases();
    const index = purchases.findIndex(p => p.id === id);
    
    if (index === -1) return false;
    
    purchases[index] = { ...purchases[index], ...updates };
    setMockPurchases(purchases);
    
    return true;
  }

  // Delete purchase
  static deletePurchase(id: string): boolean {
    const purchases = getMockPurchases();
    const filteredPurchases = purchases.filter(p => p.id !== id);
    
    if (filteredPurchases.length === purchases.length) return false;
    
    setMockPurchases(filteredPurchases);
    return true;
  }

  // Get purchase count (for testing tier behavior)
  static getPurchaseCount(): number {
    return getMockPurchases().length;
  }

  // Reset to default state (for testing)
  static resetToDefaultState(): void {
    // This will reset the mock data to its initial state
    // The businessLogic.ts file contains the initial mock data
    window.location.reload(); // Simple way to reset everything
  }

  // Filter purchases
  static filterPurchases(filters: PurchaseFilters): Purchase[] {
    let purchases = getMockPurchases();
    
    if (filters.store && filters.store !== 'All') {
      purchases = purchases.filter(p => p.storeId === filters.store);
    }
    
    if (filters.status) {
      purchases = purchases.filter(p => p.status === filters.status);
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      purchases = purchases.filter(p => 
        p.storeId.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query) ||
        p.id.includes(query)
      );
    }
    
    if (filters.dateFrom) {
      purchases = purchases.filter(p => p.date >= filters.dateFrom!);
    }
    
    if (filters.dateTo) {
      purchases = purchases.filter(p => p.date <= filters.dateTo!);
    }
    
    // Sort by days left (fewer days at the top - most urgent first)
    purchases.sort((a, b) => {
      const daysLeftA = getDaysLeft(a.dueDate);
      const daysLeftB = getDaysLeft(b.dueDate);
      return daysLeftA - daysLeftB; // Ascending order (fewer days first)
    });
    
    return purchases;
  }
}

// Payment Service
export class PaymentService {
  // Add a payment to a purchase
  static addPayment(purchaseId: string, paymentData: Omit<Payment, 'id'>): boolean {
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return false;

    const newPayment: Payment = {
      id: generatePaymentId(purchaseId),
      ...paymentData,
    };

    // Add to payment history
    purchase.paymentHistory.push(newPayment);
    
    // Update totals
    purchase.payments.gramsPaid += paymentData.gramsPaid;
    purchase.payments.feesPaid += paymentData.feesPaid;
    
    // Update status
    purchase.status = calculateStatus(purchase);
    
    // Recalculate all purchases in the current month after payment change
    const recalculatedPurchases = RecalculationService.recalculateAfterPaymentChange(purchases, purchaseId);
    
    // Update mock data with recalculated purchases
    setMockPurchases(recalculatedPurchases);
    
    // Emit refresh event to update UI
    console.log('Emitting payment-added event for purchase:', purchaseId);
    emitPaymentAdded();
    
    return true;
  }

  // Get all payments for a purchase
  static getPayments(purchaseId: string): Payment[] {
    const purchase = PurchaseService.getPurchaseById(purchaseId);
    const payments = purchase?.paymentHistory || [];
    console.log(`PaymentService.getPayments(${purchaseId}): returning ${payments.length} payments`);
    return payments;
  }

  // Get payment totals for a purchase
  static getPaymentTotals(purchaseId: string): PaymentTotals {
    const purchase = PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { gramsPaid: 0, feesPaid: 0 };

    return {
      gramsPaid: purchase.payments.gramsPaid,
      feesPaid: purchase.payments.feesPaid,
    };
  }

  // Calculate remaining amounts
  static getRemainingAmounts(purchaseId: string): RemainingAmounts {
    const purchase = PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { gramsDue: 0, feesDue: 0 };

    return {
      gramsDue: purchase.totalGrams - purchase.payments.gramsPaid,
      feesDue: purchase.totalFees - purchase.payments.feesPaid,
    };
  }

  // Validate payment amounts
  static validatePayment(purchaseId: string, gramsPaid: number, feesPaid: number): PaymentValidation {
    const purchase = PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { valid: false, error: 'Purchase not found' };

    if (gramsPaid <= 0 && feesPaid <= 0) {
      return { valid: false, error: 'Please enter at least one payment amount (fees or grams).' };
    }

    const remaining = this.getRemainingAmounts(purchaseId);
    
    if (gramsPaid > remaining.gramsDue) {
      return { valid: false, error: 'Grams paid cannot exceed grams due.' };
    }

    // Fees can exceed fees due - no validation needed

    return { valid: true };
  }

  // Delete payment
  static deletePayment(purchaseId: string, paymentId: string): boolean {
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return false;

    const paymentIndex = purchase.paymentHistory.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return false;

    const payment = purchase.paymentHistory[paymentIndex];
    
    // Remove payment
    purchase.paymentHistory.splice(paymentIndex, 1);
    
    // Update totals
    purchase.payments.gramsPaid -= payment.gramsPaid;
    purchase.payments.feesPaid -= payment.feesPaid;
    
    // Update status
    purchase.status = calculateStatus(purchase);
    
    // Recalculate all purchases in the current month after payment change
    const recalculatedPurchases = RecalculationService.recalculateAfterPaymentChange(purchases, purchaseId);
    
    // Update mock data with recalculated purchases
    setMockPurchases(recalculatedPurchases);
    
    // Emit refresh event to update UI
    console.log('Emitting payment-deleted event for payment:', paymentId);
    emitPaymentDeleted();
    
    return true;
  }
}

// Analytics Service
export class AnalyticsService {
  // Get purchase statistics
  static getPurchaseStats(): PurchaseStats {
    const purchases = getMockPurchases();
    
    const stats = purchases.reduce((acc, purchase) => {
      acc.totalPurchases += 1;
      acc.totalGrams += purchase.totalGrams;
      acc.totalFees += purchase.totalFees;
      acc.totalPaid += purchase.payments.feesPaid;
      if (purchase.status === 'Overdue') {
        acc.overdueCount += 1;
      }
      return acc;
    }, {
      totalPurchases: 0,
      totalGrams: 0,
      totalFees: 0,
      totalPaid: 0,
      pendingAmount: 0,
      overdueCount: 0,
    });
    
    stats.pendingAmount = stats.totalFees - stats.totalPaid;
    
    return stats;
  }

  // Get monthly trends
  static getMonthlyTrends(): MonthlyTrends {
    const purchases = getMockPurchases();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const current = purchases.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const previous = purchases.filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    });
    
    return {
      currentMonth: {
        grams: current.reduce((sum, p) => sum + p.totalGrams, 0),
        fees: current.reduce((sum, p) => sum + p.totalFees, 0),
        purchases: current.length,
      },
      previousMonth: {
        grams: previous.reduce((sum, p) => sum + p.totalGrams, 0),
        fees: previous.reduce((sum, p) => sum + p.totalFees, 0),
        purchases: previous.length,
      },
    };
  }
}
