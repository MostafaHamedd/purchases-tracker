import { calculateDueDate, calculatePurchaseFees } from '../business';
import { CreatePurchaseRequest, MonthlyTrends, Payment, PaymentTotals, PaymentValidation, Purchase, PurchaseFilters, PurchaseStats, RemainingAmounts } from '../types';
import { convertTo21kEquivalent, getDaysLeft } from '../utils';
import { ApiPayment, CreatePaymentData, paymentsApiService } from './paymentsApiService';
import { ApiPurchase, CreatePurchaseData, purchasesApiService } from './purchasesApiService';
import { emitPaymentAdded, emitPaymentDeleted } from './refreshEvents';

// Utility function for consistent grams rounding
const roundGrams = (grams: number): number => {
  return Math.round(grams * 10) / 10; // Round to 1 decimal place
};

// Convert API payment to app payment format
const convertApiPaymentToAppPayment = (apiPayment: ApiPayment): Payment => {
  return {
    id: apiPayment.id,
    date: apiPayment.date,
    gramsPaid: roundGrams(Number(apiPayment.grams_paid) || 0), // Convert string to number and round
    feesPaid: Number(apiPayment.fees_paid) || 0,   // Convert string to number
    karatType: apiPayment.karat_type,
    note: apiPayment.note,
  };
};

// Convert app payment to API payment format
const convertAppPaymentToApiPayment = (appPayment: Payment): CreatePaymentData => ({
  id: appPayment.id, // Include the id field that API requires
  date: appPayment.date,
  grams_paid: appPayment.gramsPaid,
  fees_paid: appPayment.feesPaid,
  karat_type: appPayment.karatType,
  note: appPayment.note,
});

// Convert API purchase to app purchase format
const convertApiPurchaseToAppPurchase = (apiPurchase: ApiPurchase): Purchase => {
  return {
    id: apiPurchase.id,
    date: apiPurchase.date,
    storeId: apiPurchase.store_id,
    status: apiPurchase.status,
    totalGrams: roundGrams(Number(apiPurchase.total_grams_21k_equivalent) || 0), // Convert string to number and round
    totalFees: Number(apiPurchase.total_base_fees) || 0,   // Convert string to number
    totalDiscount: Number(apiPurchase.total_discount_amount) || 0, // Convert string to number
    dueDate: apiPurchase.due_date,
    suppliers: {}, // Will be populated separately from purchase_suppliers table
    payments: {
      gramsPaid: 0, // Will be calculated from payments
      feesPaid: 0,  // Will be calculated from payments
    },
    paymentHistory: [], // Will be populated separately from payments table
  };
};

// Convert app purchase to API purchase format
const convertAppPurchaseToApiPurchase = (appPurchase: any): CreatePurchaseData => {
  console.log('🔄 Converting app purchase to API format:');
  console.log('   📥 Input appPurchase:', appPurchase);
  console.log('   📥 appPurchase.supplierId:', appPurchase.supplierId);
  
  const apiData = {
    id: appPurchase.id, // Include the id field that API requires
    date: appPurchase.date,
    store_id: appPurchase.storeId,
    supplier_id: appPurchase.supplierId, // Add supplier_id field
    total_grams_21k_equivalent: appPurchase.totalGrams, // Map to correct field name
    total_base_fees: appPurchase.totalFees, // Map to correct field name
    total_discount_amount: appPurchase.totalDiscount, // Map to correct field name
    total_net_fees: appPurchase.totalFees - appPurchase.totalDiscount, // Calculate net fees
    due_date: appPurchase.dueDate,
  };
  
  console.log('   📤 Output API data:', apiData);
  return apiData;
};

// Purchase Service
export class PurchaseService {
  // This function is no longer needed - using API only
  static recalculatePaymentTotals(): void {
    console.warn('⚠️ recalculatePaymentTotals: This function is no longer needed - using API only');
  }

