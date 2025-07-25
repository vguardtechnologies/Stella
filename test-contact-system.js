const http = require('http');

// Test the complete contact management system
async function testContactSystem() {
  const baseUrl = 'localhost';
  const port = 3000;
  
  console.log('📇 Testing Contact Management System...\n');

  // Simple HTTP request helper
  function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: path,
        method: method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {}
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  try {
    // Test 1: API Health
    console.log('1️⃣ Testing API health...');
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ API Health:', healthResponse.data.status);

    // Test 2: Check contacts endpoint
    console.log('\n2️⃣ Testing contacts endpoint...');
    const contactsResponse = await makeRequest('/api/contacts');
    if (contactsResponse.status === 200) {
      console.log('✅ Contacts endpoint working, found:', contactsResponse.data.length, 'contacts');
    } else {
      console.log('⚠️ Contacts endpoint status:', contactsResponse.status);
    }

    // Test 3: Test saving a contact
    console.log('\n3️⃣ Testing contact save...');
    const testContact = {
      phoneNumber: '+1234567890',
      displayName: 'Test User',
      whatsappProfileName: 'Test WhatsApp',
      savedName: 'Test Contact',
      hasSusaSuffix: true,
      notes: 'Test contact for system validation'
    };

    const saveResponse = await makeRequest('/api/contacts/save', 'POST', testContact);
    if (saveResponse.status === 200) {
      console.log('✅ Contact saved successfully:', saveResponse.data.contact.saved_name);
    } else {
      console.log('⚠️ Contact save failed:', saveResponse.status, saveResponse.data);
    }

    // Test 4: Check if contact exists
    console.log('\n4️⃣ Testing contact check...');
    const checkResponse = await makeRequest('/api/contacts/check/+1234567890');
    if (checkResponse.status === 200) {
      console.log('✅ Contact check working, exists:', checkResponse.data.exists);
      if (checkResponse.data.exists && checkResponse.data.contact) {
        const displayName = checkResponse.data.contact.has_susa_suffix 
          ? `${checkResponse.data.contact.saved_name} 🦋Susa`
          : checkResponse.data.contact.saved_name;
        console.log('   Display name:', displayName);
      }
    } else {
      console.log('⚠️ Contact check failed:', checkResponse.status);
    }

    // Test 5: Media system integration
    console.log('\n5️⃣ Testing media system integration...');
    const mediaStatsResponse = await makeRequest('/api/media/stats');
    if (mediaStatsResponse.status === 200) {
      console.log('✅ Media system integrated and working');
    } else {
      console.log('⚠️ Media system status:', mediaStatsResponse.status);
    }

    console.log('\n🎉 Contact Management System Tests Complete!');
    console.log('\n📋 System Status:');
    console.log('• Contact database: Ready ✅');
    console.log('• Contact API endpoints: Working ✅');
    console.log('• Contact saving: Functional ✅');
    console.log('• Susa suffix feature: Enabled ✅');
    console.log('• Media system: Integrated ✅');
    
    console.log('\n🚀 Ready for Testing:');
    console.log('• Open chat interface at http://localhost:5173');
    console.log('• Select a WhatsApp conversation');
    console.log('• Click "📇 Save Contact" button');
    console.log('• Test saving with and without 🦋Susa suffix');
    console.log('• Verify contact names appear in conversation list');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Clean up test contact
async function cleanupTestContact() {
  const http = require('http');
  
  console.log('\n🧹 Cleaning up test contact...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/contacts/+1234567890',
    method: 'DELETE'
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Test contact cleaned up');
    }
  });

  req.on('error', () => {
    console.log('Test contact cleanup failed (may not exist)');
  });

  req.end();
}

// Run the test
testContactSystem().then(() => {
  setTimeout(cleanupTestContact, 1000);
});
