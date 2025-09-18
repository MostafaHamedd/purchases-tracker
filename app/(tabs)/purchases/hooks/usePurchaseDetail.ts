import { useState, useEffect } from 'react';
import { PurchaseService, PaymentService } from '@/data';
import { refreshEvents } from '@/data';

export function usePurchaseDetail(purchaseId: string) {
  const [purchase, setPurchase] = useState(PurchaseService.getPurchaseById(purchaseId));
  const [payments, setPayments] = useState(PaymentService.getPayments(purchaseId));

  const refreshPurchase = () => {
    setPurchase(PurchaseService.getPurchaseById(purchaseId));
    setPayments(PaymentService.getPayments(purchaseId));
  };

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
    refreshPurchase,
  };
}