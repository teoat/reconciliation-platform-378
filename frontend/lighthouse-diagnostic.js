#!/usr/bin/env node
/**
 * Lighthouse Diagnostic Script
 * Runs comprehensive Lighthouse analysis on the frontend
 */

import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const URL = process.env.LIGHTHOUSE_URL || 'http://localhost:1000';
const OUTPUT_DIR = process.env.LIGHTHOUSE_OUTPUT_DIR || path.join(process.cwd(), 'lighthouse-reports');

async function runLighthouse() {
  console.log(`🔍 Running Lighthouse analysis on ${URL}...\n`);

  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
  });

  const options = {
    logLevel: 'info',
    output: ['json', 'html'],
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    // Run Lighthouse
    const runnerResult = await lighthouse(URL, options);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Save reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(OUTPUT_DIR, `lighthouse-${timestamp}.json`);
    const htmlPath = path.join(OUTPUT_DIR, `lighthouse-${timestamp}.html`);

    fs.writeFileSync(jsonPath, JSON.stringify(runnerResult.lhr, null, 2));
    fs.writeFileSync(htmlPath, runnerResult.report[1]); // HTML report

    // Extract scores
    const scores = {
      performance: Math.round(runnerResult.lhr.categories.performance.score * 100),
      accessibility: Math.round(runnerResult.lhr.categories.accessibility.score * 100),
      'best-practices': Math.round(runnerResult.lhr.categories['best-practices'].score * 100),
      seo: Math.round(runnerResult.lhr.categories.seo.score * 100),
    };

    // Extract issues
    const audits = runnerResult.lhr.audits;
    const issues = {
      performance: Object.entries(audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 0.9 && audit.group === 'perf-metric')
        .map(([key, audit]) => ({ id: key, title: audit.title, score: audit.score, description: audit.description })),
      accessibility: Object.entries(audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 1 && audit.group === 'a11y')
        .map(([key, audit]) => ({ id: key, title: audit.title, score: audit.score, description: audit.description })),
      'best-practices': Object.entries(audits)
        .filter(([, audit]) => audit.score !== null && audit.score < 1 && audit.group === 'best-practices')
        .map(([key, audit]) => ({ id: key, title: audit.title, score: audit.score, description: audit.description })),
    };

    // Display summary
    console.log('📊 Lighthouse Scores:');
    console.log(`   Performance: ${scores.performance}/100 ${scores.performance >= 90 ? '✅' : '⚠️'}`);
    console.log(`   Accessibility: ${scores.accessibility}/100 ${scores.accessibility >= 90 ? '✅' : '⚠️'}`);
    console.log(`   Best Practices: ${scores['best-practices']}/100 ${scores['best-practices'] >= 90 ? '✅' : '⚠️'}`);
    console.log(`   SEO: ${scores.seo}/100 ${scores.seo >= 90 ? '✅' : '⚠️'}\n`);

    // Display critical issues
    if (issues.performance.length > 0) {
      console.log('⚠️  Performance Issues:');
      issues.performance.forEach(issue => {
        console.log(`   - ${issue.title} (Score: ${Math.round(issue.score * 100)})`);
      });
      console.log('');
    }

    if (issues.accessibility.length > 0) {
      console.log('⚠️  Accessibility Issues:');
      issues.accessibility.forEach(issue => {
        console.log(`   - ${issue.title} (Score: ${Math.round(issue.score * 100)})`);
      });
      console.log('');
    }

    if (issues['best-practices'].length > 0) {
      console.log('⚠️  Best Practices Issues:');
      issues['best-practices'].forEach(issue => {
        console.log(`   - ${issue.title} (Score: ${Math.round(issue.score * 100)})`);
      });
      console.log('');
    }

    // Display key metrics
    const metrics = runnerResult.lhr.audits;
    console.log('📈 Key Metrics:');
    if (metrics['first-contentful-paint']) {
      console.log(`   First Contentful Paint: ${metrics['first-contentful-paint'].displayValue || 'N/A'}`);
    }
    if (metrics['largest-contentful-paint']) {
      console.log(`   Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue || 'N/A'}`);
    }
    if (metrics['total-blocking-time']) {
      console.log(`   Total Blocking Time: ${metrics['total-blocking-time'].displayValue || 'N/A'}`);
    }
    if (metrics['cumulative-layout-shift']) {
      console.log(`   Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue || 'N/A'}`);
    }
    if (metrics['speed-index']) {
      console.log(`   Speed Index: ${metrics['speed-index'].displayValue || 'N/A'}`);
    }
    console.log('');

    console.log(`✅ Reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}\n`);

    // Return summary for analysis
    return {
      scores,
      issues,
      metrics: {
        fcp: metrics['first-contentful-paint']?.numericValue,
        lcp: metrics['largest-contentful-paint']?.numericValue,
        tbt: metrics['total-blocking-time']?.numericValue,
        cls: metrics['cumulative-layout-shift']?.numericValue,
        si: metrics['speed-index']?.numericValue,
      },
      reportPath: jsonPath,
    };

  } finally {
    await chrome.kill();
  }
}

runLighthouse().catch(console.error);

