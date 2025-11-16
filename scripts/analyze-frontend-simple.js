#!/usr/bin/env node
/**
 * Simple Frontend Performance Analysis
 * Quick performance check without complex DevTools protocols
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1000';
const OUTPUT_DIR = path.join(__dirname, '../test-results/frontend-analysis');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('\n' + '='.repeat(80));
console.log('🚀 FRONTEND PERFORMANCE ANALYSIS');
console.log('='.repeat(80));
console.log(`\n📍 Target: ${FRONTEND_URL}\n`);

async function analyze() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Track resources
    const resources = [];
    page.on('response', async (response) => {
      try {
        const request = response.request();
        const url = request.url();
        const headers = await response.allHeaders();
        const contentLength = headers['content-length'];
        
        resources.push({
          url: url.split('/').pop() || url,
          type: request.resourceType(),
          status: response.status(),
          size: contentLength ? parseInt(contentLength) : 0,
        });
      } catch (e) {
        // Ignore errors
      }
    });

    // 1. Load Performance
    console.log('⏱️  LOAD PERFORMANCE\n');
    const startTime = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    console.log(`   Total Load Time: ${loadTime}ms`);
    if (loadTime < 3000) console.log('   ✅ Excellent (<3s)');
    else if (loadTime < 5000) console.log('   🟡 Good (3-5s)');
    else console.log('   ⚠️  Slow (>5s)');

    // 2. Performance Metrics
    console.log('\n📊 CORE WEB VITALS\n');
    const metrics = await page.evaluate(() => {
      const perf = performance.timing;
      const paint = performance.getEntriesByType('paint');
      const nav = performance.getEntriesByType('navigation')[0];
      
      return {
        dns: perf.domainLookupEnd - perf.domainLookupStart,
        tcp: perf.connectEnd - perf.connectStart,
        ttfb: perf.responseStart - perf.requestStart,
        domLoad: perf.domContentLoadedEventEnd - perf.navigationStart,
        pageLoad: perf.loadEventEnd - perf.navigationStart,
        fcp: paint.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        resources: performance.getEntriesByType('resource').length,
        memory: (performance).memory ? {
          used: (performance).memory.usedJSHeapSize / 1024 / 1024,
          total: (performance).memory.totalJSHeapSize / 1024 / 1024,
          limit: (performance).memory.jsHeapSizeLimit / 1024 / 1024,
        } : null,
      };
    });

    console.log(`   DNS Lookup: ${metrics.dns}ms`);
    console.log(`   TCP Connection: ${metrics.tcp}ms`);
    console.log(`   Time to First Byte: ${metrics.ttfb}ms`);
    console.log(`   First Contentful Paint: ${metrics.fcp.toFixed(2)}ms`);
    console.log(`   DOM Content Loaded: ${metrics.domLoad}ms`);
    console.log(`   Page Load Complete: ${metrics.pageLoad}ms`);

    if (metrics.fcp < 1800) console.log('   ✅ FCP: Excellent');
    else if (metrics.fcp < 3000) console.log('   🟡 FCP: Good');
    else console.log('   ⚠️  FCP: Needs improvement');

    // 3. Resource Analysis
    console.log('\n📦 RESOURCE ANALYSIS\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const byType = {};
    resources.forEach(r => {
      if (!byType[r.type]) byType[r.type] = { count: 0, size: 0 };
      byType[r.type].count++;
      byType[r.type].size += r.size;
    });

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    console.log(`   Total Resources: ${resources.length}`);
    console.log(`   Total Size: ${(totalSize / 1024).toFixed(2)} KB\n`);

    Object.entries(byType).sort((a, b) => b[1].size - a[1].size).forEach(([type, data]) => {
      console.log(`   ${type.padEnd(15)}: ${data.count} files, ${(data.size / 1024).toFixed(2)} KB`);
    });

    // 4. Memory Usage
    if (metrics.memory) {
      console.log('\n💾 MEMORY USAGE\n');
      console.log(`   Used: ${metrics.memory.used.toFixed(2)} MB`);
      console.log(`   Total: ${metrics.memory.total.toFixed(2)} MB`);
      console.log(`   Limit: ${metrics.memory.limit.toFixed(2)} MB`);
      console.log(`   Usage: ${((metrics.memory.used / metrics.memory.limit) * 100).toFixed(2)}%`);

      if (metrics.memory.used < 50) console.log('   ✅ Excellent');
      else if (metrics.memory.used < 100) console.log('   🟡 Good');
      else console.log('   ⚠️  High');
    }

    // 5. Network Performance
    console.log('\n🌐 NETWORK PERFORMANCE\n');
    const slowResources = resources
      .filter(r => r.status === 200)
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    console.log('   Top 10 Largest Resources:');
    slowResources.forEach((r, i) => {
      const name = r.url.length > 40 ? r.url.substring(0, 37) + '...' : r.url;
      console.log(`   ${i + 1}. ${name.padEnd(42)} ${(r.size / 1024).toFixed(2)} KB`);
    });

    // 6. React Detection
    console.log('\n⚛️  REACT APP ANALYSIS\n');
    const reactInfo = await page.evaluate(() => {
      const root = document.getElementById('root') || document.getElementById('__next');
      return {
        hasRoot: !!root,
        domNodes: document.querySelectorAll('*').length,
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      };
    });

    console.log(`   App Root: ${reactInfo.hasRoot ? '✅ Found' : '❌ Not found'}`);
    console.log(`   DOM Nodes: ${reactInfo.domNodes}`);
    console.log(`   Scripts: ${reactInfo.scripts}`);
    console.log(`   Stylesheets: ${reactInfo.stylesheets}`);

    if (reactInfo.domNodes < 3000) console.log('   ✅ DOM size is optimal');
    else if (reactInfo.domNodes < 5000) console.log('   🟡 DOM size is acceptable');
    else console.log('   ⚠️  Large DOM - may impact performance');

    // 7. Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 PERFORMANCE SUMMARY');
    console.log('='.repeat(80) + '\n');

    const summary = {
      timestamp: new Date().toISOString(),
      url: FRONTEND_URL,
      metrics: {
        loadTime: `${loadTime}ms`,
        fcp: `${metrics.fcp.toFixed(2)}ms`,
        ttfb: `${metrics.ttfb}ms`,
        domLoad: `${metrics.domLoad}ms`,
        pageLoad: `${metrics.pageLoad}ms`,
      },
      resources: {
        total: resources.length,
        totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
        byType: Object.entries(byType).map(([type, data]) => ({
          type,
          count: data.count,
          size: `${(data.size / 1024).toFixed(2)} KB`,
        })),
      },
      memory: metrics.memory ? {
        used: `${metrics.memory.used.toFixed(2)} MB`,
        total: `${metrics.memory.total.toFixed(2)} MB`,
        usage: `${((metrics.memory.used / metrics.memory.limit) * 100).toFixed(2)}%`,
      } : null,
      react: reactInfo,
      score: {
        loadSpeed: loadTime < 3000 ? '✅ Excellent' : loadTime < 5000 ? '🟡 Good' : '⚠️  Needs work',
        fcp: metrics.fcp < 1800 ? '✅ Excellent' : metrics.fcp < 3000 ? '🟡 Good' : '⚠️  Needs work',
        memory: metrics.memory ? (metrics.memory.used < 50 ? '✅ Excellent' : metrics.memory.used < 100 ? '🟡 Good' : '⚠️  High') : 'N/A',
        domSize: reactInfo.domNodes < 3000 ? '✅ Optimal' : reactInfo.domNodes < 5000 ? '🟡 Acceptable' : '⚠️  Large',
      },
    };

    console.log('   Load Speed: ' + summary.score.loadSpeed);
    console.log('   First Contentful Paint: ' + summary.score.fcp);
    console.log('   Memory Usage: ' + summary.score.memory);
    console.log('   DOM Size: ' + summary.score.domSize);

    // Save report
    const reportPath = path.join(OUTPUT_DIR, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Report saved: ${reportPath}`);

    // Screenshot
    const screenshotPath = path.join(OUTPUT_DIR, 'screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

analyze().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

