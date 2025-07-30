// Mock message handling API functions for development
import type { UIMessage, UIConversation, MessageTemplate, MessageSearchResult } from '../types/message';
import { templateStorage, draftStorage } from '../utils/localStorage';

// Simulate API delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
const mockConversations: UIConversation[] = [
  {
    id: 'conv_1',
    participantIds: ['user_1', 'customer_1'],
    type: 'individual',
    name: 'John Doe',
    lastMessageId: 'msg_3',
    lastActivityAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 2,
    isMuted: false,
    isArchived: false,
    isPinned: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: 'conv_2',
    participantIds: ['user_1', 'customer_2'],
    type: 'individual',
    name: 'Sarah Johnson',
    lastMessageId: 'msg_5',
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 0,
    isMuted: false,
    isArchived: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'conv_3',
    participantIds: ['user_1', 'customer_3'],
    type: 'individual',
    name: 'Mike Davis',
    lastMessageId: 'msg_7',
    lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unreadCount: 1,
    isMuted: false,
    isArchived: false,
    isPinned: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

const mockMessages: UIMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'conv_1',
    senderId: 'customer_1',
    recipientId: 'user_1',
    content: 'Hi! I need some products delivered today.',
    messageType: 'text',
    status: 'read',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: 'msg_2',
    conversationId: 'conv_1',
    senderId: 'user_1',
    recipientId: 'customer_1',
    content: 'Hello! Yes, we can deliver today. What time works best for you?',
    messageType: 'text',
    status: 'read',
    direction: 'outbound',
    timestamp: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
  },
  {
    id: 'msg_3',
    conversationId: 'conv_1',
    senderId: 'customer_1',
    recipientId: 'user_1',
    content: 'Around 2 PM would be perfect! How much will that be?',
    messageType: 'text',
    status: 'delivered',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  },
  {
    id: 'msg_4',
    conversationId: 'conv_2',
    senderId: 'customer_2',
    recipientId: 'user_1',
    content: 'Do you have dispensers available?',
    messageType: 'text',
    status: 'read',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
  },
  {
    id: 'msg_5',
    conversationId: 'conv_2',
    senderId: 'user_1',
    recipientId: 'customer_2',
    content: 'Yes! We have countertop and floor-standing dispensers. Would you like to see our catalog?',
    messageType: 'text',
    status: 'read',
    direction: 'outbound',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 'msg_6',
    conversationId: 'conv_3',
    senderId: 'customer_3',
    recipientId: 'user_1',
    content: 'Can you deliver to my office address? 123 Business Ave, Suite 100',
    messageType: 'text',
    status: 'delivered',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
  },
  {
    id: 'msg_7',
    conversationId: 'conv_3',
    senderId: 'user_1',
    recipientId: 'customer_3',
    content: 'Absolutely! We deliver to that area. What products are you interested in?',
    messageType: 'text',
    status: 'sent',
    direction: 'outbound',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  }
];

const defaultTemplates: MessageTemplate[] = [
  {
    id: 'template_1',
    name: 'Welcome Message',
    category: 'UTILITY',
    content: 'Hi {{customerName}}! Welcome to Stella. How can we help you today?',
    variables: ['customerName'],
    language: 'en',
    status: 'APPROVED',
    isActive: true,
    usageCount: 25,
    createdBy: 'user_1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'template_2',
    name: 'Order Confirmation',
    category: 'UTILITY',
    content: 'Thank you {{customerName}}! Your order for {{orderItems}} has been confirmed. Total: ${{total}}. We will deliver on {{deliveryDate}}.',
    variables: ['customerName', 'orderItems', 'total', 'deliveryDate'],
    language: 'en',
    status: 'APPROVED',
    isActive: true,
    usageCount: 150,
    createdBy: 'user_1',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'template_3',
    name: 'Delivery Update',
    category: 'UTILITY',
    content: 'Your order is on the way! Our delivery driver will arrive in approximately {{estimatedTime}} minutes.',
    variables: ['estimatedTime'],
    language: 'en',
    status: 'APPROVED',
    isActive: true,
    usageCount: 89,
    createdBy: 'user_1',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'template_4',
    name: 'Support Follow-up',
    category: 'UTILITY',
    content: 'Hi {{customerName}}, we wanted to follow up on your recent inquiry. Is there anything else we can help you with?',
    variables: ['customerName'],
    language: 'en',
    status: 'APPROVED',
    isActive: true,
    usageCount: 12,
    createdBy: 'user_1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'template_5',
    name: 'Holiday Special',
    category: 'MARKETING',
    content: '🎉 Special offer for {{customerName}}! Get 20% off your next order. Use code HOLIDAY20. Valid until {{expiryDate}}.',
    variables: ['customerName', 'expiryDate'],
    language: 'en',
    status: 'PENDING',
    isActive: false,
    usageCount: 3,
    createdBy: 'user_1',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
  }
];

