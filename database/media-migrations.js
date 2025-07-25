const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Create media storage tables and directory structure
const createMediaTables = async () => {
  try {
    console.log('🗄️ Creating media storage tables...');

    // Create media_files table for storing all media
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        whatsapp_media_id VARCHAR(255) UNIQUE,
        original_filename VARCHAR(500),
        file_path VARCHAR(500) NOT NULL,
        thumbnail_path VARCHAR(500),
        mime_type VARCHAR(100) NOT NULL,
        file_size INTEGER,
        width INTEGER,
        height INTEGER,
        duration INTEGER, -- for videos/audio in seconds
        file_hash VARCHAR(64), -- SHA256 hash for deduplication
        status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create media_thumbnails table for different thumbnail sizes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS media_thumbnails (
        id SERIAL PRIMARY KEY,
        media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE,
        size_type VARCHAR(20) NOT NULL CHECK (size_type IN ('small', 'medium', 'large')),
        width INTEGER NOT NULL,
        height INTEGER NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update messages table to link to media_files
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS media_file_id INTEGER REFERENCES media_files(id);
    `);

    // Create indexes for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_media_files_whatsapp_id ON media_files(whatsapp_media_id);
      CREATE INDEX IF NOT EXISTS idx_media_files_hash ON media_files(file_hash);
      CREATE INDEX IF NOT EXISTS idx_media_files_mime_type ON media_files(mime_type);
      CREATE INDEX IF NOT EXISTS idx_media_files_status ON media_files(status);
      CREATE INDEX IF NOT EXISTS idx_media_thumbnails_media_id ON media_thumbnails(media_file_id);
      CREATE INDEX IF NOT EXISTS idx_messages_media_file_id ON messages(media_file_id);
    `);

    console.log('✅ Media storage tables created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating media tables:', error);
    throw error;
  }
};

// Create directory structure for media storage
const createMediaDirectories = async () => {
  try {
    console.log('📁 Creating media storage directories...');
    
    const baseDir = path.join(process.cwd(), 'uploads');
    const directories = [
      'uploads',
      'uploads/images',
      'uploads/videos', 
      'uploads/audio',
      'uploads/documents',
      'uploads/thumbnails',
      'uploads/thumbnails/small',
      'uploads/thumbnails/medium',
      'uploads/thumbnails/large'
    ];

    for (const dir of directories) {
      const fullPath = path.join(process.cwd(), dir);
      try {
        await fs.access(fullPath);
        console.log(`📁 Directory already exists: ${dir}`);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      }
    }

    // Create .gitkeep files to ensure directories are tracked
    for (const dir of directories) {
      if (dir !== 'uploads') {
        const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
        try {
          await fs.writeFile(gitkeepPath, '');
          console.log(`📝 Created .gitkeep in ${dir}`);
        } catch (error) {
          console.log(`⚠️ Could not create .gitkeep in ${dir}:`, error.message);
        }
      }
    }

    console.log('✅ Media directories created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating media directories:', error);
    throw error;
  }
};

// Run media storage setup
const setupMediaStorage = async () => {
  try {
    console.log('🚀 Setting up media storage system...');
    await createMediaDirectories();
    await createMediaTables();
    console.log('✅ Media storage setup completed successfully');
  } catch (error) {
    console.error('❌ Media storage setup failed:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  setupMediaStorage().then(() => {
    console.log('Media storage system ready');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createMediaTables, createMediaDirectories, setupMediaStorage };
