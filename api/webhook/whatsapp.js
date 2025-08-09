const express = require('express');
const router = express.Router();
const whatsappMessageService = require('../../services/whatsappMessageService');
const whatsappMediaService = require('../../services/whatsappMediaService');
const whatsappContactService = require('../../services/whatsappContactService');

// Store verification token (should match what you set in WhatsApp Business API)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'stella_webhook_verify_token';

// Webhook verification (GET request from WhatsApp)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request:', { mode, token, challenge });

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('Webhook verified successfully!');
      res.status(200).send(challenge);
    } else {
      // Respond with '403 Forbidden' if verify tokens do not match
      console.log('Webhook verification failed - invalid token');
      res.sendStatus(403);
    }
  } else {
    console.log('Webhook verification failed - missing parameters');
    res.sendStatus(400);
  }
});

// Webhook for receiving messages (POST request from WhatsApp)
router.post('/', (req, res) => {
  try {
    const body = req.body;

    console.log('Received webhook:', JSON.stringify(body, null, 2));

    // Check if this is a WhatsApp webhook event
    if (body.object === 'whatsapp_business_account') {
      // Loop through each entry
      body.entry?.forEach(entry => {
        // Get the webhook event from the entry
        const webhookEvent = entry.changes?.[0]?.value;

        if (webhookEvent) {
          console.log('Webhook event:', webhookEvent);

          // Handle incoming messages
          if (webhookEvent.messages) {
            // Handle incoming messages
            webhookEvent.messages.forEach(async (message) => {
              console.log('Received message:', {
                from: message.from,
                id: message.id,
                timestamp: message.timestamp,
                type: message.type,
                text: message.text?.body || message.caption || 'Media message'
              });

              // Handle interactive button responses
              if (message.type === 'interactive') {
                console.log('📱 Interactive message received:', message.interactive);
                await handleInteractiveMessage(message, webhookEvent);
              }

              // Extract all available contact name information
              const contactNames = whatsappContactService.extractContactNames(message, webhookEvent);
              const bestDisplayName = whatsappContactService.getBestDisplayName(contactNames);
              
              console.log(`� Best display name for ${message.from}: "${bestDisplayName}"`);

              try {
                // Process media if present
                let mediaProcessingResult = null;
                if (message.image || message.video || message.audio || message.document) {
                  console.log(`🎯 Processing media for message ${message.id}`);
                  try {
                    mediaProcessingResult = await whatsappMediaService.processIncomingMedia(message);
                    console.log(`✅ Media processed for message ${message.id}:`, mediaProcessingResult);
                  } catch (mediaError) {
                    console.error(`❌ Failed to process media for message ${message.id}:`, mediaError);
                    // Continue with message saving even if media processing fails
                  }
                }

                // Save message to database with enhanced contact info
                await whatsappMessageService.saveIncomingMessage(message, contactNames);
                console.log(`✅ Message ${message.id} saved to database with contact info`);

                // If media was processed, log the details
                if (mediaProcessingResult) {
                  console.log(`📁 Media stored: ${mediaProcessingResult.filePath}`);
                  if (mediaProcessingResult.thumbnailPath) {
                    console.log(`🖼️ Thumbnail: ${mediaProcessingResult.thumbnailPath}`);
                  }
                }

              } catch (error) {
                console.error(`❌ Failed to save message ${message.id}:`, error);
              }

              // Here you can process the incoming message
              // For example: trigger automated responses, etc.
              handleIncomingMessage(message, webhookEvent);
            });
          }

          if (webhookEvent.statuses) {
            // Handle message status updates (sent, delivered, read, failed)
            webhookEvent.statuses.forEach(async (status) => {
              console.log('Message status update:', {
                id: status.id,
                status: status.status,
                timestamp: status.timestamp,
                recipient_id: status.recipient_id
              });

              // Extract failure reason if message failed
              let failureReason = null;
              if (status.status === 'failed' && status.errors && status.errors.length > 0) {
                const error = status.errors[0];
                console.log('Message failure details:', error);
                
                // Check for 24-hour rule violation (error code 131047)
                if (error.code === 131047 || 
                    error.message?.includes('24 hours') || 
                    error.title?.includes('Re-engagement')) {
                  failureReason = '24_hour_rule';
                  console.log('🚫 24-hour rule violation detected for message:', status.id);
                } else {
                  failureReason = 'general_error';
                  console.log('❌ General error detected for message:', status.id, 'Error:', error.message);
                }
              }

              try {
                // Update message status in database with failure reason
                await whatsappMessageService.updateMessageStatus(
                  status.id, 
                  status.status, 
                  status.timestamp,
                  failureReason
                );
                console.log(`✅ Status updated for message ${status.id}`);
              } catch (error) {
                console.error(`❌ Failed to update status for message ${status.id}:`, error);
              }

              // Here you can update message status in your database
              handleMessageStatus(status);
            });
          }
        }
      });

      // Return 200 OK to acknowledge receipt of the webhook
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Return 404 Not Found if event is not from a WhatsApp API
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Function to handle interactive messages (button responses)
async function handleInteractiveMessage(message, webhookEvent) {
  const { from, interactive } = message;
  
  console.log(`🔘 Processing interactive message from ${from}:`, interactive);

  try {
    // Handle button replies
    if (interactive.type === 'button_reply') {
      const buttonId = interactive.button_reply?.id;
      const buttonTitle = interactive.button_reply?.title;
      
      console.log(`Button pressed - ID: ${buttonId}, Title: ${buttonTitle}`);

      // Handle "Proceed" button from cart
      if (buttonId === 'proceed_checkout') {
        console.log('🚀 User wants to proceed with checkout');
        await sendCheckoutMessage(from);
      }
      
      // Add more button handlers as needed
      else {
        console.log(`Unhandled button ID: ${buttonId}`);
      }
    }
    
    // Handle list replies (for product selections and checkout)
    else if (interactive.type === 'list_reply') {
      const listId = interactive.list_reply?.id;
      const listTitle = interactive.list_reply?.title;
      
      console.log(`List item selected - ID: ${listId}, Title: ${listTitle}`);
      
      // Handle checkout selection from cart list
      if (listId === 'proceed_checkout') {
        console.log('🚀 User wants to proceed with checkout from list');
        await sendCheckoutMessage(from);
      }
      
      // Handle individual cart item selections
      else if (listId?.startsWith('view_item_')) {
        const productId = listId.replace('view_item_', '');
        console.log(`📱 User wants to view product: ${productId}`);
        
        // Send product details message
        const productMessage = {
          messaging_product: "whatsapp",
          to: from,
          type: "text", 
          text: {
            body: `📦 Product Details: ${listTitle}\n\nFor more information about this item, please contact our support team.`
          }
        };

        const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productMessage)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Product info message sent successfully');
        } else {
          console.error('❌ Failed to send product info message:', result);
        }
      }
    }
    
  } catch (error) {
    console.error('Error handling interactive message:', error);
  }
}

// Function to send checkout message
async function sendCheckoutMessage(phoneNumber) {
  try {
    console.log('🚀 Sending checkout message to:', phoneNumber);
    
    const checkoutMessage = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "text",
      text: {
        body: "🛒 Ready to checkout! Please provide your delivery details and preferred payment method. Our team will contact you shortly to complete your order."
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutMessage)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Checkout message sent successfully');
    } else {
      console.error('❌ Failed to send checkout message:', result);
    }

  } catch (error) {
    console.error('Error sending checkout message:', error);
  }
}

// Function to handle incoming messages
function handleIncomingMessage(message, webhookEvent) {
  const { from, text, type, timestamp } = message;
  
  console.log(`Processing ${type} message from ${from}:`, text?.body || 'Media content');

  // Log media information if present
  if (message.image) {
    console.log('📷 Image message received:', {
      id: message.image.id,
      mime_type: message.image.mime_type,
      caption: message.image.caption
    });
  } else if (message.video) {
    console.log('🎥 Video message received:', {
      id: message.video.id,
      mime_type: message.video.mime_type,
      caption: message.video.caption
    });
  } else if (message.audio) {
    console.log('🎵 Audio message received:', {
      id: message.audio.id,
      mime_type: message.audio.mime_type
    });
  } else if (message.document) {
    console.log('📄 Document message received:', {
      id: message.document.id,
      mime_type: message.document.mime_type,
      filename: message.document.filename
    });
  }

  // Here you can implement your business logic:
  // - Save message to database (already done above)
  // - Trigger automated responses
  // - Forward to customer service
  // - Process commands or keywords
  
  // Example: Auto-reply to text messages
  if (type === 'text' && text?.body) {
    const messageBody = text.body.toLowerCase();
    
    // Simple auto-reply logic
    if (messageBody.includes('hello') || messageBody.includes('hi')) {
      console.log('Triggering auto-reply for greeting');
      // You could call your send message API here
    }
  }
}

// Function to handle message status updates
function handleMessageStatus(status) {
  const { id, status: messageStatus, timestamp, recipient_id } = status;
  
  console.log(`Message ${id} to ${recipient_id} is now: ${messageStatus}`);

  // Here you can update your database with the message status
  // - sent: Message was sent to WhatsApp
  // - delivered: Message was delivered to the user's device
  // - read: User has read the message
  // - failed: Message delivery failed
}

// Health check for webhook
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WhatsApp Webhook',
    timestamp: new Date().toISOString(),
    verifyToken: VERIFY_TOKEN ? 'configured' : 'not configured'
  });
});

module.exports = router;
