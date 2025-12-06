import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import compression from 'vite-plugin-compression2';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:2000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:2000',
        ws: true,
      },
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
    ],
  },
  
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: false,
  },
});
