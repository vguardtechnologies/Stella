import React, { useState, useEffect } from 'react';
import './MetaIntegrationPage.css';

interface MetaIntegrationPageProps {
  onClose: () => void;
}

interface FacebookAccount {
  id: string;
  name: string;
  picture: string;
  access_token?: string;
  connected?: boolean;
}

interface FacebookPage {
  id: string;
  name: string;
  picture: string;
  access_token?: string;
  connected: boolean;
}

interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url: string;
  connected: boolean;
}

const MetaIntegrationPage: React.FC<MetaIntegrationPageProps> = ({ onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [facebookAccount, setFacebookAccount] = useState<FacebookAccount | null>(null);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Load existing connections on component mount
  useEffect(() => {
    loadExistingConnections();
  }, []);

  const loadExistingConnections = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/meta/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setFacebookAccount(data.facebook_account);
          setFacebookPages(data.facebook_pages || []);
          setInstagramAccounts(data.instagram_accounts || []);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Error loading Meta connections:', error);
    }
  };

  const handleFacebookLogin = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Simulate Facebook login for now
      console.log('Facebook login initiated');
      
      // Update state with mock connected account info
      setFacebookAccount({
        id: 'mock_id',
        name: 'Mock User',
        picture: 'https://via.placeholder.com/100',
        connected: true
      });

      // Convert Facebook API pages to local format
      setFacebookPages([{
        id: 'mock_page_id',
        name: 'Mock Page',
        picture: 'https://via.placeholder.com/100',
        access_token: 'mock_token',
        connected: false
      }]);
      
      // Convert Instagram accounts to local format
      setInstagramAccounts([{
        id: 'mock_ig_id',
        username: 'mock_instagram',
        profile_picture_url: 'https://via.placeholder.com/100',
        connected: false
      }]);
      
      setConnectionStatus('connected');
      
      // Save to localStorage
      const connectionData = {
        user: { id: 'mock_id', name: 'Mock User' },
        pages: [],
        instagram: [],
        accessToken: 'mock_token'
      };
      localStorage.setItem('facebookConnection', JSON.stringify(connectionData));

    } catch (error) {
      console.error('Facebook login error:', error);
      
      if (error instanceof Error && error.message.includes('SETUP_REQUIRED')) {
        alert('⚙️ Facebook App Setup Required\n\n' +
              'To use Facebook integration, you need to:\n' +
              '1. Create a Facebook Developer App\n' +
              '2. Get your App ID from Facebook Developer Console\n' +
              '3. Add VITE_FACEBOOK_APP_ID=your_real_app_id to your .env file\n' +
              '4. Restart the development server\n\n' +
              'Visit: https://developers.facebook.com/apps/');
      } else {
        alert('Failed to connect to Facebook. Please try again.');
      }
      
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/meta/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        setFacebookAccount(null);
        setFacebookPages([]);
        setInstagramAccounts([]);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting Meta accounts:', error);
    }
  };

  const togglePageConnection = async (pageId: string, connect: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/meta/page/${pageId}/${connect ? 'connect' : 'disconnect'}`, {
        method: 'POST',
      });

      if (response.ok) {
        setFacebookPages(prev => 
          prev.map(page => 
            page.id === pageId ? { ...page, connected: connect } : page
          )
        );
      }
    } catch (error) {
      console.error('Error toggling page connection:', error);
    }
  };

  const toggleInstagramConnection = async (accountId: string, connect: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/api/meta/instagram/${accountId}/${connect ? 'connect' : 'disconnect'}`, {
        method: 'POST',
      });

      if (response.ok) {
        setInstagramAccounts(prev => 
          prev.map(account => 
            account.id === accountId ? { ...account, connected: connect } : account
          )
        );
      }
    } catch (error) {
      console.error('Error toggling Instagram connection:', error);
    }
  };

  return (
    <div className="meta-integration-page">
      <div className="meta-integration-container">
        <div className="meta-integration-header">
          <h1>🚀 Meta Integration</h1>
          <p>Connect your Facebook and Instagram accounts to share reels and content with customers</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="meta-integration-content">
          {connectionStatus === 'disconnected' && (
            <div className="connection-section">
              <div className="connection-card">
                <div className="connection-icon">📘</div>
                <h2>Connect Your Meta Accounts</h2>
                <p>Link your Facebook and Instagram accounts to access your reels and content for customer engagement.</p>
                
                <div className="features-list">
                  <div className="feature-item">
                    <span className="feature-icon">🎬</span>
                    <span>Share Facebook and Instagram reels</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔍</span>
                    <span>Search and browse your content</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📱</span>
                    <span>Send content directly via WhatsApp</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <span>Track engagement and performance</span>
                  </div>
                </div>

                <button 
                  className="connect-button"
                  onClick={handleFacebookLogin}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect with Facebook'}
                </button>
              </div>
            </div>
          )}

          {connectionStatus === 'connecting' && (
            <div className="connecting-section">
              <div className="loading-spinner"></div>
              <h2>Connecting to Meta...</h2>
              <p>Please complete the authorization process in the popup window.</p>
            </div>
          )}

          {connectionStatus === 'connected' && facebookAccount && (
            <div className="connected-section">
              <div className="account-info">
                <img src={facebookAccount.picture} alt="Profile" className="profile-picture" />
                <div className="account-details">
                  <h2>✅ Connected as {facebookAccount.name}</h2>
                  <p>Your Meta accounts are successfully connected!</p>
                </div>
                <button className="disconnect-button" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </div>

              {facebookPages.length > 0 && (
                <div className="pages-section">
                  <h3>📄 Facebook Pages</h3>
                  <div className="pages-grid">
                    {facebookPages.map(page => (
                      <div key={page.id} className="page-card">
                        <img src={page.picture} alt={page.name} className="page-picture" />
                        <div className="page-info">
                          <h4>{page.name}</h4>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={page.connected}
                              onChange={(e) => togglePageConnection(page.id, e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {instagramAccounts.length > 0 && (
                <div className="instagram-section">
                  <h3>📷 Instagram Accounts</h3>
                  <div className="instagram-grid">
                    {instagramAccounts.map(account => (
                      <div key={account.id} className="instagram-card">
                        <img src={account.profile_picture_url} alt={account.username} className="instagram-picture" />
                        <div className="instagram-info">
                          <h4>@{account.username}</h4>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={account.connected}
                              onChange={(e) => toggleInstagramConnection(account.id, e.target.checked)}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="integration-status">
                <h3>🔗 Integration Status</h3>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-icon">✅</span>
                    <span>Facebook Account Connected</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">{facebookPages.some(p => p.connected) ? '✅' : '⏳'}</span>
                    <span>Facebook Pages: {facebookPages.filter(p => p.connected).length} connected</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">{instagramAccounts.some(a => a.connected) ? '✅' : '⏳'}</span>
                    <span>Instagram Accounts: {instagramAccounts.filter(a => a.connected).length} connected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaIntegrationPage;
