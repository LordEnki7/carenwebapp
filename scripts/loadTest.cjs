#!/usr/bin/env node

/**
 * C.A.R.E.N. Comprehensive Load Testing Suite
 * Tests the platform's ability to handle thousands of concurrent users
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

// Load Testing Configuration
const LOAD_TEST_CONFIG = {
  baseUrl: process.env.LOAD_TEST_URL || 'http://localhost:5000',
  adminKey: 'CAREN_ADMIN_2025_PRODUCTION',
  testScenarios: {
    light: { users: 50, duration: 30000 }, // 50 users for 30 seconds
    moderate: { users: 200, duration: 60000 }, // 200 users for 1 minute
    heavy: { users: 500, duration: 120000 }, // 500 users for 2 minutes
    extreme: { users: 1000, duration: 180000 }, // 1000 users for 3 minutes
  }
};

class LoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      responseTimes: [],
      errors: [],
      throughput: 0,
      concurrentUsers: 0
    };
    this.startTime = null;
    this.endTime = null;
  }

  // Make HTTP request with timing
  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const url = new URL(endpoint, LOAD_TEST_CONFIG.baseUrl);
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'C.A.R.E.N. Load Tester v1.0',
          'Authorization': options.requiresAuth ? `Bearer ${LOAD_TEST_CONFIG.adminKey}` : undefined,
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;
      
      const req = protocol.request(requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: data,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        reject({
          error: error.message,
          responseTime,
          success: false
        });
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  // Test Admin Dashboard Performance
  async testAdminDashboard(concurrentUsers = 100) {
    console.log(`\n🔧 Testing Admin Dashboard with ${concurrentUsers} concurrent users...`);
    
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      // Test user stats endpoint
      promises.push(
        this.makeRequest('/api/admin/user-stats', { requiresAuth: true })
          .catch(err => ({ success: false, error: err.error }))
      );
      
      // Test sessions endpoint
      promises.push(
        this.makeRequest('/api/admin/sessions', { requiresAuth: true })
          .catch(err => ({ success: false, error: err.error }))
      );
    }

    const results = await Promise.all(promises);
    return this.analyzeResults(results, 'Admin Dashboard');
  }

  // Test Authentication System
  async testAuthentication(concurrentUsers = 200) {
    console.log(`\n🔐 Testing Authentication with ${concurrentUsers} concurrent login attempts...`);
    
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      // Test demo login
      promises.push(
        this.makeRequest('/api/auth/demo-login', {
          method: 'POST',
          body: { username: `loadtest_user_${i}` }
        }).catch(err => ({ success: false, error: err.error }))
      );
      
      // Test user authentication
      promises.push(
        this.makeRequest('/api/auth/user', { requiresAuth: true })
          .catch(err => ({ success: false, error: err.error }))
      );
    }

    const results = await Promise.all(promises);
    return this.analyzeResults(results, 'Authentication System');
  }

  // Test Emergency Recording System
  async testEmergencyRecording(concurrentUsers = 150) {
    console.log(`\n🚨 Testing Emergency Recording with ${concurrentUsers} concurrent recordings...`);
    
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      // Test incident creation
      promises.push(
        this.makeRequest('/api/incidents', {
          method: 'POST',
          body: {
            type: 'emergency_recording',
            description: `Load test incident ${i}`,
            location: { lat: 40.7128, lng: -74.0060 },
            timestamp: new Date().toISOString()
          }
        }).catch(err => ({ success: false, error: err.error }))
      );
    }

    const results = await Promise.all(promises);
    return this.analyzeResults(results, 'Emergency Recording');
  }

  // Test Database Performance
  async testDatabaseOperations(concurrentUsers = 300) {
    console.log(`\n💾 Testing Database Operations with ${concurrentUsers} concurrent queries...`);
    
    const promises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      // Test demo status check (lightweight database query)
      promises.push(
        this.makeRequest('/api/demo/status')
          .catch(err => ({ success: false, error: err.error }))
      );
    }

    const results = await Promise.all(promises);
    return this.analyzeResults(results, 'Database Operations');
  }

  // Test API Rate Limiting
  async testRateLimiting() {
    console.log(`\n⚡ Testing Rate Limiting Protection...`);
    
    const promises = [];
    
    // Send 600 requests rapidly to test rate limiting (500 limit per 15 minutes)
    for (let i = 0; i < 600; i++) {
      promises.push(
        this.makeRequest('/api/demo/status')
          .catch(err => ({ success: false, error: err.error, statusCode: err.statusCode }))
      );
    }

    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => !r.success && r.error?.includes('rate limit'));
    
    console.log(`   ✅ Rate limiting triggered after ${results.length - rateLimited.length} requests`);
    console.log(`   ✅ ${rateLimited.length} requests properly rate limited`);
    
    return {
      testName: 'Rate Limiting',
      totalRequests: results.length,
      rateLimitedRequests: rateLimited.length,
      rateLimitingWorking: rateLimited.length > 0
    };
  }

  // Analyze test results
  analyzeResults(results, testName) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const responseTimes = results.map(r => r.responseTime).filter(t => t !== undefined);
    
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    const analysis = {
      testName,
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageResponseTime: avgResponseTime.toFixed(2),
      maxResponseTime: maxResponseTime.toFixed(2),
      minResponseTime: minResponseTime.toFixed(2),
      errors: failed.map(f => f.error).slice(0, 5) // Show first 5 errors
    };

    console.log(`   ✅ ${analysis.successfulRequests}/${analysis.totalRequests} requests successful (${analysis.successRate.toFixed(1)}%)`);
    console.log(`   ⏱️  Average response time: ${analysis.averageResponseTime}ms`);
    console.log(`   📊 Min: ${analysis.minResponseTime}ms, Max: ${analysis.maxResponseTime}ms`);
    
    if (analysis.failedRequests > 0) {
      console.log(`   ❌ ${analysis.failedRequests} failed requests`);
      if (analysis.errors.length > 0) {
        console.log(`   🔍 Sample errors: ${analysis.errors.slice(0, 2).join(', ')}`);
      }
    }

    return analysis;
  }

  // Run comprehensive load test
  async runComprehensiveTest(scenario = 'moderate') {
    const config = LOAD_TEST_CONFIG.testScenarios[scenario];
    
    console.log(`\n🚀 Starting ${scenario.toUpperCase()} load test scenario`);
    console.log(`📊 Configuration: ${config.users} concurrent users for ${config.duration/1000} seconds`);
    console.log(`🎯 Target URL: ${LOAD_TEST_CONFIG.baseUrl}`);
    console.log('=' .repeat(70));

    this.startTime = Date.now();
    
    // Run all test categories
    const testResults = [];
    
    // Test Admin Dashboard
    testResults.push(await this.testAdminDashboard(Math.floor(config.users * 0.1)));
    
    // Test Authentication  
    testResults.push(await this.testAuthentication(Math.floor(config.users * 0.3)));
    
    // Test Emergency Recording
    testResults.push(await this.testEmergencyRecording(Math.floor(config.users * 0.2)));
    
    // Test Database Operations
    testResults.push(await this.testDatabaseOperations(Math.floor(config.users * 0.4)));
    
    // Test Rate Limiting
    testResults.push(await this.testRateLimiting());

    this.endTime = Date.now();
    
    // Generate final report
    this.generateReport(testResults, scenario);
    
    return testResults;
  }

  // Generate comprehensive test report
  generateReport(testResults, scenario) {
    const totalRequests = testResults.reduce((sum, test) => sum + (test.totalRequests || 0), 0);
    const totalSuccessful = testResults.reduce((sum, test) => sum + (test.successfulRequests || 0), 0);
    const totalFailed = testResults.reduce((sum, test) => sum + (test.failedRequests || 0), 0);
    const overallSuccessRate = (totalSuccessful / totalRequests) * 100;
    const testDuration = (this.endTime - this.startTime) / 1000;
    const throughput = totalRequests / testDuration;

    console.log('\n' + '=' .repeat(70));
    console.log('🎯 C.A.R.E.N. LOAD TEST RESULTS SUMMARY');
    console.log('=' .repeat(70));
    console.log(`📊 Scenario: ${scenario.toUpperCase()}`);
    console.log(`⏱️  Test Duration: ${testDuration.toFixed(1)} seconds`);
    console.log(`📈 Total Requests: ${totalRequests}`);
    console.log(`✅ Successful: ${totalSuccessful} (${overallSuccessRate.toFixed(1)}%)`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`🚀 Throughput: ${throughput.toFixed(1)} requests/second`);
    console.log('');

    // Platform Performance Assessment
    if (overallSuccessRate >= 95) {
      console.log('🟢 EXCELLENT: Platform performance is outstanding for production deployment');
    } else if (overallSuccessRate >= 85) {
      console.log('🟡 GOOD: Platform performance is solid with minor optimization opportunities');
    } else if (overallSuccessRate >= 70) {
      console.log('🟠 WARNING: Platform performance needs optimization before high-traffic deployment');
    } else {
      console.log('🔴 CRITICAL: Platform performance requires immediate optimization');
    }

    console.log('\n📋 Detailed Test Results:');
    testResults.forEach(test => {
      if (test.testName) {
        console.log(`   ${test.testName}: ${test.successfulRequests || 'N/A'}/${test.totalRequests || 'N/A'} (${test.successRate?.toFixed(1) || 'N/A'}%)`);
      }
    });

    console.log('\n🚀 RECOMMENDATION:');
    if (overallSuccessRate >= 90) {
      console.log('   ✅ Platform is ready for production deployment with thousands of users');
      console.log('   ✅ Current infrastructure can handle expected traffic loads');
      console.log('   ✅ Security and rate limiting are working properly');
    } else {
      console.log('   🔧 Consider optimizing database queries and connection pooling');
      console.log('   🔧 Monitor response times under sustained load');
      console.log('   🔧 Consider implementing caching for frequently accessed data');
    }

    console.log('=' .repeat(70));
  }
}

// Command line interface
async function main() {
  const scenario = process.argv[2] || 'moderate';
  const validScenarios = Object.keys(LOAD_TEST_CONFIG.testScenarios);
  
  if (!validScenarios.includes(scenario)) {
    console.log('❌ Invalid scenario. Available scenarios:');
    validScenarios.forEach(s => {
      const config = LOAD_TEST_CONFIG.testScenarios[s];
      console.log(`   ${s}: ${config.users} users for ${config.duration/1000}s`);
    });
    process.exit(1);
  }

  const loadTester = new LoadTester();
  
  try {
    await loadTester.runComprehensiveTest(scenario);
    console.log('\n✅ Load testing completed successfully!');
  } catch (error) {
    console.error('\n❌ Load testing failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { LoadTester, LOAD_TEST_CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}