import React, { useState, useEffect } from 'react';
import './SocialMediaCommenter.css';

interface SocialMediaCommenterProps {
  onClose: () => void;
}

interface PlatformConnection {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  accountInfo?: {
    name: string;
    handle: string;
    avatar?: string;
    followers?: number;
  };
  lastActivity?: Date;
}

interface AIConfig {
  enabled: boolean;
  model: string;
  autoReply: boolean;
  responseDelay: number; // in seconds
  personalityPrompt: string;
}

const SocialMediaCommenter: React.FC<SocialMediaCommenterProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'ai-config' | 'activity'>('connections');
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    {
      id: 'facebook',
      name: 'Facebook Pages',
      icon: '📘',
      connected: false,
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      icon: '📷',
      connected: false,
    },
    {
      id: 'tiktok',
      name: 'TikTok Business',
      icon: '🎵',
      connected: false,
    },
    {
      id: 'facebook-ads',
      name: 'Facebook Ads',
      icon: '📊',
      connected: false,
    }
  ]);

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    enabled: false,
    model: 'llama-3.2-1b-q4',
    autoReply: false,
    responseDelay: 30,
    personalityPrompt: 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.'
  });

  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Check existing Facebook connection
  useEffect(() => {
    const checkFacebookConnection = () => {
      const savedConnection = localStorage.getItem('facebookConnection');
      if (savedConnection) {
        try {
          const connection = JSON.parse(savedConnection);
          if (connection.connected) {
            setPlatforms(prev => 
              prev.map(platform => 
                platform.id === 'facebook' || platform.id === 'instagram' ? 
                  { ...platform, connected: true, accountInfo: connection.accountInfo } : 
                  platform
              )
            );
          }
        } catch (error) {
          console.error('Error checking Facebook connection:', error);
        }
      }
    };

    checkFacebookConnection();
  }, []);

  const handlePlatformConnection = async (platformId: string) => {
    setIsConnecting(platformId);

    try {
      if (platformId === 'facebook' || platformId === 'instagram' || platformId === 'facebook-ads') {
        // Use existing Facebook connection if available
        const savedConnection = localStorage.getItem('facebookConnection');
        if (savedConnection) {
          const connection = JSON.parse(savedConnection);
          if (connection.connected) {
            setPlatforms(prev => 
              prev.map(platform => 
                platform.id === platformId ? 
                  { 
                    ...platform, 
                    connected: true, 
                    accountInfo: connection.accountInfo,
                    lastActivity: new Date()
                  } : 
                  platform
              )
            );
            setIsConnecting(null);
            return;
          }
        }

        // Redirect to Facebook integration for new connections
        alert('Please connect Facebook first from the main Facebook integration button in the action bar, then return here to enable comment management.');
        setIsConnecting(null);
        return;
      }

      if (platformId === 'tiktok') {
        // TikTok connection - placeholder for now
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setPlatforms(prev => 
          prev.map(platform => 
            platform.id === 'tiktok' ? 
              { 
                ...platform, 
                connected: true,
                accountInfo: {
                  name: 'Demo TikTok Business',
                  handle: '@demobusiness',
                  followers: 15400
                },
                lastActivity: new Date()
              } : 
              platform
          )
        );
      }

    } catch (error) {
      console.error(`Error connecting to ${platformId}:`, error);
      alert(`Failed to connect to ${platformId}. Please try again.`);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDisconnectPlatform = (platformId: string) => {
    setPlatforms(prev => 
      prev.map(platform => 
        platform.id === platformId ? 
          { ...platform, connected: false, accountInfo: undefined, lastActivity: undefined } : 
          platform
      )
    );
  };

  const renderConnectionsTab = () => (
    <div className="connections-tab">
      <div className="tab-header">
        <h3>🔗 Platform Connections</h3>
        <p>Connect your social media accounts to enable comment management</p>
      </div>

      <div className="platforms-grid">
        {platforms.map((platform) => (
          <div key={platform.id} className={`platform-card ${platform.connected ? 'connected' : ''}`}>
            <div className="platform-header">
              <span className="platform-icon">{platform.icon}</span>
              <div className="platform-info">
                <h4>{platform.name}</h4>
                {platform.connected && platform.accountInfo && (
                  <div className="account-details">
                    <p className="account-name">{platform.accountInfo.name}</p>
                    {platform.accountInfo.handle && (
                      <p className="account-handle">{platform.accountInfo.handle}</p>
                    )}
                    {platform.accountInfo.followers && (
                      <p className="followers-count">{platform.accountInfo.followers.toLocaleString()} followers</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="platform-actions">
              {platform.connected ? (
                <div className="connected-actions">
                  <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span>Connected</span>
                  </div>
                  <button 
                    className="disconnect-btn"
                    onClick={() => handleDisconnectPlatform(platform.id)}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button 
                  className="connect-btn"
                  onClick={() => handlePlatformConnection(platform.id)}
                  disabled={isConnecting === platform.id}
                >
                  {isConnecting === platform.id ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {platform.lastActivity && (
              <div className="last-activity">
                <small>Last activity: {platform.lastActivity.toLocaleDateString()}</small>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="connection-info">
        <div className="info-card">
          <h4>💡 How It Works</h4>
          <ul>
            <li>Connect your social media accounts</li>
            <li>New comments on posts/reels appear in chat conversations</li>
            <li>Respond directly from the chat interface</li>
            <li>AI can suggest replies or auto-respond (when enabled)</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderAIConfigTab = () => (
    <div className="ai-config-tab">
      <div className="tab-header">
        <h3>🤖 AI Comment Responder</h3>
        <p>Configure AI-powered automatic responses to social media comments</p>
      </div>

      <div className="config-section">
        <div className="config-group">
          <label className="config-label">
            <input
              type="checkbox"
              checked={aiConfig.enabled}
              onChange={(e) => setAiConfig(prev => ({ ...prev, enabled: e.target.checked }))}
            />
            <span>Enable AI Comment Responder</span>
          </label>
          <p className="config-description">Allow AI to analyze and suggest responses to comments</p>
        </div>

        <div className="config-group">
          <label htmlFor="ai-model">AI Model</label>
          <select
            id="ai-model"
            value={aiConfig.model}
            onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
            disabled={!aiConfig.enabled}
          >
            <option value="llama-3.2-1b-q4">Llama 3.2 1B (Recommended)</option>
            <option value="llama-3.2-3b-q4">Llama 3.2 3B (Higher Quality)</option>
            <option value="phi-3-mini-q4">Phi-3 Mini (Faster)</option>
          </select>
          <p className="config-description">Choose the AI model for generating responses</p>
        </div>

        <div className="config-group">
          <label className="config-label">
            <input
              type="checkbox"
              checked={aiConfig.autoReply}
              onChange={(e) => setAiConfig(prev => ({ ...prev, autoReply: e.target.checked }))}
              disabled={!aiConfig.enabled}
            />
            <span>Auto-Reply to Comments</span>
          </label>
          <p className="config-description">⚠️ Automatically send AI responses (use with caution)</p>
        </div>

        <div className="config-group">
          <label htmlFor="response-delay">Response Delay (seconds)</label>
          <input
            id="response-delay"
            type="range"
            min="10"
            max="300"
            value={aiConfig.responseDelay}
            onChange={(e) => setAiConfig(prev => ({ ...prev, responseDelay: parseInt(e.target.value) }))}
            disabled={!aiConfig.enabled || !aiConfig.autoReply}
          />
          <div className="range-value">{aiConfig.responseDelay} seconds</div>
          <p className="config-description">Delay before auto-sending responses</p>
        </div>

        <div className="config-group">
          <label htmlFor="personality-prompt">AI Personality & Instructions</label>
          <textarea
            id="personality-prompt"
            value={aiConfig.personalityPrompt}
            onChange={(e) => setAiConfig(prev => ({ ...prev, personalityPrompt: e.target.value }))}
            disabled={!aiConfig.enabled}
            rows={4}
            placeholder="Describe how the AI should respond to comments..."
          />
          <p className="config-description">Define the AI's tone, style, and response guidelines</p>
        </div>

        <div className="ai-status">
          <div className="status-indicator">
            <span className={`status-dot ${aiConfig.enabled ? 'active' : ''}`}></span>
            <span>AI Responder: {aiConfig.enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          {aiConfig.enabled && (
            <div className="ai-details">
              <p>Model: {aiConfig.model}</p>
              <p>Auto-Reply: {aiConfig.autoReply ? 'On' : 'Off'}</p>
              {aiConfig.autoReply && <p>Delay: {aiConfig.responseDelay}s</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivityTab = () => (
    <div className="activity-tab">
      <div className="tab-header">
        <h3>📊 Recent Activity</h3>
        <p>Monitor comment interactions and AI responses</p>
      </div>

      <div className="activity-list">
        <div className="activity-item">
          <div className="activity-icon">📘</div>
          <div className="activity-content">
            <h4>New comment on Facebook post</h4>
            <p>"Great product! When will this be back in stock?"</p>
            <div className="activity-meta">
              <span>2 minutes ago</span> • <span>@customer_jane</span>
            </div>
          </div>
          <div className="activity-status pending">Pending Response</div>
        </div>

        <div className="activity-item">
          <div className="activity-icon">📷</div>
          <div className="activity-content">
            <h4>AI responded to Instagram comment</h4>
            <p>"Thank you for your interest! We'll have more stock next week. 😊"</p>
            <div className="activity-meta">
              <span>5 minutes ago</span> • <span>@user_mike</span>
            </div>
          </div>
          <div className="activity-status replied">AI Replied</div>
        </div>

        <div className="activity-item">
          <div className="activity-icon">🎵</div>
          <div className="activity-content">
            <h4>New comment on TikTok video</h4>
            <p>"This looks amazing! Where can I buy it?"</p>
            <div className="activity-meta">
              <span>15 minutes ago</span> • <span>@tiktok_user</span>
            </div>
          </div>
          <div className="activity-status manual">Manual Reply Sent</div>
        </div>
      </div>

      <div className="activity-stats">
        <div className="stat-card">
          <h4>Today's Activity</h4>
          <div className="stat-number">12</div>
          <div className="stat-label">Comments</div>
        </div>
        <div className="stat-card">
          <h4>AI Responses</h4>
          <div className="stat-number">8</div>
          <div className="stat-label">Auto Sent</div>
        </div>
        <div className="stat-card">
          <h4>Response Time</h4>
          <div className="stat-number">2.5m</div>
          <div className="stat-label">Average</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="social-media-commenter">
      <div className="commenter-header">
        <div className="header-content">
          <h2>💬 Social Media Comment Manager</h2>
          <p>AI-powered comment management for Facebook, Instagram, TikTok & Facebook Ads</p>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="commenter-tabs">
        <button 
          className={`tab-btn ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          🔗 Connections
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ai-config' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-config')}
        >
          🤖 AI Config
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📊 Activity
        </button>
      </div>

      <div className="commenter-content">
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'ai-config' && renderAIConfigTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>
    </div>
  );
};

export default SocialMediaCommenter;
