const { pool } = require('./config/database');

async function validateCommentsOnFacebook() {
  try {
    console.log('🔍 Validating Comments Against Facebook');
    console.log('======================================\n');
    
    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook access token found');
      return;
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    console.log('✅ Facebook access token found\n');
    
    // Get all comment and post IDs from database
    const commentsResult = await pool.query(`
      SELECT 
        c.id as db_id,
        c.external_comment_id,
        c.external_post_id,
        c.author_name,
        c.comment_text,
        c.created_at
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
      AND c.external_comment_id NOT LIKE 'fb_%'  -- Skip test data
      ORDER BY c.created_at DESC
    `);
    
    const totalComments = commentsResult.rows.length;
    console.log(`📊 Testing ${totalComments} real comments from database\n`);
    
    const results = {
      total: totalComments,
      exists: 0,
      deleted: 0,
      errors: 0,
      existingComments: [],
      deletedComments: [],
      errorComments: []
    };
    
    console.log('🧪 Testing each comment...\n');
    
    for (let i = 0; i < commentsResult.rows.length; i++) {
      const comment = commentsResult.rows[i];
      const progress = `[${i + 1}/${totalComments}]`;
      
      // Extract clean comment ID for API call
      let commentId = comment.external_comment_id;
      if (commentId.includes('_')) {
        commentId = commentId.split('_')[1];
      }
      
      console.log(`${progress} Testing comment ${comment.db_id} (${commentId})`);
      
      try {
        // Test comment existence with minimal fields
        const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}?access_token=${accessToken}&fields=id,message,from`);
        const data = await response.json();
        
        if (data.error) {
          if (data.error.code === 100) {
            // Comment doesn't exist (deleted)
            console.log(`   ❌ DELETED`);
            results.deleted++;
            results.deletedComments.push({
              dbId: comment.db_id,
              commentId: comment.external_comment_id,
              author: comment.author_name,
              text: comment.comment_text?.substring(0, 50)
            });
          } else {
            // Other error
            console.log(`   ⚠️  ERROR: ${data.error.message}`);
            results.errors++;
            results.errorComments.push({
              dbId: comment.db_id,
              commentId: comment.external_comment_id,
              error: data.error.message
            });
          }
        } else {
          // Comment exists
          console.log(`   ✅ EXISTS - ${data.from?.name}`);
          results.exists++;
          results.existingComments.push({
            dbId: comment.db_id,
            commentId: comment.external_comment_id,
            fbAuthor: data.from?.name,
            dbAuthor: comment.author_name
          });
        }
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (networkError) {
        console.log(`   ⚠️  NETWORK ERROR: ${networkError.message}`);
        results.errors++;
        results.errorComments.push({
          dbId: comment.db_id,
          commentId: comment.external_comment_id,
          error: `Network: ${networkError.message}`
        });
      }
    }
    
    // Final Results
    console.log('\n🎯 VALIDATION RESULTS');
    console.log('=====================');
    console.log(`📊 Total Comments Tested: ${results.total}`);
    console.log(`✅ Still Exist on Facebook: ${results.exists} (${((results.exists/results.total)*100).toFixed(1)}%)`);
    console.log(`❌ Deleted from Facebook: ${results.deleted} (${((results.deleted/results.total)*100).toFixed(1)}%)`);
    console.log(`⚠️  Errors/Permission Issues: ${results.errors} (${((results.errors/results.total)*100).toFixed(1)}%)`);
    
    if (results.existingComments.length > 0) {
      console.log(`\n✅ COMMENTS THAT STILL EXIST (first 10):`);
      results.existingComments.slice(0, 10).forEach((comment, index) => {
        console.log(`${index + 1}. DB ID ${comment.dbId}: ${comment.fbAuthor || comment.dbAuthor}`);
      });
    }
    
    if (results.deletedComments.length > 0) {
      console.log(`\n❌ COMMENTS DELETED FROM FACEBOOK:`);
      results.deletedComments.forEach((comment, index) => {
        console.log(`${index + 1}. DB ID ${comment.dbId}: ${comment.author}`);
        console.log(`   Text: "${comment.text}..."`);
      });
    }
    
    if (results.errorComments.length > 0) {
      console.log(`\n⚠️  COMMENTS WITH ERRORS:`);
      results.errorComments.slice(0, 5).forEach((comment, index) => {
        console.log(`${index + 1}. DB ID ${comment.dbId}: ${comment.error}`);
      });
    }
    
    console.log('\n💡 SUMMARY:');
    if (results.exists > 0) {
      console.log(`✅ ${results.exists} comments are confirmed to still exist on Facebook`);
    }
    if (results.deleted > 0) {
      console.log(`🗑️  ${results.deleted} comments have been deleted from Facebook`);
    }
    if (results.errors > 0) {
      console.log(`⚠️  ${results.errors} comments had API errors (may be permission issues)`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

validateCommentsOnFacebook();
