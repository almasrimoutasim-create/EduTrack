import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  logLevel: 'info',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Radix UI - split by category for better caching
          'radix-core': [
            '@radix-ui/react-slot', '@radix-ui/react-label', '@radix-ui/react-separator',
            '@radix-ui/react-tooltip', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group',
            '@radix-ui/react-radio-group', '@radix-ui/react-checkbox', '@radix-ui/react-progress'
          ],
          'radix-overlay': [
            '@radix-ui/react-dialog', '@radix-ui/react-alert-dialog', '@radix-ui/react-popover',
            '@radix-ui/react-hover-card', '@radix-ui/react-dropdown-menu', '@radix-ui/react-context-menu',
            '@radix-ui/react-toast', '@radix-ui/react-accordion', '@radix-ui/react-collapsible'
          ],
          'radix-navigation': [
            '@radix-ui/react-navigation-menu', '@radix-ui/react-menubar', '@radix-ui/react-tabs',
            '@radix-ui/react-select', '@radix-ui/react-scroll-area', '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar', '@radix-ui/react-slider'
          ],
          
          // Heavy vendor libraries - lazy loaded
          'chart-vendor': ['recharts'],
          'pdf-vendor': ['jspdf', 'pdfjs-dist', 'html2canvas', 'react-pdf'],
          'animation-vendor': ['framer-motion', 'canvas-confetti', 'embla-carousel-react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'query-vendor': ['@tanstack/react-query'],
          'editor-vendor': ['react-markdown', 'mammoth'],
          'leaflet-vendor': ['react-leaflet', 'leaflet'],
          'date-vendor': ['date-fns', 'dayjs', 'moment', 'react-day-picker'],
          'three-vendor': ['three'],
          'utils-vendor': ['lodash', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // Auth & Real-time
          'auth-vendor': ['jsonwebtoken', 'bcryptjs', 'socket.io', 'socket.io-client'],
          
          // QR & Code
          'qr-vendor': ['qrcode.react', 'jsqr'],
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'EduTrack',
        short_name: 'EduTrack',
        description: 'منصة إدارة تعليمية متكاملة',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdnjs-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    }),
    {
      name: 'neon-api-middleware',
      async configureServer(server) {
        const { createApiHandler, setupWebSocket } = await import("./server/api.js");
        server.middlewares.use(createApiHandler());
        setupWebSocket(server.httpServer);
        console.log('[neon] API routes enabled at /neon-db/* and WS at /api/classroom-ws');
      }
    }
  ]
});