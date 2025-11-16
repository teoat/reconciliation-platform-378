import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 1000,
    host: '0.0.0.0',
    strictPort: true,
    open: true,
    // Optimize dev server performance
    hmr: {
      overlay: false, // Disable error overlay for better performance
    },
    // CORS configuration
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:2000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:2000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    // typecheck: false, // TypeScript checking is handled separately
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for better performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // More aggressive compression
        unsafe: true, // Enable unsafe optimizations for smaller bundle
      },
      mangle: {
        safari10: true, // Fix Safari 10/11 bugs
      },
    },
    target: 'es2020', // Optimize for modern browsers

    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching and reduced bundle size
        manualChunks: (id) => {
          // Vendor chunks - split by library size and usage
          // IMPORTANT: React-dependent libraries must be bundled with React or loaded after
          if (id.includes('node_modules')) {
            // Split React and React DOM for better caching
            if (id.includes('react') && !id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            // Redux depends on React's useSyncExternalStore, so bundle with React
            if (
              id.includes('@reduxjs/toolkit') ||
              id.includes('react-redux') ||
              id.includes('redux')
            ) {
              return 'react-core'; // Bundle with React core to ensure React loads first
            }
            // use-sync-external-store is a shim for React.useSyncExternalStore - must bundle with React
            if (id.includes('use-sync-external-store')) {
              return 'react-core'; // Bundle with React core to ensure React loads first
            }
            // React Router also depends on React, bundle it too to ensure proper load order
            if (id.includes('react-router')) {
              return 'react-core'; // Bundle with React core to avoid dependency issues
            }
            // UI libraries - group for better caching
            if (
              id.includes('lucide-react') ||
              id.includes('@radix-ui') ||
              id.includes('framer-motion')
            ) {
              return 'ui-vendor';
            }
            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms-vendor';
            }
            // Data fetching and utilities
            if (
              id.includes('axios') ||
              id.includes('@tanstack/react-query') ||
              id.includes('date-fns')
            ) {
              return 'data-vendor';
            }
            // Charts and visualization (lazy load these)
            if (id.includes('recharts') || id.includes('d3') || id.includes('chart.js')) {
              return 'charts-vendor';
            }
            // Virtual scrolling
            if (id.includes('@tanstack/react-virtual')) {
              return 'virtual-vendor';
            }
            // Group smaller libraries together to reduce HTTP requests
            return 'vendor-misc';
          }

          // Feature chunks - split by application modules
          if (id.includes('/src/components/pages/Auth')) {
            return 'auth-feature';
          }
          if (id.includes('/src/components/pages/Dashboard')) {
            return 'dashboard-feature';
          }
          if (
            id.includes('/src/components/pages/Projects') ||
            id.includes('/src/components/ProjectComponents')
          ) {
            return 'projects-feature';
          }
          if (
            id.includes('/src/components/pages/Reconciliation') ||
            id.includes('/src/pages/ReconciliationPage')
          ) {
            return 'reconciliation-feature';
          }
          if (id.includes('/src/components/pages/Ingestion')) {
            return 'ingestion-feature';
          }
          if (
            id.includes('/src/components/pages/Analytics') ||
            id.includes('/src/components/AnalyticsDashboard')
          ) {
            return 'analytics-feature';
          }
          if (id.includes('/src/components/pages/Settings')) {
            return 'settings-feature';
          }
          if (
            id.includes('/src/components/pages/Admin') ||
            id.includes('/src/components/UserManagement')
          ) {
            return 'admin-feature';
          }

          // Shared components
          if (id.includes('/src/components/shared')) {
            return 'shared-components';
          }

          // Utils and services
          if (id.includes('/src/utils') || id.includes('/src/services')) {
            return 'utils-services';
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
      // Mark optional dependencies as external
      external: (id) => {
        // @sentry/react is optional and dynamically imported with error handling
        if (id.includes('@sentry/react')) {
          return true;
        }
        return false;
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 300,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset handling
    assetsInlineLimit: 4096, // 4KB - inline small assets
  },
  preview: {
    port: 1000,
    host: true,
    strictPort: true,
    // Enable compression in preview
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/components/pages'),
      '@shared': resolve(__dirname, './src/components/shared'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@store': resolve(__dirname, './src/store'),
      // Ensure single React instance across workspace (equivalent to webpack resolve.alias)
      react: resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'use-sync-external-store',
      'react-router-dom',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'axios',
      'lucide-react',
    ],
    // Exclude large dependencies from pre-bundling
    exclude: [],
    // Force pre-bundling of specific modules
    force: true,
  },
  esbuild: {
    target: 'es2020',
    format: 'esm',
    // Optimize JSX
    jsx: 'automatic',
    // Enable tree shaking
    treeShaking: true,
  },
  // Performance optimizations
  define: {
    // Remove development-only code in production
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    // Provide process.env.NODE_ENV for compatibility with code expecting it
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // CSS optimizations
  css: {
    devSourcemap: false,
    // Enable CSS modules for better scoping
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
});
