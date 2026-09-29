import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initWebVitals } from '@/lib/web-vitals'

// Initialize Web Vitals monitoring in production
if (import.meta.env.PROD) {
  initWebVitals();
}

// Defensive cleanup: a stale service worker (from an older vite-plugin-pwa
// build) may still be controlling this page and serving a precached bundle.
// Unregister any workers and clear all caches so the fresh build loads.
// (The self-unregistering public/sw.js handles the controlled case; this
// covers any leftover registrations on loads that are already uncontrolled.)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => registrations.forEach((reg) => reg.unregister()))
    .catch(() => {});
  if (window.caches && window.caches.keys) {
    window.caches
      .keys()
      .then((keys) => keys.forEach((key) => window.caches.delete(key)))
      .catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)