const { pool } = require('../config/database');

// Add comment reactions table and functionality
async function addCommentReactions() {
  console.log('🎭 Adding comment reactions functionality...');

  try {
    // Create comment_reactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_reactions (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES social_comments(id) ON DELETE CASCADE,
        user_id VARCHAR(255) DEFAULT 'agent', -- who added the reaction
        emoji VARCHAR(10) NOT NULL, -- the emoji reaction
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(comment_id, user_id, emoji) -- prevent duplicate reactions
      )
    `);

    // Add reaction_count to social_comments for performance
    await pool.query(`
      ALTER TABLE social_comments 
      ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0
    `);

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_comment_reactions_emoji ON comment_reactions(emoji)`);

    // Add some sample reactions for testing
    const sampleReactions = [
      { commentId: 1, emoji: '👍', userId: 'agent' },
      { commentId: 1, emoji: '❤️', userId: 'agent' },
      { commentId: 2, emoji: '😍', userId: 'agent' },
      { commentId: 3, emoji: '👏', userId: 'agent' }
    ];

    console.log('📊 Adding sample reactions...');
    for (const reaction of sampleReactions) {
      await pool.query(`
        INSERT INTO comment_reactions (comment_id, user_id, emoji)
        VALUES ($1, $2, $3)
        ON CONFLICT (comment_id, user_id, emoji) DO NOTHING
      `, [reaction.commentId, reaction.userId, reaction.emoji]);
    }

    // Update reaction counts
    await pool.query(`
      UPDATE social_comments 
      SET reaction_count = (
        SELECT COUNT(*) FROM comment_reactions 
        WHERE comment_reactions.comment_id = social_comments.id
      )
    `);

    console.log('✅ Comment reactions functionality added successfully');
    return true;

  } catch (error) {
    console.error('❌ Error adding comment reactions:', error);
    throw error;
  }
}

// Function to toggle reaction
async function toggleReaction(commentId, emoji, userId = 'agent') {
  try {
    // Check if reaction already exists
    const existingQuery = `
      SELECT id FROM comment_reactions 
      WHERE comment_id = $1 AND user_id = $2 AND emoji = $3
    `;
    const existing = await pool.query(existingQuery, [commentId, userId, emoji]);

    if (existing.rows.length > 0) {
      // Remove reaction
      await pool.query(`
        DELETE FROM comment_reactions 
        WHERE comment_id = $1 AND user_id = $2 AND emoji = $3
      `, [commentId, userId, emoji]);
      console.log(`➖ Removed reaction ${emoji} from comment ${commentId}`);
    } else {
      // Add reaction
      await pool.query(`
        INSERT INTO comment_reactions (comment_id, user_id, emoji)
        VALUES ($1, $2, $3)
      `, [commentId, userId, emoji]);
      console.log(`➕ Added reaction ${emoji} to comment ${commentId}`);
    }

    // Update reaction count
    await pool.query(`
      UPDATE social_comments 
      SET reaction_count = (
        SELECT COUNT(*) FROM comment_reactions 
        WHERE comment_reactions.comment_id = $1
      )
      WHERE id = $1
    `, [commentId]);

    // Get updated reactions for this comment
    const reactionsQuery = `
      SELECT emoji, COUNT(*) as count, 
             array_agg(user_id) as users
      FROM comment_reactions 
      WHERE comment_id = $1 
      GROUP BY emoji 
      ORDER BY count DESC, emoji
    `;
    const reactions = await pool.query(reactionsQuery, [commentId]);

    return {
      success: true,
      reactions: reactions.rows
    };

  } catch (error) {
    console.error('❌ Error toggling reaction:', error);
    throw error;
  }
}

// Get reactions for a comment
async function getCommentReactions(commentId) {
  try {
    const query = `
      SELECT emoji, COUNT(*) as count,
             array_agg(user_id) as users
      FROM comment_reactions 
      WHERE comment_id = $1 
      GROUP BY emoji 
      ORDER BY count DESC, emoji
    `;
    const result = await pool.query(query, [commentId]);
    return result.rows;
  } catch (error) {
    console.error('❌ Error getting reactions:', error);
    throw error;
  }
}

module.exports = {
  addCommentReactions,
  toggleReaction,
  getCommentReactions
};

// Run migration if called directly
if (require.main === module) {
  addCommentReactions()
    .then(() => {
      console.log('✅ Comment reactions migration complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
