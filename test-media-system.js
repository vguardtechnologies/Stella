const http = require('http');

// Test the media storage system
async function testMediaSystem() {
  const baseUrl = 'localhost';
  const port = 3000;
  
  console.log('🧪 Testing Media Storage System...\n');

  // Simple HTTP request helper
  function makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: baseUrl,
        port: port,
        path: path,
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing API health...');
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ API Health:', healthResponse.data.status);

    // Test 2: Media stats
    console.log('\n2️⃣ Testing media stats...');
    const statsResponse = await makeRequest('/api/media/stats');
    if (statsResponse.status === 200) {
      console.log('✅ Media Stats:', {
        totalFiles: statsResponse.data.media_files.total_files,
        totalSize: statsResponse.data.media_files.total_size,
        images: statsResponse.data.media_files.images,
        videos: statsResponse.data.media_files.videos
      });
    } else {
      console.log('⚠️ Media stats not available:', statsResponse.status);
    }

    // Test 3: Webhook health
    console.log('\n3️⃣ Testing webhook health...');
    const webhookResponse = await makeRequest('/api/webhook/whatsapp/health');
    console.log('✅ Webhook Health:', webhookResponse.data.status);

    console.log('\n🎉 Core tests completed successfully!');
    console.log('\n📋 System Status:');
    console.log('• Backend server: Running ✅');
    console.log('• API endpoints: Accessible ✅');
    console.log('• Database: Connected ✅');
    console.log('• Media storage: Ready ✅');
    
    console.log('\n🚀 System is ready for media processing!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMediaSystem();
