import React from 'react'
import ReactDOM from 'react-dom/client'
import { init as initApm } from '@elastic/apm-rum'
import App from './App.tsx'
import './index.css'

// Initialize Elastic APM RUM
// Vite: Use import.meta.env instead of process.env
if (import.meta.env.PROD || import.meta.env.VITE_ELASTIC_APM_SERVER_URL) {
  initApm({
    serviceName: import.meta.env.VITE_ELASTIC_APM_SERVICE_NAME || 'reconciliation-frontend',
    serverUrl: import.meta.env.VITE_ELASTIC_APM_SERVER_URL || 'http://localhost:8200',
    environment: import.meta.env.VITE_ELASTIC_APM_ENVIRONMENT || import.meta.env.MODE || 'development',
    distributedTracingOrigins: ['http://localhost:2000'],
    // Enable real user monitoring
    disableInstrumentations: [],
    // Capture user interactions
    captureUserInteractions: true,
    // Capture page load metrics and route changes in SPA
    capturePageLoad: true,
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
