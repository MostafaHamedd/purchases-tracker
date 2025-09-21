import { calculateDueDate, calculatePurchaseFees, generatePurchaseId, getMockPurchases, setMockPurchases } from '../business';
import { CreatePurchaseRequest, MonthlyTrends, Payment, PaymentTotals, PaymentValidation, Purchase, PurchaseFilters, PurchaseStats, RemainingAmounts } from '../types';
import { calculateStatus, convertTo21kEquivalent, getDaysLeft } from '../utils';
import { ApiPayment, CreatePaymentData, paymentsApiService } from './paymentsApiService';
import { ApiPurchase, CreatePurchaseData, purchasesApiService } from './purchasesApiService';
import { RecalculationService } from './recalculationService';
import { emitPaymentAdded, emitPaymentDeleted } from './refreshEvents';

// Convert API payment to app payment format
const convertApiPaymentToAppPayment = (apiPayment: ApiPayment): Payment => ({
  id: apiPayment.id,
  date: apiPayment.date,
  gramsPaid: Number(apiPayment.grams_paid) || 0, // Convert string to number
  feesPaid: Number(apiPayment.fees_paid) || 0,   // Convert string to number
  karatType: apiPayment.karat_type,
  note: apiPayment.note,
});

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
  console.log('Converting API purchase to app format:', {
    id: apiPurchase.id,
    total_grams: apiPurchase.total_grams,
    total_fees: apiPurchase.total_fees,
    total_discount: apiPurchase.total_discount,
  });
  
  return {
    id: apiPurchase.id,
    date: apiPurchase.date,
    storeId: apiPurchase.store_id,
    status: apiPurchase.status,
    totalGrams: Number(apiPurchase.total_grams) || 0, // Convert string to number
    totalFees: Number(apiPurchase.total_fees) || 0,   // Convert string to number
    totalDiscount: Number(apiPurchase.total_discount) || 0, // Convert string to number
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
const convertAppPurchaseToApiPurchase = (appPurchase: any): CreatePurchaseData => ({
  date: appPurchase.date,
  store_id: appPurchase.storeId,
  total_grams: appPurchase.totalGrams,
  total_fees: appPurchase.totalFees,
  total_discount: appPurchase.totalDiscount,
  due_date: appPurchase.dueDate,
});

// Purchase Service
export class PurchaseService {
  // Recalculate payment totals for existing purchases (to fix karat conversion issues)
  static recalculatePaymentTotals(): void {
    const purchases = getMockPurchases();
    
    purchases.forEach(purchase => {
      console.log(`Recalculating payment totals for purchase ${purchase.id}:`, {
        paymentHistoryLength: purchase.paymentHistory.length,
        paymentHistory: purchase.paymentHistory,
      });
      
      // Recalculate gramsPaid from payment history (converting to 21k equivalent)
      const totalGramsPaid21k = purchase.paymentHistory.reduce((sum, payment) => {
        console.log(`Processing payment:`, {
          gramsPaid: payment.gramsPaid,
          karatType: payment.karatType,
          typeOfGramsPaid: typeof payment.gramsPaid,
          typeOfKaratType: typeof payment.karatType,
        });
        
        const gramsPaid21kEquivalent = convertTo21kEquivalent(payment.gramsPaid, payment.karatType);
        console.log(`Converted to 21k equivalent:`, gramsPaid21kEquivalent);
        return sum + gramsPaid21kEquivalent;
      }, 0);
      
      // Recalculate feesPaid from payment history
      const totalFeesPaid = purchase.paymentHistory.reduce((sum, payment) => {
        return sum + (Number(payment.feesPaid) || 0);
      }, 0);
      
      console.log(`Final totals for purchase ${purchase.id}:`, {
        totalGramsPaid21k,
        totalFeesPaid,
      });
      
      // Update purchase totals
      purchase.payments.gramsPaid = totalGramsPaid21k;
      purchase.payments.feesPaid = totalFeesPaid;
      
      // Update status
      purchase.status = calculateStatus(purchase);
    });
    
    // Save updated purchases
    setMockPurchases(purchases);
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
        console.warn('⚠️ Purchases API not available, falling back to mock data');
        console.log('API response was not successful:', response);
        const mockPurchases = getMockPurchases();
        console.log('📦 Returning mock purchases:', mockPurchases.length, 'purchases');
        return mockPurchases;
      }
    } catch (error) {
      console.error('❌ Error fetching purchases:', error);
      console.warn('⚠️ Purchases API not available, falling back to mock data');
      const mockPurchases = getMockPurchases();
      console.log('📦 Returning mock purchases (error fallback):', mockPurchases.length, 'purchases');
      return mockPurchases;
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
        console.warn('⚠️ Purchase API not available, falling back to mock data');
        const purchases = getMockPurchases();
        const purchase = purchases.find(p => p.id === id);
        console.log(`PurchaseService.getPurchaseById(${id}): found purchase with ${purchase?.paymentHistory?.length || 0} payments`);
        return purchase;
      }
    } catch (error) {
      console.error('❌ Error fetching purchase:', error);
      console.warn('⚠️ Purchase API not available, falling back to mock data');
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === id);
    console.log(`PurchaseService.getPurchaseById(${id}): found purchase with ${purchase?.paymentHistory?.length || 0} payments`);
    return purchase;
    }
  }

  // Create new purchase
  static async createPurchase(purchaseData: CreatePurchaseRequest): Promise<{ success: boolean; data?: Purchase; error?: string }> {
    try {
      console.log('🛒 Creating purchase via API...');
    
    const fees = calculatePurchaseFees(purchaseData.suppliers, purchaseData.date);
    // Calculate total grams from the new karat structure (sum of totalGrams21k for all suppliers)
    const totalGrams = Math.round(Object.values(purchaseData.suppliers).reduce((sum, supplierData) => {
      if (supplierData && typeof supplierData === 'object') {
        return sum + (supplierData.totalGrams21k || 0);
      }
      return sum;
    }, 0) * 10) / 10; // Round to 1 decimal place
      
      const apiPurchaseData = convertAppPurchaseToApiPurchase({
        ...purchaseData,
        totalGrams,
        totalFees: fees.totalFees,
        totalDiscount: fees.totalDiscount,
        dueDate: calculateDueDate(purchaseData.date),
      });
      
      const response = await purchasesApiService.createPurchase(apiPurchaseData);
      
      if (response.success && response.data) {
        console.log('✅ Purchase created via API:', response.data.id);
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
        console.warn('⚠️ Purchase API not available, falling back to mock data');
        // Fallback to mock data
        const purchases = getMockPurchases();
        const newId = generatePurchaseId();
    
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
    
        return { success: true, data: newPurchase };
      }
    } catch (error) {
      console.error('❌ Error creating purchase:', error);
      console.warn('⚠️ Purchase API not available, falling back to mock data');
      
      // Fallback to mock data
      const purchases = getMockPurchases();
      const newId = generatePurchaseId();
      
      const fees = calculatePurchaseFees(purchaseData.suppliers, purchaseData.date);
      const totalGrams = Math.round(Object.values(purchaseData.suppliers).reduce((sum, supplierData) => {
        if (supplierData && typeof supplierData === 'object') {
          return sum + (supplierData.totalGrams21k || 0);
        }
        return sum;
      }, 0) * 10) / 10;
      
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

      const updatedPurchases = [...purchases, newPurchase];
      const recalculatedResult = RecalculationService.recalculateAfterPurchaseChange(updatedPurchases, purchaseData.date);
      setMockPurchases(recalculatedResult.updatedPurchases);
      
      return { success: true, data: newPurchase };
    }
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
      console.warn('⚠️ Falling back to mock data for filtering');
      
      // Fallback to mock data
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
    
    purchases.sort((a, b) => {
      const daysLeftA = getDaysLeft(a.dueDate);
      const daysLeftB = getDaysLeft(b.dueDate);
        return daysLeftA - daysLeftB;
    });
    
    return purchases;
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
        // If API fails, fall back to mock data for now
        console.warn('Payments API not available, falling back to mock data');
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) return { success: false, error: 'Purchase not found' };

        const newPayment: Payment = paymentData; // paymentData already has the id

    // Add to payment history
    purchase.paymentHistory.push(newPayment);
    
        // Update totals (convert payment grams to 21k equivalent to match purchase totalGrams)
        const gramsPaid21kEquivalent = convertTo21kEquivalent(paymentData.gramsPaid, paymentData.karatType);
        purchase.payments.gramsPaid += gramsPaid21kEquivalent;
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
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error adding payment:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      // If API fails, fall back to mock data for now
      console.warn('⚠️ Payments API not available, falling back to mock data');
      const purchases = getMockPurchases();
      const purchase = purchases.find(p => p.id === purchaseId);
      if (!purchase) return { success: false, error: 'Purchase not found' };

      const newPayment: Payment = paymentData; // paymentData already has the id

      // Add to payment history
      purchase.paymentHistory.push(newPayment);
      
      // Update totals (convert payment grams to 21k equivalent to match purchase totalGrams)
      const gramsPaid21kEquivalent = convertTo21kEquivalent(paymentData.gramsPaid, paymentData.karatType);
      purchase.payments.gramsPaid += gramsPaid21kEquivalent;
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
      return { success: true };
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
        // If API fails, fall back to mock data for now
        console.warn('Payments API not available, falling back to mock data');
        const purchase = await PurchaseService.getPurchaseById(purchaseId);
        const payments = purchase?.paymentHistory || [];
        return { success: true, data: payments };
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      // If API fails, fall back to mock data for now
      console.warn('Payments API not available, falling back to mock data');
      const purchase = await PurchaseService.getPurchaseById(purchaseId);
    const payments = purchase?.paymentHistory || [];
      return { success: true, data: payments };
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
        // If API fails, fall back to mock data for now
        console.warn('Payments API not available, falling back to mock data');
    const purchases = getMockPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);
        if (!purchase) return { success: false, error: 'Purchase not found' };

    const paymentIndex = purchase.paymentHistory.findIndex(p => p.id === paymentId);
        if (paymentIndex === -1) return { success: false, error: 'Payment not found' };

    const payment = purchase.paymentHistory[paymentIndex];
    
    // Remove payment
    purchase.paymentHistory.splice(paymentIndex, 1);
    
        // Update totals (convert payment grams to 21k equivalent to match purchase totalGrams)
        const gramsPaid21kEquivalent = convertTo21kEquivalent(payment.gramsPaid, payment.karatType);
        purchase.payments.gramsPaid -= gramsPaid21kEquivalent;
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
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      // If API fails, fall back to mock data for now
      console.warn('Payments API not available, falling back to mock data');
      const purchases = getMockPurchases();
      const purchase = purchases.find(p => p.id === purchaseId);
      if (!purchase) return { success: false, error: 'Purchase not found' };

      const paymentIndex = purchase.paymentHistory.findIndex(p => p.id === paymentId);
      if (paymentIndex === -1) return { success: false, error: 'Payment not found' };

      const payment = purchase.paymentHistory[paymentIndex];
      
      // Remove payment
      purchase.paymentHistory.splice(paymentIndex, 1);
      
      // Update totals (convert payment grams to 21k equivalent to match purchase totalGrams)
      const gramsPaid21kEquivalent = convertTo21kEquivalent(payment.gramsPaid, payment.karatType);
      purchase.payments.gramsPaid -= gramsPaid21kEquivalent;
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
      return { success: true };
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
      console.warn('⚠️ Falling back to mock data for stats');
      
      // Fallback to mock data
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
      console.warn('⚠️ Falling back to mock data for trends');
      
      // Fallback to mock data
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
}
