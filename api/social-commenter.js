// Social Media Comment Management API
// Handles comment monitoring, AI responses, and cross-platform integration

const { pool } = require('../config/database');
const fetch = require('node-fetch');

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
        } else if (query.action === 'post-comments') {
          return handleGetPostComments(req, res);
        } else if (query.action === 'comment-replies') {
          return handleGetCommentReplies(req, res);
        } else if (query.action === 'webhook') {
          // Handle Facebook webhook verification
          return handleCommentWebhook(req, res);
        } else if (req.query['hub.mode']) {
          // Facebook webhook verification (no action parameter)
          return handleCommentWebhook(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'POST':
        if (query.action === 'ai-respond') {
          return handleAIResponse(req, res);
        } else if (query.action === 'send-reply') {
          return handleSendReply(req, res);
        } else if (query.action === 'edit-reply') {
          return handleEditReply(req, res);
        } else if (query.action === 'update-ai-config') {
          return handleUpdateAIConfig(req, res);
        } else if (query.action === 'connect-platform') {
          return handleConnectPlatform(req, res);
        } else if (query.action === 'webhook') {
          return handleCommentWebhook(req, res);
        } else if (query.action === 'bulk-ai-respond') {
          return handleBulkAIResponse(req, res);
        } else if (query.action === 'bulk-send-replies') {
          return handleBulkSendReplies(req, res);
        } else if (query.action === 'get-platform-data') {
          return res.json({ platform: 'facebook' });
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'PUT':
        if (query.action === 'mark-handled') {
          return handleMarkHandled(req, res);
        } else if (query.action === 'hide-comment') {
          return handleHideComment(req, res);
        } else {
          return res.status(400).json({ error: 'Invalid action' });
        }

      case 'DELETE':
        if (query.action === 'disconnect-platform') {
          return handleDisconnectPlatform(req, res);
        } else if (query.action === 'delete-comment') {
          return handleDeleteComment(req, res);
        } else if (query.action === 'delete-facebook-comment') {
          return handleDeleteFacebookComment(req, res);
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
  const { 
    platform, 
    status, 
    limit = 50, 
    offset = 0, 
    include_page_replies = 'false' // New parameter to control page reply inclusion
  } = req.query;

  try {
    // Query comments from database
    let query = `
      SELECT 
        c.id,
        c.external_comment_id,
        c.external_post_id as post_id,
        c.comment_text,
        c.author_name,
        c.author_handle,
        c.author_id,
        c.author_avatar_url,
        c.post_title,
        c.post_url,
        c.post_media_url,
        c.status,
        c.sentiment,
        c.priority,
        c.tags,
        c.created_at,
        c.updated_at,
        c.is_deleted,
        c.is_edited,
        c.deleted_at,
        c.last_edited_at,
        c.edit_count,
        c.original_text,
        p.platform_type as platform,
        p.name as platform_name, 
        p.icon as platform_icon,
        CASE 
          WHEN c.author_id = '113981868340389' OR c.author_name = 'SUSA' 
          THEN true 
          ELSE false 
        END as is_page_reply
      FROM social_comments c 
      JOIN social_platforms p ON c.platform_id = p.id 
    `;
    let params = [];

    // Add WHERE clause conditionally
    let whereConditions = [];
    
    if (status) {
      whereConditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    if (platform) {
      whereConditions.push(`p.platform_type = $${params.length + 1}`);
      params.push(platform);
    }

    // Filter out page replies by default (unless explicitly requested)
    if (include_page_replies !== 'true') {
      whereConditions.push(`NOT (c.author_id = '113981868340389' OR c.author_name = 'SUSA')`);
    }

    // Filter out hidden comments by default (unless specifically requesting hidden status)
    if (status !== 'hidden') {
      whereConditions.push(`c.status != 'hidden'`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    console.log(`🔍 Fetching comments (include_page_replies: ${include_page_replies})`);
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
    
    const result = await pool.query(query, ['default_user']);

    const defaultConfig = {
      enabled: false,
      model: 'llama-3.2-1b-q4',
      auto_reply: false,
      response_delay: 30,
      personality_prompt: 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.'
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

// Get all comments for a specific post
async function handleGetPostComments(req, res) {
  const { post_id, platform } = req.query;

  if (!post_id) {
    return res.status(400).json({
      success: false,
      error: 'post_id is required'
    });
  }

  try {
    let query = `
      SELECT 
        c.id,
        c.external_comment_id,
        c.comment_text,
        c.author_name,
        c.author_handle,
        c.author_id,
        c.created_at,
        c.status,
        c.sentiment,
        c.priority,
        c.tags,
        p.platform_type,
        p.name as platform_name,
        p.icon as platform_icon,
        c.post_title,
        c.post_url,
        c.post_media_url,
        c.is_deleted,
        c.is_edited,
        c.deleted_at,
        c.last_edited_at,
        c.edit_count,
        c.original_text
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE c.external_post_id = $1
    `;

    const params = [post_id];

    // Add platform filter if specified
    if (platform) {
      query += ` AND p.platform_type = $2`;
      params.push(platform);
    }

    query += ` ORDER BY c.created_at ASC`;

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      comments: result.rows
    });

  } catch (error) {
    console.error('Get post comments error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get existing page replies for comments
async function handleGetCommentReplies(req, res) {
  const { comment_ids } = req.query;

  if (!comment_ids) {
    return res.status(400).json({ error: 'comment_ids parameter is required' });
  }

  try {
    // Parse comment IDs (can be comma-separated string or array)
    const commentIdArray = Array.isArray(comment_ids) ? comment_ids : comment_ids.split(',');
    
    console.log('🔍 Fetching page replies for comments:', commentIdArray);

    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);

    if (tokenResult.rows.length === 0) {
      return res.status(500).json({ error: 'No Facebook access token found' });
    }

    const accessToken = tokenResult.rows[0].access_token;
    const repliesByComment = {};

    // Fetch replies for each comment from Facebook API
    for (const commentId of commentIdArray) {
      try {
        // Get comment details from database first
        const commentResult = await pool.query(`
          SELECT external_comment_id, author_name, comment_text
          FROM social_comments 
          WHERE id = $1
        `, [commentId]);

        if (commentResult.rows.length === 0) {
          console.log(`Comment ${commentId} not found in database`);
          continue;
        }

        const comment = commentResult.rows[0];
        
        // Extract actual comment ID for Facebook API
        const actualCommentId = comment.external_comment_id.includes('_') ? 
          comment.external_comment_id.split('_')[1] : 
          comment.external_comment_id;

        // Skip invalid Facebook comment IDs
        if (!actualCommentId || actualCommentId === 'comment' || actualCommentId.length < 10) {
          console.log(`⚠️ Skipping comment ${commentId} - invalid FB ID: ${actualCommentId}`);
          repliesByComment[commentId] = [];
          continue;
        }

        console.log(`Fetching replies for comment ${commentId} (FB ID: ${actualCommentId})`);

        // Fetch replies from Facebook
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}/comments?access_token=${accessToken}&fields=id,message,from{name,id},created_time&limit=50`);
        const data = await response.json();

        if (data.error) {
          console.error(`Error fetching replies for comment ${commentId}:`, data.error.message);
          repliesByComment[commentId] = [];
        } else {
          // Filter only page replies (from SUSA page)
          const pageReplies = (data.data || []).filter(reply => 
            reply.from?.name === 'SUSA' || reply.from?.id === '113981868340389'
          );

          repliesByComment[commentId] = pageReplies.map(reply => ({
            id: reply.id,
            message: reply.message,
            from: reply.from,
            created_time: reply.created_time,
            formatted_time: new Date(reply.created_time).toLocaleString()
          }));

          console.log(`Found ${pageReplies.length} page replies for comment ${commentId}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing comment ${commentId}:`, error.message);
        repliesByComment[commentId] = [];
      }
    }

    console.log('✅ Page replies fetched successfully');

    return res.status(200).json({
      success: true,
      replies: repliesByComment
    });

  } catch (error) {
    console.error('Get comment replies error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Update AI configuration
async function handleUpdateAIConfig(req, res) {
  const { config } = req.body;

  try {
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
  const { commentId, commentText, postContext } = req.body;

  try {
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
  const { commentId, replyText, platform, postId } = req.body;

  try {
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

// Edit existing reply to social media comment
async function handleEditReply(req, res) {
  const { replyId, newMessage } = req.body;

  try {
    // First, get the reply details from activity log to find the platform
    const activityQuery = `
      SELECT sa.*, sc.external_comment_id, sp.platform_type, sp.access_token, sc.id as comment_id
      FROM social_activity sa
      JOIN social_comments sc ON sa.comment_id = sc.id
      JOIN social_platforms sp ON sc.platform_id = sp.id
      WHERE sa.action_type IN ('manual_reply', 'ai_response') 
      AND sa.action_data::json->>'replyId' = $1
      ORDER BY sa.created_at DESC
      LIMIT 1
    `;
    const activityResult = await pool.query(activityQuery, [replyId]);

    if (activityResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const activity = activityResult.rows[0];

    // Edit reply via appropriate platform API
    let editResult;
    switch (activity.platform_type) {
      case 'facebook':
        editResult = await editFacebookReply(replyId, newMessage, activity.access_token);
        break;
      case 'instagram':
        editResult = await editInstagramReply(replyId, newMessage, activity.access_token);
        break;
      case 'tiktok':
        editResult = await editTikTokReply(replyId, newMessage, activity.access_token);
        break;
      default:
        throw new Error(`Unsupported platform: ${activity.platform_type}`);
    }

    // Log the edit activity
    const actionData = typeof activity.action_data === 'string' ? JSON.parse(activity.action_data) : activity.action_data;
    await pool.query(`
      INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
      VALUES ($1, 'edit_reply', $2, NOW())
    `, [activity.comment_id, JSON.stringify({ replyId, oldMessage: actionData.replyText || '', newMessage })]);

    return res.status(200).json({
      success: true,
      message: 'Reply edited successfully',
      replyId: replyId
    });

  } catch (error) {
    console.error('Edit reply error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Handle incoming comment webhooks
async function handleCommentWebhook(req, res) {
  try {
    console.log('🔔 Incoming webhook data:', JSON.stringify(req.body, null, 2));
    
    // Handle Facebook webhook verification
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      
      console.log('🔍 Facebook webhook verification:', { mode, token });
      
      // Replace 'your_verify_token' with your actual verify token
      if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN || token === 'stella_webhook_verify') {
        console.log('✅ Facebook webhook verified!');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Facebook webhook verification failed');
        return res.status(403).send('Forbidden');
      }
    }

    // Handle POST webhook data
    const webhookData = req.body;
    let commentData = null;

    // Detect platform from webhook structure
    if (webhookData.entry && webhookData.entry[0]) {
      const entry = webhookData.entry[0];
      
      // Check if it's a changes-based webhook (Facebook/Instagram)
      if (entry.changes && entry.changes[0]) {
        const change = entry.changes[0];
        
        // Instagram webhook - field is 'comments' or 'mentions'
        if (change.field === 'comments' || change.field === 'mentions') {
          console.log('📷 Processing Instagram webhook...');
          commentData = await processInstagramWebhook(webhookData);
        }
        // Facebook webhook - field is 'feed'
        else if (change.field === 'feed') {
          console.log('📘 Processing Facebook webhook...');
          commentData = await processFacebookWebhook(webhookData);
        }
        else {
          console.log(`⚠️ Unknown webhook field: ${change.field}`);
        }
      }
      // Instagram messaging webhooks (different structure)
      else if (entry.messaging) {
        console.log('📷 Processing Instagram messaging webhook...');
        commentData = await processInstagramWebhook(webhookData);
      }
    }

    if (!commentData) {
      console.log('⚠️ No actionable comment data found');
      return res.status(200).json({ success: true, message: 'No action needed' });
    }

    console.log('💾 Processing comment action:', commentData.action || 'add');
    console.log('🔍 DEBUG: Full commentData object:', JSON.stringify(commentData, null, 2));
    console.log('🔍 DEBUG: About to check action conditions...');
    console.log('🔍 COMPREHENSIVE DEBUG: action value inspection');
    console.log('  🔍 Raw action:', JSON.stringify(commentData.action));
    console.log('  🔍 Action type:', typeof commentData.action);
    console.log('  🔍 Action length:', commentData.action ? commentData.action.length : 'null/undefined');
    console.log('  🔍 Action === "hide"?', commentData.action === 'hide');
    console.log('  🔍 Action === "remove"?', commentData.action === 'remove');
    console.log('  🔍 Action === "edit"?', commentData.action === 'edit');
    console.log('  🔍 Action === "edited"?', commentData.action === 'edited');

    // Handle different comment actions and get the comment ID
    let commentId;
    if (commentData.action === 'remove') {
      console.log('🗑️ Taking REMOVE path - action matched "remove"');
      // Comment was deleted
      commentId = await handleCommentDeletion(commentData);
    } else if (commentData.action === 'edit' || commentData.action === 'edited') {
      console.log('✏️ Taking EDIT path - action matched "edit" or "edited"'); 
      // Comment was edited  
      commentId = await handleCommentEdit(commentData);
    } else if (commentData.action === 'hide' || (typeof commentData.action === 'string' && commentData.action.trim().toLowerCase() === 'hide')) {
      console.log('🙈 Taking HIDE path - this should work! Action matched "hide"');
      console.log('🙈 HIDE action detected - comment will be marked as hidden, not creating new database entry');
      // Comment was hidden - just log this, don't create new comment
      console.log(`🙈 Comment ${commentData.commentId} was hidden`);
      console.log('🙈 Returning success for hide action - no database insertion');
      return res.status(200).json({ success: true, message: 'Comment hide action logged successfully' });
    } else {
      console.log('➡️ Taking DEFAULT path (handleNewComment) - no action conditions matched');
      console.log(`🔍 DEBUG: action is "${commentData.action}" (type: ${typeof commentData.action})`);
      console.log(`🔍 DEBUG: action === 'hide'?`, commentData.action === 'hide');
      console.log(`🔍 DEBUG: This means hide condition failed - why?`); 
      // New comment (default: 'add')
      commentId = await handleNewComment(commentData);
    }

    // Only proceed with AI auto-reply for new comments
    if (commentData.action !== 'remove' && commentId) {
      // Check if AI auto-reply is enabled
      const aiConfigQuery = `SELECT * FROM ai_config WHERE user_id = $1 AND enabled = true AND auto_reply = true`;
      const aiConfig = await pool.query(aiConfigQuery, ['default_user']);

      if (aiConfig.rows.length > 0) {
        console.log('🤖 AI auto-reply is enabled, scheduling response...');
        // Schedule AI response
        setTimeout(async () => {
          try {
            await processAutoReply(commentId, commentData, aiConfig.rows[0]);
          } catch (error) {
            console.error('Auto-reply error:', error);
          }
        }, aiConfig.rows[0].response_delay * 1000);
      }
    }

    // WEBHOOK POST SCANNING: DISABLED to prevent overwriting webhook author names
    // Webhooks provide the most accurate and timely data, especially for author names
    // Post scanning can overwrite good webhook data with "Facebook User" due to API permission limits
    
    // If you need to manually scan posts, use the scan endpoint directly
    // await scanAndSyncPostComments(commentData.postId, commentData.platform);

    // Log activity for all actions
    if (commentId && commentData.action !== 'remove') {
      await logCommentActivity(commentId, 
        commentData.action === 'edit' ? 'comment_edited' : 'comment_received', 
        commentData
      );
    }

    console.log('Webhook processed successfully!');
    console.log('Final commentId value:', commentId);
    return res.status(200).json({
      success: true,
      message: 'Comment processed successfully',
      commentId: commentId
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    console.error('❌ Error details:', error.stack);
    return res.status(500).json({ error: error.message });
  }
}

// Mark comment as handled
async function handleMarkHandled(req, res) {
  const { commentId } = req.body;

  try {
    await pool.query(`
      UPDATE social_comments 
      SET status = 'handled', updated_at = NOW() 
      WHERE id = $1
    `, [commentId]);

    return res.status(200).json({
      success: true,
      message: 'Comment marked as handled'
    });

  } catch (error) {
    console.error('Mark handled error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Connect platform (placeholder)
async function handleConnectPlatform(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Platform connection handled via main Facebook integration'
  });
}

// Disconnect platform (placeholder)
async function handleDisconnectPlatform(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Platform disconnection handled'
  });
}

// Handle manual comment deletion from frontend
async function handleDeleteComment(req, res) {
  console.log(`🚀 DELETE FUNCTION CALLED - Comment ID: ${req.query.commentId}`);
  try {
    const { commentId } = req.query;
    console.log(`📋 Starting deletion process for comment ID: ${commentId}`);
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID is required'
      });
    }
    
    // Find the comment first to get its details for logging
    const findQuery = `
      SELECT id, external_comment_id, author_name, comment_text 
      FROM social_comments 
      WHERE id = $1
    `;
    
    const findResult = await pool.query(findQuery, [commentId]);
    
    if (findResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    const comment = findResult.rows[0];
    console.log(`✅ Comment found in database, proceeding with deletion...`);
    
    // Store comment data for potential logging after deletion (if needed)
    const commentData = {
      external_comment_id: comment.external_comment_id,
      author_name: comment.author_name,
      comment_text: comment.comment_text,
      deleted_by: 'admin',
      deletion_time: new Date().toISOString(),
      action: 'manual_removal'
    };
    
    console.log(`🔄 About to start cleanup process...`);
    
    // Delete related records first to avoid foreign key constraint violations
    console.log(`🗑️ Cleaning up related records for comment ${commentId}...`);
    
    // Delete from social_activity table first
    await pool.query('DELETE FROM social_activity WHERE comment_id = $1', [commentId]);
    
    // Delete from ai_suggestions table if exists
    await pool.query('DELETE FROM ai_suggestions WHERE comment_id = $1', [commentId]);
    
    // Delete from social_replies table if exists
    await pool.query('DELETE FROM social_replies WHERE comment_id = $1', [commentId]);
    
    // Now delete the main comment from database
    const deleteCommentQuery = `
      DELETE FROM social_comments 
      WHERE id = $1
    `;
    
    await pool.query(deleteCommentQuery, [commentId]);
    
    console.log(`✅ Comment ${commentId} deleted from database successfully`);
    
    // Now delete the comment from Facebook
    try {
      console.log(`🔄 Attempting to delete comment from Facebook (ID: ${comment.external_comment_id})...`);
      
      // Check if we have a Facebook access token (prioritize page token)
      let accessToken = null;
      let tokenType = 'unknown';
      
      if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
        accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
        tokenType = 'page';
      } else if (process.env.FACEBOOK_PERMANENT_ACCESS_TOKEN) {
        accessToken = process.env.FACEBOOK_PERMANENT_ACCESS_TOKEN;
        tokenType = 'permanent';
      } else if (process.env.FACEBOOK_ACCESS_TOKEN) {
        accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
        tokenType = 'general';
      }
      
      if (!accessToken) {
        console.log(`⚠️ No Facebook access token found - skipping Facebook deletion`);
      } else {
        console.log(`🔑 Using Facebook ${tokenType} access token: ${accessToken.substring(0, 15)}...`);
        const facebookDeleteResponse = await fetch(`https://graph.facebook.com/v18.0/${comment.external_comment_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (facebookDeleteResponse.ok) {
          const result = await facebookDeleteResponse.json();
          console.log(`✅ Comment successfully deleted from Facebook:`, result);
        } else {
          const errorData = await facebookDeleteResponse.text();
          console.log(`⚠️ Failed to delete comment from Facebook: ${errorData}`);
          console.log(`📋 Comment was deleted from database but may still exist on Facebook`);
          
          // Log more details about the error
          console.log(`🔍 Facebook deletion error details:`, {
            status: facebookDeleteResponse.status,
            statusText: facebookDeleteResponse.statusText,
            commentId: comment.external_comment_id
          });
        }
      }
    } catch (facebookError) {
      console.error(`❌ Error deleting comment from Facebook:`, facebookError.message);
      console.log(`📋 Comment was deleted from database but may still exist on Facebook`);
    }
    
    console.log(`✅ Comment ${commentId} deletion process completed`);
    
    return res.status(200).json({
      success: true,
      message: 'Comment deleted from database and Facebook',
      commentId: commentId
    });
    
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
}

// Handle hiding comments from view (soft hide)
async function handleHideComment(req, res) {
  try {
    const { commentId } = req.query;
    
    if (!commentId) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID is required'
      });
    }
    
    // Find the comment first to get its details for logging
    const findQuery = `
      SELECT id, external_comment_id, author_name, comment_text, status
      FROM social_comments 
      WHERE id = $1
    `;
    
    const findResult = await pool.query(findQuery, [commentId]);
    
    if (findResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }
    
    const comment = findResult.rows[0];
    
    // Update comment status to 'hidden'
    const updateQuery = `
      UPDATE social_comments 
      SET status = 'hidden', updated_at = NOW()
      WHERE id = $1
    `;
    
    await pool.query(updateQuery, [commentId]);
    
    // Log hide activity
    await logCommentActivity(comment.id, 'comment_hidden', {
      external_comment_id: comment.external_comment_id,
      author_name: comment.author_name,
      comment_text: comment.comment_text,
      previous_status: comment.status,
      hidden_by: 'admin',
      hidden_time: new Date().toISOString(),
      action: 'manual_hide'
    });
    
    console.log(`✅ Comment ${commentId} hidden from view`);
    
    return res.status(200).json({
      success: true,
      message: 'Comment hidden successfully',
      commentId: commentId
    });
    
  } catch (error) {
    console.error('Error hiding comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to hide comment'
    });
  }
}

// AI Response Generation using Llama
async function generateAIResponse(commentText, postContext, config) {
  try {
    // Enhanced AI prompt for better context understanding
    const systemPrompt = `${config.personality_prompt}

Context: You are responding to a social media comment on a post titled "${postContext}".
Guidelines:
- Keep responses concise and engaging
- Match the tone of the original comment
- Be helpful and professional
- Use emojis sparingly but appropriately
- Encourage further engagement when relevant`;

    const userPrompt = `Please generate a professional and friendly response to this social media comment: "${commentText}"

Consider the post context and provide a helpful, engaging response that encourages positive interaction.`;

    // For now, use enhanced smart responses based on comment analysis
    // TODO: Replace with actual Llama API call
    const response = await generateSmartResponse(commentText, postContext, systemPrompt);
    
    return {
      text: response.text,
      confidence: response.confidence
    };
  } catch (error) {
    console.error('AI response generation error:', error);
    
    // Fallback to basic responses
    const fallbackResponses = [
      "Thank you for your comment! We appreciate your feedback 😊",
      "Great to hear from you! Thanks for engaging with our content 👍",
      "We're glad you're interested! Feel free to reach out if you have any questions 🙌",
      "Thanks for sharing your thoughts! Your feedback means a lot to us ❤️"
    ];
    
    return {
      text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      confidence: 0.7
    };
  }
}

// Smart response generation based on comment sentiment and keywords
async function generateSmartResponse(commentText, postContext, systemPrompt) {
  const text = commentText.toLowerCase();
  
  // Analyze sentiment and intent
  const isQuestion = text.includes('?') || text.includes('how') || text.includes('what') || text.includes('when') || text.includes('where') || text.includes('why');
  const isPositive = text.includes('love') || text.includes('great') || text.includes('awesome') || text.includes('amazing') || text.includes('beautiful') || text.includes('perfect');
  const isNegative = text.includes('bad') || text.includes('hate') || text.includes('terrible') || text.includes('awful') || text.includes('worst');
  const wantsInfo = text.includes('info') || text.includes('details') || text.includes('more') || text.includes('tell me') || text.includes('learn');
  const wantsToBuy = text.includes('buy') || text.includes('purchase') || text.includes('price') || text.includes('cost') || text.includes('order') || text.includes('available');
  
  let response = '';
  let confidence = 0.8;
  
  if (isQuestion) {
    if (wantsToBuy) {
      response = "Great question! Please send us a DM or check our website for pricing and availability. We'd love to help you with your purchase! 🛍️";
      confidence = 0.9;
    } else if (wantsInfo) {
      response = "Thanks for your interest! We'd be happy to provide more details. Feel free to DM us or check our website for complete information! 📋";
      confidence = 0.85;
    } else {
      response = "Great question! We'd love to help you out. Please send us a DM or visit our website for more detailed information! 💬";
      confidence = 0.8;
    }
  } else if (isPositive) {
    response = "Thank you so much! Comments like yours make our day! We're thrilled you love what we do! ❤️✨";
    confidence = 0.9;
  } else if (isNegative) {
    response = "We appreciate your feedback and take all comments seriously. Please DM us so we can discuss your concerns and work to improve! 🤝";
    confidence = 0.85;
  } else if (wantsToBuy) {
    response = "Fantastic! We'd love to help you with your purchase. Please check our website or send us a DM for pricing and availability! 🛒";
    confidence = 0.9;
  } else if (wantsInfo) {
    response = "Thanks for your interest! We'd be happy to share more information. Please visit our website or send us a DM! 📞";
    confidence = 0.8;
  } else {
    // Generic positive responses
    const genericResponses = [
      "Thank you for your comment! We really appreciate you engaging with our content! 🙏",
      "Thanks for being part of our community! Your support means everything to us! 🌟",
      "We're so glad you're here! Thanks for following along with us! ✨",
      "Appreciate you taking the time to comment! Hope you're having a great day! 😊"
    ];
    response = genericResponses[Math.floor(Math.random() * genericResponses.length)];
    confidence = 0.75;
  }
  
  return { text: response, confidence };
}

// Platform-specific reply functions
async function sendFacebookReply(commentId, replyText, accessToken) {
  // Extract the actual comment ID from the full format (postId_commentId)
  const actualCommentId = commentId.includes('_') ? commentId.split('_')[1] : commentId;
  
  console.log('🔍 Facebook Reply Debug:', {
    originalCommentId: commentId,
    actualCommentId: actualCommentId,
    replyText: replyText
  });

  // Implementation for Facebook Graph API reply
  const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: replyText,
      access_token: accessToken
    })
  });

  const responseText = await response.text();
  console.log('📱 Facebook API Response:', {
    status: response.status,
    statusText: response.statusText,
    responseText: responseText
  });

  if (!response.ok) {
    throw new Error(`Facebook API error: ${response.statusText} - ${responseText}`);
  }

  return JSON.parse(responseText);
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

// Platform-specific edit functions
async function editFacebookReply(replyId, newMessage, accessToken) {
  // Facebook Graph API supports editing comments
  const response = await fetch(`https://graph.facebook.com/v18.0/${replyId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: newMessage,
      access_token: accessToken
    })
  });

  const responseText = await response.text();
  console.log('📝 Facebook Edit Response:', {
    status: response.status,
    statusText: response.statusText,
    responseText: responseText
  });

  if (!response.ok) {
    throw new Error(`Facebook API edit error: ${response.statusText} - ${responseText}`);
  }

  return JSON.parse(responseText);
}

async function editInstagramReply(replyId, newMessage, accessToken) {
  // Instagram Graph API supports editing comments
  const response = await fetch(`https://graph.facebook.com/v18.0/${replyId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: newMessage
    })
  });

  if (!response.ok) {
    throw new Error(`Instagram API edit error: ${response.statusText}`);
  }

  return await response.json();
}

