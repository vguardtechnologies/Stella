import React, { useState, useEffect } from 'react';
import './GmailIntegration.css';

interface GmailIntegrationProps {
  onClose: () => void;
}

interface GmailAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GmailEmail {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      data?: string;
      size: number;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
        size: number;
      };
    }>;
  };
  internalDate: string;
  labelIds: string[];
}

interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

const GmailIntegration: React.FC<GmailIntegrationProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Gmail OAuth configuration
  const GMAIL_CLIENT_ID = import.meta.env.VITE_GMAIL_CLIENT_ID || 'your-gmail-client-id';
  const GMAIL_REDIRECT_URI = import.meta.env.VITE_GMAIL_REDIRECT_URI || window.location.origin + '/gmail-callback';
  const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';

  useEffect(() => {
    // Check if we have a stored auth token
    const storedToken = localStorage.getItem('gmail_access_token');
    const tokenExpiry = localStorage.getItem('gmail_token_expiry');
    
    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      if (Date.now() < expiryTime) {
        setAuthToken(storedToken);
        setIsAuthenticated(true);
        fetchProfile(storedToken);
        fetchEmails(storedToken);
      } else {
        // Token expired, remove it
        localStorage.removeItem('gmail_access_token');
        localStorage.removeItem('gmail_token_expiry');
      }
    }

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'gmail_auth') {
      handleOAuthCallback(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const initiateGmailAuth = () => {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GMAIL_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(GMAIL_SCOPE)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=gmail_auth`;
    
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Exchange authorization code for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID,
          client_secret: import.meta.env.VITE_GMAIL_CLIENT_SECRET || 'your-client-secret',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: GMAIL_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code for token');
      }

      const tokenData: GmailAuthResponse = await response.json();
      
      // Store the token
      const expiryTime = Date.now() + (tokenData.expires_in * 1000);
      localStorage.setItem('gmail_access_token', tokenData.access_token);
      localStorage.setItem('gmail_token_expiry', expiryTime.toString());
      
      if (tokenData.refresh_token) {
        localStorage.setItem('gmail_refresh_token', tokenData.refresh_token);
      }

      setAuthToken(tokenData.access_token);
      setIsAuthenticated(true);
      
      // Fetch user data
      await fetchProfile(tokenData.access_token);
      await fetchEmails(tokenData.access_token);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to authenticate with Gmail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Gmail profile');
      }

      const profileData: GmailProfile = await response.json();
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch Gmail profile');
    }
  };

  const fetchEmails = async (token: string, maxResults: number = 10) => {
    setIsLoading(true);
    try {
      // First, get the list of message IDs
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error('Failed to fetch email list');
      }

      const listData = await listResponse.json();
      
      if (!listData.messages || listData.messages.length === 0) {
        setEmails([]);
        return;
      }

      // Fetch detailed information for each email
      const emailPromises = listData.messages.map(async (message: { id: string }) => {
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          return response.json();
        }
        return null;
      });

      const emailsData = await Promise.all(emailPromises);
      const validEmails = emailsData.filter(email => email !== null);
      setEmails(validEmails);

    } catch (error) {
      console.error('Error fetching emails:', error);
      setError('Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_token_expiry');
    localStorage.removeItem('gmail_refresh_token');
    setIsAuthenticated(false);
    setAuthToken(null);
    setProfile(null);
    setEmails([]);
    setSelectedEmail(null);
    setError(null);
  };

  const getEmailHeader = (email: GmailEmail, headerName: string): string => {
    const header = email.payload.headers.find(h => h.name.toLowerCase() === headerName.toLowerCase());
    return header?.value || '';
  };

  const formatDate = (internalDate: string): string => {
    const date = new Date(parseInt(internalDate));
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const decodeEmailBody = (data: string): string => {
    try {
      // Gmail API returns base64url encoded data
      const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
      return decoded;
    } catch (error) {
      console.error('Error decoding email body:', error);
      return 'Unable to decode email content';
    }
  };

  const getEmailBody = (email: GmailEmail): string => {
    // Try to get HTML content first, then plain text
    if (email.payload.parts) {
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/html' && part.body.data) {
          return decodeEmailBody(part.body.data);
        }
      }
      for (const part of email.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          return decodeEmailBody(part.body.data);
        }
      }
    }
    
    if (email.payload.body.data) {
      return decodeEmailBody(email.payload.body.data);
    }
    
    return email.snippet || 'No content available';
  };

  const refreshEmails = () => {
    if (authToken) {
      fetchEmails(authToken);
    }
  };

  return (
    <div className="gmail-integration">
      <div className="gmail-container">
        {/* Header */}
        <div className="gmail-header">
          <div className="gmail-header-content">
            <div className="gmail-title">
              <span className="gmail-icon">📧</span>
              <h1>Gmail Integration</h1>
            </div>
            {isAuthenticated && profile && (
              <div className="gmail-profile-info">
                <span className="gmail-email">{profile.emailAddress}</span>
                <span className="gmail-stats">{profile.messagesTotal} emails</span>
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Main Content */}
        <div className="gmail-content">
          {!isAuthenticated ? (
            /* Authentication Screen */
            <div className="gmail-auth-screen">
              <div className="auth-container">
                <div className="auth-icon">📧</div>
                <h2>Connect Your Gmail Account</h2>
                <p>
                  Connect your Gmail account to manage emails directly within Stella. 
                  You'll be able to read, search, and manage your emails seamlessly.
                </p>
                
                <div className="auth-features">
                  <div className="feature-item">
                    <span className="feature-icon">📬</span>
                    <span>Read and manage inbox</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔍</span>
                    <span>Search through emails</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📤</span>
                    <span>Send replies</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔒</span>
                    <span>Secure OAuth authentication</span>
                  </div>
                </div>

                <button 
                  className="gmail-auth-btn"
                  onClick={initiateGmailAuth}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Connect Gmail Account'}
                </button>

                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Email Management Interface */
            <div className="gmail-interface">
              <div className="gmail-sidebar">
                {/* Email List */}
                <div className="emails-panel">
                  <div className="emails-header">
                    <h3>Inbox</h3>
                    <div className="emails-actions">
                      <button 
                        className="refresh-btn"
                        onClick={refreshEmails}
                        disabled={isLoading}
                        title="Refresh emails"
                      >
                        {isLoading ? '⟳' : '↻'}
                      </button>
                      <button 
                        className="disconnect-btn"
                        onClick={handleDisconnect}
                        title="Disconnect Gmail"
                      >
                        🔌
                      </button>
                    </div>
                  </div>

                  <div className="emails-list">
                    {isLoading && emails.length === 0 ? (
                      <div className="loading-message">
                        <div className="loading-spinner"></div>
                        <span>Loading emails...</span>
                      </div>
                    ) : emails.length === 0 ? (
                      <div className="no-emails">
                        <span className="no-emails-icon">📭</span>
                        <p>No emails found</p>
                      </div>
                    ) : (
                      emails.map((email) => (
                        <div
                          key={email.id}
                          className={`email-item ${selectedEmail?.id === email.id ? 'selected' : ''}`}
                          onClick={() => setSelectedEmail(email)}
                        >
                          <div className="email-sender">
                            {getEmailHeader(email, 'from').split('<')[0].trim() || 'Unknown Sender'}
                          </div>
                          <div className="email-subject">
                            {getEmailHeader(email, 'subject') || 'No Subject'}
                          </div>
                          <div className="email-snippet">
                            {email.snippet}
                          </div>
                          <div className="email-date">
                            {formatDate(email.internalDate)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Email Content Viewer */}
              <div className="gmail-main">
                {selectedEmail ? (
                  <div className="email-viewer">
                    <div className="email-header">
                      <h2 className="email-subject">
                        {getEmailHeader(selectedEmail, 'subject') || 'No Subject'}
                      </h2>
                      <div className="email-meta">
                        <div className="email-from">
                          <strong>From:</strong> {getEmailHeader(selectedEmail, 'from')}
                        </div>
                        <div className="email-to">
                          <strong>To:</strong> {getEmailHeader(selectedEmail, 'to')}
                        </div>
                        <div className="email-date">
                          <strong>Date:</strong> {formatDate(selectedEmail.internalDate)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="email-content">
                      <div 
                        className="email-body"
                        dangerouslySetInnerHTML={{ __html: getEmailBody(selectedEmail) }}
                      />
                    </div>

                    <div className="email-actions">
                      <button className="email-action-btn reply-btn">
                        📝 Reply
                      </button>
                      <button className="email-action-btn forward-btn">
                        📤 Forward
                      </button>
                      <button className="email-action-btn archive-btn">
                        📁 Archive
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-email-selected">
                    <div className="no-email-icon">📧</div>
                    <h3>Select an email to view</h3>
                    <p>Choose an email from the list to read its content</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailIntegration;
