import { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from '../lib/database';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    if (req.method === 'GET') {
      // Webhook verification
      return handleWebhookVerification(req, res);
    } else if (req.method === 'POST') {
      // Webhook message handling
      return handleWebhookMessage(req, res);
    } else {
      return res.status(405).json({ 
        error: 'Method Not Allowed',
        message: 'Only GET and POST methods are allowed' 
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Webhook processing failed' 
    });
  }
}

// Handle webhook verification (GET request)
function handleWebhookVerification(req: VercelRequest, res: VercelResponse) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log('Webhook verification attempt:', { mode, token, verifyToken });

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully');
    return res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed');
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Webhook verification failed'
    });
  }
}

// Handle incoming WhatsApp messages (POST request)
async function handleWebhookMessage(req: VercelRequest, res: VercelResponse) {
  const body = req.body;

  console.log('Webhook received:', JSON.stringify(body, null, 2));

  try {
    // Validate WhatsApp webhook format
    if (body.object !== 'whatsapp_business_account') {
      console.log('Invalid webhook object:', body.object);
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid webhook object'
      });
    }

    // Process each entry
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        await processWebhookEntry(entry);
      }
    }

    // Always respond with 200 to acknowledge receipt
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    // Still return 200 to prevent WhatsApp from retrying
    return res.status(200).json({ success: false, error: (error as Error).message });
  }
}

// Process a webhook entry
async function processWebhookEntry(entry: any) {
  console.log('Processing webhook entry:', JSON.stringify(entry, null, 2));

  if (!entry.changes || !Array.isArray(entry.changes)) {
    console.log('No changes in entry');
    return;
  }

  for (const change of entry.changes) {
    if (change.field === 'messages') {
      await processMessagesChange(change.value);
    } else if (change.field === 'message_deliveries') {
      await processDeliveryStatusChange(change.value);
    }
  }
}

// Process incoming messages
async function processMessagesChange(value: any) {
  console.log('Processing messages change:', JSON.stringify(value, null, 2));

  // Process incoming messages
  if (value.messages && Array.isArray(value.messages)) {
    for (const message of value.messages) {
      await processIncomingMessage(message, value.metadata);
    }
  }

  // Process message status updates
  if (value.statuses && Array.isArray(value.statuses)) {
    for (const status of value.statuses) {
      await processMessageStatus(status);
    }
  }
}

// Process a single incoming message
async function processIncomingMessage(message: any, metadata: any) {
  try {
    console.log('Processing incoming message:', JSON.stringify(message, null, 2));

    const phoneNumberId = metadata?.phone_number_id;
    if (!phoneNumberId) {
      console.log('No phone number ID in metadata');
      return;
    }

    // Find the user/config for this phone number
    const config = await findConfigByPhoneNumberId(phoneNumberId);
    if (!config) {
      console.log('No configuration found for phone number ID:', phoneNumberId);
      return;
    }

    // Extract message details
    const fromNumber = message.from;
    const messageId = message.id;
    const timestamp = new Date(parseInt(message.timestamp) * 1000);

    let messageText = '';
    let messageType = 'text';

    // Extract message content based on type
    if (message.type === 'text' && message.text) {
      messageText = message.text.body;
      messageType = 'text';
    } else if (message.type === 'image' && message.image) {
      messageText = message.image.caption || '[Image]';
      messageType = 'image';
    } else if (message.type === 'document' && message.document) {
      messageText = message.document.caption || '[Document]';
      messageType = 'document';
    } else if (message.type === 'audio' && message.audio) {
      messageText = '[Audio Message]';
      messageType = 'audio';
    } else if (message.type === 'video' && message.video) {
      messageText = message.video.caption || '[Video]';
      messageType = 'video';
    } else {
      messageText = `[${message.type || 'Unknown'} Message]`;
      messageType = message.type || 'unknown';
    }

    // Create or get conversation
    const conversation = await Database.createOrUpdateConversation(
      config.user_id,
      fromNumber,
      message.profile?.name
    );

    // Save the message to database
    const savedMessage = await Database.createMessage({
      user_id: config.user_id,
      conversation_id: conversation.id,
      whatsapp_message_id: messageId,
      from_number: fromNumber,
      to_number: phoneNumberId,
      message_text: messageText,
      message_type: messageType as 'text' | 'image' | 'document' | 'audio' | 'video' | 'template',
      status: 'received' as 'sent' | 'delivered' | 'read' | 'failed' | 'received',
      timestamp: timestamp
    });

    console.log('Message saved to database:', savedMessage.id);

    // Send auto-reply if enabled
    if (config.auto_reply && config.auto_reply_message) {
      await sendAutoReply(config, fromNumber);
    }

  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
}

// Process message delivery status updates
async function processMessageStatus(status: any) {
  try {
    console.log('Processing message status:', JSON.stringify(status, null, 2));

    const messageId = status.id;
    const statusType = status.status; // sent, delivered, read, failed

    // Update message status in database
    // Note: We need to find the message by whatsapp_message_id
    // This would require a new database method
    console.log(`Message ${messageId} status updated to: ${statusType}`);

  } catch (error) {
    console.error('Error processing message status:', error);
  }
}

// Process delivery status changes
async function processDeliveryStatusChange(value: any) {
  console.log('Processing delivery status change:', JSON.stringify(value, null, 2));
  // Handle delivery status updates here
}

// Find WhatsApp configuration by phone number ID
async function findConfigByPhoneNumberId(phoneNumberId: string): Promise<any> {
  try {
    const config = await Database.getWhatsAppConfigByPhoneNumberId(phoneNumberId);
    return config;
  } catch (error) {
    console.error('Error finding config by phone number ID:', error);
    return null;
  }
}

// Send auto-reply message
async function sendAutoReply(config: any, toNumber: string) {
  try {
    console.log('Sending auto-reply to:', toNumber);

    const url = `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toNumber,
        type: 'text',
        text: { body: config.auto_reply_message }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Auto-reply sent successfully:', result.messages[0].id);

      // Save auto-reply to database
      const conversation = await Database.createOrUpdateConversation(config.user_id, toNumber);
      
      await Database.createMessage({
        user_id: config.user_id,
        conversation_id: conversation.id,
        whatsapp_message_id: result.messages[0].id,
        from_number: config.phone_number_id,
        to_number: toNumber,
        message_text: config.auto_reply_message,
        message_type: 'text',
        status: 'sent',
        timestamp: new Date()
      });

    } else {
      console.error('Failed to send auto-reply:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending auto-reply:', error);
  }
}
