// Mock configuration API functions for development
import { settingsStorage, whatsappStorage } from '../utils/localStorage';

// Simulate API delay
const delay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms));

// Application configuration types
export interface AppConfig {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    desktop: boolean;
  };
  chat: {
    autoReply: boolean;
    autoReplyMessage: string;
    typingIndicator: boolean;
    readReceipts: boolean;
    messageRetention: number; // days
  };
  business: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
    workingHours: {
      [key: string]: {
        isOpen: boolean;
        openTime: string;
        closeTime: string;
      };
    };
  };
  integrations: {
    whatsapp: {
      enabled: boolean;
      apiKey: string;
      phoneNumberId: string;
      webhookUrl: string;
      verifyToken: string;
    };
    email: {
      enabled: boolean;
      provider: 'sendgrid' | 'mailgun' | 'smtp';
      apiKey: string;
      fromEmail: string;
      fromName: string;
    };
    analytics: {
      enabled: boolean;
      provider: 'google' | 'mixpanel' | 'custom';
      trackingId: string;
    };
  };
  features: {
    multiUser: boolean;
    templates: boolean;
    analytics: boolean;
    automation: boolean;
    fileUpload: boolean;
    voiceMessages: boolean;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  theme: 'auto',
  language: 'en',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  notifications: {
    email: true,
    push: true,
    sound: true,
    desktop: true
  },
  chat: {
    autoReply: false,
    autoReplyMessage: 'Thank you for your message! We will get back to you soon.',
    typingIndicator: true,
    readReceipts: true,
    messageRetention: 30
  },
  business: {
    name: 'Stella Water Delivery',
    address: '123 Business St, City, ST 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@stella.com',
    website: 'https://stella.com',
    logo: '',
    workingHours: {
      monday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '17:00' },
      saturday: { isOpen: true, openTime: '10:00', closeTime: '14:00' },
      sunday: { isOpen: false, openTime: '10:00', closeTime: '14:00' }
    }
  },
  integrations: {
    whatsapp: {
      enabled: false,
      apiKey: '',
      phoneNumberId: '',
      webhookUrl: '',
      verifyToken: ''
    },
    email: {
      enabled: false,
      provider: 'sendgrid',
      apiKey: '',
      fromEmail: '',
      fromName: ''
    },
    analytics: {
      enabled: false,
      provider: 'google',
      trackingId: ''
    }
  },
  features: {
    multiUser: true,
    templates: true,
    analytics: true,
    automation: false,
    fileUpload: true,
    voiceMessages: false
  }
};

// Mock configuration storage
let currentConfig: AppConfig = { ...defaultConfig };

