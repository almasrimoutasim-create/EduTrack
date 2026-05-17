import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { setupApiRoutes } from './server/api.js'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'info',
  server: {
    proxy: {
      '/api': {
        target: 'https://api.base44.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    hmr: {
      overlay: false
    }
  },
  plugins: [
    base44({
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
    {
      name: 'neon-api-middleware',
      configureServer(server) {
        setupApiRoutes(server);
        console.log('[neon] API routes enabled at /neon-db/entities/*');
      }
    }
  ]
});