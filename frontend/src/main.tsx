import React from 'react'
import ReactDOM from 'react-dom/client'
import { init as initApm } from '@elastic/apm-rum'
import App from './App.tsx'
import './index.css'

// Initialize Elastic APM RUM
if (process.env.NODE_ENV === 'production' || process.env.ELASTIC_APM_SERVER_URL) {
  initApm({
    serviceName: process.env.ELASTIC_APM_SERVICE_NAME || 'reconciliation-frontend',
    serverUrl: process.env.ELASTIC_APM_SERVER_URL || 'http://localhost:8200',
    environment: process.env.ELASTIC_APM_ENVIRONMENT || 'development',
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
