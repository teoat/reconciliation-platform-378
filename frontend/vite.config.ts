import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
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
    typecheck: false,
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for better performance
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks - split by library size and usage
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Group smaller libraries together
            return 'vendor-misc';
          }
          
          // Feature chunks - split by application modules
          if (id.includes('/src/components/pages/Auth')) {
            return 'auth-feature';
          }
          if (id.includes('/src/components/pages/Dashboard')) {
            return 'dashboard-feature';
          }
          if (id.includes('/src/components/pages/Projects')) {
            return 'projects-feature';
          }
          if (id.includes('/src/components/pages/Reconciliation')) {
            return 'reconciliation-feature';
          }
          if (id.includes('/src/components/pages/Ingestion')) {
            return 'ingestion-feature';
          }
          if (id.includes('/src/components/pages/Analytics')) {
            return 'analytics-feature';
          }
          if (id.includes('/src/components/pages/Settings')) {
            return 'settings-feature';
          }
          if (id.includes('/src/components/pages/Admin')) {
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
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
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
      // External dependencies for CDN
      external: (id) => {
        // You can externalize large libraries to CDN if needed
        return false; // Keep everything bundled for now
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500, // Reduced from 1000 for stricter limits
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
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
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
})
