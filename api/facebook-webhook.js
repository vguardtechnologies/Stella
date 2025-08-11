// Facebook Webhook Handler for Real-time Comments and Messages
// Handles incoming webhook notifications from Facebook Graph API

const crypto = require('crypto');
const Database = require('../config/database');
const { pool } = require('../config/database');

// Facebook App Secret for webhook verification
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'your_app_secret_here';
const WEBHOOK_VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'stella_webhook_2025';

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;

  try {
    if (method === 'GET') {
      return handleWebhookVerification(req, res);
    }

    if (method === 'POST') {
      return handleWebhookPayload(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Facebook Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle Facebook webhook verification (GET request)
function handleWebhookVerification(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification request:', { mode, token: token ? '✓' : '✗' });

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook verification successful');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    return res.status(403).json({ error: 'Verification failed' });
  }
}

// Handle Facebook webhook payload (POST request)
async function handleWebhookPayload(req, res) {
  // Skip signature verification in development/testing
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Verify webhook signature (skip in development)
  if (!isDevelopment) {
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyWebhookSignature(req.body, signature)) {
      console.log('❌ Webhook signature verification failed');
      return res.status(403).json({ error: 'Invalid signature' });
    }
  } else {
    console.log('⚠️ Development mode: Skipping signature verification');
  }

  console.log('📨 Webhook payload received:', JSON.stringify(req.body, null, 2));

  try {
    const { object, entry } = req.body;

    if (object === 'page') {
      // Handle page events (comments, posts, etc.)
      for (const pageEntry of entry) {
        await processPageEntry(pageEntry);
      }
    } else if (object === 'instagram') {
      // Handle Instagram events (comments, mentions, etc.)
      for (const instagramEntry of entry) {
        await processInstagramEntry(instagramEntry);
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook payload:', error);
    return res.status(500).json({ error: 'Processing failed' });
  }
}

// Process Facebook page entry
async function processPageEntry(pageEntry) {
  const { id: pageId, changes } = pageEntry;

  console.log(`📘 Processing page entry for page: ${pageId}`);

  for (const change of changes) {
    const { field, value } = change;

    switch (field) {
      case 'feed':
        if (value.item === 'comment') {
          await handleCommentEvent(pageId, value, 'facebook');
        } else if (value.item === 'post') {
          await handlePostEvent(pageId, value, 'facebook');
        }
        break;

      case 'conversations':
        if (value.thread_key) {
          await handleMessageEvent(pageId, value, 'facebook');
        }
        break;

      case 'messages':
        await handleMessageEvent(pageId, value, 'facebook');
        break;

      default:
        console.log(`🔄 Unhandled field: ${field}`);
    }
  }
}

// Process Instagram entry
async function processInstagramEntry(instagramEntry) {
  const { id: instagramId, changes } = instagramEntry;

  console.log(`📷 Processing Instagram entry for account: ${instagramId}`);

  for (const change of changes) {
    const { field, value } = change;

    switch (field) {
      case 'comments':
        await handleCommentEvent(instagramId, value, 'instagram');
        break;

      case 'mentions':
        await handleMentionEvent(instagramId, value, 'instagram');
        break;

      default:
        console.log(`🔄 Unhandled Instagram field: ${field}`);
    }
  }
}

// Handle comment events
async function handleCommentEvent(platformId, commentData, platform) {
  try {
    console.log(`💬 New ${platform} comment:`, commentData);

    const {
      comment_id,
      parent_id,
      message,
      from,
      post_id,
      created_time
    } = commentData;

    // Check if comment already exists
    const existingComment = await pool.query(
      'SELECT id FROM social_comments WHERE external_id = $1',
      [comment_id]
    );

    if (existingComment.rows.length > 0) {
      console.log('⏭️ Comment already processed');
      return;
    }

    // Get platform record
    const platformRecord = await pool.query(
      'SELECT id FROM social_platforms WHERE platform_type = $1 AND connected = true LIMIT 1',
      [platform]
    );

    if (platformRecord.rows.length === 0) {
      console.log(`❌ No connected ${platform} platform found`);
      return;
    }

    // Insert new comment
    const insertQuery = `
      INSERT INTO social_comments (
        platform_id,
        external_id,
        parent_id,
        post_id,
        author_name,
        author_id,
        message,
        status,
        created_at,
        platform_created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      platformRecord.rows[0].id,
      comment_id,
      parent_id || null,
      post_id,
      from?.name || 'Unknown',
      from?.id || null,
      message,
      'pending',
      created_time ? new Date(created_time * 1000) : new Date()
    ]);

    console.log(`✅ Comment stored with ID: ${result.rows[0].id}`);

    // Check if auto-reply is enabled
    await checkAutoReply(result.rows[0].id, commentData, platform);

  } catch (error) {
    console.error('Error handling comment event:', error);
  }
}

// Handle post events
async function handlePostEvent(platformId, postData, platform) {
  try {
    console.log(`📝 New ${platform} post:`, postData);

    const {
      post_id,
      message,
      from,
      created_time
    } = postData;

    // Store post information for context in comments
    // This can be used to provide better AI responses based on post content
    
    console.log(`✅ Post event processed: ${post_id}`);

  } catch (error) {
    console.error('Error handling post event:', error);
  }
}

// Handle message events
async function handleMessageEvent(platformId, messageData, platform) {
  try {
    console.log(`📨 New ${platform} message:`, messageData);

    const {
      sender,
      recipient,
      timestamp,
      message
    } = messageData;

    // For future implementation: Store direct messages
    // This could integrate with existing WhatsApp message system
    
    console.log(`✅ Message event processed`);

  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

// Handle Instagram mention events
async function handleMentionEvent(instagramId, mentionData, platform) {
  try {
    console.log(`🏷️ New ${platform} mention:`, mentionData);

    // Handle Instagram mentions as comments for AI processing
    await handleCommentEvent(instagramId, {
      comment_id: mentionData.media_id + '_mention_' + Date.now(),
      message: mentionData.text || `Mentioned in ${mentionData.media_type}`,
      from: mentionData.from,
      post_id: mentionData.media_id,
      created_time: mentionData.created_time
    }, platform);

  } catch (error) {
    console.error('Error handling mention event:', error);
  }
}

// Check if auto-reply should be triggered
async function checkAutoReply(commentId, commentData, platform) {
  try {
    // Get AI configuration
    const aiConfig = await pool.query(
      'SELECT * FROM ai_config WHERE user_id = $1 LIMIT 1',
      ['default_user']
    );

    if (aiConfig.rows.length === 0 || !aiConfig.rows[0].enabled || !aiConfig.rows[0].auto_reply) {
      console.log('⏭️ Auto-reply disabled');
      return;
    }

    const config = aiConfig.rows[0];

    // Apply response delay
    setTimeout(async () => {
      try {
        await processAutoReply(commentId, commentData, platform, config);
      } catch (error) {
        console.error('Auto-reply processing error:', error);
      }
    }, config.response_delay * 1000);

  } catch (error) {
    console.error('Error checking auto-reply:', error);
  }
}

// Process auto-reply with AI
async function processAutoReply(commentId, commentData, platform, aiConfig) {
  try {
    console.log(`🤖 Generating AI response for comment: ${commentId}`);

    // Generate AI response using the configured model and personality
    const aiResponse = await generateAIResponse(
      commentData.message,
      commentData.post_id,
      aiConfig
    );

    if (aiResponse) {
      // Send reply via Facebook/Instagram API
      await sendPlatformReply(
        commentData.comment_id,
        aiResponse,
        platform
      );

      // Update comment status
      await pool.query(
        'UPDATE social_comments SET status = $1, ai_response = $2, responded_at = NOW() WHERE id = $3',
        ['responded', aiResponse, commentId]
      );

      console.log('✅ Auto-reply sent successfully');
    }

  } catch (error) {
    console.error('Error processing auto-reply:', error);
  }
}

// Generate AI response (placeholder - integrate with your AI service)
async function generateAIResponse(commentText, postId, aiConfig) {
  // This would integrate with your AI service (OpenAI, local LLM, etc.)
  // For now, return a simple response based on personality prompt
  
  const responses = [
    "Thank you for your comment! We appreciate your feedback.",
    "Thanks for engaging with our content! How can we help you further?",
    "We're glad you're interested! Feel free to reach out if you have questions.",
    "Your feedback is valuable to us. Thank you for taking the time to comment!",
    "Thanks for being part of our community! We love hearing from you."
  ];

  // Simple keyword-based responses (replace with actual AI integration)
  if (commentText.toLowerCase().includes('question')) {
    return "Thanks for your question! We'll get back to you soon with an answer.";
  }
  
  if (commentText.toLowerCase().includes('help')) {
    return "We're here to help! Please let us know how we can assist you.";
  }

  // Return random response for now
  return responses[Math.floor(Math.random() * responses.length)];
}

// Send reply via platform API
async function sendPlatformReply(commentId, replyText, platform) {
  // This would integrate with Facebook/Instagram Graph API
  // Using the stored access token for the platform
  
  console.log(`📤 Sending ${platform} reply to comment ${commentId}: ${replyText}`);
  
  // For now, just log the reply - implement actual API call
  return { success: true, reply_id: `reply_${Date.now()}` };
}

// Verify webhook signature
function verifyWebhookSignature(payload, signature) {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', FACEBOOK_APP_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  const signatureHash = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(signatureHash, 'hex')
  );
}
