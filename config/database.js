const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  // Local development database
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'stella_whatsapp',
    user: process.env.DB_USER || process.env.USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  // Railway production database
  production: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  }
};

// Create connection pool
const pool = new Pool(
  process.env.NODE_ENV === 'production' 
    ? dbConfig.production 
    : dbConfig.development
);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

module.exports = { pool, dbConfig };
