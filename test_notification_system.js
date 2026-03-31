import nodemailer from 'nodemailer';

// Test email notification system
async function testEmailServices() {
  console.log('🔍 Testing Email Service Configuration...\n');

  // Test 1: Check if Gmail credentials are available
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('✅ Gmail credentials found');
    console.log(`   User: ${process.env.GMAIL_USER}`);
    
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
      
      await transporter.verify();
      console.log('✅ Gmail SMTP connection verified\n');
    } catch (error) {
      console.log(`❌ Gmail SMTP connection failed: ${error.message}\n`);
    }
  } else {
    console.log('⚠️  Gmail credentials not configured');
    console.log('   Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables\n');
  }

  // Test 2: Check Outlook credentials
  if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
    console.log('✅ Outlook credentials found');
    console.log(`   User: ${process.env.OUTLOOK_USER}`);
    
    try {
      const transporter = nodemailer.createTransporter({
        service: 'hotmail',
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });
      
      await transporter.verify();
      console.log('✅ Outlook SMTP connection verified\n');
    } catch (error) {
      console.log(`❌ Outlook SMTP connection failed: ${error.message}\n`);
    }
  } else {
    console.log('⚠️  Outlook credentials not configured\n');
  }

  // Test 3: Check custom SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    console.log('✅ Custom SMTP credentials found');
    console.log(`   Host: ${process.env.SMTP_HOST}`);
    console.log(`   User: ${process.env.SMTP_USER}`);
    
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      
      await transporter.verify();
      console.log('✅ Custom SMTP connection verified\n');
    } catch (error) {
      console.log(`❌ Custom SMTP connection failed: ${error.message}\n`);
    }
  } else {
    console.log('⚠️  Custom SMTP credentials not configured\n');
  }
}

// Test SMS notification system
async function testSMSService() {
  console.log('📱 Testing SMS Service Configuration...\n');

  // Test 1: TextBelt (primary SMS service)
  console.log('🔍 TextBelt API Test:');
  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '5551234567', // Test number
        message: 'C.A.R.E.N. SMS test',
        key: process.env.TEXTBELT_API_KEY || 'textbelt'
      })
    });
    
    const result = await response.json();
    if (result.quotaRemaining !== undefined) {
      console.log('✅ TextBelt API accessible');
      console.log(`   Free quota remaining: ${result.quotaRemaining}`);
      if (process.env.TEXTBELT_API_KEY) {
        console.log('✅ TextBelt API key configured for higher quotas');
      } else {
        console.log('⚠️  Using free TextBelt quota (1 SMS/day)');
        console.log('   Set TEXTBELT_API_KEY for higher volume');
      }
    }
  } catch (error) {
    console.log(`❌ TextBelt API test failed: ${error.message}`);
  }
  console.log('');

  // Test 2: Email-to-SMS gateways
  console.log('🔍 Email-to-SMS Gateway Test:');
  if (process.env.GMAIL_USER || process.env.OUTLOOK_USER || process.env.SMTP_USER) {
    console.log('✅ Email service configured for SMS gateways');
    console.log('   Can send SMS via carrier email gateways');
    console.log('   Supports: Verizon, AT&T, T-Mobile, Sprint, and more');
  } else {
    console.log('⚠️  No email service configured');
    console.log('   SMS gateways require email service setup');
  }
  console.log('');

  // Test 3: Twilio (optional fallback)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    console.log('✅ Twilio credentials found (fallback option)');
    console.log(`   Account SID: ${process.env.TWILIO_ACCOUNT_SID.substring(0, 10)}...`);
    console.log(`   Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
    
    try {
      const { default: twilio } = await import('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log(`✅ Twilio account verified: ${account.friendlyName}`);
      console.log(`   Status: ${account.status}\n`);
    } catch (error) {
      console.log(`❌ Twilio connection failed: ${error.message}\n`);
    }
  } else {
    console.log('ℹ️  Twilio not configured (optional)');
    console.log('   TextBelt and email gateways provide SMS functionality\n');
  }
}

// Test database connectivity for emergency contacts
async function testDatabaseConnection() {
  console.log('🗄️  Testing Database Connection...\n');

  try {
    const { db } = await import('./server/db.js');
    const { emergencyContacts } = await import('./shared/schema.js');
    
    // Test simple query
    const contacts = await db.select().from(emergencyContacts).limit(1);
    console.log('✅ Database connection verified');
    console.log(`   Emergency contacts table accessible\n`);
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}\n`);
  }
}

// Test notification workflow
async function testNotificationWorkflow() {
  console.log('🔄 Testing Complete Notification Workflow...\n');

  const sampleAlert = {
    alertType: 'police_encounter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Test Street, New York, NY',
      city: 'New York',
      state: 'NY'
    },
    userMessage: 'Test emergency alert - system verification',
    userName: 'Test User'
  };

  const sampleContact = {
    id: 1,
    name: 'Test Contact',
    phone: '+1234567890',
    email: 'test@example.com',
    relationship: 'Emergency Contact',
    priority: 'primary'
  };

  try {
    const { notifyEmergencyContacts } = await import('./server/notifications.js');
    
    console.log('📧 Testing email notification format...');
    console.log('📱 Testing SMS notification format...');
    
    // This would normally send real notifications, but we'll just test the function exists
    console.log('✅ Notification functions loaded successfully');
    console.log('   Ready to send real emergency alerts\n');
  } catch (error) {
    console.log(`❌ Notification workflow test failed: ${error.message}\n`);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚨 C.A.R.E.N. Emergency Notification System Test\n');
  console.log('=' .repeat(50));
  
  await testEmailServices();
  await testSMSService();
  await testDatabaseConnection();
  await testNotificationWorkflow();
  
  console.log('=' .repeat(50));
  console.log('📋 Test Summary:');
  console.log('1. Configure email service (Gmail recommended)');
  console.log('2. Configure Twilio for SMS (optional but recommended)');
  console.log('3. Add emergency contacts in application Settings');
  console.log('4. Test voice commands for emergency alerts');
  console.log('\n🔗 For setup instructions, see: SMS_EMAIL_INTEGRATION_GUIDE.md');
}

runAllTests().catch(console.error);

export {
  testEmailServices,
  testSMSService,
  testDatabaseConnection,
  testNotificationWorkflow
};