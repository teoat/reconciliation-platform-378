// Performance Test Script for k6
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],             // Custom error rate must be below 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

// Test users
const users = [
  { email: 'user1@example.com', password: 'password123' },
  { email: 'user2@example.com', password: 'password123' },
  { email: 'user3@example.com', password: 'password123' },
];

// Authentication tokens
let authTokens = {};

export function setup() {
  // Login users and store tokens
  for (let user of users) {
    let loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (loginResponse.status === 200) {
      let loginData = JSON.parse(loginResponse.body);
      authTokens[user.email] = loginData.data.token;
    }
  }
  
  return { authTokens };
}

export default function(data) {
  let user = users[Math.floor(Math.random() * users.length)];
  let token = data.authTokens[user.email];
  
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  let headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // Test scenarios
  let scenario = Math.random();
  
  if (scenario < 0.3) {
    // Test project creation and management
    testProjectManagement(headers);
  } else if (scenario < 0.6) {
    // Test file upload and processing
    testFileProcessing(headers);
  } else if (scenario < 0.8) {
    // Test reconciliation jobs
    testReconciliationJobs(headers);
  } else {
    // Test analytics and reporting
    testAnalytics(headers);
  }
  
  sleep(1);
}

function testProjectManagement(headers) {
  // Create project
  let createProjectResponse = http.post(`${API_URL}/projects`, JSON.stringify({
    name: `Test Project ${Date.now()}`,
    description: 'Performance test project',
    settings: {
      collaboration_enabled: true,
      max_concurrent_users: 5
    }
  }), { headers });
  
  let success = check(createProjectResponse, {
    'project creation status is 200': (r) => r.status === 200,
    'project creation response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) {
    errorRate.add(1);
    return;
  }
  
  let projectData = JSON.parse(createProjectResponse.body);
  let projectId = projectData.data.id;
  
  // Get project details
  let getProjectResponse = http.get(`${API_URL}/projects/${projectId}`, { headers });
  
  check(getProjectResponse, {
    'get project status is 200': (r) => r.status === 200,
    'get project response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // List projects
  let listProjectsResponse = http.get(`${API_URL}/projects`, { headers });
  
  check(listProjectsResponse, {
    'list projects status is 200': (r) => r.status === 200,
    'list projects response time < 400ms': (r) => r.timings.duration < 400,
  });
}

function testFileProcessing(headers) {
  // Create a test project first
  let createProjectResponse = http.post(`${API_URL}/projects`, JSON.stringify({
    name: `File Test Project ${Date.now()}`,
    description: 'File processing test project'
  }), { headers });
  
  if (createProjectResponse.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  let projectData = JSON.parse(createProjectResponse.body);
  let projectId = projectData.data.id;
  
  // Create test CSV data
  let csvData = 'id,name,email\n1,John Doe,john@example.com\n2,Jane Smith,jane@example.com\n3,Bob Johnson,bob@example.com';
  
  // Upload file
  let uploadResponse = http.post(`${API_URL}/files/upload`, {
    file: http.file(csvData, 'test.csv', 'text/csv'),
    project_id: projectId
  }, { headers: { 'Authorization': headers.Authorization } });
  
  let success = check(uploadResponse, {
    'file upload status is 200': (r) => r.status === 200,
    'file upload response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  if (!success) {
    errorRate.add(1);
    return;
  }
  
  let fileData = JSON.parse(uploadResponse.body);
  let fileId = fileData.data.id;
  
  // Process file
  let processResponse = http.post(`${API_URL}/files/${fileId}/process`, {}, { headers });
  
  check(processResponse, {
    'file process status is 200': (r) => r.status === 200,
    'file process response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}

function testReconciliationJobs(headers) {
  // Create test project
  let createProjectResponse = http.post(`${API_URL}/projects`, JSON.stringify({
    name: `Reconciliation Test Project ${Date.now()}`,
    description: 'Reconciliation test project'
  }), { headers });
  
  if (createProjectResponse.status !== 200) {
    errorRate.add(1);
    return;
  }
  
  let projectData = JSON.parse(createProjectResponse.body);
  let projectId = projectData.data.id;
  
  // Create reconciliation job
  let createJobResponse = http.post(`${API_URL}/reconciliation/jobs`, JSON.stringify({
    name: `Test Job ${Date.now()}`,
    description: 'Performance test reconciliation job',
    project_id: projectId,
    source_data_source_id: 'test-source-id',
    target_data_source_id: 'test-target-id',
    matching_rules: [
      { field: 'email', type: 'exact' },
      { field: 'name', type: 'fuzzy', threshold: 0.8 }
    ],
    confidence_threshold: 0.7,
    auto_approve: false
  }), { headers });
  
  let success = check(createJobResponse, {
    'job creation status is 200': (r) => r.status === 200,
    'job creation response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) {
    errorRate.add(1);
    return;
  }
  
  let jobData = JSON.parse(createJobResponse.body);
  let jobId = jobData.data.id;
  
  // Get job status
  let getJobResponse = http.get(`${API_URL}/reconciliation/jobs/${jobId}`, { headers });
  
  check(getJobResponse, {
    'get job status is 200': (r) => r.status === 200,
    'get job response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // List jobs
  let listJobsResponse = http.get(`${API_URL}/reconciliation/jobs?project_id=${projectId}`, { headers });
  
  check(listJobsResponse, {
    'list jobs status is 200': (r) => r.status === 200,
    'list jobs response time < 400ms': (r) => r.timings.duration < 400,
  });
}

function testAnalytics(headers) {
  // Test dashboard analytics
  let dashboardResponse = http.get(`${API_URL}/analytics/dashboard`, { headers });
  
  let success = check(dashboardResponse, {
    'dashboard analytics status is 200': (r) => r.status === 200,
    'dashboard analytics response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (!success) {
    errorRate.add(1);
    return;
  }
  
  // Test reconciliation analytics
  let reconciliationResponse = http.get(`${API_URL}/analytics/reconciliation`, { headers });
  
  check(reconciliationResponse, {
    'reconciliation analytics status is 200': (r) => r.status === 200,
    'reconciliation analytics response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  // Test system metrics
  let metricsResponse = http.get(`${API_URL}/system/metrics`, { headers });
  
  check(metricsResponse, {
    'system metrics status is 200': (r) => r.status === 200,
    'system metrics response time < 300ms': (r) => r.timings.duration < 300,
  });
}

export function teardown(data) {
  // Cleanup test data if needed
  console.log('Performance test completed');
}