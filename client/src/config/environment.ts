// Environment configuration for different deployment targets
export interface Environment {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  environment: 'development' | 'production' | 'mobile';
}

// Get environment configuration based on platform and build
export function getEnvironment(): Environment {
  // Check if running in Capacitor (mobile app)
  const isCapacitor = !!(window as any).Capacitor;
  
  if (isCapacitor) {
    // Mobile app - use production backend URL
    // Falls back to carenalert.com if env var is not set at build time
    const productionApiUrl = import.meta.env.VITE_PRODUCTION_API_URL || 'https://carenalert.com';
    return {
      API_BASE_URL: productionApiUrl,
      WS_BASE_URL: productionApiUrl.replace('https://', 'wss://'),
      environment: 'mobile'
    };
  }
  
  // Web development - use relative URLs
  if (import.meta.env.DEV) {
    return {
      API_BASE_URL: '',
      WS_BASE_URL: `ws://${window.location.host}`,
      environment: 'development'
    };
  }
  
  // Web production - use relative URLs (same domain)
  return {
    API_BASE_URL: '',
    WS_BASE_URL: `wss://${window.location.host}`,
    environment: 'production'
  };
}

export const ENV = getEnvironment();