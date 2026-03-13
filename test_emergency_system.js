// Emergency Alert System Test
import http from 'http';

// Test emergency contact creation
function testEmergencyContactCreation() {
  const testContact = {
    userId: 'test-user-123',
    name: 'John Emergency Contact',
    phone: '+1-555-0123',
    email: 'john@emergency.com',
    relationship: 'Brother',
    priority: 'primary'
  };

  const postData = JSON.stringify(testContact);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/emergency-contacts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Emergency Contact Creation Test:');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      console.log('---');
    });
  });

  req.on('error', (e) => {
    console.error('Error creating emergency contact:', e.message);
  });

  req.write(postData);
  req.end();
}

// Test emergency alert creation
function testEmergencyAlert() {
  const testAlert = {
    userId: 'test-user-123',
    alertType: 'police_encounter',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Test Street',
      city: 'New York',
      state: 'NY'
    },
    userMessage: 'Testing emergency alert system - police encounter',
    incidentId: null
  };

  const postData = JSON.stringify(testAlert);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/emergency-alerts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Emergency Alert Creation Test:');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      console.log('---');
    });
  });

  req.on('error', (e) => {
    console.error('Error creating emergency alert:', e.message);
  });

  req.write(postData);
  req.end();
}

// Test database connection
function testDatabaseConnection() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/legal-rights',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Database Connection Test:');
      console.log('Status:', res.statusCode);
      console.log('Legal Rights Available:', JSON.parse(data).length > 0 ? 'Yes' : 'No');
      console.log('---');
    });
  });

  req.on('error', (e) => {
    console.error('Error testing database:', e.message);
  });

  req.end();
}

console.log('Testing C.A.R.E.N. Emergency Alert System...\n');

// Run tests
setTimeout(() => testDatabaseConnection(), 100);
setTimeout(() => testEmergencyContactCreation(), 500);
setTimeout(() => testEmergencyAlert(), 1000);