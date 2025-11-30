/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Path aliases to match the frontend directory structure
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'frontend/src'),
      '@/components': path.resolve(__dirname, 'frontend/src/components'),
      '@/pages': path.resolve(__dirname, 'frontend/src/pages'),
      '@/services': path.resolve(__dirname, 'frontend/src/services'),
      '@/utils': path.resolve(__dirname, 'frontend/src/utils'),
      '@/types': path.resolve(__dirname, 'frontend/src/types'),
      '@/store': path.resolve(__dirname, 'frontend/src/store'),
      '@/hooks': path.resolve(__dirname, 'frontend/src/hooks'),
    };
    return config;
  },
};

module.exports = nextConfig;
