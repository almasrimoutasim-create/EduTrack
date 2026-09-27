import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

          // جميع Radix UI في قطعة واحدة
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

          // PDF فقط (الأثقل)
          'vendor-pdf': ['jspdf', 'pdfjs-dist', 'react-pdf'],

          // المحررات والمستندات
          'vendor-editor': ['react-markdown', 'mammoth', 'html2canvas'],

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
