import { ApiResponse, apiService, SearchParams } from './apiService';

// Payment data types matching the API
export interface ApiPayment {
  id: string;
  purchase_id: string;
  date: string;
  grams_paid: number;
  fees_paid: number;
  karat_type: '18' | '21';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentData {
  id: string; // API requires this field
  date: string;
  grams_paid: number;
  fees_paid: number;
  karat_type: '18' | '21';
  note?: string;
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {}

export interface PaymentsSearchParams extends SearchParams {
  purchase_id?: string;
  karat_type?: '18' | '21';
  date_from?: string;
  date_to?: string;
}

class PaymentsApiService {
  private readonly endpoint = '/payments';

  // Get all payments (with optional filters)
  async getPayments(params?: PaymentsSearchParams): Promise<ApiResponse<ApiPayment[]>> {
    return apiService.get<ApiPayment[]>(this.endpoint, params);
  }

  // Get payments for a specific purchase
  async getPaymentsByPurchase(purchaseId: string): Promise<ApiResponse<ApiPayment[]>> {
    return apiService.get<ApiPayment[]>(this.endpoint, { purchase_id: purchaseId });
  }

  // Get payment by ID
  async getPaymentById(id: string): Promise<ApiResponse<ApiPayment>> {
    return apiService.get<ApiPayment>(`${this.endpoint}/${id}`);
  }

  // Create payment for a purchase
  async createPayment(purchaseId: string, data: CreatePaymentData): Promise<ApiResponse<ApiPayment>> {
    const paymentData = {
      id: data.id, // Ensure id is preserved
      purchase_id: purchaseId,
      date: data.date,
      grams_paid: data.grams_paid,
      fees_paid: data.fees_paid,
      karat_type: data.karat_type,
      note: data.note
    };
    
    console.log('💳 paymentsApiService.createPayment called with:');
    console.log('  - purchaseId:', purchaseId);
    console.log('  - data:', data);
    console.log('  - paymentData (with purchase_id):', paymentData);
    console.log('  - paymentData.id:', paymentData.id);
    
    return apiService.post<ApiPayment>(this.endpoint, paymentData);
  }

  // Update payment
  async updatePayment(id: string, data: UpdatePaymentData): Promise<ApiResponse<ApiPayment>> {
    return apiService.put<ApiPayment>(`${this.endpoint}/${id}`, data);
  }

  // Delete payment
  async deletePayment(id: string): Promise<ApiResponse<any>> {
    return apiService.delete<any>(`${this.endpoint}/${id}`);
  }
}

export const paymentsApiService = new PaymentsApiService();

// Export types
export type { ApiPayment, CreatePaymentData, PaymentsSearchParams, UpdatePaymentData };

