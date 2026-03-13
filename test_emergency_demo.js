// Emergency notification system demo with temporary data
import nodemailer from 'nodemailer';

// Configuration
const TEXTBELT_API_KEY = "160040e53102b2285931df3013d933b0e46ebf7cqeCXDWl6beXnP8pfl4LFyke6F";

async function sendTestSMS(contact, alertData) {
  const message = `🚨 EMERGENCY: ${alertData.userName} - ${alertData.alertType.replace('_', ' ')}
Time: ${new Date().toLocaleTimeString()}
Location: ${alertData.location.address}, ${alertData.location.city}, ${alertData.location.state}
Message: ${alertData.userMessage}
Contact them immediately!`;

  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: contact.phone.replace('+', ''),
        message: message,
        key: TEXTBELT_API_KEY,
      }),
    });

    const result = await response.json();
    return {
      contactId: contact.id,
      method: 'sms',
      status: result.success ? 'sent' : 'failed',
      error: result.success ? undefined : result.error,
      messageId: result.textId,
    };
  } catch (error) {
    return {
      contactId: contact.id,
      method: 'sms',
      status: 'failed',
      error: error.message,
    };
  }
}

async function testEmergencyAlert() {
  console.log('🚨 Testing Emergency Alert System with Temporary Data\n');

  // Test emergency contacts (using the seeded data)
  const testContacts = [
    {
      id: 1,
      name: "Emergency Contact 1",
      phone: "+15551234567", // Test phone number - will use 1 TextBelt credit
      email: "contact1@example.com",
      relationship: "Family",
      priority: "primary",
      isActive: true,
      userId: "test_user_1"
    }
  ];

  // Sample emergency alert data
  const alertData = {
    alertType: 'police_encounter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St',
      city: 'New York',
      state: 'NY'
    },
    userMessage: 'Traffic stop in progress - testing emergency system',
    userName: 'Test User'
  };

  console.log('📱 Emergency Alert Details:');
  console.log(`Type: ${alertData.alertType}`);
  console.log(`Location: ${alertData.location.address}, ${alertData.location.city}, ${alertData.location.state}`);
  console.log(`User Message: ${alertData.userMessage}\n`);

  console.log('📞 Sending test SMS...\n');

  try {
    const result = await sendTestSMS(testContacts[0], alertData);
    
    console.log('📊 SMS Notification Result:');
    console.log(`Contact: ${testContacts[0].name} (${testContacts[0].relationship})`);
    console.log(`Phone: ${testContacts[0].phone}`);
    console.log(`Status: ${result.status}`);
    if (result.error) {
      console.log(`Error: ${result.error}`);
    } else {
      console.log(`Message ID: ${result.messageId}`);
    }

    if (result.status === 'sent') {
      console.log('\n✅ Emergency SMS notification sent successfully!');
      console.log('📱 The test contact would receive this message on their phone.');
    } else {
      console.log('\n❌ SMS notification failed.');
    }

  } catch (error) {
    console.error('❌ Error during emergency notification test:', error);
  }
}

// Run the test
testEmergencyAlert();