async function editTikTokReply(replyId, newMessage, accessToken) {
  // Implementation for TikTok API edit - placeholder
  return { id: replyId, success: true };
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
  console.log('📘 Processing Facebook webhook data...');
  console.log('🔍 NEW VERSION WITH COMPREHENSIVE DEBUGGING ACTIVE 🔍');
  
  try {
    if (!data.entry || !data.entry[0]) {
      console.log('⚠️ No entry data found');
      return null;
    }

    const entry = data.entry[0];
    
    // Handle comment webhooks
    if (entry.changes && entry.changes[0]) {
      const change = entry.changes[0];
      console.log('📝 Facebook change detected:', change.field, change.value.item);
      
      if (change.field === 'feed' && change.value.item === 'comment') {
        const comment = change.value;
        const verb = comment.verb || 'add'; // Facebook sends: add, edit, remove, hide
        
        console.log(`📝 Facebook comment ${verb}:`, comment.comment_id);
        
        // Get post information
        let postTitle = 'Facebook Post';
        let postUrl = `https://facebook.com/${comment.post_id}`;
        
        // Try to get more detailed post info if available
        if (comment.parent_id) {
          // This is a reply to a comment, get parent comment info
          postUrl = `https://facebook.com/${comment.parent_id}`;
        }

        return {
          platform: 'facebook',
          commentId: comment.comment_id, // Use just the comment ID - will be normalized in handleNewComment
          postId: comment.post_id,
          text: comment.message || '[Comment content unavailable]', // May be empty for deleted comments
          authorName: comment.from?.name || 'Facebook User',
          authorHandle: `@${comment.from?.id || 'unknown'}`,
          authorId: comment.from?.id || 'unknown',
          postTitle: postTitle,
          postUrl: postUrl,
          createdTime: comment.created_time || new Date().toISOString(),
          action: verb, // 'add', 'edit', 'remove'
          isDeleted: verb === 'remove',
          isEdited: verb === 'edit'
        };
      }
    }
    
    console.log('⚠️ Facebook webhook: No comment data found');
    return null;
    
  } catch (error) {
    console.error('❌ Error processing Facebook webhook:', error);
    return null;
  }
}