// Mock configuration API
export const mockConfigAPI = {
  // Get application configuration
  async getConfig(): Promise<AppConfig> {
    await delay(500);
    
    // Load from localStorage if available
    const savedSettings = settingsStorage.getAllSettings();
    const whatsappConfig = whatsappStorage.getConfig();
    
    // Merge saved settings with default config
    const config: AppConfig = {
      ...currentConfig,
      ...savedSettings,
      integrations: {
        ...currentConfig.integrations,
        whatsapp: whatsappConfig ? {
          enabled: true,
          apiKey: whatsappConfig.apiKey,
          phoneNumberId: whatsappConfig.phoneNumberId,
          webhookUrl: whatsappConfig.webhookUrl,
          verifyToken: whatsappConfig.verifyToken
        } : currentConfig.integrations.whatsapp
      }
    };
    
    return config;
  },

  // Update application configuration
  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    await delay(800);
    
    // Validate updates
    if (updates.business?.email && !this.isValidEmail(updates.business.email)) {
      throw new Error('Invalid email format');
    }
    
    if (updates.business?.phone && !this.isValidPhone(updates.business.phone)) {
      throw new Error('Invalid phone number format');
    }
    
    if (updates.business?.website && !this.isValidUrl(updates.business.website)) {
      throw new Error('Invalid website URL');
    }
    
    // Deep merge updates with current config
    currentConfig = this.deepMerge(currentConfig, updates);
    
    // Save to localStorage
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'integrations') {
        settingsStorage.setSetting(key, value);
      }
    });
    
    // Handle WhatsApp integration separately
    if (updates.integrations?.whatsapp) {
      const whatsappConfig = updates.integrations.whatsapp;
      if (whatsappConfig.enabled && whatsappConfig.apiKey && whatsappConfig.phoneNumberId) {
        whatsappStorage.setConfig({
          apiKey: whatsappConfig.apiKey,
          phoneNumberId: whatsappConfig.phoneNumberId,
          webhookUrl: whatsappConfig.webhookUrl,
          verifyToken: whatsappConfig.verifyToken,
          isActive: true
        });
      }
    }
    
    return currentConfig;
  },

  // Reset configuration to defaults
  async resetConfig(): Promise<AppConfig> {
    await delay(600);
    
    currentConfig = { ...defaultConfig };
    
    // Clear localStorage settings
    Object.keys(settingsStorage.getAllSettings()).forEach(key => {
      settingsStorage.removeSetting(key);
    });
    
    whatsappStorage.clearConfig();
    
    return currentConfig;
  },

  // Get specific configuration section
  async getConfigSection<K extends keyof AppConfig>(section: K): Promise<AppConfig[K]> {
    await delay(300);
    
    const config = await this.getConfig();
    return config[section];
  },

  // Update specific configuration section
  async updateConfigSection<K extends keyof AppConfig>(section: K, updates: Partial<AppConfig[K]>): Promise<AppConfig[K]> {
    await delay(500);
    
    const currentValue = await this.getConfigSection(section);
    const updatedValue = { ...currentValue as object, ...updates as object } as AppConfig[K];
    
    await this.updateConfig({ [section]: updatedValue } as Partial<AppConfig>);
    
    return updatedValue;
  },

  // Test integrations
  async testIntegration(type: 'whatsapp' | 'email' | 'analytics'): Promise<{ success: boolean; message: string }> {
    await delay(2000);
    
    const config = await this.getConfig();
    
    switch (type) {
      case 'whatsapp':
        const whatsapp = config.integrations.whatsapp;
        if (!whatsapp.enabled || !whatsapp.apiKey || !whatsapp.phoneNumberId) {
          throw new Error('WhatsApp integration not configured');
        }
        
        // Simulate API test
        if (Math.random() < 0.9) {
          return {
            success: true,
            message: 'WhatsApp connection successful'
          };
        } else {
          throw new Error('Invalid WhatsApp credentials');
        }
        
      case 'email':
        const email = config.integrations.email;
        if (!email.enabled || !email.apiKey || !email.fromEmail) {
          throw new Error('Email integration not configured');
        }
        
        if (Math.random() < 0.9) {
          return {
            success: true,
            message: 'Email service connection successful'
          };
        } else {
          throw new Error('Invalid email credentials');
        }
        
      case 'analytics':
        const analytics = config.integrations.analytics;
        if (!analytics.enabled || !analytics.trackingId) {
          throw new Error('Analytics integration not configured');
        }
        
        return {
          success: true,
          message: 'Analytics tracking active'
        };
        
      default:
        throw new Error('Unknown integration type');
    }
  },

  // Get system information
  async getSystemInfo(): Promise<{
    version: string;
    environment: string;
    uptime: number;
    lastUpdate: Date;
    features: string[];
    limits: {
      messages: number;
      contacts: number;
      templates: number;
      storage: number;
    };
  }> {
    await delay(400);
    
    return {
      version: '1.0.0',
      environment: 'development',
      uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
      lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random update within last week
      features: ['chat', 'templates', 'whatsapp', 'analytics'],
      limits: {
        messages: 10000,
        contacts: 1000,
        templates: 50,
        storage: 1024 * 1024 * 100 // 100MB
      }
    };
  },

  // Backup configuration
  async backupConfig(): Promise<{ backup: string; timestamp: Date }> {
    await delay(1000);
    
    const config = await this.getConfig();
    const backup = JSON.stringify(config, null, 2);
    
    return {
      backup,
      timestamp: new Date()
    };
  },

  // Restore configuration from backup
  async restoreConfig(backup: string): Promise<AppConfig> {
    await delay(1200);
    
    try {
      const config = JSON.parse(backup) as AppConfig;
      
      // Validate backup structure
      if (!this.isValidConfig(config)) {
        throw new Error('Invalid configuration backup format');
      }
      
      return await this.updateConfig(config);
    } catch (error) {
      throw new Error('Failed to parse configuration backup');
    }
  },

  // Helper methods
  deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  },

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidConfig(config: any): boolean {
    // Basic validation of config structure
    return (
      typeof config === 'object' &&
      config.theme &&
      config.business &&
      config.integrations &&
      config.features
    );
  }
};

// Utility functions for development
export const mockConfigUtils = {
  // Get default configuration
  getDefaultConfig(): AppConfig {
    return { ...defaultConfig };
  },

  // Generate test configuration
  generateTestConfig(): Partial<AppConfig> {
    return {
      business: {
        name: `Test Business ${Date.now()}`,
        address: '456 Test Ave, Test City, TC 54321',
        phone: '+1 (555) 987-6543',
        email: 'test@example.com',
        website: 'https://test-business.com',
        logo: '',
        workingHours: defaultConfig.business.workingHours
      },
      theme: 'light',
      notifications: {
        email: false,
        push: true,
        sound: false,
        desktop: true
      }
    };
  },

  // Validate configuration
  validateConfig(config: Partial<AppConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (config.business?.email && !mockConfigAPI.isValidEmail(config.business.email)) {
      errors.push('Invalid business email format');
    }
    
    if (config.business?.phone && !mockConfigAPI.isValidPhone(config.business.phone)) {
      errors.push('Invalid business phone format');
    }
    
    if (config.business?.website && !mockConfigAPI.isValidUrl(config.business.website)) {
      errors.push('Invalid business website URL');
    }
    
    if (config.integrations?.whatsapp?.enabled) {
      const whatsapp = config.integrations.whatsapp;
      if (!whatsapp.apiKey) errors.push('WhatsApp API key is required');
      if (!whatsapp.phoneNumberId) errors.push('WhatsApp Phone Number ID is required');
      if (!whatsapp.webhookUrl) errors.push('WhatsApp Webhook URL is required');
      if (!whatsapp.verifyToken) errors.push('WhatsApp Verify Token is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Reset mock data
  resetMockData(): void {
    currentConfig = { ...defaultConfig };
  },

  // Get current mock state
  getMockState() {
    return {
      config: { ...currentConfig }
    };
  }
};
