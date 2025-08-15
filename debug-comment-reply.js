const { pool } = require('./config/database');

async function debugCommentReply() {
  try {
    console.log('🔍 Debugging Comment Reply Issue...\n');
    
    // Check the comment that was being replied to (ID 356 from the logs)
    const commentResult = await pool.query(`
      SELECT c.*, p.platform_type, p.access_token, p.account_info
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE c.id = $1
    `, [356]);
    
    if (commentResult.rows.length === 0) {
      console.log('❌ Comment 356 not found');
      process.exit(1);
    }
    
    const comment = commentResult.rows[0];
    
    console.log('📋 Comment Details:');
    console.log(`   Comment ID: ${comment.id}`);
    console.log(`   External Comment ID: ${comment.external_comment_id}`);
    console.log(`   Platform: ${comment.platform_type}`);
    console.log(`   Author: ${comment.author_name}`);
    console.log(`   Content: ${comment.comment_text}`);
    console.log(`   Post ID: ${comment.post_id}`);
    
    console.log('\n📋 Platform Details:');
    console.log(`   Platform ID: ${comment.platform_id}`);
    console.log(`   Has Access Token: ${!!comment.access_token}`);
    console.log(`   Token Length: ${comment.access_token?.length}`);
    console.log(`   Token Preview: ${comment.access_token?.substring(0, 50)}...`);
    
    console.log('\n🔍 Account Info:');
    console.log(JSON.stringify(comment.account_info, null, 2));
    
    // Test the token type
    console.log('\n🧪 Testing Token Type...');
    
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${comment.access_token}`);
    const testData = await testResponse.json();
    
    if (testData.error) {
      console.log('❌ Token test failed:', testData.error.message);
    } else {
      console.log('✅ Token info:');
      console.log(`   Name: ${testData.name}`);
      console.log(`   ID: ${testData.id}`);
      console.log(`   Type: ${testData.id === comment.post_id?.split('_')[0] ? 'Page Token' : 'User Token'}`);
    }
    
    // Now let's test the actual comment reply API
    console.log('\n🧪 Testing Comment Reply API...');
    
    const actualCommentId = comment.external_comment_id.includes('_') ? 
      comment.external_comment_id.split('_')[1] : 
      comment.external_comment_id;
    
    console.log(`   Original Comment ID: ${comment.external_comment_id}`);
    console.log(`   Actual Comment ID: ${actualCommentId}`);
    
    // Test with a dry run (just check if the endpoint responds)
    const replyTestResponse = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${comment.access_token}`);
    const replyTestData = await replyTestResponse.json();
    
    if (replyTestData.error) {
      console.log('❌ Comment API test failed:', replyTestData.error.message);
      console.log('🔍 Full error:', JSON.stringify(replyTestData.error, null, 2));
      
      if (replyTestData.error.code === 3) {
        console.log('\n💡 Error Code 3 = Need Page Access Token');
        console.log('   Current token appears to be a Page token already...');
        console.log('   The issue might be with comment ID or permissions.');
      }
    } else {
      console.log('✅ Comment exists and is accessible:');
      console.log(`   Comment: ${replyTestData.message || replyTestData.id}`);
      console.log(`   From: ${replyTestData.from?.name || 'Unknown'}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugCommentReply();
