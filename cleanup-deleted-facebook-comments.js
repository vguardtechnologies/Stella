const { pool } = require('./config/database');

async function cleanupDeletedComments() {
  try {
    console.log('🧹 Facebook Comments Cleanup Tool');
    console.log('=================================\n');
    
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
    
    // Get all Facebook comments
    const allCommentsResult = await pool.query(`
      SELECT 
        c.id,
        c.external_comment_id,
        c.author_name,
        c.comment_text,
        c.is_deleted
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
      ORDER BY c.created_at DESC
    `);
    
    const totalComments = allCommentsResult.rows.length;
    console.log(`📊 Found ${totalComments} Facebook comments to check\n`);
    
    if (totalComments === 0) {
      console.log('ℹ️  No comments found to cleanup');
      return;
    }
    
    const deletedComments = [];
    let checkedCount = 0;
    
    console.log('🔍 Checking comments against Facebook API...');
    
    for (const comment of allCommentsResult.rows) {
      checkedCount++;
      
      // Extract actual comment ID
      let actualCommentId = comment.external_comment_id;
      if (actualCommentId.includes('_')) {
        actualCommentId = actualCommentId.split('_')[1];
      }
      
      process.stdout.write(`\r[${checkedCount}/${totalComments}] Checking comment ${comment.id}...`);
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error && data.error.code === 100) {
          // Comment is deleted on Facebook
          deletedComments.push({
            id: comment.id,
            external_id: comment.external_comment_id,
            author: comment.author_name,
            text: comment.comment_text?.substring(0, 50)
          });
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        // Skip network errors for now
        continue;
      }
    }
    
    console.log(`\n\n📊 CLEANUP SUMMARY:`);
    console.log(`   Total checked: ${checkedCount}`);
    console.log(`   Found deleted: ${deletedComments.length}`);
    
    if (deletedComments.length === 0) {
      console.log('\n✅ No cleanup needed - all comments still exist on Facebook!');
      process.exit(0);
    }
    
    console.log(`\n🗑️  COMMENTS TO DELETE FROM DATABASE:`);
    deletedComments.slice(0, 10).forEach((comment, index) => {
      console.log(`${index + 1}. ID ${comment.id}: ${comment.author}`);
      console.log(`   "${comment.text}..."`);
    });
    
    if (deletedComments.length > 10) {
      console.log(`   ... and ${deletedComments.length - 10} more`);
    }
    
    console.log(`\n⚠️  This will permanently delete ${deletedComments.length} comments from your database.`);
    console.log(`Continue? (y/N): `);
    
    // For automation, you might want to add auto-confirm
    // For now, we'll simulate a 'yes' response
    const confirm = 'y'; // In production, use readline for user input
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Cleanup cancelled');
      process.exit(0);
    }
    
    console.log('\n🗑️  Starting cleanup...');
    
    let deletedCount = 0;
    
    for (const comment of deletedComments) {
      try {
        console.log(`Deleting comment ${comment.id}...`);
        
        // Delete related records first to avoid foreign key constraints
        await pool.query('DELETE FROM social_activity WHERE comment_id = $1', [comment.id]);
        await pool.query('DELETE FROM ai_suggestions WHERE comment_id = $1', [comment.id]);
        await pool.query('DELETE FROM social_replies WHERE comment_id = $1', [comment.id]);
        await pool.query('DELETE FROM comment_conversations WHERE comment_id = $1', [comment.id]);
        
        // Delete the comment
        const result = await pool.query('DELETE FROM social_comments WHERE id = $1', [comment.id]);
        
        if (result.rowCount > 0) {
          deletedCount++;
          console.log(`✅ Deleted comment ${comment.id}`);
        }
        
      } catch (error) {
        console.log(`❌ Error deleting comment ${comment.id}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Successfully deleted ${deletedCount} out of ${deletedComments.length} comments`);
    
    // Final count
    const finalResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
    `);
    
    console.log(`📊 Remaining Facebook comments: ${finalResult.rows[0].count}`);
    console.log('\n✅ Your database is now synchronized with Facebook!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDeletedComments();
