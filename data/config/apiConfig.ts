// API Configuration for different environments
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

// Environment-specific configurations
const configs: Record<string, ApiConfig> = {
  // Local development (same network)
  local: {
    baseURL: 'http://10.0.0.55:3000/api',
    timeout: 10000,
    retries: 3,
  },
  
  // ngrok tunnel (external access)
  ngrok: {
    baseURL: 'https://fc9f006b636f.ngrok-free.app/api',
    timeout: 15000,
    retries: 3,
  },
  
  // Production (when you deploy your backend)
  production: {
    baseURL: 'https://your-backend-domain.com/api',
    timeout: 10000,
    retries: 3,
  },
};

// Get current environment
const getCurrentEnvironment = (): string => {
  // Check for environment variable first
  if (process.env.EXPO_PUBLIC_API_ENV) {
    return process.env.EXPO_PUBLIC_API_ENV;
  }
  
  // Default to ngrok for external access
  return 'ngrok';
};

// Export current configuration
export const apiConfig = configs[getCurrentEnvironment()];

// Export all configs for reference
export { configs };

// Helper function to switch environments
export const switchEnvironment = (env: keyof typeof configs) => {
  return configs[env];
};

// Helper function to get ngrok URL (useful for dynamic ngrok URLs)
export const getNgrokUrl = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:4040/api/tunnels');
    const data = await response.json();
    
    if (data.tunnels && data.tunnels.length > 0) {
      const httpsTunnel = data.tunnels.find((tunnel: any) => tunnel.proto === 'https');
      if (httpsTunnel) {
        return `${httpsTunnel.public_url}/api`;
      }
    }
    
    throw new Error('No ngrok tunnel found');
  } catch (error) {
    console.error('Failed to get ngrok URL:', error);
    throw error;
  }
};
