import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// VitePWA يُفعَّل فقط عند الحاجة (يزيل ~15 ثانية من وقت البناء)
const usePwa = process.env.ENABLE_PWA === 'true'
let VitePWA
if (usePwa) {
  VitePWA = (await import('vite-plugin-pwa')).VitePWA
}

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  logLevel: 'info',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // React & routing core
          'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],

          // جميع Radix UI في قطعة واحدة (كان 3 قطع)
          'vendor-ui': [
            '@radix-ui/react-slot', '@radix-ui/react-label', '@radix-ui/react-separator',
            '@radix-ui/react-tooltip', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group',
            '@radix-ui/react-radio-group', '@radix-ui/react-checkbox', '@radix-ui/react-progress',
            '@radix-ui/react-dialog', '@radix-ui/react-alert-dialog', '@radix-ui/react-popover',
            '@radix-ui/react-hover-card', '@radix-ui/react-dropdown-menu', '@radix-ui/react-context-menu',
            '@radix-ui/react-toast', '@radix-ui/react-accordion', '@radix-ui/react-collapsible',
            '@radix-ui/react-navigation-menu', '@radix-ui/react-menubar', '@radix-ui/react-tabs',
            '@radix-ui/react-select', '@radix-ui/react-scroll-area', '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar', '@radix-ui/react-slider'
          ],

          // الأCharts والخريطة
          'vendor-charts': ['recharts', 'react-leaflet', 'leaflet'],

          // الوسائط المتحركة والثلاثي الأبعاد
          'vendor-media': ['framer-motion', 'canvas-confetti', 'embla-carousel-react', 'three'],

          // الأدوات والمرجعيات
          'vendor-utils': [
            'lodash', 'clsx', 'tailwind-merge', 'class-variance-authority',
            'date-fns', 'dayjs', 'moment', 'react-day-picker'
          ],

          // النماذج والصحة
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // المستندات وPDF
          'vendor-docs': ['react-markdown', 'mammoth', 'jspdf', 'pdfjs-dist', 'html2canvas', 'react-pdf'],

          // المصادقة والوقت الحقيقي
          'vendor-auth': ['jsonwebtoken', 'bcryptjs', 'socket.io', 'socket.io-client'],

          // QR & Code
          'vendor-code': ['qrcode.react', 'jsqr'],

          // الدفع
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
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
    // VitePWA يُضاف فقط عند تفعيله لتجنب عبء البناء غير الضروري
    ...(VitePWA ? [VitePWA({
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
                maxAgeSeconds: 60 * 60 * 24 * 365
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
                maxAgeSeconds: 60 * 5
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })] : []),
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
