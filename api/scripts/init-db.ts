import { Database } from '../lib/database';

async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    await Database.initializeTables();
    console.log('Database tables initialized successfully!');
    
    // Create a test user if in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating test user for development...');
      
      try {
        const testUser = await Database.createUser(
          'test@stellawater.ng',
          '$2a$12$LQv3c1yqBwlXHNRZP8MzU.w8KfF3DsO4UJFJJJJJJJJJJJJJJJJJJe' // password: 'password123'
        );
        console.log('Test user created:', testUser.email);
      } catch (error) {
        if ((error as { code?: string }).code === '23505') { // Unique constraint violation
          console.log('Test user already exists');
        } else {
          throw error;
        }
      }
    }
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
