// Quick TextBelt API test
const TEXTBELT_API_KEY = "160040e53102b2285931df3013d933b0e46ebf7cqeCXDWl6beXnP8pfl4LFyke6F";

async function testTextBeltAPI() {
  console.log('Testing TextBelt API quota check...\n');
  
  try {
    // Check quota without sending SMS
    const response = await fetch('https://textbelt.com/quota/' + TEXTBELT_API_KEY);
    const result = await response.json();
    
    console.log('TextBelt Quota Response:', result);
    
    if (result.quotaRemaining !== undefined) {
      console.log('✅ TextBelt API key is valid');
      console.log(`📊 Quota remaining: ${result.quotaRemaining}`);
      console.log('🚀 SMS emergency notifications ready');
    } else {
      console.log('❌ Unable to verify API key quota');
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testTextBeltAPI();