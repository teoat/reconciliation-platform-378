import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { store } from './store/unifiedStore';

// Optimizely imports
import { OptimizelyProvider, createInstance } from '@optimizely/react-sdk';

// Initialize Optimizely (optional - won't fail if SDK key is missing)
const optimizely = createInstance({
  sdkKey: import.meta.env.VITE_OPTIMIZELY_SDK_KEY || '',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <OptimizelyProvider optimizely={optimizely}>
          <App />
        </OptimizelyProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
