import { apiService, ApiResponse } from './apiService';

export interface MonthlyTotal {
  total_grams_21k_equivalent: number;
  total_purchases: number;
  total_receipts: number;
}

export interface MonthlyHistory {
  month_year: string;
  total_grams_21k_equivalent: number;
  total_purchases: number;
  total_receipts: number;
}

export interface DiscountCalculation {
  discountRate: number;
  discountAmount: number;
}

export interface DiscountCalculationRequest {
  purchaseId: string;
  supplierId: string;
  grams: number;
  karatType: '18' | '21';
}

class MonthlyTotalsApiService {
  private endpoint = '/monthly-totals';

  // Get current month's total grams
  async getCurrentMonthTotal(): Promise<ApiResponse<MonthlyTotal>> {
    return apiService.get<MonthlyTotal>(`${this.endpoint}/current`);
  }

  // Get monthly totals for the last 12 months
  async getMonthlyHistory(): Promise<ApiResponse<MonthlyHistory[]>> {
    return apiService.get<MonthlyHistory[]>(`${this.endpoint}/history`);
  }

  // Calculate discount for a specific receipt
  async calculateReceiptDiscount(request: DiscountCalculationRequest): Promise<ApiResponse<DiscountCalculation>> {
    return apiService.post<DiscountCalculation>(`${this.endpoint}/calculate-discount`, request);
  }
}

export const monthlyTotalsApiService = new MonthlyTotalsApiService();
