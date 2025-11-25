import React from 'react';
import ReactDOM from 'react-dom/client';
import { init as initApm } from '@elastic/apm-rum';
import App from './App';
import './index.css';
import { errorTracking } from './services/monitoring/errorTracking';
import { performanceMonitoring } from './services/monitoring/performance';

// Initialize Elastic APM RUM
// Vite: Use import.meta.env instead of process.env
if (import.meta.env.PROD || import.meta.env.VITE_ELASTIC_APM_SERVER_URL) {
  initApm({
    serviceName: import.meta.env.VITE_ELASTIC_APM_SERVICE_NAME || 'reconciliation-frontend',
    serverUrl: import.meta.env.VITE_ELASTIC_APM_SERVER_URL || 'http://localhost:8200',
    environment:
      import.meta.env.VITE_ELASTIC_APM_ENVIRONMENT || import.meta.env.MODE || 'development',
    distributedTracingOrigins: ['http://localhost:2000'],
    // Enable real user monitoring
    disableInstrumentations: [],
  });
}

// Initialize monitoring services
if (typeof window !== 'undefined') {
  errorTracking.init();
  performanceMonitoring.init();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