async function processInstagramWebhook(data) {
  console.log('📷 Processing Instagram webhook data...');
  console.log('🔍 Full Instagram webhook payload:', JSON.stringify(data, null, 2));
  
  try {
    if (!data.entry || !data.entry[0]) {
      console.log('⚠️ No entry data found');
      return null;
    }

    const entry = data.entry[0];
    console.log('🔍 Entry data:', JSON.stringify(entry, null, 2));
    
    // Handle Instagram comment webhooks
    if (entry.changes && entry.changes[0]) {
      const change = entry.changes[0];
      console.log('📝 Instagram change detected:', change.field, JSON.stringify(change.value, null, 2));
      
      if (change.field === 'comments' && change.value) {
        const comment = change.value;
        
        let postTitle = 'Instagram Post';
        let postUrl = `https://instagram.com/p/${comment.media?.code || comment.media_id}`;
        
        return {
          platform: 'instagram',
          commentId: comment.id,
          postId: comment.media_id || comment.media?.id,
          text: comment.text,
          authorName: comment.from?.username || 'Instagram User',
          authorHandle: `@${comment.from?.username || 'unknown'}`,
          authorId: comment.from?.id || 'unknown',
          postTitle: postTitle,
          postUrl: postUrl,
          createdTime: comment.timestamp || new Date().toISOString()
        };
      }
    }
    
    // Handle Instagram mention webhooks
    if (entry.changes && entry.changes[0] && entry.changes[0].field === 'mentions') {
      const change = entry.changes[0];
      const mention = change.value;
      
      return {
        platform: 'instagram',
        commentId: mention.comment_id || mention.id,
        postId: mention.media_id,
        text: mention.text || `@${mention.username} mentioned you`,
        authorName: mention.username || 'Instagram User',
        authorHandle: `@${mention.username || 'unknown'}`,
        authorId: mention.user_id || 'unknown',
        postTitle: 'Instagram Mention',
        postUrl: `https://instagram.com/p/${mention.media?.code || mention.media_id}`,
        createdTime: mention.timestamp || new Date().toISOString()
      };
    }
    
    console.log('⚠️ Instagram webhook: No comment/mention data found');
    return null;
    
  } catch (error) {
    console.error('❌ Error processing Instagram webhook:', error);
    return null;
  }
}

