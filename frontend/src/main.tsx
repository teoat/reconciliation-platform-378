import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Optimizely integration removed as the package is not in dependencies
// and it's causing build failures.
// Can be re-enabled once @optimizely/react-sdk is added to package.json.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>,
);
