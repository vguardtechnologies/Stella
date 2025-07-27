import React, { useState, useEffect } from 'react';
import './WhatsAppPage.css';

interface WhatsAppPageProps {
  onClose: () => void;
}

const WhatsAppPage: React.FC<WhatsAppPageProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('whatsapp_api_key');
    const savedPhoneNumberId = localStorage.getItem('whatsapp_phone_number_id');
    const savedWebhookUrl = localStorage.getItem('whatsapp_webhook_url');
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedPhoneNumberId) setPhoneNumberId(savedPhoneNumberId);
    if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
  }, []);

  // Load current configuration status when component mounts
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Use Vite proxy in development, direct URL in production
        const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
        
        console.log('Checking WhatsApp configuration status...', { 
          baseUrl, 
          isDev: import.meta.env.DEV,
          fullUrl: `${baseUrl}/api/whatsapp/config-status`
        });
        
        const response = await fetch(`${baseUrl}/api/whatsapp/config-status`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Backend response:', result);
        
        if (result.success) {
          setIsConnected(result.isConfigured);
          setBackendError(null); // Clear any previous errors
          console.log('Backend configuration status:', result);
          
          // Always load from localStorage first (browser persistence)
          const savedApiKey = localStorage.getItem('whatsapp_api_key');
          const savedPhoneNumberId = localStorage.getItem('whatsapp_phone_number_id');
          const savedWebhookUrl = localStorage.getItem('whatsapp_webhook_url');
          
          if (savedApiKey) setApiKey(savedApiKey);
          if (savedPhoneNumberId) setPhoneNumberId(savedPhoneNumberId);
          if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
          
          // If we have localStorage credentials but backend says not configured,
          // attempt to restore backend configuration
          if ((savedApiKey && savedPhoneNumberId) && !result.isConfigured) {
            console.log('Restoring backend configuration from localStorage...');
            await restoreBackendConfiguration(savedApiKey, savedPhoneNumberId, savedWebhookUrl || '');
          }
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
        setBackendError(error instanceof Error ? error.message : 'Backend connection failed');
        
        // If backend is unreachable, still load from localStorage and show appropriate status
        const savedApiKey = localStorage.getItem('whatsapp_api_key');
        const savedPhoneNumberId = localStorage.getItem('whatsapp_phone_number_id');
        const savedWebhookUrl = localStorage.getItem('whatsapp_webhook_url');
        
        if (savedApiKey) setApiKey(savedApiKey);
        if (savedPhoneNumberId) setPhoneNumberId(savedPhoneNumberId);
        if (savedWebhookUrl) setWebhookUrl(savedWebhookUrl);
        
        // Set as disconnected since we can't verify backend status
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  // Function to restore backend configuration from localStorage
  const restoreBackendConfiguration = async (accessToken: string, phoneNumberId: string, webhookUrl?: string) => {
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      const response = await fetch(`${baseUrl}/api/whatsapp/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          phoneNumberId,
          webhookUrl: webhookUrl || ''
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsConnected(true);
        setBackendError(null);
        console.log('Backend configuration restored successfully');
      } else {
        console.error('Failed to restore backend configuration:', result.message);
        // If restore fails, clear potentially invalid localStorage
        localStorage.removeItem('whatsapp_api_key');
        localStorage.removeItem('whatsapp_phone_number_id');
        localStorage.removeItem('whatsapp_webhook_url');
        setApiKey('');
        setPhoneNumberId('');
        setWebhookUrl('');
      }
    } catch (error) {
      console.error('Error restoring backend configuration:', error);
    }
  };

  const handleConnectAPI = async () => {
    if (!apiKey || !phoneNumberId) {
      alert('Please enter both API key and Phone Number ID');
      return;
    }

    try {
      console.log('Testing WhatsApp API connection...');
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      const response = await fetch(`${baseUrl}/api/whatsapp/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: apiKey,
          phoneNumberId: phoneNumberId
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsConnected(true);
        setBackendError(null);
        
        // Save credentials to localStorage
        localStorage.setItem('whatsapp_api_key', apiKey);
        localStorage.setItem('whatsapp_phone_number_id', phoneNumberId);
        if (webhookUrl) {
          localStorage.setItem('whatsapp_webhook_url', webhookUrl);
        }
        
        alert(`✅ ${result.message}\n\nPhone: ${result.data?.phoneNumber || 'Connected'}\nStatus: ${result.data?.status || 'Active'}`);
      } else {
        setIsConnected(false);
        alert(`❌ Connection failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      alert('❌ Network error. Please check your connection and try again.');
    }
  };

  const handleSaveConfiguration = async () => {
    if (!isConnected) {
      alert('Please connect to the API first');
      return;
    }
    
    try {
      console.log('Saving WhatsApp configuration...');
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      const response = await fetch(`${baseUrl}/api/whatsapp/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: apiKey,
          phoneNumberId: phoneNumberId,
          webhookUrl: webhookUrl
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.message}\n\nYour WhatsApp API is now configured and ready to use!`);
        
        // Optionally clear the form after successful save
        // setApiKey('');
        // setPhoneNumberId('');
        // setWebhookUrl('');
      } else {
        alert(`❌ Save failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Configuration save failed:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to disconnect WhatsApp integration?\n\n' +
      'This will:\n' +
      '• Clear all saved credentials\n' +
      '• Stop message functionality\n' +
      '• Require reconfiguration to use WhatsApp again'
    );

    if (!confirmed) return;

    try {
      console.log('Disconnecting WhatsApp integration...');
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      const response = await fetch(`${baseUrl}/api/whatsapp/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        // Clear local state
        setIsConnected(false);
        setApiKey('');
        setPhoneNumberId('');
        setWebhookUrl('');
        setBackendError(null);
        
        // Clear localStorage
        localStorage.removeItem('whatsapp_api_key');
        localStorage.removeItem('whatsapp_phone_number_id');
        localStorage.removeItem('whatsapp_webhook_url');
        
        alert(`✅ ${result.message}`);
      } else {
        alert(`❌ Disconnect failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
      alert('❌ Network error. Please try again.');
    }
  };

  return (
    <div className="whatsapp-page-overlay">
      <div className="whatsapp-page">
        <div className="whatsapp-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
            </svg>
            WhatsApp API Integration
          </h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="whatsapp-content">
          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <p>🔄 Loading configuration...</p>
            </div>
          )}

          {/* API Configuration Section */}
          {!isLoading && (
            <div className="api-config-section">
              <h3>API Configuration</h3>
              <div className="config-status">
                <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? '🟢 Connected & Configured' : '🔴 Not Connected'}
                </span>
                {isConnected && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                    WhatsApp API is ready to use
                  </small>
                )}
                {backendError && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#f44336' }}>
                    🚫 Backend Error: {backendError}
                  </small>
                )}
                {!isConnected && !backendError && (apiKey || phoneNumberId) && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#ff9800' }}>
                    ⚠️ Credentials found in browser but not synced with backend
                  </small>
                )}
              </div>
            
            <div className="input-group">
              <label htmlFor="api-key">WhatsApp Business API Access Token:</label>
              <input
                id="api-key"
                type="password"
                placeholder="Enter your WhatsApp Business API access token"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="api-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="phone-id">Phone Number ID:</label>
              <input
                id="phone-id"
                type="text"
                placeholder="Enter your WhatsApp Phone Number ID"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="api-input"
              />
            </div>

            <div className="input-group">
              <label htmlFor="webhook">Webhook URL (Optional):</label>
              <input
                id="webhook"
                type="url"
                placeholder="https://yourapp.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="api-input"
              />
            </div>

            <div className="button-group">
              <button 
                className="connect-button" 
                onClick={handleConnectAPI}
                disabled={isConnected}
              >
                {isConnected ? 'Connected' : 'Test Connection'}
              </button>
              
              <button 
                className="save-button" 
                onClick={handleSaveConfiguration}
                disabled={!isConnected}
              >
                Save Configuration
              </button>

              {/* Show restore button if we have credentials but not connected */}
              {!isConnected && (apiKey && phoneNumberId) && (
                <button 
                  className="restore-button" 
                  onClick={() => restoreBackendConfiguration(apiKey, phoneNumberId, webhookUrl)}
                >
                  Restore Config
                </button>
              )}

              {isConnected && (
                <button 
                  className="disconnect-button" 
                  onClick={handleDisconnect}
                >
                  Disconnect
                </button>
              )}
            </div>
            </div>
          )}

          {/* Integration Guide */}
          {!isLoading && (
            <div className="integration-guide">
            <h3>Integration Guide</h3>
            <div className="guide-content">
              <h4>Steps to integrate WhatsApp Business API:</h4>
              <ol>
                <li>Sign up for <a href="https://business.whatsapp.com" target="_blank" rel="noopener noreferrer">WhatsApp Business API</a></li>
                <li>Create a Meta Business App and get your access token</li>
                <li>Get your Phone Number ID from the WhatsApp Business dashboard</li>
                <li>Enter your credentials above and test the connection</li>
                <li>Set up webhook URL for receiving messages (optional)</li>
                <li>Save your configuration</li>
              </ol>
              
              <h4>What this integration enables:</h4>
              <ul>
                <li>🔧 API Connection setup for your WhatsApp Business account</li>
                <li>🔗 Webhook configuration for receiving messages</li>
                <li>⚙️ Credential management and validation</li>
                <li>📋 Configuration saving for your application</li>
              </ul>

              <h4>Note:</h4>
              <p>This page is for setting up the WhatsApp API integration. Actual messaging functionality will be implemented in separate components of your application.</p>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPage;