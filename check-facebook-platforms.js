const { pool } = require('./config/database');

async function checkFacebookPlatforms() {
  try {
    console.log('🔍 Checking Facebook platforms in database...\n');
    
    const result = await pool.query(`
      SELECT id, platform_type, page_id, access_token, created_at
      FROM social_media_platforms 
      WHERE platform_type = 'facebook' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📊 Found ${result.rows.length} Facebook platform(s):\n`);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. Platform ID: ${row.id}`);
      console.log(`   Platform Type: ${row.platform_type}`);
      console.log(`   Page ID: ${row.page_id || 'NULL'}`);
      console.log(`   Has Token: ${!!row.access_token}`);
      console.log(`   Token Length: ${row.access_token?.length || 0}`);
      console.log(`   Token Preview: ${row.access_token?.substring(0, 30)}...`);
      console.log(`   Created: ${row.created_at}`);
      console.log('---\n');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  }
}

checkFacebookPlatforms();
