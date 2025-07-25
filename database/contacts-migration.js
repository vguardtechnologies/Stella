const { pool } = require('../config/database');

// Create contacts table for storing saved contacts
const createContactsTable = async () => {
  try {
    console.log('📇 Creating contacts table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        whatsapp_profile_name VARCHAR(255),
        saved_name VARCHAR(255),
        has_susa_suffix BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for phone number lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
    `);

    console.log('✅ Contacts table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating contacts table:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  createContactsTable().then(() => {
    console.log('Contacts table ready');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createContactsTable };
