// Mock WhatsApp API functions for development
import type { WhatsAppConfig, WhatsAppMessage, WhatsAppContact, WhatsAppConversation, WhatsAppTemplate } from '../types/whatsapp';

// Simulate API delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockContacts: WhatsAppContact[] = [
  {
    id: 'contact1',
    phoneNumber: '+1234567890',
    name: 'John Doe',
    profileName: 'John',
    lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isBlocked: false
  },
  {
    id: 'contact2',
    phoneNumber: '+1234567891',
    name: 'Sarah Johnson',
    profileName: 'Sarah',
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isBlocked: false
  },
  {
    id: 'contact3',
    phoneNumber: '+1234567892',
    name: 'Mike Davis',
    profileName: 'Mike',
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    isBlocked: false
  }
];

const mockMessages: WhatsAppMessage[] = [
  {
    id: 'msg1',
    from: '+1234567890',
    to: '+1234567899', // Business number
    text: 'Hi! I need some products delivered today.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    messageType: 'text',
    status: 'read',
    direction: 'inbound'
  },
  {
    id: 'msg2',
    from: '+1234567899',
    to: '+1234567890',
    text: 'Hello! Yes, we can deliver today. What time works best for you?',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    messageType: 'text',
    status: 'read',
    direction: 'outbound'
  },
  {
    id: 'msg3',
    from: '+1234567890',
    to: '+1234567899',
    text: 'Around 2 PM would be perfect!',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    messageType: 'text',
    status: 'delivered',
    direction: 'inbound'
  }
];

const mockConversations: WhatsAppConversation[] = [
  {
    id: 'conv1',
    contactId: 'contact1',
    lastMessageId: 'msg3',
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 5 * 60 * 1000),
    status: 'active'
  },
  {
    id: 'conv2',
    contactId: 'contact2',
    lastMessageId: 'msg4',
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active'
  }
];

const mockTemplates: WhatsAppTemplate[] = [
  {
    id: 'template1',
    name: 'order_confirmation',
    category: 'utility',
    language: 'en_US',
    status: 'approved',
    components: [
      {
        type: 'body',
        text: 'Hi {{1}}, your order #{{2}} for {{3}} has been confirmed! We will deliver it on {{4}}. Total: ${{5}}'
      },
      {
        type: 'footer',
        text: 'Thanks for choosing our service!'
      }
    ]
  },
  {
    id: 'template2',
    name: 'delivery_update',
    category: 'utility',
    language: 'en_US',
    status: 'approved',
    components: [
      {
        type: 'body',
        text: 'Your order is on the way! Our driver will arrive in approximately {{1}} minutes.'
      }
    ]
  }
];

// Mock configuration storage
let mockConfig: WhatsAppConfig | null = null;

