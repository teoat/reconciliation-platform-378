/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle analyzer configuration and optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add bundle analyzer in production builds
    if (!dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './bundle-analysis/report.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: './bundle-analysis/stats.json',
        })
      );
    }

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 20,
          maxAsyncRequests: 25,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // Framework chunk (React, Next.js)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next|@next|styled-jsx)[\\/]/,
              name: 'framework',
              priority: 40,
              reuseExistingChunk: true,
            },
            // Large libraries that benefit from separate chunks
            lib: {
              test: /[\\/]node_modules[\\/](@tanstack|@hookform|recharts|zod|date-fns)[\\/]/,
              name: 'lib',
              priority: 30,
              reuseExistingChunk: true,
            },
            // UI component libraries
            ui: {
              test: /[\\/]node_modules[\\/](lucide-react|@heroicons|framer-motion)[\\/]/,
              name: 'ui',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Vendor chunk for remaining node_modules
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common chunk for shared application code
            common: {
              name: 'common',
              minChunks: 3,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Tree shaking optimization
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: false,
    };

    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@reduxjs/toolkit',
      'react-hook-form',
      'zod',
      '@tanstack/react-virtual',
      'recharts',
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Optimize fonts
  optimizeFonts: true,

  // PoweredByHeader removal for security
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minification (faster than Terser)
  swcMinify: true,

  // ESLint configuration
  eslint: {
    // Temporarily disable ESLint during builds to avoid config conflicts
    // Run ESLint separately with: npm run lint
    ignoreDuringBuilds: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
