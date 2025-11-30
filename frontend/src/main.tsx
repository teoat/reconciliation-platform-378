import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Assuming an App component exists
import './index.css'; // Assuming an index.css exists

// Optimizely imports
import { OptimizelyProvider, createInstance } from '@optimizely/react-sdk';

// Initialize Optimizely
const optimizely = createInstance({
  sdkKey: import.meta.env.VITE_OPTIMIZELY_SDK_KEY, // Placeholder for environment variable
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OptimizelyProvider optimizely={optimizely}>
      <App />
    </OptimizelyProvider>
  </React.StrictMode>,
);
