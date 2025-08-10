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
      // Check if user has saved Facebook connection in localStorage
      const savedConnection = localStorage.getItem('facebookConnection');
      if (savedConnection) {
        const connectionData = JSON.parse(savedConnection);
        setFacebookAccount(connectionData.user || null);
        setFacebookPages(connectionData.pages || []);
        setInstagramAccounts(connectionData.instagram || []);
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error loading Meta connections:', error);
    }
  };

  const handleFacebookLogin = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Get Facebook OAuth URL from backend
      const response = await fetch(`${API_BASE}/api/facebook?action=auth-url`);
      const data = await response.json();
      
      if (data.error || data.setup_required) {
        alert(data.error || 'Facebook App configuration required. Please check your environment variables.');
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        return;
      }
      
      if (data.authUrl) {
        // Open Facebook OAuth in a popup window
        const popup = window.open(
          data.authUrl,
          'FacebookAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Listen for the OAuth callback
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            // Check if connection was successful
            loadExistingConnections();
          }
        }, 1000);
        
        // Listen for OAuth callback message from popup
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
            popup?.close();
            handleAuthSuccess(event.data.code);
            window.removeEventListener('message', messageListener);
          }
        };
        
        window.addEventListener('message', messageListener);
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      alert('Failed to initiate Facebook login. Please try again.');
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleAuthSuccess = async (code: string) => {
    try {
      // Exchange code for access token
      const response = await fetch(`${API_BASE}/api/facebook?action=exchange-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Get user info
      const userResponse = await fetch(`${API_BASE}/api/facebook?action=user-info&access_token=${data.access_token}`);
      const userData = await userResponse.json();
      
      // Get pages
      const pagesResponse = await fetch(`${API_BASE}/api/facebook?action=pages&access_token=${data.access_token}`);
      const pagesData = await pagesResponse.json();
      
      // Get Instagram accounts
      const instagramResponse = await fetch(`${API_BASE}/api/facebook?action=instagram&access_token=${data.access_token}`);
      const instagramData = await instagramResponse.json();
      
      // Update state
      setFacebookAccount({
        id: userData.id,
        name: userData.name,
        picture: userData.picture?.data?.url || 'https://via.placeholder.com/100',
        access_token: data.access_token,
        connected: true
      });
      
      setFacebookPages(pagesData.data?.map((page: any) => ({
        id: page.id,
        name: page.name,
        picture: page.picture?.data?.url || 'https://via.placeholder.com/100',
        access_token: page.access_token,
        connected: false
      })) || []);
      
      setInstagramAccounts(instagramData.data?.map((account: any) => ({
        id: account.id,
        username: account.username,
        profile_picture_url: account.profile_picture_url || 'https://via.placeholder.com/100',
        connected: false
      })) || []);
      
      setConnectionStatus('connected');
      
      // Save to localStorage
      const connectionData = {
        user: {
          id: userData.id,
          name: userData.name,
          picture: userData.picture?.data?.url,
          access_token: data.access_token
        },
        pages: pagesData.data || [],
        instagram: instagramData.data || [],
        timestamp: Date.now()
      };
      
      localStorage.setItem('facebookConnection', JSON.stringify(connectionData));
      
    } catch (error) {
      console.error('Auth success handler error:', error);
      alert('Failed to complete Facebook authentication. Please try again.');
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Remove from localStorage
      localStorage.removeItem('facebookConnection');
      
      // Clear state
      setFacebookAccount(null);
      setFacebookPages([]);
      setInstagramAccounts([]);
      setConnectionStatus('disconnected');
      
      alert('Disconnected from Facebook successfully!');
    } catch (error) {
      console.error('Error disconnecting Meta accounts:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  const togglePageConnection = async (pageId: string, connect: boolean) => {
    try {
      const savedConnection = localStorage.getItem('facebookConnection');
      if (!savedConnection) {
        alert('No Facebook connection found. Please reconnect.');
        return;
      }
      
      const connectionData = JSON.parse(savedConnection);
      const response = await fetch(`${API_BASE}/api/facebook?action=toggle-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          connect,
          access_token: connectionData.user.access_token
        })
      });

      if (response.ok) {
        setFacebookPages(prev => 
          prev.map(page => 
            page.id === pageId ? { ...page, connected: connect } : page
          )
        );
        
        // Update localStorage
        connectionData.pages = connectionData.pages.map((page: any) => 
          page.id === pageId ? { ...page, connected: connect } : page
        );
        localStorage.setItem('facebookConnection', JSON.stringify(connectionData));
      } else {
        throw new Error('Failed to toggle page connection');
      }
    } catch (error) {
      console.error('Error toggling page connection:', error);
      alert('Failed to update page connection. Please try again.');
    }
  };

  const toggleInstagramConnection = async (accountId: string, connect: boolean) => {
    try {
      const savedConnection = localStorage.getItem('facebookConnection');
      if (!savedConnection) {
        alert('No Facebook connection found. Please reconnect.');
        return;
      }
      
      const connectionData = JSON.parse(savedConnection);
      const response = await fetch(`${API_BASE}/api/facebook?action=toggle-instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          connect,
          access_token: connectionData.user.access_token
        })
      });

      if (response.ok) {
        setInstagramAccounts(prev => 
          prev.map(account => 
            account.id === accountId ? { ...account, connected: connect } : account
          )
        );
        
        // Update localStorage
        connectionData.instagram = connectionData.instagram.map((account: any) => 
          account.id === accountId ? { ...account, connected: connect } : account
        );
        localStorage.setItem('facebookConnection', JSON.stringify(connectionData));
      } else {
        throw new Error('Failed to toggle Instagram connection');
      }
    } catch (error) {
      console.error('Error toggling Instagram connection:', error);
      alert('Failed to update Instagram connection. Please try again.');
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
