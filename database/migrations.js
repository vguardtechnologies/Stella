const { pool } = require('../config/database');

// Database schema for WhatsApp messages
const createTables = async () => {
  try {
    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        display_name VARCHAR(255),
        profile_name VARCHAR(255),
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        whatsapp_message_id VARCHAR(255) UNIQUE NOT NULL,
        conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
        phone_number VARCHAR(20) NOT NULL,
        direction VARCHAR(10) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
        message_type VARCHAR(20) NOT NULL,
        content TEXT,
        media_url VARCHAR(500),
        media_mime_type VARCHAR(100),
        media_sha256 VARCHAR(64),
        media_file_size INTEGER,
        voice_duration INTEGER, -- for voice notes (in seconds)
        timestamp BIGINT NOT NULL,
        status VARCHAR(20) DEFAULT 'received',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create message_status table for tracking delivery status
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_status (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create whatsapp_config table for persistent configuration
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_config (
        id SERIAL PRIMARY KEY,
        access_token TEXT NOT NULL,
        phone_number_id VARCHAR(50) NOT NULL,
        webhook_url VARCHAR(500),
        verify_token VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create contacts table for storing saved contacts
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

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_phone_number ON messages(phone_number);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
      CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
      CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number);
      CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON contacts(phone_number);
    `);

    console.log('✅ Database tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating database tables:', error);
    throw error;
  }
};

// Function to run migrations
const runMigrations = async () => {
  try {
    console.log('🚀 Running database migrations...');
    await createTables();
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().then(() => {
    console.log('Database setup complete');
    process.exit(0);
  });
}

module.exports = { createTables, runMigrations };