async function processTikTokWebhook(data) {
  // Process TikTok webhook data - placeholder
  return null;
}

// Bulk AI Response Handler
async function handleBulkAIResponse(req, res) {
  try {
    const { post_id, platform, exclude_replied = true } = req.body;

    console.log(`🤖 Bulk AI Response Request - Post: ${post_id}, Platform: ${platform}`);

    // Build WHERE clause based on parameters
    let whereClause = '1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (post_id) {
      whereClause += ` AND external_post_id = $${paramIndex}`;
      queryParams.push(post_id);
      paramIndex++;
    }

    if (platform) {
      whereClause += ` AND p.name = $${paramIndex}`;
      queryParams.push(platform);
      paramIndex++;
    }

    if (exclude_replied) {
      whereClause += ' AND c.status != \'replied\'';
    }

    // Get all pending comments
    const commentsResult = await pool.query(`
      SELECT c.*, p.name as platform_name, p.icon as platform_icon 
      FROM social_comments c 
      JOIN social_platforms p ON c.platform_id = p.id 
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT 50
    `, queryParams);

    const comments = commentsResult.rows;

    if (comments.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No pending comments found',
        responses: []
      });
    }

    console.log(`📝 Generating AI responses for ${comments.length} comments...`);

    // Generate AI responses for all comments
    const bulkResponses = await Promise.all(
      comments.map(async (comment) => {
        try {
          const aiResponse = await generateAIResponse(
            comment.comment_text,
            comment.post_title || 'Social Media Post',
            {
              platform: comment.platform_name,
              authorName: comment.author_name,
              postUrl: comment.post_url
            }
          );

          return {
            comment_id: comment.id,
            author_name: comment.author_name,
            author_handle: comment.author_handle,
            comment_text: comment.comment_text,
            platform: comment.platform_name,
            post_title: comment.post_title,
            ai_response: aiResponse.text,
            confidence: aiResponse.confidence,
            sentiment: aiResponse.sentiment || 'neutral',
            created_at: comment.created_at,
            post_url: comment.post_url
          };
        } catch (error) {
          console.error(`❌ Error generating AI response for comment ${comment.id}:`, error);
          return {
            comment_id: comment.id,
            author_name: comment.author_name,
            author_handle: comment.author_handle,
            comment_text: comment.comment_text,
            platform: comment.platform_name,
            post_title: comment.post_title,
            ai_response: 'Error generating response',
            confidence: 0,
            sentiment: 'neutral',
            created_at: comment.created_at,
            error: error.message
          };
        }
      })
    );

    console.log(`✅ Generated ${bulkResponses.length} AI responses successfully`);

    res.json({
      success: true,
      message: `Generated AI responses for ${bulkResponses.length} comments`,
      responses: bulkResponses,
      total_comments: comments.length
    });

  } catch (error) {
    console.error('❌ Bulk AI response error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate bulk AI responses', 
      details: error.message 
    });
  }
}

