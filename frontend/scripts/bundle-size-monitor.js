#!/usr/bin/env node

/**
 * Bundle Size Monitor
 * Monitors bundle size changes and alerts on significant increases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size thresholds (in KB) - Based on current production build
const THRESHOLDS = {
  total: 1000, // Total bundle size limit
  warning: 850, // Warning threshold
  // Individual chunks can be up to 250KB (reasonable for modern web apps)
  maxChunkSize: 250,
};

function parseBundleStats() {
  try {
    // Read the build output or dist stats
    const distPath = path.join(__dirname, '..', 'dist');

    if (!fs.existsSync(distPath)) {
      console.log('❌ Dist directory not found. Run build first.');
      return null;
    }

    // For now, we'll use a simple approach - check file sizes
    // In a real implementation, you'd use webpack-bundle-analyzer stats
    const assets = fs
      .readdirSync(path.join(distPath, 'js'))
      .filter((file) => file.endsWith('.js'))
      .map((file) => {
        const filePath = path.join(distPath, 'js', file);
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.js', ''),
          size: stats.size / 1024, // Convert to KB
          path: file,
        };
      });

    return assets;
  } catch (error) {
    console.error('Error parsing bundle stats:', error);
    return null;
  }
}

function checkBundleSizes(assets) {
  if (!assets) return;

  console.log('📊 Bundle Size Analysis\n');

  let totalSize = 0;
  let hasIssues = false;
  let hasWarnings = false;

  assets.forEach((asset) => {
    totalSize += asset.size;

    const status = asset.size > THRESHOLDS.maxChunkSize ? '❌' : '✅';
    const isLarge = asset.size > THRESHOLDS.maxChunkSize;

    console.log(`${status} ${asset.name}: ${asset.size.toFixed(1)}KB`);

    if (isLarge) {
      hasIssues = true;
      console.log(`   ⚠️  Exceeds max chunk size of ${THRESHOLDS.maxChunkSize}KB`);
    }
  });

  console.log(`\n📈 Total Bundle Size: ${totalSize.toFixed(1)}KB`);

  if (totalSize > THRESHOLDS.total) {
    console.log(`❌ Total exceeds limit of ${THRESHOLDS.total}KB`);
    hasIssues = true;
  } else if (totalSize > THRESHOLDS.warning) {
    console.log(`⚠️  Total approaches limit (${THRESHOLDS.warning}KB warning threshold)`);
    hasWarnings = true;
  } else {
    console.log(`✅ Total within acceptable limits`);
  }

  if (hasIssues) {
    console.log('\n🚨 Critical bundle size issues detected!');
    console.log('Action required:');
    console.log('- Implement code splitting for large chunks');
    console.log('- Remove unused dependencies');
    console.log('- Optimize asset loading');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('\n⚠️  Bundle size warnings detected');
    console.log('Consider optimization:');
    console.log('- Further code splitting');
    console.log('- Tree shaking improvements');
    console.log('- Lazy loading enhancements');
  } else {
    console.log('\n✅ Bundle sizes optimized');
  }
}

function generateReport(assets) {
  if (!assets) return;

  const report = {
    timestamp: new Date().toISOString(),
    assets: assets,
    thresholds: THRESHOLDS,
    totalSize: assets.reduce((sum, asset) => sum + asset.size, 0),
    status: 'pass',
  };

  // Check if any asset exceeds threshold
  const hasIssues =
    assets.some((asset) => {
      const threshold = THRESHOLDS[asset.name] || THRESHOLDS.total / assets.length;
      return asset.size > threshold;
    }) || report.totalSize > THRESHOLDS.total;

  if (hasIssues) {
    report.status = 'fail';
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'bundle-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📄 Report saved to: ${reportPath}`);
}

// Main execution
console.log('🔍 Bundle Size Monitor Starting...\n');

const assets = parseBundleStats();

if (assets && assets.length > 0) {
  checkBundleSizes(assets);
  generateReport(assets);
} else {
  console.log('❌ No bundle assets found. Make sure build has been run.');
  process.exit(1);
}
