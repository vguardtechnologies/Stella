const { pool } = require('./config/database');

async function addFailureReasonColumn() {
  try {
    console.log('🔧 Adding failure_reason column to messages table...');
    
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(50);
    `);
    
    console.log('✅ Successfully added failure_reason column to messages table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding failure_reason column:', error);
    process.exit(1);
  }
}

addFailureReasonColumn();
