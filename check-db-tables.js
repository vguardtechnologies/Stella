const { pool } = require('./config/database');

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%platform%'
    `);
    
    console.log('📊 Platform-related tables:');
    result.rows.forEach(row => console.log(' -', row.table_name));
    
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%comment%'
    `);
    
    console.log('\n📊 Comment-related tables:');
    result2.rows.forEach(row => console.log(' -', row.table_name));
    
    const result3 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%social%'
    `);
    
    console.log('\n📊 Social-related tables:');
    result3.rows.forEach(row => console.log(' -', row.table_name));
    
    // Check all tables
    const result4 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 All tables:');
    result4.rows.forEach(row => console.log(' -', row.table_name));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
