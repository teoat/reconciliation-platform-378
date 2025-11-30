#!/usr/bin/env node

/**
 * Documentation Link Checker
 * Checks all links in markdown files for validity
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const CHECK_TIMEOUT = 10000; // 10 seconds
const CONCURRENT_CHECKS = 5; // Check 5 links at a time

// Results tracking
const results = {
  total: 0,
  checked: 0,
  valid: 0,
  invalid: 0,
  errors: [],
  warnings: []
};

/**
 * Check if URL is accessible
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https:') ? https : http;

    const req = client.request(url, {
      method: 'HEAD',
      timeout: CHECK_TIMEOUT,
      headers: {
        'User-Agent': 'Documentation-Link-Checker/1.0'
      }
    }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        valid: res.statusCode >= 200 && res.statusCode < 400
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        error: err.message,
        valid: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        valid: false
      });
    });

    req.end();
  });
}

/**
 * Extract links from markdown content
 */
function extractLinks(content, filePath) {
  const links = new Set();
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    let url = match[2];

    // Skip anchors and relative links
    if (url.startsWith('#') || url.startsWith('./') || url.startsWith('../')) {
      continue;
    }

    // Only check HTTP/HTTPS URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      continue;
    }

    links.add(url);
  }

  return Array.from(links).map(url => ({ url, file: filePath }));
}

/**
 * Process files recursively
 */
function processFiles(dir) {
  const files = [];

  function walk(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Check links in batches
 */
async function checkLinksBatch(links) {
  const batches = [];
  for (let i = 0; i < links.length; i += CONCURRENT_CHECKS) {
    batches.push(links.slice(i, i + CONCURRENT_CHECKS));
  }

  for (const batch of batches) {
    const promises = batch.map(link => checkUrl(link.url));
    const batchResults = await Promise.all(promises);

    for (let i = 0; i < batch.length; i++) {
      const link = batch[i];
      const result = batchResults[i];

      results.checked++;

      if (result.valid) {
        results.valid++;
        console.log(`✅ ${link.url}`);
      } else {
        results.invalid++;
        const error = result.error || `HTTP ${result.status}`;
        results.errors.push({
          url: link.url,
          file: link.file,
          error
        });
        console.log(`❌ ${link.url} (${link.file}) - ${error}`);
      }
    }

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Documentation Link Checker\n');

  // Find all markdown files
  const files = processFiles(DOCS_DIR);
  console.log(`Found ${files.length} markdown files\n`);

  // Extract links from all files
  const allLinks = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const links = extractLinks(content, path.relative(DOCS_DIR, file));
      allLinks.push(...links);
    } catch (error) {
      results.warnings.push(`Failed to read ${file}: ${error.message}`);
    }
  }

  results.total = allLinks.length;
  console.log(`Found ${results.total} links to check\n`);

  if (allLinks.length === 0) {
    console.log('No links found to check.');
    return;
  }

  // Check links
  await checkLinksBatch(allLinks);

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total links: ${results.total}`);
  console.log(`Valid: ${results.valid}`);
  console.log(`Invalid: ${results.invalid}`);

  if (results.errors.length > 0) {
    console.log('\n❌ INVALID LINKS:');
    results.errors.forEach(error => {
      console.log(`  ${error.url} (${error.file}) - ${error.error}`);
    });
  }

  // Exit with error code if there are invalid links
  if (results.invalid > 0) {
    process.exit(1);
  } else {
    console.log('\n✅ All links are valid!');
  }
}

// Run the checker
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});</content>
<parameter name="filePath">scripts/check-doc-links.js