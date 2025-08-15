const { pool } = require('./config/database');

async function syncDatabaseWithFacebook() {
  try {
    console.log('🔄 Syncing Database Comments with Facebook...\n');
    
    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook platform found');
      return;
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    console.log('✅ Found Facebook access token\n');
    
    // Get all Facebook comments from database
    const allCommentsResult = await pool.query(`
      SELECT id, external_comment_id, external_post_id, author_name, 
             comment_text, created_at, is_deleted
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${allCommentsResult.rows.length} Facebook comments in database\n`);
    
    const commentsToDelete = [];
    const activeComments = [];
    let processedCount = 0;
    
    console.log('🔍 Checking each comment against Facebook API...\n');
    
    for (const comment of allCommentsResult.rows) {
      processedCount++;
      
      // Extract the actual comment ID for Facebook API
      const actualCommentId = comment.external_comment_id.includes('_') ? 
        comment.external_comment_id.split('_')[1] : 
        comment.external_comment_id;
      
      console.log(`[${processedCount}/${allCommentsResult.rows.length}] Checking comment ${comment.id}:`);
      console.log(`   External ID: ${comment.external_comment_id}`);
      console.log(`   Author: ${comment.author_name}`);
      console.log(`   Already marked deleted: ${comment.is_deleted}`);
      
      try {
        // Check if comment exists on Facebook
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
          if (data.error.code === 100 && data.error.message.includes('does not exist')) {
            console.log(`   ❌ DELETED on Facebook - will remove from database`);
            commentsToDelete.push({
              id: comment.id,
              external_comment_id: comment.external_comment_id,
              author_name: comment.author_name,
              reason: 'Deleted on Facebook (Error 100)'
            });
          } else if (data.error.code === 190) {
            console.log(`   ⚠️  Access token issue - skipping this comment`);
          } else {
            console.log(`   ⚠️  Other error (${data.error.code}): ${data.error.message}`);
          }
        } else {
          console.log(`   ✅ EXISTS on Facebook - keeping in database`);
          activeComments.push({
            id: comment.id,
            external_comment_id: comment.external_comment_id,
            author_name: comment.author_name,
            fb_author: data.from?.name,
            fb_message: data.message?.substring(0, 50) + '...'
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Show summary before deletion
    console.log('📊 SYNC SUMMARY:');
    console.log(`   Total comments checked: ${allCommentsResult.rows.length}`);
    console.log(`   Active on Facebook: ${activeComments.length}`);
    console.log(`   To be deleted: ${commentsToDelete.length}\n`);
    
    if (commentsToDelete.length > 0) {
      console.log('🗑️  Comments to be deleted:');
      commentsToDelete.forEach((comment, index) => {
        console.log(`   ${index + 1}. DB ID ${comment.id}: ${comment.external_comment_id}`);
        console.log(`      Author: ${comment.author_name}`);
        console.log(`      Reason: ${comment.reason}`);
      });
      
      console.log(`\n🧹 Starting cleanup process...\n`);
      
      let deletedCount = 0;
      
      for (const comment of commentsToDelete) {
        try {
          console.log(`Deleting comment ${comment.id} (${comment.external_comment_id})...`);
          
          // First, delete related records to avoid foreign key constraints
          console.log('  🧹 Cleaning up social_activity records...');
          const activityResult = await pool.query(`
            DELETE FROM social_activity 
            WHERE comment_id = $1
          `, [comment.id]);
          console.log(`     Removed ${activityResult.rowCount} activity records`);
          
          console.log('  🧹 Cleaning up ai_suggestions records...');
          const suggestionsResult = await pool.query(`
            DELETE FROM ai_suggestions 
            WHERE comment_id = $1
          `, [comment.id]);
          console.log(`     Removed ${suggestionsResult.rowCount} suggestion records`);
          
          // Now delete the comment itself
          console.log('  🧹 Deleting the comment...');
          const commentResult = await pool.query(`
            DELETE FROM social_comments 
            WHERE id = $1
          `, [comment.id]);
          
          if (commentResult.rowCount > 0) {
            deletedCount++;
            console.log(`  ✅ Successfully deleted comment ${comment.id}\n`);
          } else {
            console.log(`  ❌ Failed to delete comment ${comment.id}\n`);
          }
          
        } catch (error) {
          console.log(`  ❌ Error deleting comment ${comment.id}: ${error.message}\n`);
        }
      }
      
      console.log(`🎉 Cleanup completed! Deleted ${deletedCount} out of ${commentsToDelete.length} comments.\n`);
      
    } else {
      console.log('✅ No comments need to be deleted - database is already in sync!\n');
    }
    
    // Final verification
    const finalCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
    `);
    
    console.log('📊 FINAL STATUS:');
    console.log(`   Active Facebook comments in database: ${finalCountResult.rows[0].count}`);
    console.log(`   Comments verified to exist on Facebook: ${activeComments.length}`);
    console.log('   ✅ Database is now synchronized with Facebook!\n');
    
    if (activeComments.length > 0) {
      console.log('🎯 Ready for replies! You can now safely reply to any of these comments:');
      activeComments.slice(0, 5).forEach((comment, index) => {
        console.log(`   ${index + 1}. ${comment.author_name || comment.fb_author}: ${comment.fb_message}`);
      });
      
      if (activeComments.length > 5) {
        console.log(`   ... and ${activeComments.length - 5} more comments`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

syncDatabaseWithFacebook();
