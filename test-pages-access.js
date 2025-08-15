const { pool } = require('./config/database');

async function testPagesFetch() {
  try {
    console.log('🧪 Testing Facebook Pages API...\n');
    
    // Get current user token from database
    const result = await pool.query(`
      SELECT access_token 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    const userToken = result.rows[0].access_token;
    console.log('🔍 Testing with token:', userToken.substring(0, 30) + '...');
    
    // Test basic user info first
    console.log('\n1. Testing user info...');
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userToken}`);
    const userData = await userResponse.json();
    
    if (userData.error) {
      console.log('❌ User info failed:', userData.error.message);
      process.exit(1);
    }
    
    console.log('✅ User info works:', userData.name, userData.id);
    
    // Test pages access with timeout
    console.log('\n2. Testing pages access...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      const pagesData = await pagesResponse.json();
      
      if (pagesData.error) {
        console.log('❌ Pages access failed:', pagesData.error.message);
        console.log('🔍 Full error:', JSON.stringify(pagesData.error, null, 2));
        
        if (pagesData.error.code === 190) {
          console.log('\n💡 Token might be expired. Try generating a new token.');
        } else if (pagesData.error.message.includes('permissions')) {
          console.log('\n💡 Token missing pages permissions. Need pages_show_list permission.');
        }
      } else {
        console.log(`✅ Pages access works! Found ${pagesData.data.length} pages:`);
        pagesData.data.forEach((page, i) => {
          console.log(`   ${i+1}. ${page.name} (${page.id})`);
        });
      }
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('❌ Request timed out after 10 seconds');
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testPagesFetch();
