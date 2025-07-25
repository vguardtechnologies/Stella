const express = require('express');
const axios = require('axios');
const router = express.Router();
const whatsappConfigService = require('../../services/whatsappConfigService');

// In-memory cache for quick access (refreshed from database)
let whatsappConfig = null;

// Initialize configuration from database
const initializeConfig = async () => {
  try {
    whatsappConfig = await whatsappConfigService.getConfig();
    console.log('WhatsApp configuration loaded:', {
      hasAccessToken: !!whatsappConfig.accessToken,
      hasPhoneNumberId: !!whatsappConfig.phoneNumberId,
      isConfigured: whatsappConfig.isConfigured,
      lastConfigured: whatsappConfig.lastConfigured
    });
  } catch (error) {
    console.error('Failed to initialize WhatsApp config:', error);
    // Fallback to environment variables
    whatsappConfig = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
      isConfigured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      lastConfigured: null
    };
  }
};

// Initialize on module load
initializeConfig();

// Test WhatsApp API connection
router.post('/test-connection', async (req, res) => {
  try {
    const { accessToken, phoneNumberId } = req.body;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'Access token and phone number ID are required'
      });
    }

    // Test the connection by making a simple API call to WhatsApp
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 200) {
      res.json({
        success: true,
        message: 'Successfully connected to WhatsApp Business API!',
        data: {
          phoneNumber: response.data.display_phone_number || 'Connected',
          status: response.data.status || 'active'
        }
      });
    } else {
      throw new Error('Invalid response from WhatsApp API');
    }

  } catch (error) {
    console.error('WhatsApp API test failed:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to connect to WhatsApp API';
    let statusCode = 400;
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      // Handle specific OAuth errors
      if (apiError.code === 190) {
        if (apiError.error_subcode === 463) {
          errorMessage = 'WhatsApp access token has expired. Please generate a new token from your Meta Business account.';
        } else if (apiError.message.includes("Expected 1 '.' in the input")) {
          errorMessage = 'Invalid access token format. Please check your token and try again.';
        } else {
          errorMessage = `Authentication failed: ${apiError.message}`;
        }
      } else {
        errorMessage = apiError.message || 'WhatsApp API error';
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.response?.data?.error?.message || error.message,
      errorCode: error.response?.data?.error?.code,
      errorSubcode: error.response?.data?.error?.error_subcode
    });
  }
});

// Get configuration status
router.get('/config-status', (req, res) => {
  res.json({
    success: true,
    isConfigured: whatsappConfig.isConfigured,
    hasAccessToken: !!whatsappConfig.accessToken,
    hasPhoneNumberId: !!whatsappConfig.phoneNumberId,
    phoneNumberId: whatsappConfig.phoneNumberId ? `***${whatsappConfig.phoneNumberId.slice(-4)}` : '',
    webhookUrl: whatsappConfig.webhookUrl,
    message: whatsappConfig.isConfigured ? 'WhatsApp is configured' : 'WhatsApp needs configuration',
    lastConfigured: whatsappConfig.lastConfigured || null
  });
});

// Save WhatsApp configuration
router.post('/configure', async (req, res) => {
  try {
    const { accessToken, phoneNumberId, webhookUrl } = req.body;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'Access token and phone number ID are required'
      });
    }

    // First test the connection
    try {
      const testResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (testResponse.status !== 200) {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid WhatsApp API credentials',
        error: error.response?.data?.error?.message || error.message
      });
    }

    // Save the configuration to database
    await whatsappConfigService.saveConfig({
      accessToken,
      phoneNumberId,
      webhookUrl: webhookUrl || ''
    });

    // Update in-memory cache
    whatsappConfig = {
      accessToken,
      phoneNumberId,
      webhookUrl: webhookUrl || '',
      verifyToken: whatsappConfig.verifyToken, // Keep existing verify token
      isConfigured: true,
      lastConfigured: new Date().toISOString()
    };

    console.log('WhatsApp configuration saved:', {
      phoneNumberId: whatsappConfig.phoneNumberId,
      hasAccessToken: !!whatsappConfig.accessToken,
      webhookUrl: whatsappConfig.webhookUrl,
      lastConfigured: whatsappConfig.lastConfigured
    });

    res.json({
      success: true,
      message: 'WhatsApp configuration saved successfully!',
      data: {
        phoneNumberId: whatsappConfig.phoneNumberId,
        webhookUrl: whatsappConfig.webhookUrl,
        isConfigured: whatsappConfig.isConfigured
      }
    });

  } catch (error) {
    console.error('Configuration save failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message
    });
  }
});

