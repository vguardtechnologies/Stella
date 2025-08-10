// Database migration for Social Media Comment Management System
const { pool } = require('../config/database');

async function migrateSocialCommenterTables() {
  console.log('🔄 Creating social media commenter tables...');

  try {
    // Social Platforms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_platforms (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
        platform_type VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'tiktok', 'facebook-ads'
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(10),
        connected BOOLEAN DEFAULT FALSE,
        account_info JSONB,
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        last_activity TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, platform_type)
      )
    `);

    // Social Comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_comments (
        id SERIAL PRIMARY KEY,
        platform_id INTEGER REFERENCES social_platforms(id),
        external_comment_id VARCHAR(255) NOT NULL,
        external_post_id VARCHAR(255) NOT NULL,
        comment_text TEXT NOT NULL,
        author_name VARCHAR(255),
        author_handle VARCHAR(255),
        author_id VARCHAR(255),
        author_avatar_url TEXT,
        post_title TEXT,
        post_url TEXT,
        post_media_url TEXT,
        status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'replied', 'ignored', 'escalated'
        sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
        priority INTEGER DEFAULT 5, -- 1-10 priority scale
        tags JSONB, -- ['urgent', 'complaint', 'question', etc.]
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform_id, external_comment_id)
      )
    `);

    // AI Configuration table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default_user',
        enabled BOOLEAN DEFAULT FALSE,
        model VARCHAR(50) DEFAULT 'llama-3.2-1b-q4',
        auto_reply BOOLEAN DEFAULT FALSE,
        response_delay INTEGER DEFAULT 30, -- seconds
        personality_prompt TEXT DEFAULT 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.',
        max_response_length INTEGER DEFAULT 500,
        confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);

    // AI Suggestions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES social_comments(id),
        suggested_response TEXT NOT NULL,
        confidence_score DECIMAL(3,2),
        used BOOLEAN DEFAULT FALSE,
        feedback VARCHAR(20), -- 'good', 'bad', 'modified'
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Social Activity table (for tracking all actions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_activity (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES social_comments(id),
        action_type VARCHAR(50) NOT NULL, -- 'comment_received', 'ai_suggested', 'manual_reply', 'ai_reply', 'ignored'
        action_data JSONB,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Social Replies table (for tracking sent replies)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_replies (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES social_comments(id),
        reply_text TEXT NOT NULL,
        external_reply_id VARCHAR(255),
        reply_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'ai_auto', 'ai_suggested'
        sent_by VARCHAR(255),
        sent_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'sent' -- 'sent', 'failed', 'deleted'
      )
    `);

    // Comment Conversations table (linking comments to WhatsApp conversations)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_conversations (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES social_comments(id),
        whatsapp_conversation_id VARCHAR(255),
        whatsapp_phone_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(comment_id)
      )
    `);

    // Social Posts table (for caching post information)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id SERIAL PRIMARY KEY,
        platform_id INTEGER REFERENCES social_platforms(id),
        external_post_id VARCHAR(255) NOT NULL,
        post_type VARCHAR(20), -- 'photo', 'video', 'reel', 'story'
        title TEXT,
        caption TEXT,
        media_url TEXT,
        thumbnail_url TEXT,
        post_url TEXT,
        engagement_stats JSONB, -- likes, comments, shares, views
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform_id, external_post_id)
      )
    `);

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_comments_status ON social_comments(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_comments_platform_id ON social_comments(platform_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_comments_created_at ON social_comments(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_activity_comment_id ON social_activity(comment_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_activity_created_at ON social_activity(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_social_platforms_user_id ON social_platforms(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_conversations_whatsapp ON comment_conversations(whatsapp_conversation_id)`);

    console.log('✅ Social media commenter tables created successfully');
    return true;

  } catch (error) {
    console.error('❌ Error creating social commenter tables:', error);
    throw error;
  }
}

// Insert default AI configuration
async function insertDefaultAIConfig() {
  try {
    await pool.query(`
      INSERT INTO ai_config (
        user_id, enabled, model, auto_reply, response_delay, personality_prompt
      ) VALUES (
        'default_user', 
        false, 
        'llama-3.2-1b-q4', 
        false, 
        30,
        'You are a helpful customer service representative. Respond professionally and friendly to customer comments.'
      ) ON CONFLICT (user_id) DO NOTHING
    `);
    console.log('✅ Default AI configuration inserted');
  } catch (error) {
    console.error('❌ Error inserting default AI config:', error);
  }
}

