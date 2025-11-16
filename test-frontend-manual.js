// Manual Frontend Testing Script
// This script tests the frontend functionality without Playwright

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testFrontend() {
  log('\n🧪 Testing Reconciliation Platform Frontend\n', colors.blue);

  const tests = [
    {
      name: 'Frontend is accessible',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        if (!response.body.includes('Reconciliation Platform')) {
          throw new Error('Page title not found');
        }
        return 'Frontend is serving content correctly';
      }
    },
    {
      name: 'Security headers are present',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        const requiredHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'content-security-policy'
        ];
        const missing = requiredHeaders.filter(h => !response.headers[h]);
        if (missing.length > 0) {
          throw new Error(`Missing headers: ${missing.join(', ')}`);
        }
        return 'All security headers present';
      }
    },
    {
      name: 'Static assets are bundled',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        const hasJS = response.body.includes('/js/') || response.body.includes('.js');
        const hasCSS = response.body.includes('/css/') || response.body.includes('.css');
        if (!hasJS || !hasCSS) {
          throw new Error('Missing JS or CSS assets');
        }
        return 'Static assets are properly referenced';
      }
    },
    {
      name: 'Root div exists',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        if (!response.body.includes('id="root"')) {
          throw new Error('Root div not found');
        }
        return 'React root div is present';
      }
    },
    {
      name: 'CDN libraries are loaded',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        const hasSocketIO = response.body.includes('socket.io');
        const hasAxios = response.body.includes('axios');
        if (!hasSocketIO || !hasAxios) {
          throw new Error('CDN libraries not found');
        }
        return 'External libraries from CDN are present';
      }
    },
    {
      name: 'Backend is reachable from frontend',
      test: async () => {
        const response = await makeRequest('http://localhost:2000/health');
        if (response.statusCode !== 200) {
          throw new Error(`Backend not accessible: ${response.statusCode}`);
        }
        const data = JSON.parse(response.body);
        if (!data.success || data.data.status !== 'healthy') {
          throw new Error('Backend is not healthy');
        }
        return 'Backend API is healthy and reachable';
      }
    },
    {
      name: 'Nginx compression is enabled',
      test: async () => {
        const response = await makeRequest('http://localhost:1000');
        if (!response.headers['vary'] || !response.headers['vary'].includes('Accept-Encoding')) {
          throw new Error('Gzip compression headers not found');
        }
        return 'Nginx compression is configured';
      }
    },
    {
      name: 'SPA routing works',
      test: async () => {
        const response = await makeRequest('http://localhost:1000/projects');
        if (response.statusCode !== 200) {
          throw new Error(`SPA route failed: ${response.statusCode}`);
        }
        if (!response.body.includes('id="root"')) {
          throw new Error('SPA not serving app on route');
        }
        return 'SPA routing correctly serves index.html';
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      log(`✅ ${test.name}`, colors.green);
      log(`   ${result}`, colors.reset);
      passed++;
    } catch (error) {
      log(`❌ ${test.name}`, colors.red);
      log(`   Error: ${error.message}`, colors.red);
      if (error.stack) {
        log(`   Stack: ${error.stack.split('\n')[1]}`, colors.yellow);
      }
      failed++;
    }
  }

  log(`\n📊 Test Summary`, colors.blue);
  log(`   Passed: ${passed}/${tests.length}`, passed === tests.length ? colors.green : colors.yellow);
  log(`   Failed: ${failed}/${tests.length}`, failed > 0 ? colors.red : colors.green);

  if (failed > 0) {
    log(`\n⚠️  Some tests failed. Frontend may not be working as expected.`, colors.yellow);
    process.exit(1);
  } else {
    log(`\n✅ All tests passed! Frontend is working correctly.`, colors.green);
    log(`\n🌐 You can now open Chrome and visit http://localhost:1000`, colors.blue);
    process.exit(0);
  }
}

testFrontend().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});