// Bulk Send Replies Handler
async function handleBulkSendReplies(req, res) {
  try {
    const { replies } = req.body;

    if (!Array.isArray(replies) || replies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid replies array'
      });
    }

    console.log(`📤 Bulk sending ${replies.length} replies...`);

    const results = await Promise.all(
      replies.map(async (reply) => {
        try {
          const { comment_id, response_text, platform } = reply;

          // Get comment details
          const commentResult = await pool.query(
            'SELECT * FROM social_comments WHERE id = $1',
            [comment_id]
          );

          if (commentResult.rows.length === 0) {
            throw new Error(`Comment ${comment_id} not found`);
          }

          const comment = commentResult.rows[0];

          // Send the reply via the appropriate platform API
          let sentReply = null;
          if (platform === 'facebook') {
            sentReply = await sendFacebookReply(comment.external_comment_id, response_text);
          } else if (platform === 'instagram') {
            sentReply = await sendInstagramReply(comment.external_comment_id, response_text);
          } else if (platform === 'tiktok') {
            sentReply = await sendTikTokReply(comment.external_comment_id, response_text);
          } else {
            throw new Error(`Unsupported platform: ${platform}`);
          }

          // Update comment status
          await pool.query(`
            UPDATE social_comments 
            SET status = 'replied',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [comment_id]);

          // Log the activity
          await pool.query(`
            INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
            VALUES ($1, 'reply_sent', $2, CURRENT_TIMESTAMP)
          `, [comment_id, JSON.stringify({
            response: response_text,
            platform: platform,
            method: 'bulk_send'
          })]);

          return {
            comment_id,
            success: true,
            message: 'Reply sent successfully',
            platform_response: sentReply
          };

        } catch (error) {
          console.error(`❌ Error sending reply for comment ${reply.comment_id}:`, error);
          return {
            comment_id: reply.comment_id,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Bulk send completed: ${successful} successful, ${failed} failed`);

    res.json({
      success: true,
      message: `Bulk send completed: ${successful} successful, ${failed} failed`,
      results,
      summary: {
        total: replies.length,
        successful,
        failed
      }
    });

  } catch (error) {
    console.error('❌ Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk replies',
      details: error.message
    });
  }
}

// Handle new comment creation
async function handleNewComment(commentData) {
  // Normalize comment ID format - always use post_id_comment_id format
  let normalizedCommentId = commentData.commentId;
  if (!normalizedCommentId.includes('_')) {
    // If just comment ID, prepend post ID
    normalizedCommentId = `${commentData.postId}_${commentData.commentId}`;
  } else if (normalizedCommentId.split('_').length > 2) {
    // If format like "pageId_postId_commentId", extract just "postId_commentId"
    const parts = normalizedCommentId.split('_');
    if (parts.length >= 2) {
      normalizedCommentId = `${parts[parts.length - 2]}_${parts[parts.length - 1]}`;
    }
  }

  console.log(`🔧 Normalized comment ID: ${commentData.commentId} → ${normalizedCommentId}`);

  // Check if comment already exists (prevent duplicates from webhook + post scanning)
  const existingComment = await pool.query(`
    SELECT id FROM social_comments 
    WHERE external_comment_id = $1 
    AND platform_id = (SELECT id FROM social_platforms WHERE platform_type = $2 LIMIT 1)
  `, [normalizedCommentId, commentData.platform]);

  if (existingComment.rows.length > 0) {
    console.log(`⚠️ Comment ${normalizedCommentId} already exists, skipping duplicate insertion`);
    return existingComment.rows[0].id;
  }

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
    commentData.platform,
    normalizedCommentId, // Use normalized ID
    commentData.postId,
    commentData.text,
    commentData.authorName,
    commentData.authorHandle,
    commentData.authorId,
    commentData.postTitle,
    commentData.postUrl
  ]);

  const newCommentId = result.rows[0].id;
  console.log(`✅ New comment saved with ID: ${newCommentId}`);

  // NOTE: Post scanning moved to handleCommentWebhook to handle ALL webhook types consistently
  
  return newCommentId;
}

