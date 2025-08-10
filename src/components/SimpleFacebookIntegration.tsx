import React, { useState, useEffect } from 'react';
import FacebookConnectionTest from './FacebookConnectionTest';
import { validateFacebookToken } from '../utils/tokenValidator';
import './MetaIntegrationPage.css';

interface SimpleFacebookIntegrationProps {
  onClose: () => void;
}

interface FacebookConfig {
  appId: string;
  accessToken: string;
  appSecret: string;
  connected: boolean;
}

interface FacebookPage {
  id: string;
  name: string;
  picture: string;
  access_token?: string;
  connected: boolean;
}

const SimpleFacebookIntegration: React.FC<SimpleFacebookIntegrationProps> = ({ onClose }) => {
  const [config, setConfig] = useState<FacebookConfig>({
    appId: '',
    accessToken: '',
    appSecret: '',
    connected: false
  });
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showConnectionTest, setShowConnectionTest] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Load saved configuration on component mount
  useEffect(() => {
    loadSavedConfig();
  }, []);

  const loadSavedConfig = () => {
    try {
      const savedConfig = localStorage.getItem('simpleFacebookConfig');
      if (savedConfig) {
        const configData = JSON.parse(savedConfig);
        setConfig(configData);
        setConnectionStatus(configData.connected ? 'connected' : 'disconnected');
        
        // Load pages if connected
        const savedPages = localStorage.getItem('facebookPages');
        if (savedPages) {
          setPages(JSON.parse(savedPages));
        }
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  };

  const handleInputChange = (field: keyof FacebookConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
      connected: false // Reset connection when credentials change
    }));
    setConnectionStatus('disconnected');
  };

  const testConnection = async () => {
    if (!config.appId || !config.accessToken) {
      alert('Please enter App ID and Access Token');
      return;
    }

    setTesting(true);
    setConnectionStatus('connecting');

    try {
      // First, validate the token type
      const tokenValidation = await validateFacebookToken(config.accessToken);
      
      if (!tokenValidation.isValid) {
        let errorMessage = tokenValidation.error || 'Token validation failed';
        
        if (tokenValidation.tokenType === 'whatsapp') {
          errorMessage = '🚨 Wrong Token Type!\n\n' +
            'You\'re using a WhatsApp token, but this needs a Facebook token.\n\n' +
            '✅ Solution:\n' +
            '1. Go to: https://developers.facebook.com/tools/explorer/\n' +
            '2. Get Token → Get User Access Token\n' +
            '3. Add permissions: pages_show_list, pages_read_engagement\n' +
            '4. Generate Access Token\n' +
            '5. Use that token here instead';
        }
        
        alert(errorMessage);
        setConnectionStatus('disconnected');
        setTesting(false);
        return;
      }

      // If token is valid, proceed with connection test
      const response = await fetch(`${API_BASE}/api/simple-facebook?action=test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: config.appId,
          accessToken: config.accessToken,
          appSecret: config.appSecret
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update config
        const newConfig = {
          ...config,
          connected: true
        };
        setConfig(newConfig);
        setConnectionStatus('connected');
        
        // Set pages
        setPages(data.pages || []);
        
        // Save to localStorage
        localStorage.setItem('simpleFacebookConfig', JSON.stringify(newConfig));
        localStorage.setItem('facebookPages', JSON.stringify(data.pages || []));
        
        alert('Successfully connected to Facebook!');
      } else {
        throw new Error(data.error || 'Connection failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Connection failed: ${errorMessage}`);
      setConnectionStatus('disconnected');
    } finally {
      setTesting(false);
    }
  };

  const disconnect = () => {
    setConfig({
      appId: '',
      accessToken: '',
      appSecret: '',
      connected: false
    });
    setPages([]);
    setConnectionStatus('disconnected');
    
    // Clear localStorage
    localStorage.removeItem('simpleFacebookConfig');
    localStorage.removeItem('facebookPages');
    
    alert('Disconnected from Facebook');
  };

  const togglePageConnection = async (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId 
        ? { ...page, connected: !page.connected }
        : page
    ));
    
    // Save updated pages to localStorage
    const updatedPages = pages.map(page => 
      page.id === pageId 
        ? { ...page, connected: !page.connected }
        : page
    );
    localStorage.setItem('facebookPages', JSON.stringify(updatedPages));
  };

  const fetchPageContent = async (pageId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/simple-facebook?action=page-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          accessToken: config.accessToken
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Page content:', data.content);
        // You can handle the content here - display in a modal, etc.
      } else {
        alert('Failed to fetch page content: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
      alert('Failed to fetch page content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meta-integration-overlay">
      <div className="meta-integration-modal">
        <div className="meta-integration-header">
          <h2>📘 Facebook Integration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="meta-integration-content">
          {connectionStatus === 'disconnected' ? (
            <div className="connection-setup">
              <h3>🔑 Enter Facebook Credentials</h3>
              <p>Enter your Facebook App credentials to connect:</p>
              
              <div className="form-group">
                <label htmlFor="appId">App ID</label>
                <input
                  type="text"
                  id="appId"
                  value={config.appId}
                  onChange={(e) => handleInputChange('appId', e.target.value)}
                  placeholder="Your Facebook App ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="accessToken">Access Token</label>
                <input
                  type="text"
                  id="accessToken"
                  value={config.accessToken}
                  onChange={(e) => handleInputChange('accessToken', e.target.value)}
                  placeholder="Your Facebook Access Token"
                />
              </div>

              <div className="form-group">
                <label htmlFor="appSecret">App Secret (Optional)</label>
                <input
                  type="text"
                  id="appSecret"
                  value={config.appSecret}
                  onChange={(e) => handleInputChange('appSecret', e.target.value)}
                  placeholder="Your Facebook App Secret (optional)"
                />
              </div>

              <button
                className="connect-btn"
                onClick={testConnection}
                disabled={testing || !config.appId || !config.accessToken}
              >
                {testing ? '🔄 Testing Connection...' : '🔗 Test Connection'}
              </button>
            </div>
          ) : (
            <div className="connection-success">
              <div className="status-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>✅ Connected to Facebook</h3>
                <div className="header-buttons">
                  <button 
                    className="test-btn" 
                    onClick={() => setShowConnectionTest(true)}
                    style={{ 
                      marginRight: '10px',
                      backgroundColor: '#4267B2',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🧪 Test Connection
                  </button>
                  <button className="disconnect-btn" onClick={disconnect}>
                    Disconnect
                  </button>
                </div>
              </div>

              {pages.length > 0 && (
                <div className="pages-section">
                  <h4>📄 Your Facebook Pages</h4>
                  <div className="pages-list">
                    {pages.map((page) => (
                      <div key={page.id} className="page-item">
                        <div className="page-info">
                          <img src={page.picture} alt={page.name} />
                          <div>
                            <h5>{page.name}</h5>
                            <span className={`status ${page.connected ? 'connected' : 'disconnected'}`}>
                              {page.connected ? 'Connected' : 'Not Connected'}
                            </span>
                          </div>
                        </div>
                        <div className="page-actions">
                          <button
                            className={`toggle-btn ${page.connected ? 'disconnect' : 'connect'}`}
                            onClick={() => togglePageConnection(page.id)}
                          >
                            {page.connected ? 'Disconnect' : 'Connect'}
                          </button>
                          <button
                            className="fetch-btn"
                            onClick={() => fetchPageContent(page.id)}
                            disabled={loading}
                          >
                            📱 Browse Content
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="integration-info">
                <h4>🎯 What's Connected</h4>
                <ul>
                  <li>✅ Facebook App ID: {config.appId}</li>
                  <li>✅ Access Token: {config.accessToken ? '••••••••' : 'Not set'}</li>
                  <li>✅ Pages Available: {pages.length}</li>
                  <li>✅ Connected Pages: {pages.filter(p => p.connected).length}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showConnectionTest && (
        <FacebookConnectionTest onClose={() => setShowConnectionTest(false)} />
      )}
    </div>
  );
};

export default SimpleFacebookIntegration;
