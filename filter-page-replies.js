const { pool } = require('./config/database');

async function filterPageReplies() {
  try {
    console.log('🔧 Managing Page Replies vs Customer Comments...\n');
    
    // Get page info
    const pageResult = await pool.query(`
      SELECT account_info FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    const pageInfo = pageResult.rows[0].account_info;
    const pageId = pageInfo.page_id;
    
    console.log(`📋 Your Page: ${pageInfo.page_name} (ID: ${pageId})`);
    
    // Mark page replies
    console.log('\n🏷️  Marking page replies...');
    const updateResult = await pool.query(`
      UPDATE social_comments 
      SET tags = COALESCE(tags, '{}'::jsonb) || '{"is_page_reply": true}'::jsonb
      WHERE author_id = $1 
      AND platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
    `, [pageId]);
    
    console.log(`✅ Marked ${updateResult.rowCount} comments as page replies`);
    
    // Get counts
    const customerCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      AND (tags->>'is_page_reply')::boolean IS NOT TRUE
    `);
    
    const pageReplyCountResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      AND (tags->>'is_page_reply')::boolean = true
    `);
    
    console.log('\n📊 Updated Comment Distribution:');
    console.log(`   Customer Comments: ${customerCountResult.rows[0].count}`);
    console.log(`   Page Replies: ${pageReplyCountResult.rows[0].count}`);
    
    // Show recent customer comments only
    const customerCommentsResult = await pool.query(`
      SELECT id, external_comment_id, author_name, comment_text, created_at
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      AND (tags->>'is_page_reply')::boolean IS NOT TRUE
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n🎯 Recent Customer Comments (excluding page replies):');
    customerCommentsResult.rows.forEach((comment, index) => {
      console.log(`${index + 1}. ${comment.author_name}: ${comment.comment_text?.substring(0, 60)}...`);
    });
    
    console.log('\n✅ Database updated! Page replies are now properly tagged.');
    console.log('💡 You can now filter your chat interface to show only customer comments.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

filterPageReplies();
