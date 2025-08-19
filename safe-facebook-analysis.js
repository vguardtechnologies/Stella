const { pool } = require('./config/database');

async function safeFacebookCommentsCheck() {
  try {
    console.log('🔍 Safe Facebook Comments Analysis');
    console.log('==================================\n');
    
    // Get Facebook access token and account info
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
    const accountInfo = tokenResult.rows[0].account_info;
    
    console.log('✅ Facebook access token found');
    console.log(`📄 Page: ${accountInfo?.name || 'Unknown'} (ID: ${accountInfo?.id || 'Unknown'})\n`);
    
    // Analyze comment patterns and sources
    const analysisResult = await pool.query(`
      SELECT 
        c.id,
        c.external_comment_id,
        c.external_post_id,
        c.author_name,
        c.comment_text,
        c.created_at,
        c.is_deleted,
        c.status,
        CASE 
          WHEN c.external_comment_id LIKE 'fb_%' THEN 'test_data'
          WHEN c.external_comment_id = 'comment' THEN 'invalid_id'
          WHEN c.external_comment_id LIKE '%_%' THEN 'webhook_format'
          ELSE 'other'
        END as comment_source
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
      ORDER BY c.created_at DESC
    `);
    
    const totalComments = analysisResult.rows.length;
    console.log(`📊 Total Facebook comments in database: ${totalComments}\n`);
    
    // Categorize comments by source
    const categories = {
      test_data: [],
      invalid_id: [],
      webhook_format: [],
      other: []
    };
    
    analysisResult.rows.forEach(comment => {
      categories[comment.comment_source].push(comment);
    });
    
    console.log('📋 COMMENT CATEGORIES:');
    console.log('======================');
    console.log(`🧪 Test Data (fb_*, ig_*, etc.): ${categories.test_data.length}`);
    console.log(`❌ Invalid IDs: ${categories.invalid_id.length}`);
    console.log(`📡 Webhook Format (post_id_comment_id): ${categories.webhook_format.length}`);
    console.log(`❓ Other Format: ${categories.other.length}\n`);
    
    // Show samples from each category
    if (categories.test_data.length > 0) {
      console.log('🧪 TEST DATA SAMPLES:');
      categories.test_data.slice(0, 3).forEach((comment, index) => {
        console.log(`${index + 1}. ID ${comment.id}: ${comment.external_comment_id}`);
        console.log(`   Author: ${comment.author_name}`);
        console.log(`   Text: "${comment.comment_text?.substring(0, 40)}..."`);
      });
      console.log('');
    }
    
    if (categories.webhook_format.length > 0) {
      console.log('📡 WEBHOOK FORMAT SAMPLES (Most likely real comments):');
      categories.webhook_format.slice(0, 5).forEach((comment, index) => {
        const parts = comment.external_comment_id.split('_');
        console.log(`${index + 1}. ID ${comment.id}`);
        console.log(`   External ID: ${comment.external_comment_id}`);
        console.log(`   Post ID: ${parts[0]} | Comment ID: ${parts[1]}`);
        console.log(`   Author: ${comment.author_name}`);
        console.log(`   Date: ${comment.created_at}`);
        console.log(`   Text: "${comment.comment_text?.substring(0, 50)}..."`);
        console.log('');
      });
    }
    
    // Test Facebook API access more safely
    console.log('🔧 TESTING FACEBOOK API ACCESS:');
    console.log('================================');
    
    try {
      // Test with page info first
      const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
      const pageData = await pageResponse.json();
      
      if (pageData.error) {
        console.log(`❌ Page API Error: ${pageData.error.message}`);
        console.log(`   This suggests token issues, not deleted comments`);
      } else {
        console.log(`✅ Page API Access: ${pageData.name} (ID: ${pageData.id})`);
      }
    } catch (error) {
      console.log(`❌ Page API Network Error: ${error.message}`);
    }
    
    // Test post access instead of comment access
    const uniquePosts = [...new Set(categories.webhook_format.map(c => c.external_post_id))];
    
    if (uniquePosts.length > 0) {
      console.log(`\n🔍 Testing access to ${Math.min(3, uniquePosts.length)} posts (safer than testing comments):`);
      
      for (let i = 0; i < Math.min(3, uniquePosts.length); i++) {
        const postId = uniquePosts[i];
        console.log(`\nTesting post ${postId}:`);
        
        try {
          const response = await fetch(`https://graph.facebook.com/v18.0/${postId}?access_token=${accessToken}&fields=id,message,created_time`);
          const data = await response.json();
          
          if (data.error) {
            console.log(`   ❌ Error: ${data.error.message} (Code: ${data.error.code})`);
            if (data.error.code === 100) {
              console.log(`   💡 Post may be deleted or private`);
            } else if (data.error.code === 190 || data.error.code === 3) {
              console.log(`   💡 Token permission issue - NOT deleted comments`);
            }
          } else {
            console.log(`   ✅ Post accessible: "${data.message?.substring(0, 30)}..."`);
            console.log(`   💡 This suggests comments on this post likely still exist`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.log(`   ❌ Network error: ${error.message}`);
        }
      }
    }
    
    console.log('\n📊 ANALYSIS SUMMARY:');
    console.log('====================');
    console.log(`Total Comments: ${totalComments}`);
    console.log(`Real Comments (webhook format): ${categories.webhook_format.length}`);
    console.log(`Test/Sample Data: ${categories.test_data.length}`);
    console.log(`Invalid IDs: ${categories.invalid_id.length}`);
    
    console.log('\n💡 CONCLUSIONS:');
    console.log('===============');
    
    if (categories.test_data.length > 0) {
      console.log(`🧪 ${categories.test_data.length} comments are clearly test data and can be safely removed`);
    }
    
    if (categories.webhook_format.length > 0) {
      console.log(`📡 ${categories.webhook_format.length} comments appear to be real webhook data`);
      console.log(`   These likely still exist but may have permission/access issues`);
    }
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('====================');
    console.log('1. Error 100 "Tried accessing nonexisting field (post)" suggests API query issue, NOT deleted comments');
    console.log('2. Facebook may have changed their API or your token permissions');
    console.log('3. Comments might be private/restricted rather than deleted');
    console.log('4. Test data should be cleaned up separately from real comments');
    
    console.log('\n🛡️  RECOMMENDATIONS:');
    console.log('=====================');
    console.log('1. DO NOT delete all comments - many appear to be real data');
    console.log('2. Remove only obvious test data (fb_comment_1, etc.)');
    console.log('3. Check Facebook token permissions');
    console.log('4. Use post-level API access instead of direct comment access');
    console.log('5. Consider that comments may be restricted rather than deleted');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

safeFacebookCommentsCheck();
