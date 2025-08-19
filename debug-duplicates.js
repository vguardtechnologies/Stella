const { pool } = require('./config/database');

async function checkDuplicateComments() {
  try {
    console.log('🔍 Checking for duplicate comments in database...\n');
    
    // Check for duplicate external comment IDs
    const duplicatesResult = await pool.query(`
      SELECT external_comment_id, count(*) as count, 
             array_agg(id) as comment_ids,
             array_agg(created_at) as created_times
      FROM social_comments 
      GROUP BY external_comment_id 
      HAVING count(*) > 1
      ORDER BY count DESC
    `);
    
    if (duplicatesResult.rows.length > 0) {
      console.log('❌ Found duplicate comments:');
      duplicatesResult.rows.forEach((dup, index) => {
        console.log(`${index + 1}. External ID: ${dup.external_comment_id}`);
        console.log(`   Count: ${dup.count}`);
        console.log(`   Database IDs: ${dup.comment_ids.join(', ')}`);
        console.log(`   Created Times: ${dup.created_times.map(t => t.toISOString()).join(', ')}`);
        console.log('');
      });
    } else {
      console.log('✅ No duplicate external comment IDs found');
    }
    
    // Check total comments count
    const totalResult = await pool.query('SELECT count(*) as total FROM social_comments');
    console.log(`📊 Total comments in database: ${totalResult.rows[0].total}`);
    
    // Check recent comments
    const recentResult = await pool.query(`
      SELECT id, external_comment_id, comment_text, author_name, created_at, platform_id
      FROM social_comments 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 Recent 10 comments:');
    recentResult.rows.forEach((comment, index) => {
      console.log(`${index + 1}. ID: ${comment.id} | External: ${comment.external_comment_id}`);
      console.log(`   Author: ${comment.author_name}`);
      console.log(`   Text: ${comment.comment_text?.substring(0, 60)}...`);
      console.log(`   Created: ${comment.created_at.toISOString()}`);
      console.log(`   Platform ID: ${comment.platform_id}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDuplicateComments();
