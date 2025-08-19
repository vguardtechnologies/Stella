const { pool } = require('./config/database');

async function cleanupDuplicateComments() {
  try {
    console.log('🧹 Starting cleanup of duplicate Facebook comments...\n');

    // Find comments that are likely duplicates based on content and author
    const duplicateQuery = `
      WITH duplicate_groups AS (
        SELECT 
          comment_text,
          author_name,
          author_id,
          platform_id,
          COUNT(*) as count,
          array_agg(id ORDER BY created_at) as comment_ids,
          array_agg(external_comment_id ORDER BY created_at) as external_ids,
          array_agg(created_at ORDER BY created_at) as created_times
        FROM social_comments 
        WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook' LIMIT 1)
        GROUP BY comment_text, author_name, author_id, platform_id
        HAVING COUNT(*) > 1
      )
      SELECT * FROM duplicate_groups
      ORDER BY count DESC
    `;

    const duplicates = await pool.query(duplicateQuery);
    
    console.log(`📊 Found ${duplicates.rows.length} groups of duplicate comments\n`);

    let totalCleaned = 0;

    for (const group of duplicates.rows) {
      console.log(`\n🔍 Processing duplicate group:`);
      console.log(`   Author: ${group.author_name}`);
      console.log(`   Text: ${group.comment_text?.substring(0, 60)}...`);
      console.log(`   Count: ${group.count}`);
      console.log(`   IDs: ${group.comment_ids.join(', ')}`);
      console.log(`   External IDs: ${group.external_ids.join(', ')}`);

      // Keep the oldest comment (first in array), delete the rest
      const idsToDelete = group.comment_ids.slice(1); // Remove first element, keep rest for deletion
      
      if (idsToDelete.length > 0) {
        console.log(`   🗑️ Deleting duplicate IDs: ${idsToDelete.join(', ')}`);
        
        // First delete related records to avoid foreign key constraint violations
        console.log(`   🔗 Cleaning up related records...`);
        
        // Delete from social_activity
        await pool.query(`
          DELETE FROM social_activity 
          WHERE comment_id = ANY($1)
        `, [idsToDelete]);
        
        // Delete from social_replies
        await pool.query(`
          DELETE FROM social_replies 
          WHERE comment_id = ANY($1)
        `, [idsToDelete]);
        
        // Delete from ai_suggestions
        await pool.query(`
          DELETE FROM ai_suggestions 
          WHERE comment_id = ANY($1)
        `, [idsToDelete]);
        
        // Delete from comment_reactions (if exists)
        try {
          await pool.query(`
            DELETE FROM comment_reactions 
            WHERE comment_id = ANY($1)
          `, [idsToDelete]);
        } catch (e) {
          // Table might not exist, ignore
        }
        
        // Delete from comment_conversations
        await pool.query(`
          DELETE FROM comment_conversations 
          WHERE comment_id = ANY($1)
        `, [idsToDelete]);
        
        // Now delete the duplicate comments
        await pool.query(`
          DELETE FROM social_comments 
          WHERE id = ANY($1)
        `, [idsToDelete]);

        totalCleaned += idsToDelete.length;
        console.log(`   ✅ Deleted ${idsToDelete.length} duplicates and related records`);
      }
    }

    console.log(`\n🎉 Cleanup complete! Removed ${totalCleaned} duplicate comments`);

    // Show final stats
    const finalCount = await pool.query('SELECT count(*) as total FROM social_comments');
    console.log(`📊 Remaining comments in database: ${finalCount.rows[0].total}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

cleanupDuplicateComments();
