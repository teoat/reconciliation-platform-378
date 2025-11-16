#!/usr/bin/env node
/**
 * Frontend Performance Analysis with Chrome DevTools Protocol
 * Automated performance auditing and reporting
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1000';
const OUTPUT_DIR = path.join(__dirname, '../test-results/devtools');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function analyzeFrontend() {
  console.log('🚀 Starting Chrome DevTools Frontend Analysis\n');
  console.log(`📍 Target URL: ${FRONTEND_URL}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();

    // Enable DevTools domains
    const client = await page.target().createCDPSession();
    await client.send('Performance.enable');
    await client.send('Network.enable');
    await client.send('Page.enable');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('=' .repeat(80));
    console.log('📊 PERFORMANCE ANALYSIS REPORT');
    console.log('='.repeat(80));

    // 1. Load Performance
    console.log('\n🔍 1. LOAD PERFORMANCE\n');
    const startTime = Date.now();
    
    await page.goto(FRONTEND_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`   ⏱️  Total Load Time: ${loadTime}ms`);
    
    if (loadTime < 3000) {
      console.log('   ✅ Excellent load time (<3s)');
    } else if (loadTime < 5000) {
      console.log('   🟡 Good load time (3-5s)');
    } else {
      console.log('   ⚠️  Slow load time (>5s)');
    }

    // 2. Performance Metrics
    console.log('\n🔍 2. CORE WEB VITALS\n');
    
    const metrics = await page.evaluate(() => {
      const navTiming = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        navigation: navTiming,
        fcp: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
        resources: performance.getEntriesByType('resource').length,
      };
    });

    if (metrics.fcp) {
      console.log(`   🎨 First Contentful Paint: ${metrics.fcp.toFixed(2)}ms`);
      if (metrics.fcp < 1800) {
        console.log('      ✅ Excellent FCP');
      } else if (metrics.fcp < 3000) {
        console.log('      🟡 Good FCP');
      } else {
        console.log('      ⚠️  Needs improvement');
      }
    }

    console.log(`   📦 Total Resources Loaded: ${metrics.resources}`);

    // 3. Coverage Analysis
    console.log('\n🔍 3. CODE COVERAGE ANALYSIS\n');
    
    await client.send('Profiler.enable');
    await client.send('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: true,
    });
    await client.send('CSS.enable');
    await client.send('CSS.startRuleUsageTracking');

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Get JS coverage
    const { result: jsCoverage } = await client.send('Profiler.takePreciseCoverage');
    const { ruleUsage: cssCoverage } = await client.send('CSS.stopRuleUsageTracking');

    let totalJsBytes = 0;
    let usedJsBytes = 0;

    jsCoverage.forEach((entry) => {
      entry.functions.forEach((func) => {
        func.ranges.forEach((range) => {
          const bytes = range.endOffset - range.startOffset;
          totalJsBytes += bytes;
          if (range.count > 0) {
            usedJsBytes += bytes;
          }
        });
      });
    });

    const jsUsagePercent = totalJsBytes > 0 ? (usedJsBytes / totalJsBytes) * 100 : 0;
    console.log(`   📜 JavaScript Usage: ${jsUsagePercent.toFixed(2)}%`);
    console.log(`      Total: ${(totalJsBytes / 1024).toFixed(2)} KB`);
    console.log(`      Used: ${(usedJsBytes / 1024).toFixed(2)} KB`);
    console.log(`      Unused: ${((totalJsBytes - usedJsBytes) / 1024).toFixed(2)} KB`);

    if (jsUsagePercent > 75) {
      console.log('      ✅ Excellent code usage');
    } else if (jsUsagePercent > 50) {
      console.log('      🟡 Good code usage');
    } else {
      console.log('      ⚠️  High unused code - consider code splitting');
    }

    let totalCssRules = cssCoverage.length;
    let usedCssRules = cssCoverage.filter(rule => rule.used).length;
    const cssUsagePercent = totalCssRules > 0 ? (usedCssRules / totalCssRules) * 100 : 0;

    console.log(`\n   🎨 CSS Usage: ${cssUsagePercent.toFixed(2)}%`);
    console.log(`      Total Rules: ${totalCssRules}`);
    console.log(`      Used Rules: ${usedCssRules}`);
    console.log(`      Unused Rules: ${totalCssRules - usedCssRules}`);

    // 4. Network Analysis
    console.log('\n🔍 4. NETWORK ANALYSIS\n');
    
    const resourceTiming = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const byType = {};
      
      resources.forEach(resource => {
        const type = resource.initiatorType || 'other';
        if (!byType[type]) {
          byType[type] = { count: 0, size: 0, duration: 0 };
        }
        byType[type].count++;
        byType[type].size += resource.transferSize || 0;
        byType[type].duration += resource.duration || 0;
      });
      
      return byType;
    });

    console.log('   📊 Resources by Type:');
    Object.entries(resourceTiming).forEach(([type, data]) => {
      console.log(`      ${type}: ${data.count} files, ${(data.size / 1024).toFixed(2)} KB, ${data.duration.toFixed(2)}ms`);
    });

    // 5. Memory Analysis
    console.log('\n🔍 5. MEMORY ANALYSIS\n');
    
    const memory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize / 1024 / 1024,
          total: performance.memory.totalJSHeapSize / 1024 / 1024,
          limit: performance.memory.jsHeapSizeLimit / 1024 / 1024,
        };
      }
      return null;
    });

    if (memory) {
      console.log(`   💾 JavaScript Heap:`);
      console.log(`      Used: ${memory.used.toFixed(2)} MB`);
      console.log(`      Total: ${memory.total.toFixed(2)} MB`);
      console.log(`      Limit: ${memory.limit.toFixed(2)} MB`);
      console.log(`      Usage: ${((memory.used / memory.limit) * 100).toFixed(2)}%`);

      if (memory.used < 50) {
        console.log('      ✅ Excellent memory usage');
      } else if (memory.used < 100) {
        console.log('      🟡 Good memory usage');
      } else {
        console.log('      ⚠️  High memory usage');
      }
    }

    // 6. Lighthouse Audit
    console.log('\n🔍 6. LIGHTHOUSE AUDIT\n');
    console.log('   Running Lighthouse...');

    const { default: lighthouse } = await import('lighthouse');
    const { URL } = await import('url');
    
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: new URL(browser.wsEndpoint()).port,
    };

    const runnerResult = await lighthouse(FRONTEND_URL, options);
    
    if (runnerResult && runnerResult.lhr) {
      const categories = runnerResult.lhr.categories;
      
      console.log(`\n   📊 Lighthouse Scores:`);
      console.log(`      Performance: ${Math.round(categories.performance.score * 100)}/100`);
      console.log(`      Accessibility: ${Math.round(categories.accessibility.score * 100)}/100`);
      console.log(`      Best Practices: ${Math.round(categories['best-practices'].score * 100)}/100`);
      console.log(`      SEO: ${Math.round(categories.seo.score * 100)}/100`);

      // Save full report
      const reportPath = path.join(OUTPUT_DIR, 'lighthouse-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(runnerResult.lhr, null, 2));
      console.log(`\n   💾 Full report saved: ${reportPath}`);
    }

    // 7. Recommendations
    console.log('\n🔍 7. RECOMMENDATIONS\n');
    
    const recommendations = [];

    if (jsUsagePercent < 60) {
      recommendations.push('   • Implement more aggressive code splitting');
      recommendations.push('   • Consider lazy loading for rarely used features');
    }

    if (cssUsagePercent < 60) {
      recommendations.push('   • Remove unused CSS rules');
      recommendations.push('   • Consider critical CSS extraction');
    }

    if (loadTime > 3000) {
      recommendations.push('   • Optimize bundle size');
      recommendations.push('   • Enable compression (gzip/brotli)');
      recommendations.push('   • Implement resource preloading');
    }

    if (memory && memory.used > 100) {
      recommendations.push('   • Check for memory leaks');
      recommendations.push('   • Optimize component re-renders');
      recommendations.push('   • Review event listener cleanup');
    }

    if (recommendations.length === 0) {
      console.log('   ✅ No critical recommendations - frontend is well optimized!');
    } else {
      console.log('   Suggested Improvements:');
      recommendations.forEach(rec => console.log(rec));
    }

    // 8. Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80) + '\n');

    const summary = {
      loadTime: `${loadTime}ms`,
      jsUsage: `${jsUsagePercent.toFixed(2)}%`,
      cssUsage: `${cssUsagePercent.toFixed(2)}%`,
      resourceCount: metrics.resources,
      memoryUsed: memory ? `${memory.used.toFixed(2)} MB` : 'N/A',
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(summary, null, 2));

    // Save summary
    const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n💾 Summary saved: ${summaryPath}\n`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run analysis
analyzeFrontend()
  .then(() => {
    console.log('✅ Analysis complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });

