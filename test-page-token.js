const { pool } = require('./config/database');

async function testCurrentPageToken() {
  try {
    console.log('🧪 Testing Current Page Access Token...\n');
    
    // Get current token from database
    const result = await pool.query(`
      SELECT access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    const pageToken = result.rows[0].access_token;
    const accountInfo = result.rows[0].account_info;
    
    console.log('🔑 Current Primary Token (Page):', pageToken.substring(0, 50) + '...');
    console.log('📏 Token Length:', pageToken.length);
    console.log('📋 Page ID:', accountInfo.page_id);
    console.log('📋 Page Name:', accountInfo.page_name);
    
    // Test 1: Check token info
    console.log('\n1️⃣ Testing token info...');
    const tokenInfoResponse = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${pageToken}&access_token=${pageToken}`);
    const tokenInfo = await tokenInfoResponse.json();
    
    if (tokenInfo.data) {
      console.log('✅ Token Info:');
      console.log('   Type:', tokenInfo.data.type);
      console.log('   App ID:', tokenInfo.data.app_id);
      console.log('   User ID:', tokenInfo.data.user_id);
      console.log('   Expires:', tokenInfo.data.expires_at ? new Date(tokenInfo.data.expires_at * 1000) : 'Never');
      console.log('   Scopes:', tokenInfo.data.scopes?.join(', ') || 'Not available');
    } else {
      console.log('❌ Token info failed:', tokenInfo.error?.message);
    }
    
    // Test 2: Check if this is actually a page token
    console.log('\n2️⃣ Testing page identity...');
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${pageToken}`);
    const meData = await meResponse.json();
    
    if (meData.error) {
      console.log('❌ Page identity test failed:', meData.error.message);
    } else {
      console.log('✅ Page Identity:');
      console.log('   Name:', meData.name);
      console.log('   ID:', meData.id);
      console.log('   Category:', meData.category);
    }
    
    // Test 3: Check permissions
    console.log('\n3️⃣ Testing permissions...');
    const permResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${pageToken}`);
    const permData = await permResponse.json();
    
    if (permData.error) {
      console.log('❌ Permissions test failed:', permData.error.message);
    } else if (permData.data) {
      console.log('✅ Permissions:');
      permData.data.forEach(perm => {
        console.log(`   ${perm.permission}: ${perm.status}`);
      });
    }
    
    // Test 4: Test comment posting capability on a dummy comment ID
    console.log('\n4️⃣ Testing comment API access...');
    
    // Use a test comment ID from your logs: 1446378203277766
    const testCommentId = '1446378203277766';
    
    // First, try to read the comment
    const commentResponse = await fetch(`https://graph.facebook.com/v18.0/${testCommentId}?access_token=${pageToken}`);
    const commentData = await commentResponse.json();
    
    if (commentData.error) {
      console.log('❌ Comment read test failed:', commentData.error.message);
      console.log('   This might indicate permissions or scope issues');
    } else {
      console.log('✅ Comment read test successful:');
      console.log('   Comment ID:', commentData.id);
      console.log('   From:', commentData.from?.name || 'Unknown');
      console.log('   Message:', commentData.message?.substring(0, 50) || 'No message');
      
      console.log('\n🎯 COMMENT REPLY TEST: Attempting to post test reply...');
      
      // Try to post a test reply
      const replyResponse = await fetch(`https://graph.facebook.com/v18.0/${testCommentId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Test reply from Stella - please ignore',
          access_token: pageToken
        })
      });
      
      const replyData = await replyResponse.text();
      
      console.log('📱 Reply Response:');
      console.log('   Status:', replyResponse.status, replyResponse.statusText);
      console.log('   Response:', replyData);
      
      if (replyResponse.ok) {
        console.log('🎉 SUCCESS! Comment reply works!');
      } else {
        console.log('❌ Comment reply failed - this is the core issue');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCurrentPageToken();