  // Get all purchases
  static async getAllPurchases(): Promise<Purchase[]> {
    try {
      console.log('🛒 Fetching purchases from API...');
      const response = await purchasesApiService.getPurchases();
      
      console.log('🛒 Purchases API response:', response);
      
      if (response.success && response.data) {
        console.log('✅ API purchases loaded:', response.data.length);
        console.log('API purchases data:', response.data);
        
        // Convert API purchases to app format and populate with suppliers and payments
        const purchases = await Promise.all(
          response.data.map(async (apiPurchase) => {
            console.log('Processing API purchase:', apiPurchase);
            const purchase = convertApiPurchaseToAppPurchase(apiPurchase);
            
            // Get suppliers for this purchase
            try {
              const suppliersResponse = await purchasesApiService.getPurchaseSuppliers(purchase.id);
              if (suppliersResponse.success && suppliersResponse.data) {
                // Convert suppliers data to the expected format
                const suppliers: Record<string, { grams18k: number; grams21k: number; totalGrams21k: number }> = {};
                suppliersResponse.data.forEach(supplier => {
                  suppliers[supplier.supplier_code] = {
                    grams18k: supplier.grams_18k,
                    grams21k: supplier.grams_21k,
                    totalGrams21k: supplier.total_grams_21k_equivalent,
                  };
                });
                purchase.suppliers = suppliers;
              }
            } catch (error) {
              console.warn(`Failed to fetch suppliers for purchase ${purchase.id}:`, error);
            }
            
            // Get payments for this purchase
            try {
              const paymentsResponse = await paymentsApiService.getPaymentsByPurchase(purchase.id);
              if (paymentsResponse.success && paymentsResponse.data) {
                purchase.paymentHistory = paymentsResponse.data.map(convertApiPaymentToAppPayment);
                
                // Calculate payment totals
                const totalGramsPaid21k = purchase.paymentHistory.reduce((sum, payment) => {
                  const gramsPaid21kEquivalent = convertTo21kEquivalent(payment.gramsPaid, payment.karatType);
                  return sum + gramsPaid21kEquivalent;
                }, 0);
                
                const totalFeesPaid = purchase.paymentHistory.reduce((sum, payment) => {
                  return sum + (Number(payment.feesPaid) || 0);
                }, 0);
                
                console.log(`Payment calculation for purchase ${purchase.id}:`, {
                  paymentHistoryLength: purchase.paymentHistory.length,
                  totalGramsPaid21k,
                  totalFeesPaid,
                });
                
                purchase.payments = {
                  gramsPaid: totalGramsPaid21k,
                  feesPaid: totalFeesPaid,
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch payments for purchase ${purchase.id}:`, error);
            }
            
            return purchase;
          })
        );
        
        return purchases;
      } else {
        console.error('❌ Purchases API failed:', response);
        throw new Error('Failed to fetch purchases from API');
      }
    } catch (error) {
      console.error('❌ Error fetching purchases:', error);
      throw error;
    }
  }


  // Get purchase by ID
  static async getPurchaseById(id: string): Promise<Purchase | undefined> {
    try {
      console.log(`🛒 Fetching purchase ${id} from API...`);
      const response = await purchasesApiService.getPurchaseById(id);
      
      if (response.success && response.data) {
        console.log('✅ API purchase loaded:', response.data.id);
        const purchase = convertApiPurchaseToAppPurchase(response.data);
        
        // Get suppliers for this purchase
        try {
          const suppliersResponse = await purchasesApiService.getPurchaseSuppliers(purchase.id);
          if (suppliersResponse.success && suppliersResponse.data) {
            const suppliers: Record<string, { grams18k: number; grams21k: number; totalGrams21k: number }> = {};
            suppliersResponse.data.forEach(supplier => {
              suppliers[supplier.supplier_code] = {
                grams18k: supplier.grams_18k,
                grams21k: supplier.grams_21k,
                totalGrams21k: supplier.total_grams_21k_equivalent,
              };
            });
            purchase.suppliers = suppliers;
          }
        } catch (error) {
          console.warn(`Failed to fetch suppliers for purchase ${purchase.id}:`, error);
        }
        
        // Get payments for this purchase
        try {
          const paymentsResponse = await paymentsApiService.getPaymentsByPurchase(purchase.id);
          if (paymentsResponse.success && paymentsResponse.data) {
            purchase.paymentHistory = paymentsResponse.data.map(convertApiPaymentToAppPayment);
            
            // Calculate payment totals
            const totalGramsPaid21k = purchase.paymentHistory.reduce((sum, payment) => {
              const gramsPaid21kEquivalent = convertTo21kEquivalent(payment.gramsPaid, payment.karatType);
              return sum + gramsPaid21kEquivalent;
            }, 0);
            
            const totalFeesPaid = purchase.paymentHistory.reduce((sum, payment) => {
              return sum + (Number(payment.feesPaid) || 0);
            }, 0);
            
            purchase.payments = {
              gramsPaid: totalGramsPaid21k,
              feesPaid: totalFeesPaid,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch payments for purchase ${purchase.id}:`, error);
        }
        
        console.log(`PurchaseService.getPurchaseById(${id}): found purchase with ${purchase.paymentHistory.length} payments`);
        return purchase;
      } else {
        console.error('❌ Purchase API failed:', response);
        return undefined;
      }
    } catch (error) {
      console.error('❌ Error fetching purchase:', error);
      return undefined;
    }
  }

  // Create new purchase
  static async createPurchase(purchaseData: CreatePurchaseRequest): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      console.log('🛒 Creating Purchase...');
      console.log('   📦 Data:', purchaseData);
      console.log(''); // Add space
    
    const fees = calculatePurchaseFees(purchaseData.suppliers, purchaseData.date);
    // Calculate total grams from the new karat structure (sum of totalGrams21k for all suppliers)
    const totalGrams = roundGrams(Object.values(purchaseData.suppliers).reduce((sum, supplierData) => {
      if (supplierData && typeof supplierData === 'object') {
        return sum + (supplierData.totalGrams21k || 0);
      }
      return sum;
    }, 0)); // Round to 1 decimal place
      
      const purchaseDataForApi = {
        ...purchaseData,
        totalGrams,
        totalFees: fees.totalFees,
        totalDiscount: fees.totalDiscount,
        dueDate: calculateDueDate(purchaseData.date),
      };
      
      console.log('   📦 Purchase data before conversion:', purchaseDataForApi);
      console.log('   📦 Purchase data supplierId:', purchaseDataForApi.supplierId);
      
      const apiPurchaseData = convertAppPurchaseToApiPurchase(purchaseDataForApi);
      
      console.log('   📤 Sending to API:', apiPurchaseData);
      console.log('   📤 API Data includes supplier_id:', apiPurchaseData.supplier_id);
      console.log('   📤 Required fields check:');
      console.log('     - id:', apiPurchaseData.id);
      console.log('     - store_id:', apiPurchaseData.store_id);
      console.log('     - supplier_id:', apiPurchaseData.supplier_id);
      console.log('     - date:', apiPurchaseData.date);
      
      const response = await purchasesApiService.createPurchase(apiPurchaseData);
      
      if (response.success && response.data) {
        console.log('✅ Purchase Created Successfully');
        console.log('   🔄 Converting response...');
        console.log(''); // Add space
        
        // Convert API response to frontend format
        const frontendPurchase = convertApiPurchaseToAppPurchase(response.data);
        const newPurchase = convertApiPurchaseToAppPurchase(response.data);
        newPurchase.suppliers = purchaseData.suppliers;
        newPurchase.payments = { gramsPaid: 0, feesPaid: 0 };
        newPurchase.paymentHistory = [];
        
        // Create purchase suppliers
        for (const [supplierCode, supplierData] of Object.entries(purchaseData.suppliers)) {
          try {
            await purchasesApiService.createPurchaseSupplier({
              purchase_id: newPurchase.id,
              supplier_code: supplierCode,
              grams_18k: supplierData.grams18k,
              grams_21k: supplierData.grams21k,
              total_grams_21k_equivalent: supplierData.totalGrams21k,
            });
          } catch (error) {
            console.warn(`Failed to create supplier ${supplierCode} for purchase ${newPurchase.id}:`, error);
          }
        }
        
        return { success: true, data: newPurchase };
      } else {
        console.error('❌ Purchase API failed:', response);
        return { success: false, error: 'Failed to create purchase' };
      }
    } catch (error) {
      console.error('❌ Error creating purchase:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create purchase' };
    }
  }

  // Update purchase
  static async updatePurchase(id: string, updateData: any): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      console.log('📝 Updating Purchase...');
      console.log('   📦 ID:', id);
      console.log('   📦 Data:', updateData);
      console.log(''); // Add space
      
      const apiUpdateData = convertAppPurchaseToApiPurchase(updateData);
      console.log('   📤 Sending to API:', apiUpdateData);
      console.log('   📤 API Data includes supplier_id:', apiUpdateData.supplier_id);
      
      const response = await purchasesApiService.updatePurchase(id, apiUpdateData);
      
      if (response.success && response.data) {
        console.log('✅ Purchase Updated Successfully');
        console.log('   🔄 Converting response...');
        console.log(''); // Add space
        const frontendPurchase = convertApiPurchaseToAppPurchase(response.data);
        return { success: true, data: frontendPurchase };
      } else {
        console.error('❌ Purchase API failed:', response);
        return { success: false, error: 'Failed to update purchase' };
      }
    } catch (error) {
      console.error('❌ Error updating purchase:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update purchase' };
    }
  }

