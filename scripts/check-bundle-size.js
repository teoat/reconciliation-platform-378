#!/usr/bin/env node

/**
 * Bundle Size Checker Script
 * Checks bundle size against predefined limits and fails CI if exceeded
 */

const fs = require('fs');
const path = require('path');

class BundleSizeChecker {
  constructor() {
    this.bundleDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    this.strict = process.argv.includes('--strict');
    this.limits = {
      total: this.strict ? 2.5 * 1024 * 1024 : 3 * 1024 * 1024, // 2.5MB strict, 3MB target (S-grade)
      largestChunk: this.strict ? 800 * 1024 : 1.2 * 1024 * 1024, // 800KB strict, 1.2MB normal
      chunkCount: 25, // Reduced from 30 for better optimization
    };
  }

  async check() {
    console.log('📏 Checking bundle size...');

    // Check if bundle exists
    if (!fs.existsSync(this.bundleDir)) {
      console.log('❌ Bundle directory not found. Run `npm run build` first.');
      process.exit(1);
    }

    // Analyze chunks
    const chunks = this.getChunkFiles();
    const analysis = this.analyzeChunks(chunks);

    // Check against limits
    const violations = this.checkLimits(analysis);

    // Report results
    this.reportResults(analysis, violations);

    // Exit with appropriate code
    if (violations.length > 0) {
      console.log('\n❌ Bundle size check failed!');
      process.exit(1);
    } else {
      console.log('\n✅ Bundle size check passed!');
      process.exit(0);
    }
  }

  getChunkFiles() {
    const chunks = [];

    if (fs.existsSync(this.bundleDir)) {
      const files = fs.readdirSync(this.bundleDir);
      files.forEach((file) => {
        if (file.endsWith('.js')) {
          const filePath = path.join(this.bundleDir, file);
          const stats = fs.statSync(filePath);
          chunks.push({
            name: file,
            path: filePath,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          });
        }
      });
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  analyzeChunks(chunks) {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    const largestChunk = chunks[0];
    const chunksOver1MB = chunks.filter((chunk) => chunk.size > 1024 * 1024);

    return {
      totalSize,
      totalSizeMB,
      chunkCount: chunks.length,
      chunks,
      largestChunk,
      chunksOver1MB,
      timestamp: new Date().toISOString(),
    };
  }

  checkLimits(analysis) {
    const violations = [];

    // Check total bundle size
    if (analysis.totalSize > this.limits.total) {
      violations.push({
        type: 'total_size',
        message: `Total bundle size ${analysis.totalSizeMB}MB exceeds limit of ${(this.limits.total / (1024 * 1024)).toFixed(2)}MB`,
        severity: 'high',
      });
    }

    // Check largest chunk size
    if (analysis.largestChunk && analysis.largestChunk.size > this.limits.largestChunk) {
      violations.push({
        type: 'largest_chunk',
        message: `Largest chunk "${analysis.largestChunk.name}" is ${(analysis.largestChunk.size / (1024 * 1024)).toFixed(2)}MB, exceeds limit of ${(this.limits.largestChunk / (1024 * 1024)).toFixed(2)}MB`,
        severity: 'medium',
      });
    }

    // Check chunk count
    if (analysis.chunkCount > this.limits.chunkCount) {
      violations.push({
        type: 'chunk_count',
        message: `Too many chunks: ${analysis.chunkCount} (limit: ${this.limits.chunkCount})`,
        severity: 'low',
      });
    }

    // Check for chunks over 1MB
    if (analysis.chunksOver1MB.length > 2) {
      violations.push({
        type: 'too_many_large_chunks',
        message: `${analysis.chunksOver1MB.length} chunks over 1MB found. Consider code splitting.`,
        severity: 'medium',
      });
    }

    return violations;
  }

  reportResults(analysis, violations) {
    console.log('\n📊 Bundle Size Analysis:');
    console.log(`Total Size: ${analysis.totalSizeMB} MB`);
    console.log(`Total Chunks: ${analysis.chunkCount}`);
    console.log(
      `Largest Chunk: ${analysis.largestChunk?.name} (${analysis.largestChunk?.sizeMB} MB)`
    );
    console.log(`Chunks > 1MB: ${analysis.chunksOver1MB.length}`);

    if (violations.length > 0) {
      console.log('\n🚨 Violations:');
      violations.forEach((violation, index) => {
        const icon =
          violation.severity === 'high' ? '🔴' : violation.severity === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${violation.message}`);
      });
    }

    console.log('\n💡 Recommendations:');
    if (analysis.totalSizeMB > 3) {
      console.log('- ⚠️  Bundle exceeds 3MB target! Implement dynamic imports for route-based code splitting');
      console.log('- Review and remove unused dependencies');
      console.log('- Implement lazy loading for heavy components');
      console.log('- Consider tree-shaking unused code');
    }

    if (analysis.chunksOver1MB.length > 0) {
      console.log('- Large chunks detected. Consider splitting vendor libraries');
      console.log('- Implement better code splitting strategies');
    }

    if (analysis.chunkCount > 20) {
      console.log('- High chunk count. Consider consolidating small chunks');
    }

    console.log(
      `\nMode: ${this.strict ? 'Strict' : 'Normal'} (limits: Total=${(this.limits.total / (1024 * 1024)).toFixed(2)}MB, Largest=${(this.limits.largestChunk / (1024 * 1024)).toFixed(2)}MB, Chunks=${this.limits.chunkCount})`
    );
  }
}

// Run check
const checker = new BundleSizeChecker();
checker.check().catch(console.error);
