// WhatsApp-related types
export interface WhatsAppConfig {
  apiKey: string;
  phoneNumberId: string;
  webhookUrl: string;
  verifyToken: string;
  isActive: boolean;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: Date;
  messageType: 'text' | 'template' | 'media';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  direction: 'inbound' | 'outbound';
}

export interface WhatsAppContact {
  id: string;
  phoneNumber: string;
  name?: string;
  profileName?: string;
  lastSeen?: Date;
  isBlocked: boolean;
}

export interface WhatsAppConversation {
  id: string;
  contactId: string;
  lastMessageId?: string;
  unreadCount: number;
  updatedAt: Date;
  status: 'active' | 'archived' | 'blocked';
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'utility' | 'marketing' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  components: TemplateComponent[];
}

export interface TemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  format?: 'text' | 'media';
  text?: string;
  parameters?: string[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: string;
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: MessageStatus[];
  };
}

export interface MessageStatus {
  id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}