  // Delete purchase - using API only
  static async deletePurchase(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting purchase:', id);
      const response = await purchasesApiService.deletePurchase(id);
      
      if (response.success) {
        console.log('✅ Purchase deleted successfully');
        return { success: true };
      } else {
        console.error('❌ Delete purchase API failed:', response);
        return { success: false, error: 'Failed to delete purchase' };
      }
    } catch (error) {
      console.error('❌ Error deleting purchase:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete purchase' };
    }
  }

  // Get purchase count - using API only
  static async getPurchaseCount(): Promise<number> {
    try {
      const purchases = await this.getAllPurchases();
      return purchases.length;
    } catch (error) {
      console.error('❌ Error getting purchase count:', error);
      return 0;
    }
  }

  // Reset function no longer needed - using API only
  static resetToDefaultState(): void {
    console.warn('⚠️ resetToDefaultState: This function is no longer needed - using API only');
  }

  // Filter purchases
  static async filterPurchases(filters: PurchaseFilters): Promise<Purchase[]> {
    try {
      const purchases = await this.getAllPurchases();
      
      console.log('PurchaseService.filterPurchases debug:');
      console.log('- filters:', filters);
      console.log('- all purchases:', purchases.map(p => ({ id: p.id, storeId: p.storeId })));
      
      let filteredPurchases = [...purchases];
      
      if (filters.store && filters.store !== 'All') {
        console.log('- filtering by store:', filters.store);
        filteredPurchases = filteredPurchases.filter(p => {
          const matches = p.storeId === filters.store;
          console.log(`  - purchase ${p.id} (storeId: ${p.storeId}) matches ${filters.store}:`, matches);
          return matches;
        });
        console.log('- filtered purchases:', filteredPurchases.map(p => ({ id: p.id, storeId: p.storeId })));
      }
      
      if (filters.status) {
        filteredPurchases = filteredPurchases.filter(p => p.status === filters.status);
      }
      
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredPurchases = filteredPurchases.filter(p => 
          p.storeId.toLowerCase().includes(query) ||
          p.status.toLowerCase().includes(query) ||
          p.id.includes(query)
        );
      }
      
      if (filters.dateFrom) {
        filteredPurchases = filteredPurchases.filter(p => p.date >= filters.dateFrom!);
      }
      
      if (filters.dateTo) {
        filteredPurchases = filteredPurchases.filter(p => p.date <= filters.dateTo!);
      }
      
      // Sort by days left (fewer days at the top - most urgent first)
      filteredPurchases.sort((a, b) => {
        const daysLeftA = getDaysLeft(a.dueDate);
        const daysLeftB = getDaysLeft(b.dueDate);
        return daysLeftA - daysLeftB; // Ascending order (fewer days first)
      });
      
      return filteredPurchases;
    } catch (error) {
      console.error('❌ Error filtering purchases:', error);
      throw error;
    }
  }
}

