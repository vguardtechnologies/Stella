import React, { useState, useEffect } from 'react';
import { facebookAPI } from '../api/facebook';
import type { FacebookPage, InstagramAccount, FacebookMedia, InstagramMedia } from '../api/facebook';
import './MediaBrowser.css';

interface MediaBrowserProps {
  onClose: () => void;
  onSelectMedia: (mediaUrl: string, caption?: string) => void;
}

interface ConnectedAccount {
  user: {
    id: string;
    name: string;
    picture: { data: { url: string } };
  };
  accessToken: string;
  pages: FacebookPage[];
  instagram: InstagramAccount[];
}

const MediaBrowser: React.FC<MediaBrowserProps> = ({ onClose, onSelectMedia }) => {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram'>('instagram');
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);
  const [selectedInstagram, setSelectedInstagram] = useState<InstagramAccount | null>(null);
  const [media, setMedia] = useState<(FacebookMedia | InstagramMedia)[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Load saved Facebook connection
  useEffect(() => {
    const savedConnection = localStorage.getItem('facebookConnection');
    if (savedConnection) {
      try {
        setConnectedAccount(JSON.parse(savedConnection));
      } catch (error) {
        console.error('Error loading Facebook connection:', error);
        localStorage.removeItem('facebookConnection');
      }
    }
  }, []);

  // Auto-select first Instagram account when available
  useEffect(() => {
    if (connectedAccount?.instagram && connectedAccount.instagram.length > 0 && !selectedInstagram) {
      setSelectedInstagram(connectedAccount.instagram[0]);
    }
  }, [connectedAccount, selectedInstagram]);

  // Load media when account/selection changes
  useEffect(() => {
    if (activeTab === 'instagram' && selectedInstagram && connectedAccount) {
      loadInstagramMedia(selectedInstagram.id);
    } else if (activeTab === 'facebook' && selectedPage && connectedAccount) {
      loadPageMedia(selectedPage.id);
    } else {
      // Clear media when no account is selected
      setMedia([]);
    }
  }, [activeTab, selectedInstagram, selectedPage, connectedAccount]);

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const code = await facebookAPI.openLoginPopup();
      const authResponse = await facebookAPI.exchangeCode(code);
      
      // Get Instagram accounts
      const instagramResponse = await facebookAPI.getInstagramAccounts(authResponse.accessToken);
      
      const account = {
        user: authResponse.user,
        accessToken: authResponse.accessToken,
        pages: authResponse.pages,
        instagram: instagramResponse.instagram
      };

      setConnectedAccount(account);
      localStorage.setItem('facebookConnection', JSON.stringify(account));

    } catch (error) {
      console.error('Facebook login error:', error);
      alert('Failed to connect to Facebook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadInstagramMedia = async (instagramId: string) => {
    if (!connectedAccount) return;
    
    setLoadingMedia(true);
    try {
      const response = await facebookAPI.getInstagramReels(instagramId, connectedAccount.accessToken);
      setMedia(response.reels);
    } catch (error) {
      console.error('Error loading Instagram media:', error);
      setMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const loadPageMedia = async (pageId: string) => {
    if (!connectedAccount) return;
    
    setLoadingMedia(true);
    try {
      const response = await facebookAPI.getPageMedia(pageId, connectedAccount.accessToken);
      setMedia(response.media);
    } catch (error) {
      console.error('Error loading page media:', error);
      setMedia([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleMediaSelect = (item: FacebookMedia | InstagramMedia) => {
    const mediaUrl = item.media_url;
    const caption = item.caption;
    onSelectMedia(mediaUrl, caption);
  };

  const handleDisconnect = () => {
    setConnectedAccount(null);
    setSelectedPage(null);
    setSelectedInstagram(null);
    setMedia([]);
    localStorage.removeItem('facebookConnection');
  };

  return (
    <div className="media-browser-overlay">
      <div className="media-browser-container">
        <div className="media-browser-header">
          <h2>Browse Media Content</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="media-browser-content">
          {!connectedAccount ? (
            <div className="connect-section">
              <div className="connect-prompt">
                <h3>Connect Your Social Media</h3>
                <p>Connect your Facebook and Instagram accounts to browse and share your content with customers.</p>
                <button 
                  className="connect-button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : '📘 Connect Facebook & Instagram'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Account Info */}
              <div className="account-header">
                <img 
                  src={connectedAccount.user.picture.data.url} 
                  alt={connectedAccount.user.name}
                  className="account-avatar"
                />
                <div className="account-info">
                  <h3>{connectedAccount.user.name}</h3>
                  <span>{connectedAccount.pages.length} pages, {connectedAccount.instagram.length} Instagram accounts</span>
                </div>
                <button className="disconnect-btn" onClick={handleDisconnect}>Disconnect</button>
              </div>

              {/* Platform Tabs */}
              <div className="platform-tabs">
                <button 
                  className={`tab ${activeTab === 'instagram' ? 'active' : ''}`}
                  onClick={() => setActiveTab('instagram')}
                >
                  📷 Instagram Reels
                </button>
                <button 
                  className={`tab ${activeTab === 'facebook' ? 'active' : ''}`}
                  onClick={() => setActiveTab('facebook')}
                >
                  📘 Facebook Posts
                </button>
              </div>

              {/* Account Selection */}
              {activeTab === 'instagram' && connectedAccount.instagram.length > 0 && (
                <div className="account-selector">
                  <label>Select Instagram Account:</label>
                  <select 
                    value={selectedInstagram?.id || ''} 
                    onChange={(e) => {
                      const account = connectedAccount.instagram.find(ig => ig.id === e.target.value);
                      setSelectedInstagram(account || null);
                    }}
                  >
                    {connectedAccount.instagram.map(ig => (
                      <option key={ig.id} value={ig.id}>{ig.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'facebook' && connectedAccount.pages.length > 0 && (
                <div className="account-selector">
                  <label>Select Facebook Page:</label>
                  <select 
                    value={selectedPage?.id || ''} 
                    onChange={(e) => {
                      const page = connectedAccount.pages.find(p => p.id === e.target.value);
                      setSelectedPage(page || null);
                    }}
                  >
                    <option value="">Choose a page...</option>
                    {connectedAccount.pages.map(page => (
                      <option key={page.id} value={page.id}>{page.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Media Grid */}
              <div className="media-content">
                {loadingMedia ? (
                  <div className="loading-media">
                    <div className="loading-spinner"></div>
                    <p>Loading {activeTab === 'instagram' ? 'Instagram reels' : 'Facebook posts'}...</p>
                  </div>
                ) : media.length > 0 ? (
                  <div className="media-grid">
                    {media.map((item) => (
                      <div 
                        key={item.id} 
                        className="media-item"
                        onClick={() => handleMediaSelect(item)}
                      >
                        <div className="media-thumbnail">
                          {'thumbnail_url' in item && item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="Media thumbnail" />
                          ) : 'media_url' in item ? (
                            <img src={item.media_url} alt="Media" />
                          ) : (
                            <div className="no-thumbnail">📹</div>
                          )}
                          <div className="media-overlay">
                            <span className="media-type">
                              {'media_type' in item ? item.media_type : item.type}
                            </span>
                          </div>
                        </div>
                        <div className="media-info">
                          <p className="media-caption">
                            {(item.caption || 'No caption').substring(0, 80)}...
                          </p>
                          <div className="media-stats">
                            <span>👍 {item.like_count || 0}</span>
                            <span>💬 {item.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-media">
                    <p>No {activeTab === 'instagram' ? 'reels' : 'posts'} found</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaBrowser;
