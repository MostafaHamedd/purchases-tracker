// API Test utility for debugging
import { apiService } from './apiService';
import { discountTiersApiService } from './discountTiersApiService';
import { paymentsApiService } from './paymentsApiService';
import { storesApiService } from './storesApiService';
import { suppliersApiService } from './suppliersApiService';

export class ApiTest {
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing API connection...');
      console.log('🌐 API Base URL:', apiService['baseURL']); // Access private property for debugging
      
      const isHealthy = await apiService.healthCheck();
      console.log('✅ API Health Check:', isHealthy ? 'SUCCESS' : 'FAILED');
      return isHealthy;
    } catch (error) {
      console.error('❌ API Connection Failed:', error);
      console.error('💡 Troubleshooting tips:');
      console.error('   - Make sure your backend server is running on port 3000');
      console.error('   - Check if the IP address is correct for your network');
      console.error('   - Ensure your device/emulator is on the same network');
      return false;
    }
  }

  static async testStoresAPI(): Promise<void> {
    try {
      console.log('🔍 Testing Stores API...');
      
      // Test get stores
      const storesResponse = await storesApiService.getStores();
      console.log('✅ Get Stores:', storesResponse.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Stores Count:', storesResponse.data?.length || 0);
      
      if (storesResponse.data && storesResponse.data.length > 0) {
        const firstStore = storesResponse.data[0];
        console.log('📋 First Store:', {
          id: firstStore.id,
          name: firstStore.name,
          code: firstStore.code,
          is_active: firstStore.is_active
        });
      }
      
    } catch (error) {
      console.error('❌ Stores API Test Failed:', error);
    }
  }

  static async testSuppliersAPI(): Promise<void> {
    try {
      console.log('🔍 Testing Suppliers API...');
      
      // Test get suppliers
      const suppliersResponse = await suppliersApiService.getSuppliers();
      console.log('✅ Get Suppliers:', suppliersResponse.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Suppliers Count:', suppliersResponse.data?.length || 0);
      
      if (suppliersResponse.data && suppliersResponse.data.length > 0) {
        const firstSupplier = suppliersResponse.data[0];
        console.log('📋 First Supplier:', {
          id: firstSupplier.id,
          name: firstSupplier.name,
          code: firstSupplier.code,
          is_active: firstSupplier.is_active
        });
      }
      
    } catch (error) {
      console.error('❌ Suppliers API Test Failed:', error);
    }
  }

  static async testDiscountTiersAPI(): Promise<void> {
    try {
      console.log('🔍 Testing Discount Tiers API...');
      
      // Test get discount tiers
      const tiersResponse = await discountTiersApiService.getDiscountTiers();
      console.log('✅ Get Discount Tiers:', tiersResponse.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Discount Tiers Count:', tiersResponse.data?.length || 0);
      
      if (tiersResponse.data && tiersResponse.data.length > 0) {
        const firstTier = tiersResponse.data[0];
        console.log('📋 First Discount Tier:', {
          id: firstTier.id,
          supplier_id: firstTier.supplier_id,
          karat_type: firstTier.karat_type,
          name: firstTier.name,
          threshold: firstTier.threshold,
          discount_percentage: firstTier.discount_percentage
        });
      }
      
    } catch (error) {
      console.error('❌ Discount Tiers API Test Failed:', error);
    }
  }

  static async testPaymentsAPI(): Promise<void> {
    try {
      console.log('🔍 Testing Payments API...');
      
      // Test get all payments
      const paymentsResponse = await paymentsApiService.getPayments();
      console.log('✅ Get Payments:', paymentsResponse.success ? 'SUCCESS' : 'FAILED');
      console.log('📊 Payments Count:', paymentsResponse.data?.length || 0);
      
      if (paymentsResponse.data && paymentsResponse.data.length > 0) {
        const firstPayment = paymentsResponse.data[0];
        console.log('📋 First Payment:', {
          id: firstPayment.id,
          purchase_id: firstPayment.purchase_id,
          date: firstPayment.date,
          grams_paid: firstPayment.grams_paid,
          fees_paid: firstPayment.fees_paid,
          karat_type: firstPayment.karat_type
        });
      }
      
    } catch (error) {
      console.error('❌ Payments API Test Failed:', error);
    }
  }

  static async runAllTests(): Promise<void> {
    console.log('🚀 Starting API Tests...');
    
    const connectionOk = await this.testConnection();
    if (connectionOk) {
      await this.testStoresAPI();
      await this.testSuppliersAPI();
      await this.testDiscountTiersAPI();
      await this.testPaymentsAPI();
    }
    
    console.log('🏁 API Tests Complete');
  }
}

// Auto-run tests in development
if (__DEV__) {
  // Run tests after a short delay to allow app to initialize
  setTimeout(() => {
    ApiTest.runAllTests();
  }, 2000);
}
