#!/usr/bin/env node

/**
 * Bundle Size Checker
 * Validates bundle sizes against performance budgets
 */

import { statSync, readdirSync, lstatSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Performance budgets (in KB)
const BUNDLE_BUDGETS = {
  'js': {
    max: 500, // 500KB for JS bundles
    warning: 400,
  },
  'css': {
    max: 100, // 100KB for CSS
    warning: 80,
  },
  'total': {
    max: 600, // 600KB total initial load
    warning: 500,
  },
};

function formatSize(bytes) {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) {
    return `${mb.toFixed(2)}MB`;
  }
  return `${kb.toFixed(2)}KB`;
}

function checkBundleSize() {
  const distDir = join(rootDir, 'dist');
  
  try {
    // Check if dist directory exists
    if (!statSync(distDir).isDirectory()) {
      console.log('⚠️  dist directory not found. Run "npm run build" first.');
      process.exit(0);
    }

    // Find all JS and CSS files
    const findFiles = (dir, extension) => {
      const files = [];
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = lstatSync(fullPath);
          if (stat.isDirectory()) {
            files.push(...findFiles(fullPath, extension));
          } else if (item.endsWith(extension)) {
            files.push(fullPath);
          }
        }
      } catch (e) {
        // Directory doesn't exist
      }
      return files;
    };

    const jsDir = join(distDir, 'js');
    const cssDir = join(distDir, 'css');
    const jsFiles = findFiles(jsDir, '.js');
    const cssFiles = findFiles(cssDir, '.css');

    let totalJSSize = 0;
    let totalCSSSize = 0;

    // Calculate JS bundle sizes
    console.log('\n📦 JavaScript Bundles:');
    jsFiles.forEach(file => {
      const stats = statSync(file);
      const sizeKB = stats.size / 1024;
      totalJSSize += stats.size;
      
      const status = sizeKB > BUNDLE_BUDGETS.js.max ? '❌' : 
                     sizeKB > BUNDLE_BUDGETS.js.warning ? '⚠️' : '✅';
      
      const relativePath = file.replace(rootDir + '/', '');
      console.log(`  ${status} ${relativePath}: ${formatSize(stats.size)}`);
    });

    // Calculate CSS bundle sizes
    console.log('\n🎨 CSS Bundles:');
    cssFiles.forEach(file => {
      const stats = statSync(file);
      const sizeKB = stats.size / 1024;
      totalCSSSize += stats.size;
      
      const status = sizeKB > BUNDLE_BUDGETS.css.max ? '❌' : 
                     sizeKB > BUNDLE_BUDGETS.css.warning ? '⚠️' : '✅';
      
      const relativePath = file.replace(rootDir + '/', '');
      console.log(`  ${status} ${relativePath}: ${formatSize(stats.size)}`);
    });

    // Summary
    console.log('\n📊 Summary:');
    const totalSize = totalJSSize + totalCSSSize;
    const totalSizeKB = totalSize / 1024;
    
    console.log(`  Total JS: ${formatSize(totalJSSize)}`);
    console.log(`  Total CSS: ${formatSize(totalCSSSize)}`);
    console.log(`  Total: ${formatSize(totalSize)}`);

    // Check budgets
    const jsSizeKB = totalJSSize / 1024;
    const cssSizeKB = totalCSSSize / 1024;

    let hasErrors = false;
    let hasWarnings = false;

    if (jsSizeKB > BUNDLE_BUDGETS.js.max) {
      console.log(`\n❌ JS bundle size (${jsSizeKB.toFixed(2)}KB) exceeds budget (${BUNDLE_BUDGETS.js.max}KB)`);
      hasErrors = true;
    } else if (jsSizeKB > BUNDLE_BUDGETS.js.warning) {
      console.log(`\n⚠️  JS bundle size (${jsSizeKB.toFixed(2)}KB) is close to budget (${BUNDLE_BUDGETS.js.max}KB)`);
      hasWarnings = true;
    }

    if (cssSizeKB > BUNDLE_BUDGETS.css.max) {
      console.log(`❌ CSS bundle size (${cssSizeKB.toFixed(2)}KB) exceeds budget (${BUNDLE_BUDGETS.css.max}KB)`);
      hasErrors = true;
    } else if (cssSizeKB > BUNDLE_BUDGETS.css.warning) {
      console.log(`⚠️  CSS bundle size (${cssSizeKB.toFixed(2)}KB) is close to budget (${BUNDLE_BUDGETS.css.max}KB)`);
      hasWarnings = true;
    }

    if (totalSizeKB > BUNDLE_BUDGETS.total.max) {
      console.log(`❌ Total bundle size (${totalSizeKB.toFixed(2)}KB) exceeds budget (${BUNDLE_BUDGETS.total.max}KB)`);
      hasErrors = true;
    } else if (totalSizeKB > BUNDLE_BUDGETS.total.warning) {
      console.log(`⚠️  Total bundle size (${totalSizeKB.toFixed(2)}KB) is close to budget (${BUNDLE_BUDGETS.total.max}KB)`);
      hasWarnings = true;
    }

    if (!hasErrors && !hasWarnings) {
      console.log('\n✅ All bundle sizes are within budget!');
    }

    // Exit with error code if budgets exceeded
    if (hasErrors) {
      process.exit(1);
    }

    if (hasWarnings) {
      console.log('\n⚠️  Some bundles are close to budget limits. Consider optimization.');
    }

  } catch (error) {
    console.error('❌ Error checking bundle sizes:', error.message);
    process.exit(1);
  }
}

checkBundleSize();

