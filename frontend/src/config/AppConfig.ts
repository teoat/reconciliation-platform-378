// Application Configuration

export interface AppConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  environment: 'development' | 'production' | 'test';
  features: {
    enableWebSocket: boolean;
    enableOptimizely: boolean;
    enableAnalytics: boolean;
  };
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000',
  environment: (import.meta.env.VITE_ENV as AppConfig['environment']) || 'development',
  features: {
    enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET === 'true',
    enableOptimizely: import.meta.env.VITE_ENABLE_OPTIMIZELY === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
};

export default config;