// Handle comment deletion - completely remove from database
async function handleCommentDeletion(commentData) {
  console.log(`🗑️ Comment ${commentData.commentId} was deleted - removing from database`);
  
  // Find the comment to get its ID for logging
  const findQuery = `
    SELECT id FROM social_comments 
    WHERE external_comment_id = $1
  `;
  
  const findResult = await pool.query(findQuery, [commentData.commentId]);
  
  if (findResult.rows.length > 0) {
    const commentId = findResult.rows[0].id;
    
    // Log deletion activity before removing
    await logCommentActivity(commentId, 'comment_deleted', {
      ...commentData,
      deleted_by: commentData.authorName,
      deletion_time: new Date().toISOString(),
      action: 'permanent_removal'
    });
    
    // Delete related records first to avoid foreign key constraint violations
    console.log(`🗑️ Cleaning up related records for comment ${commentId}...`);
    
    // Delete from social_activity table first
    await pool.query('DELETE FROM social_activity WHERE comment_id = $1', [commentId]);
    
    // Delete from ai_suggestions table if exists
    await pool.query('DELETE FROM ai_suggestions WHERE comment_id = $1', [commentId]);
    
    // Delete from social_replies table if exists
    await pool.query('DELETE FROM social_replies WHERE comment_id = $1', [commentId]);
    
    // Now delete the comment completely
    const deleteCommentQuery = `
      DELETE FROM social_comments 
      WHERE external_comment_id = $1
      RETURNING id
    `;
    
    const result = await pool.query(deleteCommentQuery, [commentData.commentId]);
    
    if (result.rows.length > 0) {
      console.log(`✅ Comment ${commentId} permanently removed from database`);
      return commentId;
    }
  } else {
    console.log(`⚠️ Comment ${commentData.commentId} not found for deletion`);
    return null;
  }
}

