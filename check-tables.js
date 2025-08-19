const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTables() {
  try {
    console.log('📊 Current Database Tables and Structure:\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%comment%' OR table_name LIKE '%social%')
      ORDER BY table_name
    `);
    
    for (const table of tablesResult.rows) {
      console.log(`🗂️  Table: ${table.table_name}`);
      
      // Get columns for each table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columnsResult.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`);
      });
      console.log('');
    }
    
    // Get sample data from social_comments
    console.log('📋 Sample Comments Data:');
    const sampleResult = await pool.query(`
      SELECT id, external_comment_id, external_post_id, author_name, 
             comment_text, created_at, is_deleted, platform_id
      FROM social_comments 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    sampleResult.rows.forEach((comment, index) => {
      console.log(`${index + 1}. ID: ${comment.id}`);
      console.log(`   External ID: ${comment.external_comment_id}`);
      console.log(`   Author: ${comment.author_name}`);
      console.log(`   Text: ${comment.comment_text?.substring(0, 50)}...`);
      console.log(`   Platform ID: ${comment.platform_id}`);
      console.log(`   Is Deleted: ${comment.is_deleted}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