// Mock message API
export const mockMessageAPI = {
  // Get conversations
  async getConversations(limit: number = 50, offset: number = 0): Promise<UIConversation[]> {
    await delay(800);
    
    const start = offset;
    const end = start + limit;
    
    return mockConversations
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime())
      .slice(start, end);
  },

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<UIConversation | null> {
    await delay(400);
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    return conversation || null;
  },

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<UIMessage[]> {
    await delay(600);
    
    const conversationMessages = mockMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const start = offset;
    const end = start + limit;
    
    return conversationMessages.slice(start, end);
  },

  // Send message
  async sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'document' = 'text'): Promise<UIMessage> {
    await delay(1000);
    
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }
    
    if (content.length > 4096) {
      throw new Error('Message too long (max 4096 characters)');
    }
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const newMessage: UIMessage = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId: 'user_1', // Current user
      recipientId: conversation.participantIds.find(id => id !== 'user_1') || 'unknown',
      content: content.trim(),
      messageType,
      status: 'sent',
      direction: 'outbound',
      timestamp: new Date()
    };
    
    // Add to mock messages
    mockMessages.push(newMessage);
    
    // Update conversation
    conversation.lastMessageId = newMessage.id;
    conversation.lastActivityAt = new Date();
    conversation.updatedAt = new Date();
    
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
    
    // Clear draft
    draftStorage.removeDraft(conversationId);
    
    return newMessage;
  },

  // Send template message
  async sendTemplateMessage(conversationId: string, templateId: string, variables: Record<string, string>): Promise<UIMessage> {
    await delay(1200);
    
    const template = defaultTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    if (!template.isActive) {
      throw new Error('Template is not active');
    }
    
    // Replace variables in template content
    let content = template.content;
    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value) {
        content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      }
    });
    
    // Update template usage count
    template.usageCount += 1;
    template.updatedAt = new Date();
    
    return this.sendMessage(conversationId, content);
  },

  // Mark messages as read
  async markAsRead(conversationId: string, messageIds: string[]): Promise<{ success: boolean }> {
    await delay(300);
    
    messageIds.forEach(messageId => {
      const message = mockMessages.find(m => m.id === messageId);
      if (message && message.direction === 'inbound') {
        message.status = 'read';
      }
    });
    
    // Update conversation unread count
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
    }
    
    return { success: true };
  },

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<{ success: boolean }> {
    await delay(500);
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.isArchived = true;
    conversation.updatedAt = new Date();
    
    return { success: true };
  },

  // Unarchive conversation
  async unarchiveConversation(conversationId: string): Promise<{ success: boolean }> {
    await delay(500);
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.isArchived = false;
    conversation.updatedAt = new Date();
    
    return { success: true };
  },

  // Pin/unpin conversation
  async togglePinConversation(conversationId: string): Promise<{ success: boolean; isPinned: boolean }> {
    await delay(400);
    
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    conversation.isPinned = !conversation.isPinned;
    conversation.updatedAt = new Date();
    
    return { success: true, isPinned: conversation.isPinned };
  },

  // Search messages
  async searchMessages(query: string, conversationId?: string): Promise<MessageSearchResult[]> {
    await delay(800);
    
    const searchTerms = query.toLowerCase().split(/\s+/);
    let messagesToSearch = mockMessages;
    
    if (conversationId) {
      messagesToSearch = mockMessages.filter(m => m.conversationId === conversationId);
    }
    
    const results: MessageSearchResult[] = [];
    
    messagesToSearch.forEach(message => {
      const content = message.content.toLowerCase();
      const matches = searchTerms.filter(term => content.includes(term));
      
      if (matches.length > 0) {
        const conversation = mockConversations.find(c => c.id === message.conversationId);
        if (conversation) {
          results.push({
            message,
            conversation,
            matches: matches.map(term => ({
              field: 'content',
              snippet: this.getSnippet(message.content, term)
            }))
          });
        }
      }
    });
    
    return results.sort((a, b) => b.message.timestamp.getTime() - a.message.timestamp.getTime());
  },

  // Get message templates
  async getTemplates(): Promise<MessageTemplate[]> {
    await delay(600);
    
    // Get templates from localStorage first, then merge with defaults
    const savedTemplates = templateStorage.getTemplates();
    const allTemplates = [...defaultTemplates, ...savedTemplates];
    
    // Remove duplicates (prefer saved templates)
    const uniqueTemplates = allTemplates.reduce((acc, template) => {
      const existing = acc.find(t => t.id === template.id);
      if (!existing) {
        acc.push(template);
      }
      return acc;
    }, [] as MessageTemplate[]);
    
    return uniqueTemplates.sort((a, b) => b.usageCount - a.usageCount);
  },

  // Create template
  async createTemplate(templateData: Omit<MessageTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    await delay(800);
    
    if (!templateData.name.trim()) {
      throw new Error('Template name is required');
    }
    
    if (!templateData.content.trim()) {
      throw new Error('Template content is required');
    }
    
    const newTemplate: MessageTemplate = {
      ...templateData,
      id: `template_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    templateStorage.addTemplate(newTemplate);
    
    return newTemplate;
  },

  // Update template
  async updateTemplate(templateId: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    await delay(700);
    
    const templates = templateStorage.getTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      // Check if it's a default template
      const defaultTemplate = defaultTemplates.find(t => t.id === templateId);
      if (!defaultTemplate) {
        throw new Error('Template not found');
      }
      
      // Create a copy of the default template with updates
      const updatedTemplate: MessageTemplate = {
        ...defaultTemplate,
        ...updates,
        id: `template_${Date.now()}`, // New ID for the copy
        updatedAt: new Date()
      };
      
      templateStorage.addTemplate(updatedTemplate);
      return updatedTemplate;
    }
    
    const updatedTemplate = {
      ...templates[templateIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    templateStorage.updateTemplate(templateId, updates);
    
    return updatedTemplate;
  },

  // Delete template
  async deleteTemplate(templateId: string): Promise<{ success: boolean }> {
    await delay(500);
    
    // Can't delete default templates
    const isDefaultTemplate = defaultTemplates.some(t => t.id === templateId);
    if (isDefaultTemplate) {
      throw new Error('Cannot delete default template');
    }
    
    const success = templateStorage.removeTemplate(templateId);
    if (!success) {
      throw new Error('Template not found');
    }
    
    return { success: true };
  },

  // Draft management
  async saveDraft(conversationId: string, content: string): Promise<{ success: boolean }> {
    await delay(200);
    
    if (content.trim()) {
      draftStorage.saveDraft(conversationId, content);
    } else {
      draftStorage.removeDraft(conversationId);
    }
    
    return { success: true };
  },

  async getDraft(conversationId: string): Promise<string> {
    await delay(100);
    
    return draftStorage.getDraft(conversationId);
  },

  // Helper method for search snippets
  getSnippet(text: string, searchTerm: string, contextLength: number = 50): string {
    const lowerText = text.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerTerm);
    
    if (index === -1) return text.substring(0, contextLength * 2);
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + searchTerm.length + contextLength);
    
    let snippet = text.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  }
};

// Utility functions for development
export const mockMessageUtils = {
  // Generate test message
  generateTestMessage(conversationId: string): UIMessage {
    const testMessages = [
      'Hello! How can I help you today?',
      'I need delivery for my office.',
      'What are your delivery times?',
      'Do you have the product available?',
      'Can I schedule weekly deliveries?',
      'Thank you for the quick service!',
      'Is there a discount for bulk orders?',
      'Can you deliver to my new address?'
    ];
    
    return {
      id: `test_${Date.now()}`,
      conversationId,
      senderId: Math.random() > 0.5 ? 'user_1' : 'customer_test',
      recipientId: Math.random() > 0.5 ? 'customer_test' : 'user_1',
      content: testMessages[Math.floor(Math.random() * testMessages.length)],
      messageType: 'text',
      status: 'delivered',
      direction: Math.random() > 0.5 ? 'inbound' : 'outbound',
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
    };
  },

  // Create test conversation
  createTestConversation(name: string): UIConversation {
    return {
      id: `test_conv_${Date.now()}`,
      participantIds: ['user_1', `customer_${Date.now()}`],
      type: 'individual',
      name,
      lastActivityAt: new Date(),
      unreadCount: Math.floor(Math.random() * 5),
      isMuted: false,
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Simulate incoming message
  simulateIncomingMessage(conversationId: string, content: string): UIMessage {
    const message: UIMessage = {
      id: `incoming_${Date.now()}`,
      conversationId,
      senderId: 'customer_incoming',
      recipientId: 'user_1',
      content,
      messageType: 'text',
      status: 'delivered',
      direction: 'inbound',
      timestamp: new Date()
    };
    
    mockMessages.push(message);
    
    // Update conversation
    const conversation = mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.lastMessageId = message.id;
      conversation.lastActivityAt = new Date();
      conversation.unreadCount += 1;
    }
    
    return message;
  },

  // Reset mock data
  resetMockData(): void {
    mockMessages.length = 0;
    mockConversations.length = 0;
    templateStorage.setTemplates([]);
    draftStorage.clearAllDrafts();
  },

  // Get current mock state
  getMockState() {
    return {
      conversations: [...mockConversations],
      messages: [...mockMessages],
      templates: [...defaultTemplates, ...templateStorage.getTemplates()]
    };
  }
};