// Get current configuration status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      isConfigured: whatsappConfig.isConfigured,
      hasAccessToken: !!whatsappConfig.accessToken,
      hasPhoneNumberId: !!whatsappConfig.phoneNumberId,
      webhookUrl: whatsappConfig.webhookUrl,
      phoneNumberId: whatsappConfig.phoneNumberId ? 
        `***${whatsappConfig.phoneNumberId.slice(-4)}` : ''
    }
  });
});

// Send a WhatsApp message (text or multimedia)
router.post('/send-message', async (req, res) => {
  try {
    if (!whatsappConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not configured. Please configure API credentials first.'
      });
    }

    const { to, message, type = 'text', mediaUrl, fileName, caption } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number is required'
      });
    }

    let messageData = {
      messaging_product: 'whatsapp',
      to: to,
      type: type
    };

    // Handle different message types
    switch (type) {
      case 'text':
        if (!message) {
          return res.status(400).json({
            success: false,
            message: 'Message text is required for text messages'
          });
        }
        messageData.text = { body: message };
        break;

      case 'image':
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            message: 'Media URL is required for image messages'
          });
        }
        messageData.image = {
          link: mediaUrl,
          caption: caption || ''
        };
        break;

      case 'video':
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            message: 'Media URL is required for video messages'
          });
        }
        messageData.video = {
          link: mediaUrl,
          caption: caption || ''
        };
        break;

      case 'audio':
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            message: 'Media URL is required for audio messages'
          });
        }
        messageData.audio = {
          link: mediaUrl
        };
        break;

      case 'document':
        if (!mediaUrl) {
          return res.status(400).json({
            success: false,
            message: 'Media URL is required for document messages'
          });
        }
        messageData.document = {
          link: mediaUrl,
          filename: fileName || 'document',
          caption: caption || ''
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Unsupported message type. Supported types: text, image, video, audio, document'
        });
    }

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save the outgoing message to database
    const whatsappMessageService = require('../../services/whatsappMessageService');
    try {
      const saveData = {
        whatsappMessageId: response.data.messages[0].id,
        to: to,
        messageType: type,
        content: type === 'text' ? message : (caption || fileName || 'Media message'),
        mediaUrl: mediaUrl || null,
        mediaMimeType: null // Will be filled when we download the media
      };
      
      await whatsappMessageService.saveOutgoingMessage(saveData);
      console.log(`✅ Saved outgoing ${type} message ${response.data.messages[0].id} to database`);
    } catch (dbError) {
      console.error(`❌ Failed to save outgoing message to database:`, dbError);
      // Don't fail the API call if database save fails
    }

    res.json({
      success: true,
      message: 'Message sent successfully!',
      data: {
        messageId: response.data.messages[0].id,
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('Message send failed:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to send message',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Get messages for a specific phone number
router.get('/messages/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const whatsappMessageService = require('../../services/whatsappMessageService');
    const messages = await whatsappMessageService.getConversationHistory(
      phoneNumber,
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      messages: messages,
      count: messages.length,
      phoneNumber
    });
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Upload media to WhatsApp and get media ID
router.post('/upload-media', async (req, res) => {
  try {
    if (!whatsappConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not configured. Please configure API credentials first.'
      });
    }

    const { mediaUrl, mimeType } = req.body;

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required'
      });
    }

    // Upload media to WhatsApp
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}/media`,
      {
        messaging_product: 'whatsapp',
        type: mimeType || 'auto-detect',
        url: mediaUrl
      },
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      data: {
        mediaId: uploadResponse.data.id,
        mediaUrl: mediaUrl
      }
    });

  } catch (error) {
    console.error('Media upload failed:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to upload media',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Get media download URL from WhatsApp
router.get('/media/:mediaId', async (req, res) => {
  try {
    if (!whatsappConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not configured'
      });
    }

    const { mediaId } = req.params;
    console.log(`Fetching media URL for ID: ${mediaId}`);

    // Get media URL from WhatsApp
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`
        }
      }
    );

    console.log(`Successfully fetched media data for ${mediaId}:`, {
      url: mediaResponse.data.url ? 'URL present' : 'No URL',
      mimeType: mediaResponse.data.mime_type,
      fileSize: mediaResponse.data.file_size
    });

    res.json({
      success: true,
      data: {
        mediaId: mediaId,
        url: mediaResponse.data.url,
        mimeType: mediaResponse.data.mime_type,
        sha256: mediaResponse.data.sha256,
        fileSize: mediaResponse.data.file_size
      }
    });

  } catch (error) {
    console.error(`Media fetch failed for ID ${req.params.mediaId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch media';
    if (error.response?.status === 404) {
      errorMessage = 'Media not found or expired';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied to media';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid WhatsApp access token';
    }
    
    res.status(error.response?.status || 400).json({
      success: false,
      message: errorMessage,
      mediaId: req.params.mediaId,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Proxy media content from WhatsApp to avoid CORS issues
router.get('/media-proxy/:mediaId', async (req, res) => {
  try {
    if (!whatsappConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not configured'
      });
    }

    const { mediaId } = req.params;
    console.log(`Proxying media content for ID: ${mediaId}`);

    // First, get the media URL from WhatsApp
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${whatsappConfig.accessToken}`
        }
      }
    );

    const mediaUrl = mediaResponse.data.url;
    const mimeType = mediaResponse.data.mime_type || 'video/mp4';

    console.log(`Fetching media content from: ${mediaUrl}`);

    // Stream the media content through our server to avoid CORS
    const mediaContentResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'User-Agent': 'Stella-WhatsApp-Client/1.0'
      },
      responseType: 'stream',
      timeout: 30000 // 30 second timeout
    });

    // Set appropriate headers for the response
    res.set({
      'Content-Type': mimeType,
      'Content-Length': mediaContentResponse.headers['content-length'],
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    });

    // Stream the content to the client
    mediaContentResponse.data.pipe(res);

    mediaContentResponse.data.on('error', (error) => {
      console.error(`Stream error for media ${mediaId}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream media content' });
      }
    });

  } catch (error) {
    console.error(`Media proxy failed for ID ${req.params.mediaId}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    });
    
    if (!res.headersSent) {
      let errorMessage = 'Failed to proxy media content';
      if (error.response?.status === 404) {
        errorMessage = 'Media not found or expired';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied to media';
      }
      
      res.status(error.response?.status || 500).json({
        success: false,
        message: errorMessage,
        mediaId: req.params.mediaId
      });
    }
  }
});

// Disconnect WhatsApp integration
router.post('/disconnect', async (req, res) => {
  try {
    console.log('Disconnecting WhatsApp integration...');
    
    // Clear configuration from database
    await whatsappConfigService.clearConfig();
    
    // Clear in-memory configuration
    whatsappConfig = {
      accessToken: '',
      phoneNumberId: '',
      webhookUrl: '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
      isConfigured: false,
      lastConfigured: null
    };

    console.log('WhatsApp configuration cleared successfully');

    res.json({
      success: true,
      message: 'WhatsApp integration disconnected successfully. All credentials have been cleared.'
    });

  } catch (error) {
    console.error('Disconnect failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect WhatsApp integration',
      error: error.message
    });
  }
});

// Get configuration (without sensitive data)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      isConfigured: whatsappConfig.isConfigured,
      phoneNumberId: whatsappConfig.phoneNumberId,
      webhookUrl: whatsappConfig.webhookUrl,
      // Don't return sensitive access token
      hasAccessToken: !!whatsappConfig.accessToken
    }
  });
});

module.exports = router;
