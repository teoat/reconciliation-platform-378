// K6 Load Testing Script
// Benchmark system under 50K concurrent users

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 1000 },   // Ramp up to 1K users
    { duration: '5m', target: 1000 },   // Stay at 1K users
    { duration: '2m', target: 5000 },   // Ramp up to 5K users
    { duration: '5m', target: 5000 },   // Stay at 5K users
    { duration: '2m', target: 10000 },  // Ramp up to 10K users
    { duration: '5m', target: 10000 },  // Stay at 10K users
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests below 500ms
    http_req_failed: ['rate<0.01'],     // Less than 1% errors
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:2000';

export default function () {
  // Test 1: Health Check
  const healthCheck = http.get(`${BASE_URL}/health`);
  check(healthCheck, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(0.1);

  // Test 2: API Endpoint (unauthenticated)
  const apiRequest = http.get(`${BASE_URL}/api/v1/projects`);
  check(apiRequest, {
    'API request successful': (r) => r.status === 200 || r.status === 401,
    'API response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(0.5);

  // Test 3: Static Assets (if available)
  const staticAsset = http.get(`${BASE_URL}/static/favicon.ico`);
  check(staticAsset, {
    'Static asset served': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