// Handle comment editing
async function handleCommentEdit(commentData) {
  console.log(`✏️ Comment ${commentData.commentId} was edited`);
  
  // Find existing comment and store original text
  const existingQuery = `
    SELECT id, comment_text, edit_count 
    FROM social_comments 
    WHERE external_comment_id = $1
  `;
  
  const existing = await pool.query(existingQuery, [commentData.commentId]);
  
  if (existing.rows.length > 0) {
    const comment = existing.rows[0];
    
    // Store original text if this is the first edit
    const originalText = comment.edit_count === 0 ? comment.comment_text : null;
    
    // Update comment with edited content
    const updateQuery = `
      UPDATE social_comments 
      SET 
        comment_text = $1,
        is_edited = TRUE,
        last_edited_at = NOW(),
        edit_count = edit_count + 1,
        updated_at = NOW()
        ${originalText ? ', original_text = $3' : ''}
      WHERE external_comment_id = $2
      RETURNING id, edit_count
    `;

    const params = [commentData.text, commentData.commentId];
    if (originalText) {
      params.push(originalText);
    }

    const result = await pool.query(updateQuery, params);
    const commentId = result.rows[0].id;
    const editCount = result.rows[0].edit_count;
    
    console.log(`✅ Comment ${commentId} updated (edit #${editCount})`);
    
    // Log edit activity
    if (commentId) {
      await logCommentActivity(commentId, 'comment_edited', {
        ...commentData,
        edit_count: editCount,
        previous_text: comment.comment_text,
        new_text: commentData.text,
        edit_time: new Date().toISOString()
      });
    }
    
    return commentId;
  } else {
    console.log(`⚠️ Comment ${commentData.commentId} not found for editing`);
    return null;
  }
}

// Helper function to log comment activities
async function logCommentActivity(commentId, actionType, data) {
  try {
    await pool.query(`
      INSERT INTO social_activity (comment_id, action_type, action_data, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [commentId, actionType, JSON.stringify(data)]);
  } catch (activityError) {
    // Fallback for legacy column name
    if (activityError.message.includes('column "action_type"')) {
      console.log('⚠️ Using legacy activity_type column');
      await pool.query(`
        INSERT INTO social_activity (comment_id, activity_type, action_data, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [commentId, actionType, JSON.stringify(data)]);
    } else {
      console.error('❌ Activity logging error:', activityError.message);
    }
  }
}



// Scan Facebook post for all comments and sync with database
async function scanAndSyncPostComments(postId, platform) {
  if (platform !== 'facebook') {
    console.log('⚠️ Post scanning only supported for Facebook currently');
    return;
  }

  // Prevent concurrent syncing of the same post
  const syncKey = `sync_${postId}`;
  if (global.activeSyncs && global.activeSyncs.has(syncKey)) {
    console.log(`⚠️ Post ${postId} sync already in progress, skipping duplicate sync`);
    return;
  }

  // Track active syncs
  if (!global.activeSyncs) {
    global.activeSyncs = new Set();
  }
  global.activeSyncs.add(syncKey);

  try {
    console.log(`🔍 Scanning Facebook post ${postId} for all comments...`);

    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);

    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook access token found for post scanning');
      return;
    }

    const accessToken = tokenResult.rows[0].access_token;

    // Fetch all comments from Facebook for this post
    let allCommentsFromFB = [];
    let nextUrl = `https://graph.facebook.com/v18.0/${postId}/comments?access_token=${accessToken}&fields=id,message,from{name,id},created_time,parent&limit=100`;

    do {
      const response = await fetch(nextUrl);
      const data = await response.json();

      if (data.error) {
        console.error('❌ Facebook API error during post scan:', data.error);
        break;
      }

      if (data.data && data.data.length > 0) {
        allCommentsFromFB = allCommentsFromFB.concat(data.data);
        console.log(`📥 Found ${data.data.length} comments, total so far: ${allCommentsFromFB.length}`);
      }

      // Check for pagination
      nextUrl = data.paging?.next || null;
      
      // Add delay to respect rate limits
      if (nextUrl) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } while (nextUrl);

    console.log(`📊 Total comments found on Facebook post: ${allCommentsFromFB.length}`);

    // Get existing comments in database for this post with their content
    const existingComments = await pool.query(`
      SELECT external_comment_id, id, comment_text, author_name
      FROM social_comments 
      WHERE external_post_id = $1 
      AND platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
    `, [postId]);

    const existingCommentIds = new Set(existingComments.rows.map(c => c.external_comment_id));
    const existingCommentMap = new Map(existingComments.rows.map(c => [c.external_comment_id, c]));
    console.log(`💾 Existing comments in database: ${existingCommentIds.size}`);

    // Track changes
    let newCommentsAdded = 0;
    let commentsUpdated = 0;
    let commentsToDelete = [];
    
    // Create a set of Facebook comment IDs to check for deletions
    const facebookCommentIds = new Set(allCommentsFromFB.map(fbComment => `${postId}_${fbComment.id}`));
    
    // Process Facebook comments - check for new and edited comments
    for (const fbComment of allCommentsFromFB) {
      const commentId = `${postId}_${fbComment.id}`;
      
      // Skip page replies (comments from our business account)
      if (fbComment.from?.id === '113981868340389' || fbComment.from?.name === 'SUSA') {
        console.log(`🚫 Skipping page reply: ${fbComment.from?.name}`);
        continue;
      }

      if (existingCommentIds.has(commentId)) {
        // Check if comment was edited
        const existingComment = existingCommentMap.get(commentId);
        const fbMessage = fbComment.message || '[Comment content unavailable]';
        const fbAuthor = fbComment.from?.name || 'Facebook User';
        
        // Only update if we have actual changes AND we have better author info
        const shouldUpdateText = existingComment.comment_text !== fbMessage;
        const shouldUpdateAuthor = existingComment.author_name !== fbAuthor && 
                                 fbAuthor !== 'Facebook User' && 
                                 existingComment.author_name === 'Facebook User';
        
        if (shouldUpdateText || shouldUpdateAuthor) {
          try {
            if (shouldUpdateText && shouldUpdateAuthor) {
              // Update both text and author
              await pool.query(`
                UPDATE social_comments 
                SET comment_text = $1, author_name = $2, updated_at = NOW()
                WHERE external_comment_id = $3
              `, [fbMessage, fbAuthor, commentId]);
              console.log(`📝 Updated comment text and author: ${fbAuthor} - "${fbMessage.substring(0, 30)}..."`);
            } else if (shouldUpdateText) {
              // Only update text, preserve existing author name
              await pool.query(`
                UPDATE social_comments 
                SET comment_text = $1, updated_at = NOW()
                WHERE external_comment_id = $2
              `, [fbMessage, commentId]);
              console.log(`📝 Updated comment text: ${existingComment.author_name} - "${fbMessage.substring(0, 30)}..."`);
            } else if (shouldUpdateAuthor) {
              // Only update author (upgrade from "Facebook User" to real name)
              await pool.query(`
                UPDATE social_comments 
                SET author_name = $1, updated_at = NOW()
                WHERE external_comment_id = $2
              `, [fbAuthor, commentId]);
              console.log(`👤 Updated author name: "${existingComment.author_name}" → "${fbAuthor}"`);
            }
            
            commentsUpdated++;
          } catch (error) {
            console.error(`❌ Error updating comment ${fbComment.id}:`, error.message);
          }
        }
      } else {
        // New comment - add to database
        try {
          const commentQuery = `
            INSERT INTO social_comments (
              platform_id, external_comment_id, external_post_id, 
              comment_text, author_name, author_handle, author_id,
              post_title, post_url, status, created_at, updated_at
            ) VALUES (
              (SELECT id FROM social_platforms WHERE platform_type = 'facebook' LIMIT 1),
              $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, NOW()
            )
          `;

          await pool.query(commentQuery, [
            commentId,
            postId,
            fbComment.message || '[Comment content unavailable]',
            fbComment.from?.name || 'Facebook User',
            `@${fbComment.from?.id || 'unknown'}`,
            fbComment.from?.id || 'unknown',
            'Facebook Post',
            `https://facebook.com/${postId}`,
            new Date(fbComment.created_time || Date.now())
          ]);

          newCommentsAdded++;
          console.log(`✅ Added new comment: ${fbComment.from?.name} - "${fbComment.message?.substring(0, 30)}..."`);

        } catch (error) {
          if (error.code === '23505') { // Duplicate key - comment already exists (webhook vs sync race condition)
            console.log(`⏭️ Skipping duplicate comment ${fbComment.id} - already exists (likely added by webhook)`);
          } else {
            console.error(`❌ Error adding comment ${fbComment.id}:`, error.message);
          }
        }
      }
    }

    // Check for deleted comments (exist in DB but not on Facebook)
    for (const existingComment of existingComments.rows) {
      if (!facebookCommentIds.has(existingComment.external_comment_id)) {
        commentsToDelete.push(existingComment);
      }
    }

    // Delete comments that no longer exist on Facebook
    for (const commentToDelete of commentsToDelete) {
      try {
        console.log(`🗑️ Deleting comment that no longer exists on Facebook: ${commentToDelete.external_comment_id}`);
        
        // Delete related records first
        await pool.query('DELETE FROM social_activity WHERE comment_id = $1', [commentToDelete.id]);
        await pool.query('DELETE FROM ai_suggestions WHERE comment_id = $1', [commentToDelete.id]);
        await pool.query('DELETE FROM social_replies WHERE comment_id = $1', [commentToDelete.id]);
        
        // Delete the comment
        await pool.query('DELETE FROM social_comments WHERE id = $1', [commentToDelete.id]);
        
        console.log(`✅ Deleted comment ${commentToDelete.id}`);
      } catch (error) {
        console.error(`❌ Error deleting comment ${commentToDelete.id}:`, error.message);
      }
    }

    console.log(`🎉 Post sync completed:`);
    console.log(`   ➕ ${newCommentsAdded} new comments added`);
    console.log(`   📝 ${commentsUpdated} comments updated`);
    console.log(`   🗑️ ${commentsToDelete.length} comments deleted`);

  } catch (error) {
    console.error('❌ Error during post scanning:', error);
  } finally {
    // Clean up sync tracking
    if (global.activeSyncs) {
      global.activeSyncs.delete(syncKey);
    }
  }
}