// Mock API functions
export const mockWhatsAppAPI = {
  // Configuration
  async configure(config: WhatsAppConfig): Promise<{ success: boolean; message: string }> {
    await delay(1500);
    
    // Simulate validation
    if (!config.apiKey || config.apiKey.length < 100) {
      throw new Error('Invalid API key format');
    }
    
    if (!config.phoneNumberId || !/^\d{15,16}$/.test(config.phoneNumberId)) {
      throw new Error('Invalid Phone Number ID format');
    }
    
    if (!config.webhookUrl || !config.webhookUrl.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }
    
    mockConfig = config;
    return {
      success: true,
      message: 'WhatsApp configuration saved successfully'
    };
  },

  async getConfiguration(): Promise<WhatsAppConfig | null> {
    await delay(500);
    return mockConfig;
  },

  async testConnection(): Promise<{ success: boolean; message: string }> {
    await delay(2000);
    
    if (!mockConfig) {
      throw new Error('WhatsApp not configured');
    }
    
    // Simulate random connection issues
    if (Math.random() < 0.1) {
      throw new Error('Connection failed: Invalid access token');
    }
    
    return {
      success: true,
      message: 'Successfully connected to WhatsApp Business API'
    };
  },

  async verifyWebhook(verifyToken: string, hubChallenge: string): Promise<string> {
    await delay(200);
    
    if (!mockConfig || verifyToken !== mockConfig.verifyToken) {
      throw new Error('Invalid verify token');
    }
    
    return hubChallenge;
  },

  // Messaging
  async sendMessage(to: string, message: string): Promise<WhatsAppMessage> {
    await delay(1000);
    
    if (!mockConfig) {
      throw new Error('WhatsApp not configured');
    }
    
    // Simulate phone number validation
    const cleanTo = to.replace(/[^\d]/g, '');
    if (cleanTo.length < 10 || cleanTo.length > 15) {
      throw new Error('Invalid phone number format');
    }
    
    // Simulate message length validation
    if (message.length > 4096) {
      throw new Error('Message too long (max 4096 characters)');
    }
    
    // Simulate rate limiting
    if (Math.random() < 0.05) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    const newMessage: WhatsAppMessage = {
      id: `msg_${Date.now()}`,
      from: mockConfig.phoneNumberId,
      to: cleanTo,
      text: message,
      timestamp: new Date(),
      messageType: 'text',
      status: 'sending',
      direction: 'outbound'
    };
    
    // Simulate status updates
    setTimeout(() => {
      newMessage.status = 'sent';
    }, 500);
    
    setTimeout(() => {
      newMessage.status = 'delivered';
    }, 1500);
    
    // Sometimes simulate read receipt
    if (Math.random() < 0.7) {
      setTimeout(() => {
        newMessage.status = 'read';
      }, 3000);
    }
    
    return newMessage;
  },

  async sendTemplate(to: string, templateName: string, parameters: string[]): Promise<WhatsAppMessage> {
    await delay(1200);
    
    if (!mockConfig) {
      throw new Error('WhatsApp not configured');
    }
    
    const template = mockTemplates.find(t => t.name === templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    if (template.status !== 'approved') {
      throw new Error(`Template '${templateName}' is not approved`);
    }
    
    // Build message text from template
    let messageText = template.components.find(c => c.type === 'body')?.text || '';
    parameters.forEach((param, index) => {
      messageText = messageText.replace(`{{${index + 1}}}`, param);
    });
    
    const newMessage: WhatsAppMessage = {
      id: `tmpl_${Date.now()}`,
      from: mockConfig.phoneNumberId,
      to: to,
      text: messageText,
      timestamp: new Date(),
      messageType: 'template',
      status: 'sending',
      direction: 'outbound'
    };
    
    // Simulate status updates
    setTimeout(() => newMessage.status = 'sent', 500);
    setTimeout(() => newMessage.status = 'delivered', 1500);
    
    return newMessage;
  },

  // Data retrieval
  async getMessages(limit: number = 50, offset: number = 0): Promise<WhatsAppMessage[]> {
    await delay(800);
    
    // Simulate pagination
    const start = offset;
    const end = start + limit;
    
    return mockMessages.slice(start, end);
  },

  async getContacts(): Promise<WhatsAppContact[]> {
    await delay(600);
    return [...mockContacts];
  },

  async getConversations(): Promise<WhatsAppConversation[]> {
    await delay(700);
    return [...mockConversations];
  },

  async getTemplates(): Promise<WhatsAppTemplate[]> {
    await delay(900);
    return [...mockTemplates];
  },

  // Contact management
  async blockContact(phoneNumber: string): Promise<{ success: boolean }> {
    await delay(800);
    
    const contact = mockContacts.find(c => c.phoneNumber === phoneNumber);
    if (contact) {
      contact.isBlocked = true;
    }
    
    return { success: true };
  },

  async unblockContact(phoneNumber: string): Promise<{ success: boolean }> {
    await delay(800);
    
    const contact = mockContacts.find(c => c.phoneNumber === phoneNumber);
    if (contact) {
      contact.isBlocked = false;
    }
    
    return { success: true };
  },

  // Webhook simulation
  async simulateIncomingMessage(from: string, message: string): Promise<WhatsAppMessage> {
    await delay(500);
    
    const incomingMessage: WhatsAppMessage = {
      id: `incoming_${Date.now()}`,
      from: from,
      to: mockConfig?.phoneNumberId || '+1234567899',
      text: message,
      timestamp: new Date(),
      messageType: 'text',
      status: 'delivered',
      direction: 'inbound'
    };
    
    // Add to mock messages
    mockMessages.push(incomingMessage);
    
    // Update conversation
    let conversation = mockConversations.find(c => {
      const contact = mockContacts.find(contact => contact.id === c.contactId);
      return contact?.phoneNumber === from;
    });
    
    if (!conversation) {
      // Create new contact and conversation
      const newContact: WhatsAppContact = {
        id: `contact_${Date.now()}`,
        phoneNumber: from,
        name: `Contact ${from}`,
        isBlocked: false
      };
      mockContacts.push(newContact);
      
      conversation = {
        id: `conv_${Date.now()}`,
        contactId: newContact.id,
        lastMessageId: incomingMessage.id,
        unreadCount: 1,
        updatedAt: new Date(),
        status: 'active'
      };
      mockConversations.push(conversation);
    } else {
      conversation.lastMessageId = incomingMessage.id;
      conversation.unreadCount += 1;
      conversation.updatedAt = new Date();
    }
    
    return incomingMessage;
  },

  // Analytics
  async getMessageStats(days: number = 7): Promise<{
    totalSent: number;
    totalReceived: number;
    deliveryRate: number;
    readRate: number;
  }> {
    await delay(1000);
    
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentMessages = mockMessages.filter(m => m.timestamp > cutoff);
    
    const sent = recentMessages.filter(m => m.direction === 'outbound').length;
    const received = recentMessages.filter(m => m.direction === 'inbound').length;
    const delivered = recentMessages.filter(m => m.status === 'delivered' || m.status === 'read').length;
    const read = recentMessages.filter(m => m.status === 'read').length;
    
    return {
      totalSent: sent,
      totalReceived: received,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      readRate: sent > 0 ? (read / sent) * 100 : 0
    };
  }
};

// Utility functions for development
export const mockWhatsAppUtils = {
  // Generate realistic phone numbers
  generatePhoneNumber(): string {
    const countryCode = Math.floor(Math.random() * 99) + 1;
    const number = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `+${countryCode}${number}`;
  },

  // Generate test message
  generateTestMessage(): string {
    const messages = [
      'Hello! I need a delivery today.',
      'What are your prices for 5-gallon bottles?',
      'Can you deliver to my office address?',
      'I need to schedule a weekly delivery.',
      'Is the product available?',
      'Thank you for the quick delivery!',
      'Can I change my delivery time?',
      'Do you accept credit cards?'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  },

  // Reset mock data
  resetMockData(): void {
    mockConfig = null;
    mockMessages.length = 0;
    mockContacts.length = 0;
    mockConversations.length = 0;
  },

  // Get current mock state
  getMockState() {
    return {
      config: mockConfig,
      messages: [...mockMessages],
      contacts: [...mockContacts],
      conversations: [...mockConversations],
      templates: [...mockTemplates]
    };
  }
};
