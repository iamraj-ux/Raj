import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Guard against iframe popup restrictions and unhandled Firebase internal assertions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (
      msg.includes('INTERNAL ASSERTION FAILED') ||
      msg.includes('Pending promise was never set') ||
      msg.includes('auth/popup-closed-by-user') ||
      msg.includes('auth/cancelled-popup-request')
    ) {
      console.warn('[Handled Firebase Auth Assertion]:', msg);
      event.preventDefault();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);