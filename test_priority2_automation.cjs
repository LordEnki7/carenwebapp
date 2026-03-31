#!/usr/bin/env node

// Priority #2 User Journey Progress Automation Testing
// Tests the complete user journey tracking and sparkle effect automation system

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

const testScenarios = [
  {
    name: 'First Login Milestone',
    action: 'first_login',
    metadata: { source: 'signup_flow' },
    expectedPoints: 10,
    expectedSparkle: 'gold'
  },
  {
    name: 'Emergency Activation Milestone',
    action: 'emergency_activated', 
    metadata: { emergencyType: 'traffic_stop', location: 'dashboard' },
    expectedPoints: 50,
    expectedSparkle: 'emergency'
  },
  {
    name: 'Attorney Contact Milestone',
    action: 'attorney_contacted',
    metadata: { method: 'emergency_call', attorneyId: 'test-attorney' },
    expectedPoints: 25,
    expectedSparkle: 'silver'
  },
  {
    name: 'Recording Completion Milestone',
    action: 'recording_completed',
    metadata: { duration: 120, quality: 'high' },
    expectedPoints: 20,
    expectedSparkle: 'bronze'
  },
  {
    name: 'Forum Post Creation Milestone',
    action: 'forum_post_created',
    metadata: { category: 'traffic_stops', postId: 'test-post-123' },
    expectedPoints: 15,
    expectedSparkle: 'rainbow'
  },
  {
    name: 'Rights Viewing Milestone',
    action: 'rights_viewed',
    metadata: { state: 'CA', category: 'traffic_stops' },
    expectedPoints: 5,
    expectedSparkle: 'bronze'
  }
];

async function testUserJourneyTracking() {
  console.log('🧪 Testing Priority #2: User Journey Progress Automation\n');
  
  const results = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    automationTriggers: 0,
    sparkleEffects: 0,
    averageResponseTime: 0
  };

  for (const scenario of testScenarios) {
    const startTime = Date.now();
    results.totalTests++;
    
    console.log(`📋 Testing: ${scenario.name}`);
    console.log(`   Action: ${scenario.action}`);
    console.log(`   Expected: ${scenario.expectedPoints} points, ${scenario.expectedSparkle} sparkle`);
    
    try {
      // Test user journey tracking
      const response = await fetch(`${BASE_URL}/api/journey/track-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: scenario.action,
          metadata: scenario.metadata
        })
      });

      const responseTime = Date.now() - startTime;
      results.averageResponseTime += responseTime;

      if (!response.ok) {
        console.log(`   ❌ FAILED: HTTP ${response.status}`);
        results.failed++;
        continue;
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.success) {
        console.log(`   ❌ FAILED: API returned success: false`);
        console.log(`   Error: ${data.message || 'Unknown error'}`);
        results.failed++;
        continue;
      }

      // Validate milestone data
      if (data.milestone.points !== scenario.expectedPoints) {
        console.log(`   ❌ FAILED: Expected ${scenario.expectedPoints} points, got ${data.milestone.points}`);
        results.failed++;
        continue;
      }

      if (data.milestone.sparkleType !== scenario.expectedSparkle) {
        console.log(`   ❌ FAILED: Expected ${scenario.expectedSparkle} sparkle, got ${data.milestone.sparkleType}`);
        results.failed++;
        continue;
      }

      // Track automation triggers
      if (data.automationTriggered) {
        results.automationTriggers++;
      }

      console.log(`   ✅ PASSED (${responseTime}ms)`);
      console.log(`   Points: ${data.pointsEarned}, Sparkle: ${data.milestone.sparkleType}`);
      console.log(`   N8N Automation: ${data.automationTriggered ? 'Triggered' : 'Not triggered'}`);
      console.log(`   New Milestone: ${data.isNewMilestone}`);
      results.passed++;

      // Test sparkle effect if new milestone
      if (data.isNewMilestone) {
        await testSparkleEffect(scenario, results);
      }

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      results.failed++;
    }
    
    console.log('');
  }

  return results;
}

async function testSparkleEffect(scenario, results) {
  console.log(`   💫 Testing sparkle effect...`);
  
  try {
    const sparkleResponse = await fetch(`${BASE_URL}/api/journey/trigger-sparkle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'test-user',
        sparkleType: scenario.expectedSparkle,
        location: scenario.action,
        intensity: 'high',
        duration: 3000
      })
    });

    if (sparkleResponse.ok) {
      const sparkleData = await sparkleResponse.json();
      if (sparkleData.success) {
        results.sparkleEffects++;
        console.log(`   ✨ Sparkle effect triggered: ${sparkleData.sparkleType}`);
      }
    }
  } catch (error) {
    console.log(`   💫 Sparkle test failed: ${error.message}`);
  }
}

async function testProgressRetrieval() {
  console.log('📊 Testing progress retrieval...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/journey/progress/test-user`);
    
    if (!response.ok) {
      console.log(`❌ Progress retrieval failed: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Progress retrieved for user: ${data.userId}`);
    console.log(`   Level: ${data.stats.level}, Points: ${data.stats.totalPoints}`);
    console.log(`   Milestones: ${data.stats.milestonesCompleted}, Streak: ${data.stats.streakDays}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Progress retrieval error: ${error.message}`);
    return false;
  }
}

async function testN8NStatus() {
  console.log('🔧 Testing N8N automation status...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/n8n/status`);
    
    if (!response.ok) {
      console.log(`❌ N8N status check failed: HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ N8N Status: ${data.status}`);
    console.log(`   Priority #1: ${data.priority1Status}`);
    console.log(`   Priority #2: ${data.priority2Status}`);
    console.log(`   User Journey Endpoint: ${data.userJourneyEndpoint}`);
    console.log(`   Sparkle Endpoint: ${data.sparkleEndpoint}`);
    
    return true;
  } catch (error) {
    console.log(`❌ N8N status error: ${error.message}`);
    return false;
  }
}

async function runPriority2Tests() {
  const startTime = Date.now();
  console.log('🚀 Starting Priority #2 User Journey Progress Automation Tests');
  console.log('='.repeat(70));
  
  // Test N8N status first
  await testN8NStatus();
  console.log('');
  
  // Test user journey tracking
  const results = await testUserJourneyTracking();
  
  // Test progress retrieval
  await testProgressRetrieval();
  console.log('');
  
  // Calculate results
  const totalTime = Date.now() - startTime;
  results.averageResponseTime = Math.round(results.averageResponseTime / results.totalTests);
  
  console.log('📈 PRIORITY #2 AUTOMATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.totalTests}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${Math.round((results.passed / results.totalTests) * 100)}%`);
  console.log(`N8N Automation Triggers: ${results.automationTriggers}`);
  console.log(`Sparkle Effects: ${results.sparkleEffects}`);
  console.log(`Average Response Time: ${results.averageResponseTime}ms`);
  console.log(`Total Test Duration: ${totalTime}ms`);
  console.log('');
  
  if (results.passed === results.totalTests) {
    console.log('🎉 PRIORITY #2 AUTOMATION 100% OPERATIONAL');
    console.log('User Journey Progress Automation system ready for deployment!');
  } else {
    console.log('⚠️  Some tests failed - check system configuration');
  }
  
  console.log('='.repeat(70));
}

// Run tests if this script is executed directly
if (require.main === module) {
  runPriority2Tests().catch(console.error);
}

module.exports = { runPriority2Tests, testUserJourneyTracking, testSparkleEffect };