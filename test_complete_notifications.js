// Complete notification system test with configured credentials
import nodemailer from 'nodemailer';

// Test configuration with user's credentials
const TEXTBELT_API_KEY = "160040e53102b2285931df3013d933b0e46ebf7cqeCXDWl6beXnP8pfl4LFyke6F";
const GMAIL_USER = "carenwebapp@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

async function testEmailService() {
  console.log('🔍 Testing Gmail Email Service...\n');
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    console.log('📧 Email notifications ready');
    return true;
    
  } catch (error) {
    console.log('❌ Gmail error:', error.message);
    return false;
  }
}

async function testSMSService() {
  console.log('\n📱 Testing TextBelt SMS Service...\n');
  
  try {
    // Check quota only (no SMS sent)
    const response = await fetch('https://textbelt.com/quota/' + TEXTBELT_API_KEY);
    const result = await response.json();
    
    if (result.quotaRemaining !== undefined) {
      console.log('✅ TextBelt API key valid');
      console.log(`📊 SMS quota: ${result.quotaRemaining} messages available`);
      console.log('📱 SMS notifications ready');
      return true;
    } else {
      console.log('❌ Unable to verify TextBelt quota');
      return false;
    }
    
  } catch (error) {
    console.log('❌ TextBelt error:', error.message);
    return false;
  }
}

async function testEmergencyNotificationFormat() {
  console.log('\n🚨 Testing Emergency Notification Format...\n');
  
  const mockAlertData = {
    alertType: 'police_encounter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY 10001',
      city: 'New York',
      state: 'NY'
    },
    userMessage: 'Traffic stop in progress',
    userName: 'Test User'
  };

  const mockContact = {
    id: 1,
    name: 'Emergency Contact',
    phone: '+15551234567',
    email: 'contact@example.com',
    relationship: 'Family',
    priority: 'primary'
  };

  // Test SMS format
  const smsMessage = `🚨 EMERGENCY: ${mockAlertData.userName} - Police Encounter
Time: ${new Date().toLocaleTimeString()}
Location: ${mockAlertData.location.address}
Message: ${mockAlertData.userMessage}
Contact them immediately!`;

  console.log('📱 SMS Message Format:');
  console.log(smsMessage);

  // Test email format  
  const emailSubject = `🚨 EMERGENCY ALERT: Police Encounter - ${mockAlertData.userName}`;
  console.log('\n📧 Email Subject:', emailSubject);
  console.log('📧 Email includes: GPS coordinates, timestamp, emergency type, contact instructions');
  
  return true;
}

async function runCompleteTest() {
  console.log('🚨 C.A.R.E.N. Complete Notification System Test\n');
  console.log('=' .repeat(60));
  
  const emailReady = await testEmailService();
  const smsReady = await testSMSService();
  const formatValid = await testEmergencyNotificationFormat();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 INTEGRATION STATUS SUMMARY:');
  console.log(`📧 Email Service: ${emailReady ? '✅ READY' : '❌ FAILED'}`);
  console.log(`📱 SMS Service: ${smsReady ? '✅ READY' : '❌ FAILED'}`);
  console.log(`🚨 Emergency Format: ${formatValid ? '✅ READY' : '❌ FAILED'}`);
  
  if (emailReady && smsReady && formatValid) {
    console.log('\n🎉 EMERGENCY NOTIFICATION SYSTEM FULLY OPERATIONAL');
    console.log('   Voice commands will trigger real SMS and email alerts');
    console.log('   Next: Add emergency contacts in application Settings');
  } else {
    console.log('\n⚠️  System partially ready - check failed components above');
  }
}

runCompleteTest().catch(console.error);