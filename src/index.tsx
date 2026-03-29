import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { installBrowserApiInterceptor } from './services/browserApiInterceptor';
import { getStorageMode } from './services/storageMode';

installBrowserApiInterceptor();
console.info(`[Niyanta] storage mode: ${getStorageMode()}`);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
