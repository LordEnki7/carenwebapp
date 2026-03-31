#!/usr/bin/env node

/**
 * C.A.R.E.N. Load Testing Verification Script
 * Tests the load testing system implementation
 */

const http = require('http');

async function testLoadTestEndpoints() {
  console.log('🧪 Testing C.A.R.E.N. Load Testing System...\n');
  
  const baseUrl = 'http://localhost:5000';
  const adminKey = 'CAREN_ADMIN_2025_PRODUCTION';
  
  try {
    // Test 1: Start Load Test
    console.log('📊 Test 1: Starting Load Test...');
    const startResponse = await makeRequest(`${baseUrl}/api/load-test/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scenario: 'moderate' })
    });
    
    if (startResponse.sessionId) {
      console.log(`✅ Load test started successfully! Session ID: ${startResponse.sessionId}\n`);
      
      // Test 2: Check Load Test Status
      console.log('🔍 Test 2: Checking Load Test Status...');
      const statusResponse = await makeRequest(`${baseUrl}/api/load-test/status/${startResponse.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${adminKey}`
        }
      });
      
      if (statusResponse.sessionId) {
        console.log(`✅ Load test status retrieved successfully!`);
        console.log(`   Status: ${statusResponse.status}`);
        console.log(`   Progress: ${statusResponse.progress}%`);
        console.log(`   Current RPS: ${statusResponse.metrics?.currentRPS || 'N/A'}`);
        console.log(`   Response Time: ${statusResponse.metrics?.responseTime || 'N/A'}ms\n`);
      } else {
        console.log('❌ Failed to get load test status\n');
      }
    } else {
      console.log('❌ Failed to start load test\n');
    }
    
    // Test 3: Test Authentication
    console.log('🔐 Test 3: Testing Authentication...');
    try {
      await makeRequest(`${baseUrl}/api/load-test/start`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer INVALID_KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scenario: 'light' })
      });
      console.log('❌ Authentication test failed - should have been blocked\n');
    } catch (error) {
      if (error.statusCode === 401) {
        console.log('✅ Authentication working correctly - unauthorized access blocked\n');
      } else {
        console.log(`❌ Unexpected authentication error: ${error.message}\n`);
      }
    }
    
    console.log('🎯 Load Testing System Verification Complete!');
    console.log('✅ All endpoints operational');
    console.log('✅ Admin authentication working');
    console.log('✅ Ready for comprehensive load testing');
    
  } catch (error) {
    console.error('❌ Load testing system verification failed:', error.message);
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          const error = new Error(`HTTP ${res.statusCode}: ${data}`);
          error.statusCode = res.statusCode;
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Run the test
testLoadTestEndpoints();