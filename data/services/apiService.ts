// Base API service configuration
import { apiConfig } from '../config/apiConfig';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || apiConfig.baseURL;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SearchParams extends PaginationParams {
  search?: string;
}

// Helper function to make error messages more user-friendly
const makeUserFriendlyError = (error: string): string => {
  // Network errors
  if (error.includes('Network request failed') || error.includes('fetch')) {
    return '🌐 Connection Error\n\nUnable to connect to the server. Please check your internet connection and try again.';
  }
  
  // Timeout errors
  if (error.includes('timeout') || error.includes('AbortError')) {
    return '⏱️ Request Timeout\n\nThe request took too long to complete. Please try again.';
  }
  
  // Server errors
  if (error.includes('500') || error.includes('Internal Server Error')) {
    return '🔧 Server Error\n\nSomething went wrong on our end. Please try again later.';
  }
  
  // Not found errors
  if (error.includes('404') || error.includes('Not Found')) {
    return '❓ Not Found\n\nThe requested information could not be found.';
  }
  
  // Unauthorized errors
  if (error.includes('401') || error.includes('Unauthorized')) {
    return '🔒 Access Denied\n\nYou do not have permission to perform this action.';
  }
  
  // Forbidden errors
  if (error.includes('403') || error.includes('Forbidden')) {
    return '🚫 Forbidden\n\nThis action is not allowed.';
  }
  
  // Validation errors
  if (error.includes('validation') || error.includes('invalid')) {
    return '📝 Invalid Data\n\nPlease check your input and try again.';
  }
  
  // Default: return original error
  return error;
};

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning page
    };

    // Create timeout controller for React Native compatibility
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Add timeout using AbortController
      signal: controller.signal,
    };

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url} (attempt ${retryCount + 1})`);
      const response = await fetch(url, config);
      clearTimeout(timeoutId); // Clear timeout on successful response
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error [${endpoint}]:`, {
          status: response.status,
          statusText: response.statusText,
          data
        });
        const errorMessage = data.error || data.message || `HTTP ${response.status}`;
        throw new Error(makeUserFriendlyError(errorMessage));
      }

      console.log(`✅ API Success [${endpoint}]:`, data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error(`❌ API Error [${endpoint}]:`, {
        url,
        error: error instanceof Error ? error.message : error,
        type: error instanceof TypeError ? 'Network Error' : 'API Error',
        attempt: retryCount + 1
      });
      
      // Retry logic for network errors
      if (retryCount < apiConfig.retries && error instanceof TypeError) {
        console.log(`🔄 Retrying request (${retryCount + 1}/${apiConfig.retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.request<T>(endpoint, options, retryCount + 1);
      }
      
      // Make network errors more user-friendly
      if (error instanceof Error) {
        throw new Error(makeUserFriendlyError(error.message));
      }
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        finalEndpoint += `?${queryString}`;
      }
    }

    return this.request<T>(finalEndpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    console.log('📤 API POST request:');
    console.log('  - endpoint:', endpoint);
    console.log('  - data:', data);
    console.log('  - JSON body:', data ? JSON.stringify(data) : undefined);
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Create singleton instance
export const apiService = new ApiService();

