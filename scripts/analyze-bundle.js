#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes webpack bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.bundleDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    this.reportDir = path.join(process.cwd(), 'bundle-analysis');
    this.statsFile = path.join(this.reportDir, 'stats.json');
    this.reportFile = path.join(this.reportDir, 'report.html');
  }

  async analyze() {
    console.log('🔍 Analyzing bundle...');

    // Ensure report directory exists
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }

    // Check if bundle exists
    if (!fs.existsSync(this.bundleDir)) {
      console.log('❌ Bundle directory not found. Run `npm run build` first.');
      return;
    }

    // Analyze chunks
    const chunks = this.getChunkFiles();
    const analysis = this.analyzeChunks(chunks);

    // Generate reports
    this.generateJSONReport(analysis);
    this.generateHTMLReport(analysis);

    // Print summary
    this.printSummary(analysis);

    // Provide recommendations
    this.provideRecommendations(analysis);
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

    const largeChunks = chunks.filter((chunk) => chunk.size > 500 * 1024); // > 500KB
    const mediumChunks = chunks.filter(
      (chunk) => chunk.size > 100 * 1024 && chunk.size <= 500 * 1024
    ); // 100KB - 500KB
    const smallChunks = chunks.filter((chunk) => chunk.size <= 100 * 1024); // <= 100KB

    return {
      totalSize,
      totalSizeMB,
      chunkCount: chunks.length,
      chunks,
      largeChunks,
      mediumChunks,
      smallChunks,
      timestamp: new Date().toISOString(),
    };
  }

  generateJSONReport(analysis) {
    const report = {
      analysis,
      recommendations: this.getRecommendations(analysis),
    };

    fs.writeFileSync(this.statsFile, JSON.stringify(report, null, 2));
    console.log(`📊 JSON report saved to: ${this.statsFile}`);
  }

  generateHTMLReport(analysis) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
        .chunk-list { margin-top: 30px; }
        .chunk-item { padding: 15px; border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 10px; }
        .chunk-name { font-weight: bold; color: #333; }
        .chunk-size { color: #666; }
        .large { border-left: 4px solid #dc3545; }
        .medium { border-left: 4px solid #ffc107; }
        .small { border-left: 4px solid #28a745; }
        .recommendations { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 20px; margin-top: 30px; }
        .recommendations h3 { margin-top: 0; color: #0066cc; }
        .recommendation-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Bundle Analysis Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">${analysis.totalSizeMB} MB</div>
                    <div class="metric-label">Total Size</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${analysis.chunkCount}</div>
                    <div class="metric-label">Chunks</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${analysis.largeChunks.length}</div>
                    <div class="metric-label">Large Chunks (>500KB)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${analysis.mediumChunks.length}</div>
                    <div class="metric-label">Medium Chunks (100-500KB)</div>
                </div>
            </div>

            <div class="chunk-list">
                <h2>📋 Chunk Details</h2>
                ${analysis.chunks
                  .map(
                    (chunk) => `
                    <div class="chunk-item ${chunk.size > 500 * 1024 ? 'large' : chunk.size > 100 * 1024 ? 'medium' : 'small'}">
                        <div class="chunk-name">${chunk.name}</div>
                        <div class="chunk-size">${chunk.sizeKB} KB (${chunk.sizeMB} MB)</div>
                    </div>
                `
                  )
                  .join('')}
            </div>

            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                ${this.getRecommendations(analysis)
                  .map(
                    (rec) => `
                    <div class="recommendation-item">
                        <strong>${rec.title}</strong><br>
                        ${rec.description}
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(this.reportFile, html);
    console.log(`📄 HTML report saved to: ${this.reportFile}`);
  }

  printSummary(analysis) {
    console.log('\n📊 Bundle Analysis Summary:');
    console.log(`Total Size: ${analysis.totalSizeMB} MB`);
    console.log(`Total Chunks: ${analysis.chunkCount}`);
    console.log(`Large Chunks (>500KB): ${analysis.largeChunks.length}`);
    console.log(`Medium Chunks (100-500KB): ${analysis.mediumChunks.length}`);
    console.log(`Small Chunks (≤100KB): ${analysis.smallChunks.length}`);
  }

  getRecommendations(analysis) {
    const recommendations = [];

    if (analysis.largeChunks.length > 0) {
      recommendations.push({
        title: 'Large Chunks Detected',
        description: `Found ${analysis.largeChunks.length} chunks larger than 500KB. Consider code splitting or lazy loading for these chunks.`,
      });
    }

    if (analysis.totalSizeMB > 5) {
      recommendations.push({
        title: 'Bundle Size Optimization',
        description:
          'Total bundle size exceeds 5MB. Consider implementing dynamic imports, tree shaking, and removing unused dependencies.',
      });
    }

    if (analysis.chunkCount > 20) {
      recommendations.push({
        title: 'Chunk Count Optimization',
        description: `High number of chunks (${analysis.chunkCount}) detected. Consider consolidating small chunks or implementing better code splitting strategies.`,
      });
    }

    recommendations.push({
      title: 'Enable Compression',
      description:
        'Ensure gzip/brotli compression is enabled on your server for better loading performance.',
    });

    recommendations.push({
      title: 'Implement Caching',
      description:
        'Set appropriate cache headers for static assets and implement service worker caching for better performance.',
    });

    return recommendations;
  }

  provideRecommendations(analysis) {
    console.log('\n💡 Recommendations:');

    if (analysis.largeChunks.length > 0) {
      console.log(
        `⚠️  Found ${analysis.largeChunks.length} large chunks (>500KB). Consider code splitting.`
      );
    }

    if (analysis.totalSizeMB > 5) {
      console.log('⚠️  Bundle size exceeds 5MB. Consider optimization strategies.');
    }

    console.log('✅ Run with ANALYZE=true to generate detailed webpack bundle analyzer report.');
    console.log('✅ Consider implementing dynamic imports for route-based code splitting.');
    console.log('✅ Enable compression and caching for better performance.');
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(console.error);
