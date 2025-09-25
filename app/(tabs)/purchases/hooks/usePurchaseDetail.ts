import { PaymentService, PurchaseService, refreshEvents } from '@/data';
import { purchasesApiService } from '@/data/services/purchasesApiService';
import { useEffect, useState } from 'react';

export function usePurchaseDetail(purchaseId: string) {
  const [purchase, setPurchase] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get purchase data (async)
      const purchaseData = await PurchaseService.getPurchaseById(purchaseId);
      setPurchase(purchaseData);
      
      // Get payments data (async)
      const paymentsResult = await PaymentService.getPayments(purchaseId);
      
      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data);
      } else {
        setError(paymentsResult.error || 'Failed to fetch payments');
        setPayments([]);
      }
      
      // Get receipts data (async)
      try {
        const receiptsResponse = await purchasesApiService.getPurchaseReceipts(purchaseId);
        if (receiptsResponse.success && receiptsResponse.data) {
          setReceipts(receiptsResponse.data);
          console.log('📄 Receipts loaded:', receiptsResponse.data.length);
        } else {
          console.warn('Failed to fetch receipts:', receiptsResponse);
          setReceipts([]);
        }
      } catch (err) {
        console.warn('Error fetching receipts:', err);
        setReceipts([]);
      }
    } catch (err) {
      console.error('Error refreshing purchase:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh purchase');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshPurchase();
  }, [purchaseId]);

  // Event listeners
  useEffect(() => {
    const handleRefresh = () => {
      refreshPurchase();
    };

    refreshEvents.on('payment-added', handleRefresh);
    refreshEvents.on('payment-deleted', handleRefresh);
    refreshEvents.on('purchase-updated', handleRefresh);

    return () => {
      refreshEvents.off('payment-added', handleRefresh);
      refreshEvents.off('payment-deleted', handleRefresh);
      refreshEvents.off('purchase-updated', handleRefresh);
    };
  }, [purchaseId]);

  return {
    purchase,
    payments,
    receipts,
    loading,
    error,
    refreshPurchase,
  };
}