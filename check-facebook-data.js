const { pool } = require('./config/database');

async function checkFacebookData() {
  try {
    console.log('🔍 Checking Facebook platforms...\n');
    
    const dataResult = await pool.query(`
      SELECT id, user_id, platform_type, name, connected, account_info, access_token, created_at
      FROM social_platforms 
      WHERE platform_type = 'facebook'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📊 Found ${dataResult.rows.length} Facebook platform(s):\n`);
    
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Platform ID: ${row.id}`);
      console.log(`   User ID: ${row.user_id}`);
      console.log(`   Platform Type: ${row.platform_type}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Connected: ${row.connected}`);
      console.log(`   Account Info: ${JSON.stringify(row.account_info, null, 2)}`);
      console.log(`   Has Token: ${!!row.access_token}`);
      console.log(`   Token Length: ${row.access_token?.length || 0}`);
      console.log(`   Token Preview: ${row.access_token?.substring(0, 50)}...`);
      console.log(`   Created: ${row.created_at}`);
      console.log('---\n');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  }
}

checkFacebookData();
