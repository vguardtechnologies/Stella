import React, { useState } from 'react';
import { Bell, Palette, Shield, Building, MessageSquare, Save, RefreshCw } from 'lucide-react';
import './Settings.css';

interface SettingsProps {
  onSave?: (settings: any) => void;
  onCancel?: () => void;
}

interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessDescription: string;
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

interface WhatsAppSettings {
  phoneNumberId: string;
  accessToken: string;
  webhookUrl: string;
  verifyToken: string;
  businessAccountId: string;
  autoReply: boolean;
  autoReplyMessage: string;
  welcomeMessage: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  orderNotifications: boolean;
  messageNotifications: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordRequirements: {
    minLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState('business');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Business Settings State
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    businessName: 'Stella Water Delivery',
    businessAddress: '123 Water Street, Lagos, Nigeria',
    businessPhone: '+234 801 234 5678',
    businessEmail: 'info@stellawater.ng',
    businessDescription: 'Premium water delivery service in Lagos',
    businessHours: {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '16:00', closed: false },
      sunday: { open: '', close: '', closed: true }
    }
  });

  // WhatsApp Settings State
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsAppSettings>({
    phoneNumberId: '',
    accessToken: '',
    webhookUrl: '',
    verifyToken: '',
    businessAccountId: '',
    autoReply: true,
    autoReplyMessage: 'Thank you for contacting us! We\'ll get back to you shortly.',
    welcomeMessage: 'Welcome to Stella Water Delivery! How can we help you today?'
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    orderNotifications: true,
    messageNotifications: true,
    marketingEmails: false,
    weeklyReports: true
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false
    }
  });

  // Appearance Settings State
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    primaryColor: '#3B82F6',
    fontSize: 'medium',
    compactMode: false
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const allSettings = {
        business: businessSettings,
        whatsapp: whatsappSettings,
        notifications: notificationSettings,
        security: securitySettings,
        appearance: appearanceSettings
      };
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave?.(allSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'business', label: 'Business', icon: Building },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const renderBusinessSettings = () => (
    <div className="settings-section">
      <h3>Business Information</h3>
      
      <div className="form-group">
        <label htmlFor="businessName">Business Name</label>
        <input
          type="text"
          id="businessName"
          value={businessSettings.businessName}
          onChange={(e) => {
            setBusinessSettings({ ...businessSettings, businessName: e.target.value });
            setHasChanges(true);
          }}
        />
      </div>

      <div className="form-group">
        <label htmlFor="businessAddress">Business Address</label>
        <textarea
          id="businessAddress"
          value={businessSettings.businessAddress}
          onChange={(e) => {
            setBusinessSettings({ ...businessSettings, businessAddress: e.target.value });
            setHasChanges(true);
          }}
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="businessPhone">Phone Number</label>
          <input
            type="tel"
            id="businessPhone"
            value={businessSettings.businessPhone}
            onChange={(e) => {
              setBusinessSettings({ ...businessSettings, businessPhone: e.target.value });
              setHasChanges(true);
            }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="businessEmail">Email Address</label>
          <input
            type="email"
            id="businessEmail"
            value={businessSettings.businessEmail}
            onChange={(e) => {
              setBusinessSettings({ ...businessSettings, businessEmail: e.target.value });
              setHasChanges(true);
            }}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="businessDescription">Business Description</label>
        <textarea
          id="businessDescription"
          value={businessSettings.businessDescription}
          onChange={(e) => {
            setBusinessSettings({ ...businessSettings, businessDescription: e.target.value });
            setHasChanges(true);
          }}
          rows={2}
        />
      </div>

      <h4>Business Hours</h4>
      <div className="business-hours">
        {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
          <div key={day} className="business-hours-row">
            <div className="day-label">
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </div>
            <div className="hours-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) => {
                    setBusinessSettings({
                      ...businessSettings,
                      businessHours: {
                        ...businessSettings.businessHours,
                        [day]: { ...hours, closed: !e.target.checked }
                      }
                    });
                    setHasChanges(true);
                  }}
                />
                Open
              </label>
              {!hours.closed && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => {
                      setBusinessSettings({
                        ...businessSettings,
                        businessHours: {
                          ...businessSettings.businessHours,
                          [day]: { ...hours, open: e.target.value }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => {
                      setBusinessSettings({
                        ...businessSettings,
                        businessHours: {
                          ...businessSettings.businessHours,
                          [day]: { ...hours, close: e.target.value }
                        }
                      });
                      setHasChanges(true);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWhatsAppSettings = () => (
    <div className="settings-section">
      <h3>WhatsApp Business API Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="phoneNumberId">Phone Number ID</label>
        <input
          type="text"
          id="phoneNumberId"
          value={whatsappSettings.phoneNumberId}
          onChange={(e) => {
            setWhatsappSettings({ ...whatsappSettings, phoneNumberId: e.target.value });
            setHasChanges(true);
          }}
          placeholder="Enter your WhatsApp Phone Number ID"
        />
      </div>

      <div className="form-group">
        <label htmlFor="accessToken">Access Token</label>
        <input
          type="password"
          id="accessToken"
          value={whatsappSettings.accessToken}
          onChange={(e) => {
            setWhatsappSettings({ ...whatsappSettings, accessToken: e.target.value });
            setHasChanges(true);
          }}
          placeholder="Enter your WhatsApp Access Token"
        />
      </div>

      <div className="form-group">
        <label htmlFor="businessAccountId">Business Account ID</label>
        <input
          type="text"
          id="businessAccountId"
          value={whatsappSettings.businessAccountId}
          onChange={(e) => {
            setWhatsappSettings({ ...whatsappSettings, businessAccountId: e.target.value });
            setHasChanges(true);
          }}
          placeholder="Enter your WhatsApp Business Account ID"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="webhookUrl">Webhook URL</label>
          <input
            type="url"
            id="webhookUrl"
            value={whatsappSettings.webhookUrl}
            onChange={(e) => {
              setWhatsappSettings({ ...whatsappSettings, webhookUrl: e.target.value });
              setHasChanges(true);
            }}
            placeholder="https://your-domain.com/webhook"
          />
        </div>

        <div className="form-group">
          <label htmlFor="verifyToken">Verify Token</label>
          <input
            type="text"
            id="verifyToken"
            value={whatsappSettings.verifyToken}
            onChange={(e) => {
              setWhatsappSettings({ ...whatsappSettings, verifyToken: e.target.value });
              setHasChanges(true);
            }}
            placeholder="Enter verify token"
          />
        </div>
      </div>

      <h4>Auto-Reply Settings</h4>
      
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={whatsappSettings.autoReply}
          onChange={(e) => {
            setWhatsappSettings({ ...whatsappSettings, autoReply: e.target.checked });
            setHasChanges(true);
          }}
        />
        Enable Auto-Reply
      </label>

      {whatsappSettings.autoReply && (
        <div className="form-group">
          <label htmlFor="autoReplyMessage">Auto-Reply Message</label>
          <textarea
            id="autoReplyMessage"
            value={whatsappSettings.autoReplyMessage}
            onChange={(e) => {
              setWhatsappSettings({ ...whatsappSettings, autoReplyMessage: e.target.value });
              setHasChanges(true);
            }}
            rows={3}
            placeholder="Enter your auto-reply message"
          />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="welcomeMessage">Welcome Message</label>
        <textarea
          id="welcomeMessage"
          value={whatsappSettings.welcomeMessage}
          onChange={(e) => {
            setWhatsappSettings({ ...whatsappSettings, welcomeMessage: e.target.value });
            setHasChanges(true);
          }}
          rows={3}
          placeholder="Enter your welcome message for new customers"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>
      
      <div className="notification-group">
        <h4>General Notifications</h4>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.emailNotifications}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>Email Notifications</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.pushNotifications}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>Push Notifications</span>
        </label>
      </div>

      <div className="notification-group">
        <h4>Business Notifications</h4>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.orderNotifications}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, orderNotifications: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>New Orders</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.messageNotifications}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, messageNotifications: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>New Messages</span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.weeklyReports}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, weeklyReports: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>Weekly Reports</span>
        </label>
      </div>

      <div className="notification-group">
        <h4>Marketing</h4>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={notificationSettings.marketingEmails}
            onChange={(e) => {
              setNotificationSettings({ ...notificationSettings, marketingEmails: e.target.checked });
              setHasChanges(true);
            }}
          />
          <span>Marketing Emails</span>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security Settings</h3>
      
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={securitySettings.twoFactorAuth}
          onChange={(e) => {
            setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked });
            setHasChanges(true);
          }}
        />
        <span>Enable Two-Factor Authentication</span>
      </label>

      <div className="form-group">
        <label htmlFor="sessionTimeout">Session Timeout (minutes)</label>
        <select
          id="sessionTimeout"
          value={securitySettings.sessionTimeout}
          onChange={(e) => {
            setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) });
            setHasChanges(true);
          }}
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
          <option value={480}>8 hours</option>
        </select>
      </div>

      <h4>Password Requirements</h4>
      
      <div className="form-group">
        <label htmlFor="minLength">Minimum Length</label>
        <select
          id="minLength"
          value={securitySettings.passwordRequirements.minLength}
          onChange={(e) => {
            setSecuritySettings({
              ...securitySettings,
              passwordRequirements: {
                ...securitySettings.passwordRequirements,
                minLength: parseInt(e.target.value)
              }
            });
            setHasChanges(true);
          }}
        >
          <option value={6}>6 characters</option>
          <option value={8}>8 characters</option>
          <option value={10}>10 characters</option>
          <option value={12}>12 characters</option>
        </select>
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={securitySettings.passwordRequirements.requireUppercase}
          onChange={(e) => {
            setSecuritySettings({
              ...securitySettings,
              passwordRequirements: {
                ...securitySettings.passwordRequirements,
                requireUppercase: e.target.checked
              }
            });
            setHasChanges(true);
          }}
        />
        <span>Require Uppercase Letters</span>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={securitySettings.passwordRequirements.requireNumbers}
          onChange={(e) => {
            setSecuritySettings({
              ...securitySettings,
              passwordRequirements: {
                ...securitySettings.passwordRequirements,
                requireNumbers: e.target.checked
              }
            });
            setHasChanges(true);
          }}
        />
        <span>Require Numbers</span>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={securitySettings.passwordRequirements.requireSymbols}
          onChange={(e) => {
            setSecuritySettings({
              ...securitySettings,
              passwordRequirements: {
                ...securitySettings.passwordRequirements,
                requireSymbols: e.target.checked
              }
            });
            setHasChanges(true);
          }}
        />
        <span>Require Special Characters</span>
      </label>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="settings-section">
      <h3>Appearance Settings</h3>
      
      <div className="form-group">
        <label htmlFor="theme">Theme</label>
        <select
          id="theme"
          value={appearanceSettings.theme}
          onChange={(e) => {
            setAppearanceSettings({ ...appearanceSettings, theme: e.target.value as 'light' | 'dark' | 'auto' });
            setHasChanges(true);
          }}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="primaryColor">Primary Color</label>
        <div className="color-picker-group">
          <input
            type="color"
            id="primaryColor"
            value={appearanceSettings.primaryColor}
            onChange={(e) => {
              setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value });
              setHasChanges(true);
            }}
          />
          <input
            type="text"
            value={appearanceSettings.primaryColor}
            onChange={(e) => {
              setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value });
              setHasChanges(true);
            }}
            placeholder="#3B82F6"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="fontSize">Font Size</label>
        <select
          id="fontSize"
          value={appearanceSettings.fontSize}
          onChange={(e) => {
            setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value as 'small' | 'medium' | 'large' });
            setHasChanges(true);
          }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={appearanceSettings.compactMode}
          onChange={(e) => {
            setAppearanceSettings({ ...appearanceSettings, compactMode: e.target.checked });
            setHasChanges(true);
          }}
        />
        <span>Compact Mode</span>
      </label>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <div className="settings-actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'business' && renderBusinessSettings()}
          {activeTab === 'whatsapp' && renderWhatsAppSettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
