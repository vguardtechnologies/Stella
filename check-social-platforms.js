const { pool } = require('./config/database');

async function checkSocialPlatforms() {
  try {
    console.log('🔍 Checking social_platforms table...\n');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'social_platforms'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Get Facebook platform data
    const dataResult = await pool.query(`
      SELECT id, platform_type, page_id, page_name, access_token, created_at
      FROM social_platforms 
      WHERE platform_type = 'facebook'
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`\n📊 Found ${dataResult.rows.length} Facebook platform(s):\n`);
    
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Platform ID: ${row.id}`);
      console.log(`   Platform Type: ${row.platform_type}`);
      console.log(`   Page ID: ${row.page_id || 'NULL'}`);
      console.log(`   Page Name: ${row.page_name || 'NULL'}`);
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

checkSocialPlatforms();
