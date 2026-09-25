import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initWebVitals } from '@/lib/web-vitals'

// Initialize Web Vitals monitoring in production
if (import.meta.env.PROD) {
  initWebVitals();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)