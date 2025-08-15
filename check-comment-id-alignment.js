const { pool } = require('./config/database');

async function checkCommentIDAlignment() {
  try {
    console.log('🔍 Checking Comment ID Alignment with Facebook...\n');
    
    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook platform found');
      return;
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    console.log('✅ Found Facebook access token');
    
    // Get recent comments from database
    const commentsResult = await pool.query(`
      SELECT id, external_comment_id, external_post_id, author_name, 
             comment_text, created_at, is_deleted
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`📊 Found ${commentsResult.rows.length} recent comments in database\n`);
    
    for (let i = 0; i < commentsResult.rows.length; i++) {
      const comment = commentsResult.rows[i];
      console.log(`🔍 Checking Comment ${i + 1}:`);
      console.log(`   DB ID: ${comment.id}`);
      console.log(`   External Comment ID: ${comment.external_comment_id}`);
      console.log(`   External Post ID: ${comment.external_post_id}`);
      console.log(`   Author: ${comment.author_name}`);
      console.log(`   Content: ${comment.comment_text?.substring(0, 50)}...`);
      console.log(`   Is Deleted: ${comment.is_deleted}`);
      
      // Extract the actual comment ID for Facebook API
      let actualCommentId = comment.external_comment_id;
      
      // Handle different ID formats
      if (actualCommentId.includes('_')) {
        // Format: post_id_comment_id
        actualCommentId = actualCommentId.split('_')[1];
        console.log(`   Extracted Comment ID: ${actualCommentId}`);
      }
      
      // Test Facebook API access to this comment
      console.log(`   🧪 Testing Facebook API access...`);
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
          console.log(`   ❌ Facebook API Error: ${data.error.message}`);
          console.log(`      Error Code: ${data.error.code}`);
          
          if (data.error.code === 100) {
            console.log(`      💡 Comment may have been deleted on Facebook`);
          } else if (data.error.code === 3) {
            console.log(`      💡 Permission issue - need page access token`);
          }
        } else {
          console.log(`   ✅ Facebook API Success:`);
          console.log(`      FB Comment ID: ${data.id}`);
          console.log(`      FB From: ${data.from?.name}`);
          console.log(`      FB Message: ${data.message?.substring(0, 50)}...`);
          console.log(`      FB Created: ${data.created_time}`);
          
          // Check if IDs match
          const dbCommentId = comment.external_comment_id;
          const fbCommentId = data.id;
          
          console.log(`   🔄 ID Comparison:`);
          console.log(`      Database: ${dbCommentId}`);
          console.log(`      Facebook: ${fbCommentId}`);
          
          if (dbCommentId === fbCommentId) {
            console.log(`      ✅ IDs MATCH perfectly!`);
          } else if (dbCommentId.includes(fbCommentId) || fbCommentId.includes(dbCommentId)) {
            console.log(`      ⚠️  IDs are related but not exact match`);
          } else {
            console.log(`      ❌ IDs DO NOT MATCH - this is a problem!`);
          }
        }
      } catch (error) {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 Summary and Recommendations:');
    console.log('1. Check which comments show "IDs MATCH perfectly" - these are ready for replies');
    console.log('2. Comments with API errors (code 100) are likely deleted on Facebook');
    console.log('3. Comments with permission errors (code 3) need proper access token');
    console.log('4. Any ID mismatches need to be investigated and fixed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkCommentIDAlignment();
