import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { createApiHandler } from "./server/api.js"

const hasNeon = process.env.DATABASE_URL;

export default defineConfig({
  logLevel: 'info',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix-ui': [
            '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox', '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu', '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card',
            '@radix-ui/react-label', '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu', '@radix-ui/react-popover',
            '@radix-ui/react-progress', '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area', '@radix-ui/react-select',
            '@radix-ui/react-separator', '@radix-ui/react-slider',
            '@radix-ui/react-slot', '@radix-ui/react-switch',
            '@radix-ui/react-tabs', '@radix-ui/react-toast',
            '@radix-ui/react-toggle', '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip'
          ],
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'pdfjs-dist', 'html2canvas'],
          'animation-vendor': ['framer-motion', 'canvas-confetti'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
          'editor-vendor': ['react-quill', 'react-markdown'],
          'three-vendor': ['three'],
          'stripe-vendor': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'leaflet-vendor': ['react-leaflet'],
        }
      }
    }
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  plugins: [
    react(),
    hasNeon ? {
      name: 'neon-api-middleware',
      configureServer(server) {
        server.middlewares.use(createApiHandler());
        console.log('[neon] API routes enabled at /neon-db/*');
      }
    } : null
  ].filter(Boolean)
});