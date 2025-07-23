const express = require('express');
const axios = require('axios');
const router = express.Router();

// In-memory storage for credentials (in production, use a database)
let whatsappConfig = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  isConfigured: false
};

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
    
    res.status(400).json({
      success: false,
      message: 'Failed to connect to WhatsApp API',
      error: error.response?.data?.error?.message || error.message
    });
  }
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

    // Save the configuration
    whatsappConfig = {
      accessToken,
      phoneNumberId,
      webhookUrl: webhookUrl || '',
      verifyToken: whatsappConfig.verifyToken, // Keep existing verify token
      isConfigured: true
    };

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

// Send a WhatsApp message
router.post('/send-message', async (req, res) => {
  try {
    if (!whatsappConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp not configured. Please configure API credentials first.'
      });
    }

    const { to, message, type = 'text' } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number and message are required'
      });
    }

    const messageData = {
      messaging_product: 'whatsapp',
      to: to,
      type: type,
      text: {
        body: message
      }
    };

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
