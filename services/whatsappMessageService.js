const { pool } = require('../config/database');

class WhatsAppMessageService {
  // Create or get conversation
  async createOrGetConversation(phoneNumber, displayName = null, profileName = null) {
    try {
      // First, try to find existing conversation
      const existingConversation = await pool.query(
        'SELECT * FROM conversations WHERE phone_number = $1',
        [phoneNumber]
      );

      if (existingConversation.rows.length > 0) {
        // Update last message time and names if provided
        await pool.query(
          `UPDATE conversations 
           SET last_message_at = CURRENT_TIMESTAMP,
               display_name = COALESCE($2, display_name),
               profile_name = COALESCE($3, profile_name),
               updated_at = CURRENT_TIMESTAMP
           WHERE phone_number = $1`,
          [phoneNumber, displayName, profileName]
        );
        return existingConversation.rows[0];
      }

      // Create new conversation
      const newConversation = await pool.query(
        `INSERT INTO conversations (phone_number, display_name, profile_name)
         VALUES ($1, $2, $3) RETURNING *`,
        [phoneNumber, displayName, profileName]
      );

      return newConversation.rows[0];
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  }

  // Save incoming message
  async saveIncomingMessage(messageData, contactNames = null) {
    try {
      const {
        id: whatsappMessageId,
        from: phoneNumber,
        timestamp,
        type: messageType,
        text,
        image,
        audio,
        voice,
        video,
        document,
        sticker,
        location,
        contacts,
        interactive
      } = messageData;

      // Extract display name from contact names if available
      let displayName = null;
      let profileName = null;
      
      if (contactNames) {
        displayName = contactNames.bestDisplayName;
        profileName = contactNames.profileName;
      }

      // Get or create conversation with contact names
      const conversation = await this.createOrGetConversation(phoneNumber, displayName, profileName);

      let content = '';
      let mediaUrl = null;
      let mediaMimeType = null;
      let mediaSha256 = null;
      let mediaFileSize = null;
      let voiceDuration = null;

      // Extract content based on message type
      switch (messageType) {
        case 'text':
          content = text?.body || '';
          break;
        case 'image':
          content = image?.caption || '';
          mediaUrl = image?.id; // WhatsApp media ID
          mediaMimeType = image?.mime_type;
          mediaSha256 = image?.sha256;
          break;
        case 'audio':
          mediaUrl = audio?.id;
          mediaMimeType = audio?.mime_type;
          mediaSha256 = audio?.sha256;
          // For audio messages, voice duration might be in different fields
          voiceDuration = null;
          if (audio?.voice === true || audio?.voice_duration) {
            voiceDuration = audio.voice_duration ? (parseInt(audio.voice_duration) || null) : null;
          }
          break;
        case 'voice':
          mediaUrl = voice?.id;
          mediaMimeType = voice?.mime_type;
          mediaSha256 = voice?.sha256;
          voiceDuration = voice?.voice_duration ? (parseInt(voice.voice_duration) || null) : null;
          break;
        case 'video':
          content = video?.caption || '';
          mediaUrl = video?.id;
          mediaMimeType = video?.mime_type;
          mediaSha256 = video?.sha256;
          break;
        case 'document':
          content = document?.caption || document?.filename || '';
          mediaUrl = document?.id;
          mediaMimeType = document?.mime_type;
          mediaSha256 = document?.sha256;
          mediaFileSize = document?.filesize ? (parseInt(document.filesize) || null) : null;
          break;
        case 'sticker':
          mediaUrl = sticker?.id;
          mediaMimeType = sticker?.mime_type;
          mediaSha256 = sticker?.sha256;
          break;
        case 'location':
          content = JSON.stringify({
            latitude: location?.latitude,
            longitude: location?.longitude,
            name: location?.name,
            address: location?.address
          });
          break;
        case 'contacts':
          content = JSON.stringify(contacts);
          break;
        case 'interactive':
          content = JSON.stringify(interactive);
          break;
        default:
          content = JSON.stringify(messageData);
      }

      // Debug logging for voice messages
      if (messageType === 'audio' || messageType === 'voice') {
        console.log('🎵 Voice message processing:', {
          messageType,
          mediaUrl,
          mediaMimeType,
          voiceDuration,
          audioData: audio,
          voiceData: voice
        });
      }

      // Ensure numeric fields are valid before database insert
      voiceDuration = (voiceDuration && !isNaN(voiceDuration)) ? voiceDuration : null;
      mediaFileSize = (mediaFileSize && !isNaN(mediaFileSize)) ? mediaFileSize : null;

      console.log('📊 Final values for DB insert:', {
        messageType,
        voiceDuration,
        mediaFileSize,
        mediaUrl,
        mediaMimeType
      });

      // Save message to database
      const savedMessage = await pool.query(
        `INSERT INTO messages (
          whatsapp_message_id, conversation_id, phone_number, direction,
          message_type, content, media_url, media_mime_type, media_sha256,
          media_file_size, voice_duration, timestamp, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          whatsappMessageId,
          conversation.id,
          phoneNumber,
          'incoming',
          messageType,
          content,
          mediaUrl,
          mediaMimeType,
          mediaSha256,
          mediaFileSize,
          voiceDuration,
          timestamp,
          'received'
        ]
      );

      console.log(`✅ Saved ${messageType} message from ${phoneNumber}`);
      return savedMessage.rows[0];
    } catch (error) {
      console.error('Error saving incoming message:', error);
      throw error;
    }
  }

  // Save outgoing message
  async saveOutgoingMessage(messageData) {
    try {
      const {
        whatsappMessageId,
        to: phoneNumber,
        messageType,
        content,
        mediaUrl = null,
        mediaMimeType = null
      } = messageData;

      // Get or create conversation
      const conversation = await this.createOrGetConversation(phoneNumber);

      const savedMessage = await pool.query(
        `INSERT INTO messages (
          whatsapp_message_id, conversation_id, phone_number, direction,
          message_type, content, media_url, media_mime_type, timestamp, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          whatsappMessageId,
          conversation.id,
          phoneNumber,
          'outgoing',
          messageType,
          content,
          mediaUrl,
          mediaMimeType,
          Math.floor(Date.now() / 1000), // Convert to seconds and round down to integer
          'sent'
        ]
      );

      console.log(`✅ Saved outgoing ${messageType} message to ${phoneNumber}`);
      return savedMessage.rows[0];
    } catch (error) {
      console.error('Error saving outgoing message:', error);
      throw error;
    }
  }

  // Update message status
  async updateMessageStatus(whatsappMessageId, status, timestamp) {
    try {
      // Find the message
      const message = await pool.query(
        'SELECT id FROM messages WHERE whatsapp_message_id = $1',
        [whatsappMessageId]
      );

      if (message.rows.length === 0) {
        console.log(`Message ${whatsappMessageId} not found for status update`);
        return;
      }

      // Update message status
      await pool.query(
        'UPDATE messages SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE whatsapp_message_id = $2',
        [status, whatsappMessageId]
      );

      // Insert status history
      await pool.query(
        'INSERT INTO message_status (message_id, status, timestamp) VALUES ($1, $2, $3)',
        [message.rows[0].id, status, timestamp]
      );

      console.log(`✅ Updated message ${whatsappMessageId} status to ${status}`);
    } catch (error) {
      console.error('Error updating message status:', error);
      throw error;
    }
  }

  // Get conversation history
  async getConversationHistory(phoneNumber, limit = 50, offset = 0) {
    try {
      const messages = await pool.query(
        `SELECT m.*, c.display_name, c.profile_name
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE m.phone_number = $1
         ORDER BY m.timestamp DESC
         LIMIT $2 OFFSET $3`,
        [phoneNumber, limit, offset]
      );

      return messages.rows;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  // Get all conversations
  async getAllConversations(limit = 20, offset = 0) {
    try {
      const conversations = await pool.query(
        `SELECT c.*, 
                m.content as last_message,
                m.message_type as last_message_type,
                m.timestamp as last_message_timestamp
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id
         WHERE m.timestamp = (
           SELECT MAX(timestamp) FROM messages WHERE conversation_id = c.id
         ) OR m.timestamp IS NULL
         ORDER BY c.last_message_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      return conversations.rows;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppMessageService();