// POST-SCANNING FUNCTIONS REMOVED:
// handleSyncFacebookPost() and scanAndSyncPostComments() removed since 
// webhooks provide real-time updates and post-scanning conflicts with webhook data.

// Function to delete a comment directly from Facebook (for orphaned comments)
async function handleDeleteFacebookComment(req, res) {
  console.log(`🚀 FACEBOOK DELETE FUNCTION CALLED - FB Comment ID: ${req.query.fbCommentId}`);
  try {
    const { fbCommentId } = req.query;
    console.log(`📋 Starting Facebook deletion process for FB comment ID: ${fbCommentId}`);

    if (!fbCommentId) {
      return res.status(400).json({
        success: false,
        error: 'Facebook comment ID is required'
      });
    }

    // Check if we have a Facebook access token (prioritize page token)
    let accessToken = null;
    let tokenType = 'unknown';
    
    if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
      accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      tokenType = 'page';
    } else if (process.env.FACEBOOK_PERMANENT_ACCESS_TOKEN) {
      accessToken = process.env.FACEBOOK_PERMANENT_ACCESS_TOKEN;
      tokenType = 'permanent';
    } else if (process.env.FACEBOOK_ACCESS_TOKEN) {
      accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      tokenType = 'general';
    }
    
    if (!accessToken) {
      console.log(`⚠️ No Facebook access token found in environment variables`);
      return res.status(500).json({
        success: false,
        error: 'Facebook access token not configured'
      });
    }

    console.log(`🔑 Using Facebook ${tokenType} access token: ${accessToken.substring(0, 15)}...`);

    // Delete the comment from Facebook
    console.log(`🔄 Attempting to delete comment from Facebook (ID: ${fbCommentId})...`);
    
    const facebookDeleteResponse = await fetch(`https://graph.facebook.com/v18.0/${fbCommentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (facebookDeleteResponse.ok) {
      const result = await facebookDeleteResponse.json();
      console.log(`✅ Comment successfully deleted from Facebook:`, result);
      
      return res.status(200).json({
        success: true,
        message: 'Comment deleted from Facebook',
        fbCommentId: fbCommentId,
        result: result
      });
    } else {
      const errorData = await facebookDeleteResponse.text();
      console.log(`⚠️ Failed to delete comment from Facebook: ${errorData}`);
      
      // Log more details about the error
      console.log(`🔍 Facebook deletion error details:`, {
        status: facebookDeleteResponse.status,
        statusText: facebookDeleteResponse.statusText,
        commentId: fbCommentId
      });
      
      return res.status(400).json({
        success: false,
        error: 'Failed to delete comment from Facebook',
        details: errorData,
        fbCommentId: fbCommentId
      });
    }

  } catch (error) {
    console.error('Error deleting Facebook comment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
// Webhooks handle all comment lifecycle events (add/edit/remove/hide) efficiently.
