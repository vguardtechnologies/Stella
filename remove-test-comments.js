const { pool } = require('./config/database');

async function removeTestComments() {
  try {
    console.log('🧹 Removing Test Comments from Database...\n');
    
    // Get all Facebook comments to identify test comments
    const allCommentsResult = await pool.query(`
      SELECT id, external_comment_id, author_name, comment_text, created_at
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${allCommentsResult.rows.length} Facebook comments in database\n`);
    
    // Identify test comments by patterns
    const testComments = allCommentsResult.rows.filter(comment => {
      const isTestComment = 
        // Test content patterns
        comment.comment_text?.includes('Test from Stella') ||
        comment.comment_text?.includes('Test reply from Stella') ||
        comment.comment_text?.includes('Testing fixed API') ||
        comment.comment_text?.includes('please ignore') ||
        // Test author patterns
        comment.author_name === 'SUSA' && comment.comment_text?.includes('Test') ||
        comment.author_name === 'SUSA' && comment.comment_text?.includes('API') ||
        // External ID patterns that look like tests
        comment.external_comment_id?.includes('test') ||
        comment.external_comment_id?.includes('debug') ||
        comment.external_comment_id?.includes('_123') ||
        comment.external_comment_id?.includes('_456') ||
        comment.external_comment_id?.includes('_999');
      
      return isTestComment;
    });
    
    console.log('🔍 Identified test comments:');
    testComments.forEach((comment, index) => {
      console.log(`${index + 1}. ID ${comment.id}: ${comment.author_name}`);
      console.log(`   External ID: ${comment.external_comment_id}`);
      console.log(`   Content: ${comment.comment_text?.substring(0, 60)}...`);
      console.log(`   Created: ${comment.created_at}`);
      console.log('');
    });
    
    if (testComments.length === 0) {
      console.log('✅ No test comments found to remove');
      return;
    }
    
    console.log(`🗑️  Will remove ${testComments.length} test comments\n`);
    
    let deletedCount = 0;
    
    for (const comment of testComments) {
      try {
        console.log(`Deleting test comment ${comment.id} (${comment.external_comment_id})...`);
        
        // Clean up related records first
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
        
        // Delete the comment
        console.log('  🧹 Deleting the comment...');
        const commentResult = await pool.query(`
          DELETE FROM social_comments 
          WHERE id = $1
        `, [comment.id]);
        
        if (commentResult.rowCount > 0) {
          deletedCount++;
          console.log(`  ✅ Successfully deleted test comment ${comment.id}\n`);
        } else {
          console.log(`  ❌ Failed to delete test comment ${comment.id}\n`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error deleting comment ${comment.id}: ${error.message}\n`);
      }
    }
    
    // Final summary
    const finalCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
    `);
    
    console.log('🎉 Test Comment Cleanup Complete!');
    console.log(`📊 Deleted ${deletedCount} out of ${testComments.length} test comments`);
    console.log(`📊 Remaining Facebook comments: ${finalCountResult.rows[0].count}`);
    
    // Show remaining recent comments
    const remainingResult = await pool.query(`
      SELECT id, external_comment_id, author_name, comment_text, created_at
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🎯 Recent remaining comments (non-test):');
    remainingResult.rows.forEach((comment, index) => {
      console.log(`${index + 1}. ID ${comment.id}: ${comment.author_name}`);
      console.log(`   Content: ${comment.comment_text?.substring(0, 50)}...`);
      console.log('');
    });
    
    console.log('✅ Your database now contains only genuine Facebook comments ready for replies!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

removeTestComments();
