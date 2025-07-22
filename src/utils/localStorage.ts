// Local storage utilities for Stella app
import type { User, AuthResponse } from '../types/auth';
import type { MessageTemplate } from '../types/message';
import type { WhatsAppConfig } from '../types/whatsapp';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'stella_auth_token',
  REFRESH_TOKEN: 'stella_refresh_token',
  USER_DATA: 'stella_user_data',
  WHATSAPP_CONFIG: 'stella_whatsapp_config',
  MESSAGE_TEMPLATES: 'stella_message_templates',
  CHAT_DRAFTS: 'stella_chat_drafts',
  SETTINGS: 'stella_settings',
  THEME: 'stella_theme',
} as const;

// Generic localStorage wrapper with error handling
class LocalStorageManager {
  isAvailable(): boolean {
    try {
      const test = '__stella_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  set<T>(key: string, value: T): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.isAvailable()) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting localStorage key "${key}":`, error);
      return defaultValue;
    }
  }

  remove(key: string): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) return false;
    
    try {
      // Only clear Stella-specific keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
}

const storage = new LocalStorageManager();

// Authentication storage functions
export const authStorage = {
  setAuth: (authData: AuthResponse): boolean => {
    const success = storage.set(STORAGE_KEYS.AUTH_TOKEN, authData.token) &&
                   storage.set(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken) &&
                   storage.set(STORAGE_KEYS.USER_DATA, authData.user);
    return success;
  },

  getToken: (): string | undefined => {
    return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
  },

  getRefreshToken: (): string | undefined => {
    return storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUser: (): User | undefined => {
    return storage.get<User>(STORAGE_KEYS.USER_DATA);
  },

  clearAuth: (): boolean => {
    return storage.remove(STORAGE_KEYS.AUTH_TOKEN) &&
           storage.remove(STORAGE_KEYS.REFRESH_TOKEN) &&
           storage.remove(STORAGE_KEYS.USER_DATA);
  },

  isAuthenticated: (): boolean => {
    const token = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const user = storage.get<User>(STORAGE_KEYS.USER_DATA);
    return !!(token && user);
  }
};

// WhatsApp configuration storage
export const whatsappStorage = {
  setConfig: (config: WhatsAppConfig): boolean => {
    return storage.set(STORAGE_KEYS.WHATSAPP_CONFIG, config);
  },

  getConfig: (): WhatsAppConfig | undefined => {
    return storage.get<WhatsAppConfig>(STORAGE_KEYS.WHATSAPP_CONFIG);
  },

  clearConfig: (): boolean => {
    return storage.remove(STORAGE_KEYS.WHATSAPP_CONFIG);
  },

  isConfigured: (): boolean => {
    const config = storage.get<WhatsAppConfig>(STORAGE_KEYS.WHATSAPP_CONFIG);
    return !!(config && config.apiKey && config.phoneNumberId);
  }
};

// Message templates storage
export const templateStorage = {
  setTemplates: (templates: MessageTemplate[]): boolean => {
    return storage.set(STORAGE_KEYS.MESSAGE_TEMPLATES, templates);
  },

  getTemplates: (): MessageTemplate[] => {
    return storage.get<MessageTemplate[]>(STORAGE_KEYS.MESSAGE_TEMPLATES, []) || [];
  },

  addTemplate: (template: MessageTemplate): boolean => {
    const templates = templateStorage.getTemplates();
    const updated = [...templates, template];
    return storage.set(STORAGE_KEYS.MESSAGE_TEMPLATES, updated);
  },

  updateTemplate: (templateId: string, updates: Partial<MessageTemplate>): boolean => {
    const templates = templateStorage.getTemplates();
    const index = templates.findIndex(t => t.id === templateId);
    if (index === -1) return false;
    
    templates[index] = { ...templates[index], ...updates };
    return storage.set(STORAGE_KEYS.MESSAGE_TEMPLATES, templates);
  },

  removeTemplate: (templateId: string): boolean => {
    const templates = templateStorage.getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    return storage.set(STORAGE_KEYS.MESSAGE_TEMPLATES, filtered);
  }
};

// Chat drafts storage
export const draftStorage = {
  saveDraft: (conversationId: string, content: string): boolean => {
    const drafts = storage.get<Record<string, string>>(STORAGE_KEYS.CHAT_DRAFTS, {}) || {};
    drafts[conversationId] = content;
    return storage.set(STORAGE_KEYS.CHAT_DRAFTS, drafts);
  },

  getDraft: (conversationId: string): string => {
    const drafts = storage.get<Record<string, string>>(STORAGE_KEYS.CHAT_DRAFTS, {}) || {};
    return drafts[conversationId] || '';
  },

  removeDraft: (conversationId: string): boolean => {
    const drafts = storage.get<Record<string, string>>(STORAGE_KEYS.CHAT_DRAFTS, {}) || {};
    delete drafts[conversationId];
    return storage.set(STORAGE_KEYS.CHAT_DRAFTS, drafts);
  },

  clearAllDrafts: (): boolean => {
    return storage.remove(STORAGE_KEYS.CHAT_DRAFTS);
  }
};

// Application settings storage
export const settingsStorage = {
  setSetting: (key: string, value: any): boolean => {
    const settings = storage.get<Record<string, any>>(STORAGE_KEYS.SETTINGS, {}) || {};
    settings[key] = value;
    return storage.set(STORAGE_KEYS.SETTINGS, settings);
  },

  getSetting: <T>(key: string, defaultValue: T): T => {
    const settings = storage.get<Record<string, any>>(STORAGE_KEYS.SETTINGS, {}) || {};
    return settings[key] !== undefined ? settings[key] : defaultValue;
  },

  removeSetting: (key: string): boolean => {
    const settings = storage.get<Record<string, any>>(STORAGE_KEYS.SETTINGS, {}) || {};
    delete settings[key];
    return storage.set(STORAGE_KEYS.SETTINGS, settings);
  },

  getAllSettings: (): Record<string, any> => {
    return storage.get<Record<string, any>>(STORAGE_KEYS.SETTINGS, {}) || {};
  }
};

// Theme storage
export const themeStorage = {
  setTheme: (theme: 'light' | 'dark' | 'auto'): boolean => {
    return storage.set(STORAGE_KEYS.THEME, theme);
  },

  getTheme: (): 'light' | 'dark' | 'auto' => {
    return storage.get<'light' | 'dark' | 'auto'>(STORAGE_KEYS.THEME, 'auto') || 'auto';
  }
};

// Utility function to check storage usage
export const getStorageInfo = () => {
  if (!localStorage) return null;
  
  let totalSize = 0;
  const keyData: Array<{ key: string; size: number }> = [];
  
  Object.values(STORAGE_KEYS).forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      totalSize += size;
      keyData.push({ key, size });
    }
  });
  
  return {
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    keys: keyData.sort((a, b) => b.size - a.size),
    available: storage.isAvailable()
  };
};

// Helper function to format bytes
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default storage;
