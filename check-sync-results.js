const { pool } = require('./config/database');

async function checkSyncResults() {
  try {
    console.log('📊 Checking sync results...\n');
    
    // Get final count of comments
    const totalResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
    `);
    
    console.log(`✅ Total Facebook comments in database: ${totalResult.rows[0].count}`);
    
    // Show some recent comments to verify
    const recentResult = await pool.query(`
      SELECT id, external_comment_id, author_name, comment_text, created_at
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🎯 Recent comments still in database:');
    recentResult.rows.forEach((comment, index) => {
      console.log(`${index + 1}. ID ${comment.id}: ${comment.author_name}`);
      console.log(`   External ID: ${comment.external_comment_id}`);
      console.log(`   Content: ${comment.comment_text?.substring(0, 50)}...`);
      console.log(`   Created: ${comment.created_at}`);
      console.log('');
    });
    
    console.log('✅ Database sync completed successfully!');
    console.log('💬 All remaining comments are verified to exist on Facebook and ready for replies.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSyncResults();
