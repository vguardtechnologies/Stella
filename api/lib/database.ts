import { sql } from '@vercel/postgres';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  api_key: string;
  phone_number_id: string;
  webhook_url: string;
  verify_token: string;
  business_account_id: string;
  is_active: boolean;
  auto_reply: boolean;
  auto_reply_message: string;
  welcome_message: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  user_id: string;
  whatsapp_message_id: string;
  conversation_id: string;
  from_number: string;
  to_number: string;
  message_text: string;
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  timestamp: Date;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_id: string;
  contact_number: string;
  contact_name: string;
  last_message_id?: string;
  unread_count: number;
  created_at: Date;
  updated_at: Date;
}

export class Database {
  // Initialize database tables
  static async initializeTables() {
    try {
      // Users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // WhatsApp configurations table
      await sql`
        CREATE TABLE IF NOT EXISTS whatsapp_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          api_key VARCHAR(500),
          phone_number_id VARCHAR(100),
          webhook_url VARCHAR(500),
          verify_token VARCHAR(255),
          business_account_id VARCHAR(255),
          is_active BOOLEAN DEFAULT false,
          auto_reply BOOLEAN DEFAULT true,
          auto_reply_message TEXT DEFAULT 'Thank you for contacting us! We will get back to you shortly.',
          welcome_message TEXT DEFAULT 'Welcome to our service! How can we help you today?',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Conversations table
      await sql`
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          contact_number VARCHAR(20) NOT NULL,
          contact_name VARCHAR(255),
          last_message_id UUID,
          unread_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, contact_number)
        )
      `;

      // Messages table
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          whatsapp_message_id VARCHAR(255),
          from_number VARCHAR(20) NOT NULL,
          to_number VARCHAR(20) NOT NULL,
          message_text TEXT,
          message_type VARCHAR(50) DEFAULT 'text',
          status VARCHAR(50) DEFAULT 'sent',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Add foreign key constraint for last_message_id
      await sql`
        ALTER TABLE conversations 
        ADD CONSTRAINT fk_last_message 
        FOREIGN KEY (last_message_id) 
        REFERENCES messages(id) ON DELETE SET NULL
      `;

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC)`;

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  // User operations
  static async createUser(email: string, passwordHash: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${passwordHash})
      RETURNING *
    `;
    return result.rows[0] as User;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result.rows[0] as User || null;
  }

  static async getUserById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result.rows[0] as User || null;
  }

  // WhatsApp configuration operations
  static async createWhatsAppConfig(config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const result = await sql`
      INSERT INTO whatsapp_configs (
        user_id, api_key, phone_number_id, webhook_url, verify_token,
        business_account_id, is_active, auto_reply, auto_reply_message, welcome_message
      )
      VALUES (
        ${config.user_id}, ${config.api_key}, ${config.phone_number_id}, 
        ${config.webhook_url}, ${config.verify_token}, ${config.business_account_id},
        ${config.is_active || false}, ${config.auto_reply || true}, 
        ${config.auto_reply_message}, ${config.welcome_message}
      )
      RETURNING *
    `;
    return result.rows[0] as WhatsAppConfig;
  }

  static async getWhatsAppConfigByUserId(userId: string): Promise<WhatsAppConfig | null> {
    const result = await sql`
      SELECT * FROM whatsapp_configs WHERE user_id = ${userId}
    `;
    return result.rows[0] as WhatsAppConfig || null;
  }

  static async getWhatsAppConfigByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppConfig | null> {
    const result = await sql`
      SELECT * FROM whatsapp_configs WHERE phone_number_id = ${phoneNumberId} AND is_active = true
    `;
    return result.rows[0] as WhatsAppConfig || null;
  }

  static async updateWhatsAppConfig(userId: string, config: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
    const result = await sql`
      UPDATE whatsapp_configs SET
        api_key = COALESCE(${config.api_key}, api_key),
        phone_number_id = COALESCE(${config.phone_number_id}, phone_number_id),
        webhook_url = COALESCE(${config.webhook_url}, webhook_url),
        verify_token = COALESCE(${config.verify_token}, verify_token),
        business_account_id = COALESCE(${config.business_account_id}, business_account_id),
        is_active = COALESCE(${config.is_active}, is_active),
        auto_reply = COALESCE(${config.auto_reply}, auto_reply),
        auto_reply_message = COALESCE(${config.auto_reply_message}, auto_reply_message),
        welcome_message = COALESCE(${config.welcome_message}, welcome_message),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] as WhatsAppConfig;
  }

  // Conversation operations
  static async createOrUpdateConversation(
    userId: string, 
    contactNumber: string, 
    contactName?: string
  ): Promise<Conversation> {
    const result = await sql`
      INSERT INTO conversations (user_id, contact_number, contact_name)
      VALUES (${userId}, ${contactNumber}, ${contactName})
      ON CONFLICT (user_id, contact_number)
      DO UPDATE SET 
        contact_name = COALESCE(${contactName}, conversations.contact_name),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result.rows[0] as Conversation;
  }

  static async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const result = await sql`
      SELECT c.*, m.message_text as last_message_text, m.timestamp as last_message_timestamp
      FROM conversations c
      LEFT JOIN messages m ON c.last_message_id = m.id
      WHERE c.user_id = ${userId}
      ORDER BY c.updated_at DESC
    `;
    return result.rows as Conversation[];
  }

  // Message operations
  static async createMessage(message: Partial<Message>): Promise<Message> {
    const result = await sql`
      INSERT INTO messages (
        user_id, conversation_id, whatsapp_message_id, from_number, 
        to_number, message_text, message_type, status, timestamp
      )
      VALUES (
        ${message.user_id}, ${message.conversation_id}, ${message.whatsapp_message_id},
        ${message.from_number}, ${message.to_number}, ${message.message_text},
        ${message.message_type || 'text'}, ${message.status || 'sent'}, 
        ${message.timestamp?.toISOString() || new Date().toISOString()}
      )
      RETURNING *
    `;

    const newMessage = result.rows[0] as Message;

    // Update conversation's last message
    await sql`
      UPDATE conversations SET
        last_message_id = ${newMessage.id},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${message.conversation_id}
    `;

    return newMessage;
  }

  static async getMessagesByConversationId(conversationId: string, limit = 50): Promise<Message[]> {
    const result = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;
    return result.rows as Message[];
  }

  static async updateMessageStatus(messageId: string, status: string): Promise<Message> {
    const result = await sql`
      UPDATE messages SET
        status = ${status},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${messageId}
      RETURNING *
    `;
    return result.rows[0] as Message;
  }
}
