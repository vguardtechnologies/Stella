const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || process.env.USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stella_whatsapp',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function testReplyIdStructure() {
  console.log('🔍 Testing reply ID structure...');
  
  try {
    // Get social activity for the specific replyId we're looking for
    const result = await pool.query(`
      SELECT action_data 
      FROM social_activity 
      WHERE action_type = 'manual_reply' 
      AND action_data->>'replyId' LIKE '%1501561624537659%'
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('📊 Found activities:', result.rows.length);
    result.rows.forEach((row, i) => {
      console.log(`Activity ${i + 1}:`, row.action_data);
    });
    
    // Also check the social_comments table to see the exact structure
    const commentsResult = await pool.query(`
      SELECT id, external_comment_id, message, from_data
      FROM social_comments 
      WHERE external_comment_id LIKE '%1472819243859647%'
      LIMIT 5
    `);
    
    console.log('\n📋 Comments with matching external_comment_id:', commentsResult.rows.length);
    commentsResult.rows.forEach((row, i) => {
      console.log(`Comment ${i + 1}:`, {
        id: row.id,
        external_comment_id: row.external_comment_id,
        message: row.message?.substring(0, 50) + '...',
        from_data: row.from_data
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testReplyIdStructure();
