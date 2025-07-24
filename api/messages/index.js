const express = require('express');
const router = express.Router();
const whatsappMessageService = require('../../services/whatsappMessageService');

// Get all conversations
router.get('/conversations', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const conversations = await whatsappMessageService.getAllConversations(
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// Get conversation history for a specific phone number
router.get('/conversations/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await whatsappMessageService.getConversationHistory(
      phoneNumber,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: messages,
      count: messages.length,
      phoneNumber
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history'
    });
  }
});

// Get message statistics
router.get('/stats', async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    
    // Get various statistics
    const totalConversations = await pool.query('SELECT COUNT(*) FROM conversations');
    const totalMessages = await pool.query('SELECT COUNT(*) FROM messages');
    const incomingMessages = await pool.query("SELECT COUNT(*) FROM messages WHERE direction = 'incoming'");
    const outgoingMessages = await pool.query("SELECT COUNT(*) FROM messages WHERE direction = 'outgoing'");
    
    // Messages by type
    const messagesByType = await pool.query(`
      SELECT message_type, COUNT(*) as count 
      FROM messages 
      GROUP BY message_type 
      ORDER BY count DESC
    `);
    
    // Recent activity (last 24 hours)
    const recentActivity = await pool.query(`
      SELECT COUNT(*) as count
      FROM messages 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `);
    
    res.json({
      success: true,
      data: {
        totalConversations: parseInt(totalConversations.rows[0].count),
        totalMessages: parseInt(totalMessages.rows[0].count),
        incomingMessages: parseInt(incomingMessages.rows[0].count),
        outgoingMessages: parseInt(outgoingMessages.rows[0].count),
        messagesByType: messagesByType.rows,
        recentActivity: parseInt(recentActivity.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const { pool } = require('../../config/database');
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      message: 'Messages API is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;
