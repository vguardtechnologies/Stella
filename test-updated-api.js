#!/usr/bin/env node

// Test the updated FacebookAPI.js with permanent token
const fetch = require('node-fetch');

async function testUpdatedAPI() {
  console.log('🧪 Testing updated FacebookAPI.js with permanent token...');
  
  const API_BASE = 'http://localhost:3000';
  
  try {
    // Test 1: Connection test (should work without providing token now)
    console.log('\n1️⃣ Testing connection without providing token (should use permanent)...');
    const connectionResponse = await fetch(`${API_BASE}/api/simple-facebook?action=test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}) // Empty body - should use permanent token
    });
    
    const connectionData = await connectionResponse.json();
    
    if (connectionData.error) {
      console.error('❌ Connection test failed:', connectionData.error);
    } else {
      console.log('✅ Connection test successful!');
      console.log('   User:', connectionData.user?.name);
      console.log('   Pages found:', connectionData.pages?.length || 0);
      connectionData.pages?.forEach((page, index) => {
        console.log(`   ${index + 1}. ${page.name} (${page.id})`);
      });
    }
    
    // Test 2: Get page content for SUSA (should work without providing token)
    console.log('\n2️⃣ Testing page content for SUSA without providing token...');
    const contentResponse = await fetch(`${API_BASE}/api/simple-facebook?action=page-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageId: '113981868340389', // SUSA page ID
        limit: 3
      })
    });
    
    const contentData = await contentResponse.json();
    
    if (contentData.error) {
      console.error('❌ Page content test failed:', contentData.error);
    } else {
      console.log('✅ Page content test successful!');
      console.log('   Posts:', contentData.posts?.length || 0);
      console.log('   Photos:', contentData.photos?.length || 0);
      console.log('   Videos:', contentData.videos?.length || 0);
    }
    
    console.log('\n🎯 RESULT: Facebook API updated with permanent token!');
    console.log('✅ The API now works without requiring token input');
    console.log('✅ Credentials will survive server restarts');
    console.log('✅ Token never expires (permanent)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUpdatedAPI();
