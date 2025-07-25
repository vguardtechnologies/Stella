const { createTables } = require('./database/migrations');

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  try {
    await createTables();
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  process.exit(0);
}

runMigrations();
