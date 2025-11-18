// Simple health check tests for frontend
// Run with: node tests/health.test.js

import http from 'http';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost';

// Helper function to make HTTP requests
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, FRONTEND_URL);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data, headers: res.headers });
      });
    }).on('error', reject);
  });
}

// Test cases
const tests = [
  {
    name: 'Frontend should be accessible',
    test: async () => {
      const response = await makeRequest('/');
      if (response.status === 200) {
        return { passed: true, message: 'Frontend is accessible' };
      }
      return { passed: false, message: `Expected 200, got ${response.status}` };
    }
  },
  {
    name: 'Health check endpoint should work',
    test: async () => {
      const response = await makeRequest('/health');
      if (response.status === 200 && response.data.includes('healthy')) {
        return { passed: true, message: 'Health check is working' };
      }
      return { passed: false, message: `Health check failed: ${response.status}` };
    }
  },
  {
    name: 'HTML content should be served',
    test: async () => {
      const response = await makeRequest('/');
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        return { passed: true, message: 'HTML content is served' };
      }
      return { passed: false, message: `Expected HTML, got ${contentType}` };
    }
  },
  {
    name: 'Root HTML should contain app div',
    test: async () => {
      const response = await makeRequest('/');
      if (response.data.includes('id="root"') || response.data.includes('id=root')) {
        return { passed: true, message: 'React root element found' };
      }
      return { passed: false, message: 'React root element not found' };
    }
  },
  {
    name: 'SPA routing should work (all routes return HTML)',
    test: async () => {
      const response = await makeRequest('/some-random-route');
      // Should return index.html with 200 (SPA behavior)
      if (response.status === 200 && response.data.includes('id="root"')) {
        return { passed: true, message: 'SPA routing is configured correctly' };
      }
      return { passed: false, message: `SPA routing may not be working: ${response.status}` };
    }
  }
];

// Run all tests
async function runTests() {
  console.log('🧪 Running Frontend Health Tests...\n');
  console.log(`Frontend URL: ${FRONTEND_URL}\n`);
  
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