// Payment Service
export class PaymentService {
  // Add a payment to a purchase
  static async addPayment(purchaseId: string, paymentData: Payment): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💳 PaymentService.addPayment called with:');
      console.log('  - purchaseId:', purchaseId);
      console.log('  - paymentData:', paymentData);
      
      const apiPaymentData = convertAppPaymentToApiPayment(paymentData);
      console.log('  - apiPaymentData:', apiPaymentData);
      console.log('  - apiPaymentData.id:', apiPaymentData.id);
      console.log('  - apiPaymentData has id?', 'id' in apiPaymentData);
      
      const response = await paymentsApiService.createPayment(purchaseId, apiPaymentData);
      console.log('  - API response:', response);
      
      if (response.success) {
        // Emit refresh event to update UI
        console.log('Emitting payment-added event for purchase:', purchaseId);
        emitPaymentAdded();
        return { success: true };
      } else {
        console.error('❌ Payment API failed:', response);
        return { success: false, error: 'Failed to add payment' };
      }
    } catch (error) {
      console.error('❌ Error adding payment:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add payment' };
    }
  }

  // Get all payments for a purchase
  static async getPayments(purchaseId: string): Promise<{ success: boolean; data?: Payment[]; error?: string }> {
    try {
      const response = await paymentsApiService.getPaymentsByPurchase(purchaseId);
      
      if (response.success) {
        const payments = response.data.map(convertApiPaymentToAppPayment);
        console.log(`PaymentService.getPayments(${purchaseId}): returning ${payments.length} payments`);
        return { success: true, data: payments };
      } else {
        console.error('❌ Payment API failed:', response);
        return { success: false, error: 'Failed to fetch payments' };
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch payments' };
    }
  }

  // Get payment totals for a purchase
  static async getPaymentTotals(purchaseId: string): Promise<PaymentTotals> {
    const purchase = await PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { gramsPaid: 0, feesPaid: 0 };

    return {
      gramsPaid: Number(purchase.payments.gramsPaid) || 0,
      feesPaid: Number(purchase.payments.feesPaid) || 0,
    };
  }

  // Calculate remaining amounts
  static async getRemainingAmounts(purchaseId: string): Promise<RemainingAmounts> {
    const purchase = await PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { gramsDue: 0, feesDue: 0 };

    return {
      gramsDue: (Number(purchase.totalGrams) || 0) - (Number(purchase.payments.gramsPaid) || 0),
      feesDue: (Number(purchase.totalFees) || 0) - (Number(purchase.payments.feesPaid) || 0),
    };
  }

  // Validate payment amounts
  static async validatePayment(purchaseId: string, gramsPaid: number, feesPaid: number): Promise<PaymentValidation> {
    const purchase = await PurchaseService.getPurchaseById(purchaseId);
    if (!purchase) return { valid: false, error: 'Purchase not found' };

    if (gramsPaid <= 0 && feesPaid <= 0) {
      return { valid: false, error: 'Please enter at least one payment amount (fees or grams).' };
    }

    const remaining = await this.getRemainingAmounts(purchaseId);
    
    if (gramsPaid > remaining.gramsDue) {
      return { valid: false, error: 'Grams paid cannot exceed grams due.' };
    }

    // Fees can exceed fees due - no validation needed

    return { valid: true };
  }

  // Delete payment
  static async deletePayment(purchaseId: string, paymentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await paymentsApiService.deletePayment(paymentId);
      
      if (response.success) {
        // Emit refresh event to update UI
        console.log('Emitting payment-deleted event for payment:', paymentId);
        emitPaymentDeleted();
        return { success: true };
      } else {
        console.error('❌ Payment API failed:', response);
        return { success: false, error: 'Failed to delete payment' };
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete payment' };
    }
  }
}

// Analytics Service
export class AnalyticsService {
  // Get purchase statistics
  static async getPurchaseStats(): Promise<PurchaseStats> {
    try {
      const purchases = await PurchaseService.getAllPurchases();
      
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
    } catch (error) {
      console.error('❌ Error getting purchase stats:', error);
      throw error;
    }
  }

  // Get monthly trends
  static async getMonthlyTrends(): Promise<MonthlyTrends> {
    try {
      const purchases = await PurchaseService.getAllPurchases();
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
    } catch (error) {
      console.error('❌ Error getting monthly trends:', error);
      throw error;
    }
  }
}
