// Social Media Comment Management API
// Handles comment monitoring, AI responses, and cross-platform integration

const express = require('express');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        if (query.action === 'comments') {
          return handleGetComments(req, res);
        } else if (query.action === 'activity') {
          return handleGetActivity(req, res);
        } else if (query.action === 'ai-config') {
          return handleGetAIConfig(req, res);
        } else if (query.action === 'platforms') {
          return handleGetPlatforms(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'POST':
        if (query.action === 'ai-respond') {
          return handleAIResponse(req, res);
        } else if (query.action === 'send-reply') {
          return handleSendReply(req, res);
        } else if (query.action === 'update-ai-config') {
          return handleUpdateAIConfig(req, res);
        } else if (query.action === 'connect-platform') {
          return handleConnectPlatform(req, res);
        } else if (query.action === 'webhook') {
          return handleCommentWebhook(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'PUT':
        if (query.action === 'mark-handled') {
          return handleMarkHandled(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'DELETE':
        if (query.action === 'disconnect-platform') {
          return handleDisconnectPlatform(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Social Media Commenter API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get comments from all connected platforms
async function handleGetComments(req, res) {
  const { platform, status = 'pending', limit = 50, offset = 0 } = req.query;

  try {
        
    // Query comments from database
    let query = `
      SELECT c.*, p.name as platform_name, p.icon as platform_icon 
      FROM social_comments c 
      JOIN social_platforms p ON c.platform_id = p.id 
      WHERE c.status = $1
    `;
    const params = [status];

    if (platform) {
      query += ` AND p.platform_type = $${params.length + 1}`;
      params.push(platform);
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      comments: result.rows,
      hasMore: result.rows.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get activity feed
async function handleGetActivity(req, res) {
  const { limit = 20, offset = 0 } = req.query;

  try {
        
    const query = `
      SELECT 
        a.*,
        p.name as platform_name,
        p.icon as platform_icon,
        c.comment_text,
        c.author_name,
        c.author_handle
      FROM social_activity a
      LEFT JOIN social_comments c ON a.comment_id = c.id
      LEFT JOIN social_platforms p ON c.platform_id = p.id
      ORDER BY a.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    return res.status(200).json({
      success: true,
      activities: result.rows,
      hasMore: result.rows.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get activity error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get AI configuration
async function handleGetAIConfig(req, res) {
  try {
        
    const query = `
      SELECT * FROM ai_config 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query, ['default_user']); // For now, use default user

    const defaultConfig = {
      enabled: false,
      model: 'llama-3.2-1b-q4',
      autoReply: false,
      responseDelay: 30,
      personalityPrompt: 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.'
    };

    const config = result.rows.length > 0 ? result.rows[0] : defaultConfig;

    return res.status(200).json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Get AI config error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get connected platforms
async function handleGetPlatforms(req, res) {
  try {
    const { pool } = require('../config/database');
    
    const query = `
      SELECT 
        id, platform_type, name, icon, connected, account_info, 
        last_activity, created_at, updated_at 
      FROM social_platforms 
      WHERE user_id = $1 
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(query, ['default_user']);

    return res.status(200).json({
      success: true,
      platforms: result.rows
    });

  } catch (error) {
    console.error('Get platforms error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Update AI configuration
async function handleUpdateAIConfig(req, res) {
  const { config } = body;

  try {
    const { pool } = require('../config/database');
    
    const query = `
      INSERT INTO ai_config (user_id, enabled, model, auto_reply, response_delay, personality_prompt, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        enabled = $2,
        model = $3,
        auto_reply = $4,
        response_delay = $5,
        personality_prompt = $6,
        updated_at = NOW()
    `;

    await pool.query(query, [
      'default_user',
      config.enabled,
      config.model,
      config.autoReply,
      config.responseDelay,
      config.personalityPrompt
    ]);

    return res.status(200).json({
      success: true,
      message: 'AI configuration updated successfully'
    });

  } catch (error) {
    console.error('Update AI config error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Generate AI response for a comment
async function handleAIResponse(req, res) {
  const { commentId, commentText, postContext } = body;

  try {
    const { pool } = require('../config/database');

    // Get AI configuration
    const configQuery = `SELECT * FROM ai_config WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`;
    const configResult = await pool.query(configQuery, ['default_user']);
    
    if (configResult.rows.length === 0 || !configResult.rows[0].enabled) {
      return res.status(400).json({ error: 'AI responder is not enabled' });
    }

    const config = configResult.rows[0];

    // Generate AI response using Llama model
    const aiResponse = await generateAIResponse(commentText, postContext, config);

    // Save suggested response
    const saveQuery = `
      INSERT INTO ai_suggestions (comment_id, suggested_response, confidence_score, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;

    const saveResult = await pool.query(saveQuery, [commentId, aiResponse.text, aiResponse.confidence]);

    return res.status(200).json({
      success: true,
      response: aiResponse.text,
      confidence: aiResponse.confidence,
      suggestionId: saveResult.rows[0].id
    });

  } catch (error) {
    console.error('AI response error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Send reply to social media comment
async function handleSendReply(req, res) {
  const { commentId, replyText, platform, postId } = body;

  try {
    const { pool } = require('../config/database');

    // Get comment details
    const commentQuery = `
      SELECT c.*, p.platform_type, p.access_token 
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE c.id = $1
    `;
    const commentResult = await pool.query(commentQuery, [commentId]);

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = commentResult.rows[0];

    // Send reply via appropriate platform API
    let replyResult;
    switch (comment.platform_type) {
      case 'facebook':
        replyResult = await sendFacebookReply(comment.external_comment_id, replyText, comment.access_token);
        break;
      case 'instagram':
        replyResult = await sendInstagramReply(comment.external_comment_id, replyText, comment.access_token);
        break;
      case 'tiktok':
        replyResult = await sendTikTokReply(comment.external_comment_id, replyText, comment.access_token);
        break;
      default:
        throw new Error(`Unsupported platform: ${comment.platform_type}`);
    }

    // Update comment status and save reply
    await pool.query(`UPDATE social_comments SET status = 'replied', updated_at = NOW() WHERE id = $1`, [commentId]);

    // Log activity
    await pool.query(`
      INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
      VALUES ($1, 'manual_reply', $2, NOW())
    `, [commentId, JSON.stringify({ replyText, replyId: replyResult.id })]);

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      replyId: replyResult.id
    });

  } catch (error) {
    console.error('Send reply error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Handle incoming comment webhooks
async function handleCommentWebhook(req, res) {
  const { platform, data } = body;

  try {
    const { pool } = require('../config/database');

    // Process webhook based on platform
    let commentData;
    switch (platform) {
      case 'facebook':
        commentData = await processFacebookWebhook(data);
        break;
      case 'instagram':
        commentData = await processInstagramWebhook(data);
        break;
      case 'tiktok':
        commentData = await processTikTokWebhook(data);
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!commentData) {
      return res.status(200).json({ success: true, message: 'No action needed' });
    }

    // Save comment to database
    const commentQuery = `
      INSERT INTO social_comments (
        platform_id, external_comment_id, external_post_id, 
        comment_text, author_name, author_handle, author_id,
        post_title, post_url, status, created_at, updated_at
      ) VALUES (
        (SELECT id FROM social_platforms WHERE platform_type = $1 LIMIT 1),
        $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW()
      ) RETURNING id
    `;

    const result = await pool.query(commentQuery, [
      platform,
      commentData.commentId,
      commentData.postId,
      commentData.text,
      commentData.authorName,
      commentData.authorHandle,
      commentData.authorId,
      commentData.postTitle,
      commentData.postUrl
    ]);

    const newCommentId = result.rows[0].id;

    // Check if AI auto-reply is enabled
    const aiConfigQuery = `SELECT * FROM ai_config WHERE user_id = $1 AND enabled = true AND auto_reply = true`;
    const aiConfig = await pool.query(aiConfigQuery, ['default_user']);

    if (aiConfig.rows.length > 0) {
      // Schedule AI response
      setTimeout(async () => {
        try {
          await processAutoReply(newCommentId, commentData, aiConfig.rows[0]);
        } catch (error) {
          console.error('Auto-reply error:', error);
        }
      }, aiConfig.rows[0].response_delay * 1000);
    }

    // Log activity
    await pool.query(`
      INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
      VALUES ($1, 'comment_received', $2, NOW())
    `, [newCommentId, JSON.stringify(commentData)]);

    return res.status(200).json({
      success: true,
      message: 'Comment processed successfully',
      commentId: newCommentId
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// AI Response Generation using Llama
async function generateAIResponse(commentText, postContext, config) {
  try {
    // For now, return a mock response - in production, integrate with actual Llama model
    const mockResponses = [
      "Thank you for your comment! We appreciate your feedback.",
      "Great question! Let me help you with that.",
      "Thanks for your interest in our products!",
      "We're glad you like it! Feel free to reach out if you have any questions.",
      "Thank you for sharing your thoughts with us!"
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      text: randomResponse,
      confidence: 0.85
    };

  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

// Platform-specific reply functions
async function sendFacebookReply(commentId, replyText, accessToken) {
  // Implementation for Facebook Graph API reply
  const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: replyText
    })
  });

  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.statusText}`);
  }

  return await response.json();
}

async function sendInstagramReply(commentId, replyText, accessToken) {
  // Implementation for Instagram Graph API reply
  const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/replies`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: replyText
    })
  });

  if (!response.ok) {
    throw new Error(`Instagram API error: ${response.statusText}`);
  }

  return await response.json();
}

async function sendTikTokReply(commentId, replyText, accessToken) {
  // Implementation for TikTok API reply - placeholder
  return { id: `tiktok_reply_${Date.now()}` };
}

// Process auto-reply with AI
async function processAutoReply(commentId, commentData, aiConfig) {
  try {
    const aiResponse = await generateAIResponse(commentData.text, commentData.postTitle, aiConfig);
    
    // Send the AI-generated reply
    await handleSendReply({}, {
      json: (data) => console.log('Auto-reply sent:', data)
    }, {
      commentId,
      replyText: aiResponse.text,
      platform: commentData.platform
    });

  } catch (error) {
    console.error('Auto-reply processing error:', error);
  }
}

// Webhook processors for different platforms
async function processFacebookWebhook(data) {
  // Process Facebook webhook data
  if (data.entry && data.entry[0] && data.entry[0].changes) {
    const change = data.entry[0].changes[0];
    if (change.field === 'feed' && change.value.item === 'comment') {
      return {
        commentId: change.value.comment_id,
        postId: change.value.post_id,
        text: change.value.message,
        authorName: change.value.from.name,
        authorHandle: `@${change.value.from.id}`,
        authorId: change.value.from.id,
        postTitle: 'Facebook Post',
        postUrl: `https://facebook.com/${change.value.post_id}`
      };
    }
  }
  return null;
}

async function processInstagramWebhook(data) {
  // Process Instagram webhook data
  if (data.entry && data.entry[0] && data.entry[0].changes) {
    const change = data.entry[0].changes[0];
    if (change.field === 'comments') {
      return {
        commentId: change.value.id,
        postId: change.value.media.id,
        text: change.value.text,
        authorName: change.value.from.username,
        authorHandle: `@${change.value.from.username}`,
        authorId: change.value.from.id,
        postTitle: 'Instagram Post',
        postUrl: `https://instagram.com/p/${change.value.media.id}`
      };
    }
  }
  return null;
}

async function processTikTokWebhook(data) {
  // Process TikTok webhook data - placeholder
  return null;
}
