const express = require('express');
const router = express.Router();

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

          // Handle different types of webhook events
          if (webhookEvent.messages) {
            // Handle incoming messages
            webhookEvent.messages.forEach(message => {
              console.log('Received message:', {
                from: message.from,
                id: message.id,
                timestamp: message.timestamp,
                type: message.type,
                text: message.text?.body || message.caption || 'Media message'
              });

              // Here you can process the incoming message
              // For example: save to database, trigger automated responses, etc.
              handleIncomingMessage(message, webhookEvent);
            });
          }

          if (webhookEvent.statuses) {
            // Handle message status updates (sent, delivered, read, failed)
            webhookEvent.statuses.forEach(status => {
              console.log('Message status update:', {
                id: status.id,
                status: status.status,
                timestamp: status.timestamp,
                recipient_id: status.recipient_id
              });

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

// Function to handle incoming messages
function handleIncomingMessage(message, webhookEvent) {
  const { from, text, type, timestamp } = message;
  
  console.log(`Processing ${type} message from ${from}:`, text?.body || 'Media content');

  // Here you can implement your business logic:
  // - Save message to database
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
