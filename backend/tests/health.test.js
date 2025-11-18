// Simple health check tests for backend API
// Run with: node tests/health.test.js

import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:8386';

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    }).on('error', reject);
  });
}

// Test cases
const tests = [
  {
    name: 'Backend server should be running',
    test: async () => {
      const response = await makeRequest('/api/auth/me');
      // Should return 401 (unauthorized) not 500 or connection error
      if (response.status === 401 || response.status === 200) {
        return { passed: true, message: 'Server is running' };
      }
      return { passed: false, message: `Expected 401 or 200, got ${response.status}` };
    }
  },
  {
    name: 'Auth routes should be accessible',
    test: async () => {
      const response = await makeRequest('/api/auth/signin');
      // Should return 400 (bad request) not 404
      if (response.status === 400 || response.status === 401) {
        return { passed: true, message: 'Auth routes are accessible' };
      }
      return { passed: false, message: `Expected 400 or 401, got ${response.status}` };
    }
  },
  {
    name: 'Chat routes should be accessible',
    test: async () => {
      const response = await makeRequest('/api/chat/rooms');
      // Should return 401 (unauthorized) meaning auth middleware is working
      if (response.status === 401) {
        return { passed: true, message: 'Chat routes require authentication' };
      }
      return { passed: false, message: `Expected 401, got ${response.status}` };
    }
  },
  {
    name: 'Response should have JSON content-type',
    test: async () => {
      const response = await makeRequest('/api/auth/me');
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        return { passed: true, message: 'Response is JSON' };
      }
      return { passed: false, message: `Expected JSON, got ${contentType}` };
    }
  }
];

// Run all tests
async function runTests() {
  console.log('🧪 Running Backend Health Tests...\n');
  console.log(`API URL: ${API_URL}\n`);
  
  let passed = 0;
  let failed = 0;

  for (const testCase of tests) {
    try {
      const result = await testCase.test();
      if (result.passed) {
        console.log(`✅ ${testCase.name}`);
        console.log(`   ${result.message}\n`);
        passed++;
      } else {
        console.log(`❌ ${testCase.name}`);
        console.log(`   ${result.message}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('─'.repeat(50));

  // Exit with error code if any test failed
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

