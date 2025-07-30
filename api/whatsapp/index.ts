import { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { Database } from '../lib/database';
import { withAuth } from '../lib/auth';

// WhatsApp configuration schema
const whatsappConfigSchema = z.object({
  phoneNumberId: z.string().min(1, 'Phone Number ID is required'),
  accessToken: z.string().min(1, 'Access Token is required'),
  webhookUrl: z.string().url('Invalid webhook URL'),
  verifyToken: z.string().min(1, 'Verify Token is required'),
  businessAccountId: z.string().min(1, 'Business Account ID is required'),
  autoReply: z.boolean().default(true),
  autoReplyMessage: z.string().optional(),
  welcomeMessage: z.string().optional(),
});

// Send message schema
const sendMessageSchema = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'Message text is required'),
  type: z.enum(['text', 'template']).default('text'),
});

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// WhatsApp API service
class WhatsAppAPI {
  private accessToken: string;
  private phoneNumberId: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
  }

  async sendMessage(to: string, message: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { action } = req.query;

  // Route handlers based on action
  if (action === 'configure' && req.method === 'POST') {
    return withAuth(handleConfigure)(req, res);
  } else if (action === 'status' && req.method === 'GET') {
    return withAuth(handleStatus)(req, res);
  } else if (action === 'test-connection' && req.method === 'POST') {
    return withAuth(handleTestConnection)(req, res);
  } else if (action === 'send-message' && req.method === 'POST') {
    return withAuth(handleSendMessage)(req, res);
  } else if (action === 'messages' && req.method === 'GET') {
    return withAuth(handleGetMessages)(req, res);
  } else if (action === 'conversations' && req.method === 'GET') {
    return withAuth(handleGetConversations)(req, res);
  } else {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid action or method'
    });
  }
}

// Configure WhatsApp settings
async function handleConfigure(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const validation = whatsappConfigSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid configuration data',
        details: validation.error.issues
      });
    }

    const config = validation.data;

    // Test the configuration before saving
    const whatsappAPI = new WhatsAppAPI(config.accessToken, config.phoneNumberId);
    const isConnectionValid = await whatsappAPI.testConnection();

    if (!isConnectionValid) {
      return res.status(400).json({
        error: 'Configuration Error',
        message: 'Invalid WhatsApp API credentials. Please check your access token and phone number ID.'
      });
    }

    // Check if config exists, update or create
    const existingConfig = await Database.getWhatsAppConfigByUserId(user.id);
    
    let savedConfig;
    if (existingConfig) {
      savedConfig = await Database.updateWhatsAppConfig(user.id, {
        api_key: config.accessToken,
        phone_number_id: config.phoneNumberId,
        webhook_url: config.webhookUrl,
        verify_token: config.verifyToken,
        business_account_id: config.businessAccountId,
        is_active: true,
        auto_reply: config.autoReply,
        auto_reply_message: config.autoReplyMessage || 'Thank you for contacting us! We will get back to you shortly.',
        welcome_message: config.welcomeMessage || 'Welcome to our service! How can we help you today?',
      });
    } else {
      savedConfig = await Database.createWhatsAppConfig({
        user_id: user.id,
        api_key: config.accessToken,
        phone_number_id: config.phoneNumberId,
        webhook_url: config.webhookUrl,
        verify_token: config.verifyToken,
        business_account_id: config.businessAccountId,
        is_active: true,
        auto_reply: config.autoReply,
        auto_reply_message: config.autoReplyMessage || 'Thank you for contacting us! We will get back to you shortly.',
        welcome_message: config.welcomeMessage || 'Welcome to our service! How can we help you today?',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'WhatsApp configuration saved successfully',
      data: {
        id: savedConfig.id,
        is_active: savedConfig.is_active,
        phone_number_id: savedConfig.phone_number_id,
        webhook_url: savedConfig.webhook_url,
        auto_reply: savedConfig.auto_reply,
        updated_at: savedConfig.updated_at
      }
    });
  } catch (error) {
    console.error('Configure WhatsApp error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to configure WhatsApp settings'
    });
  }
}

// Get WhatsApp status
async function handleStatus(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const config = await Database.getWhatsAppConfigByUserId(user.id);
    
    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          configured: false,
          is_active: false,
          message: 'WhatsApp not configured'
        }
      });
    }

    // Test connection if active
    let connectionStatus = false;
    if (config.is_active && config.api_key && config.phone_number_id) {
      const whatsappAPI = new WhatsAppAPI(config.api_key, config.phone_number_id);
      connectionStatus = await whatsappAPI.testConnection();
    }

    return res.status(200).json({
      success: true,
      data: {
        configured: true,
        is_active: config.is_active,
        connection_status: connectionStatus,
        phone_number_id: config.phone_number_id,
        webhook_url: config.webhook_url,
        auto_reply: config.auto_reply,
        last_updated: config.updated_at
      }
    });
  } catch (error) {
    console.error('Get WhatsApp status error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get WhatsApp status'
    });
  }
}

// Test WhatsApp connection
async function handleTestConnection(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const config = await Database.getWhatsAppConfigByUserId(user.id);
    
    if (!config || !config.is_active) {
      return res.status(400).json({
        error: 'Configuration Error',
        message: 'WhatsApp not configured or inactive'
      });
    }

    const whatsappAPI = new WhatsAppAPI(config.api_key, config.phone_number_id);
    const isConnected = await whatsappAPI.testConnection();

    return res.status(200).json({
      success: true,
      data: {
        connected: isConnected,
        message: isConnected ? 'WhatsApp connection successful' : 'WhatsApp connection failed'
      }
    });
  } catch (error) {
    console.error('Test WhatsApp connection error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to test WhatsApp connection'
    });
  }
}

// Send WhatsApp message
async function handleSendMessage(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid message data',
        details: validation.error.issues
      });
    }

    const { to, message } = validation.data;

    // Get WhatsApp config
    const config = await Database.getWhatsAppConfigByUserId(user.id);
    if (!config || !config.is_active) {
      return res.status(400).json({
        error: 'Configuration Error',
        message: 'WhatsApp not configured or inactive'
      });
    }

    // Send message via WhatsApp API
    const whatsappAPI = new WhatsAppAPI(config.api_key, config.phone_number_id);
    const response = await whatsappAPI.sendMessage(to, message);

    // Create or get conversation
    const conversation = await Database.createOrUpdateConversation(user.id, to);

    // Save message to database
    const savedMessage = await Database.createMessage({
      user_id: user.id,
      conversation_id: conversation.id,
      whatsapp_message_id: response.messages[0].id,
      from_number: config.phone_number_id,
      to_number: to,
      message_text: message,
      message_type: 'text',
      status: 'sent',
      timestamp: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message_id: savedMessage.id,
        whatsapp_message_id: response.messages[0].id,
        status: 'sent',
        timestamp: savedMessage.timestamp
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to send message'
    });
  }
}

// Get messages for a conversation
async function handleGetMessages(req: VercelRequest, res: VercelResponse) {
  try {
    const { conversation_id } = req.query;
    
    if (!conversation_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Conversation ID is required'
      });
    }

    const messages = await Database.getMessagesByConversationId(conversation_id as string);

    return res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse() // Return in chronological order
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve messages'
    });
  }
}

// Get all conversations
async function handleGetConversations(req: VercelRequest, res: VercelResponse, user: any) {
  try {
    const conversations = await Database.getConversationsByUserId(user.id);

    return res.status(200).json({
      success: true,
      data: {
        conversations
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve conversations'
    });
  }
}
