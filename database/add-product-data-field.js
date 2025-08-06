const { pool } = require('../config/database');

async function addProductDataField() {
  try {
    console.log('🔄 Adding product_data field to messages table...');
    
    // Add product_data column as JSONB for storing product information
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS product_data JSONB;
    `);
    
    // Add failure_reason column if it doesn't exist (for better error handling)
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(50);
    `);
    
    console.log('✅ Successfully added product_data and failure_reason fields to messages table');
    return true;
  } catch (error) {
    console.error('❌ Error adding product_data field:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { addProductDataField };

// Run directly if called as script
if (require.main === module) {
  addProductDataField()
    .then(() => {
      console.log('✅ Database schema update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database schema update failed:', error);
      process.exit(1);
    });
}
