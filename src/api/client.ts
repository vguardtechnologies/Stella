// Real API client to replace mock APIs when backend is ready
import type { WhatsAppConfig } from '../types/whatsapp';
import type { User } from '../types/auth';
import type { Message, Conversation } from '../types/message';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth?action=register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }

    return response.data!;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth?action=login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/api/user?action=me');
    return response.data!.user;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/user?action=refresh', {
      method: 'POST',
    });

    if (response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
    }

    return response.data!;
  }

  // WhatsApp configuration methods
  async configureWhatsApp(config: {
    phoneNumberId: string;
    accessToken: string;
    webhookUrl: string;
    verifyToken: string;
    businessAccountId: string;
    autoReply?: boolean;
    autoReplyMessage?: string;
    welcomeMessage?: string;
  }): Promise<WhatsAppConfig> {
    const response = await this.request<WhatsAppConfig>('/api/whatsapp?action=configure', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumberId: config.phoneNumberId,
        accessToken: config.accessToken,
        webhookUrl: config.webhookUrl,
        verifyToken: config.verifyToken,
        businessAccountId: config.businessAccountId,
        autoReply: config.autoReply,
        autoReplyMessage: config.autoReplyMessage,
        welcomeMessage: config.welcomeMessage,
      }),
    });

    return response.data!;
  }

  async getWhatsAppStatus(): Promise<{
    configured: boolean;
    is_active: boolean;
    connection_status?: boolean;
    phone_number_id?: string;
    webhook_url?: string;
    auto_reply?: boolean;
    last_updated?: string;
  }> {
    const response = await this.request<any>('/api/whatsapp?action=status');
    return response.data!;
  }

  async testWhatsAppConnection(): Promise<{ connected: boolean; message: string }> {
    const response = await this.request<{ connected: boolean; message: string }>(
      '/api/whatsapp?action=test-connection',
      { method: 'POST' }
    );
    return response.data!;
  }

  // Messaging methods
  async sendMessage(to: string, message: string): Promise<{
    message_id: string;
    whatsapp_message_id: string;
    status: string;
    timestamp: string;
  }> {
    const response = await this.request<any>('/api/whatsapp?action=send-message', {
      method: 'POST',
      body: JSON.stringify({ to, message }),
    });

    return response.data!;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    const response = await this.request<{ messages: Message[] }>(
      `/api/whatsapp?action=messages&conversation_id=${conversationId}`
    );
    return response.data!.messages;
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.request<{ conversations: Conversation[] }>(
      '/api/whatsapp?action=conversations'
    );
    return response.data!.conversations;
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