// Insert sample platforms (for testing)
async function insertSamplePlatforms() {
  try {
    const platforms = [
      {
        type: 'facebook',
        name: 'Facebook Pages',
        icon: '📘',
        connected: false
      },
      {
        type: 'instagram',
        name: 'Instagram Business',
        icon: '📷',
        connected: false
      },
      {
        type: 'tiktok',
        name: 'TikTok Business',
        icon: '🎵',
        connected: false
      },
      {
        type: 'facebook-ads',
        name: 'Facebook Ads',
        icon: '📊',
        connected: false
      }
    ];

    for (const platform of platforms) {
      await pool.query(`
        INSERT INTO social_platforms (
          user_id, platform_type, name, icon, connected
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, platform_type) DO NOTHING
      `, ['default_user', platform.type, platform.name, platform.icon, platform.connected]);
    }

    console.log('✅ Sample platforms inserted');
  } catch (error) {
    console.error('❌ Error inserting sample platforms:', error);
  }
}

// Insert sample comments for testing
async function insertSampleComments() {
  try {
    // First, get platform IDs
    const platforms = await pool.query(`
      SELECT id, platform_type FROM social_platforms 
      WHERE user_id = 'default_user'
    `);

    const platformMap = {};
    platforms.rows.forEach(p => {
      platformMap[p.platform_type] = p.id;
    });

    const sampleComments = [
      {
        platformId: platformMap['facebook'],
        externalCommentId: 'fb_comment_1',
        externalPostId: 'fb_post_1',
        text: 'Great product! When will this be back in stock?',
        authorName: 'Jane Customer',
        authorHandle: '@jane_customer',
        authorId: 'jane_123',
        postTitle: 'New Product Launch',
        postUrl: 'https://facebook.com/post_1',
        status: 'pending'
      },
      {
        platformId: platformMap['instagram'],
        externalCommentId: 'ig_comment_1',
        externalPostId: 'ig_post_1',
        text: 'This looks amazing! Where can I buy it?',
        authorName: 'Mike User',
        authorHandle: '@mike_user',
        authorId: 'mike_456',
        postTitle: 'Instagram Post',
        postUrl: 'https://instagram.com/p/post_1',
        status: 'pending'
      },
      {
        platformId: platformMap['tiktok'],
        externalCommentId: 'tt_comment_1',
        externalPostId: 'tt_post_1',
        text: 'Love this! Need more info please 😍',
        authorName: 'Sarah TikTok',
        authorHandle: '@sarah_tiktok',
        authorId: 'sarah_789',
        postTitle: 'TikTok Video',
        postUrl: 'https://tiktok.com/@user/video/1',
        status: 'pending'
      }
    ];

    for (const comment of sampleComments) {
      await pool.query(`
        INSERT INTO social_comments (
          platform_id, external_comment_id, external_post_id, comment_text,
          author_name, author_handle, author_id, post_title, post_url, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (platform_id, external_comment_id) DO NOTHING
      `, [
        comment.platformId, comment.externalCommentId, comment.externalPostId,
        comment.text, comment.authorName, comment.authorHandle, comment.authorId,
        comment.postTitle, comment.postUrl, comment.status
      ]);
    }

    console.log('✅ Sample comments inserted');
  } catch (error) {
    console.error('❌ Error inserting sample comments:', error);
  }
}

// Main migration function
async function runSocialCommenterMigration() {
  console.log('🚀 Starting Social Media Commenter migration...');
  
  try {
    await migrateSocialCommenterTables();
    await insertDefaultAIConfig();
    await insertSamplePlatforms();
    await insertSampleComments();
    
    console.log('🎉 Social Media Commenter migration completed successfully!');
    return true;
  } catch (error) {
    console.error('💥 Social Media Commenter migration failed:', error);
    throw error;
  }
}

module.exports = {
  migrateSocialCommenterTables,
  insertDefaultAIConfig,
  insertSamplePlatforms,
  insertSampleComments,
  runSocialCommenterMigration
};
