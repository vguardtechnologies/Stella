// Message-related types

// UI Message interface for frontend components  
export interface UIMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  editedAt?: Date;
  replyToId?: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number; // For audio/video
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contact?: {
    name: string;
    phoneNumber: string;
    email?: string;
  };
}

// UI Conversation interface for frontend components
export interface UIConversation {
  id: string;
  participantIds: string[];
  type: 'individual' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  lastMessageId?: string;
  lastActivityAt: Date;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Message interface for backend communication
export interface Message {
  id: string;
  user_id: string;
  conversation_id: string;
  whatsapp_message_id?: string;
  from_number: string;
  to_number: string;
  message_text: string;
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'template';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'received';
  timestamp: Date;
  created_at: Date;
}

// API Conversation interface for backend communication
export interface Conversation {
  id: string;
  user_id: string;
  contact_number: string;
  contact_name?: string;
  last_message_id?: string;
  unread_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  content: string;
  variables: string[];
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  isActive: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSettings {
  autoReply: boolean;
  autoReplyMessage?: string;
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
      };
    };
  };
  awayMessage?: string;
  typingIndicator: boolean;
  readReceipts: boolean;
  messageRetention: number; // days
}

export interface MessageDraft {
  conversationId: string;
  content: string;
  timestamp: Date;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface MessageSearch {
  query: string;
  conversationId?: string;
  messageType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  senderId?: string;
}

export interface MessageSearchResult {
  message: UIMessage;
  conversation: UIConversation;
  matches: Array<{
    field: string;
    snippet: string;
  }>;
}

// Real-time message events
export interface MessageEvent {
  type: 'message.new' | 'message.update' | 'message.delete' | 'typing.start' | 'typing.stop' | 'read.receipt';
  conversationId: string;
  userId?: string;
  messageId?: string;
  data?: any;
  timestamp: Date;
}
