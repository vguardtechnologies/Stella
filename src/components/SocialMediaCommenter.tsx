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
  platform_type?: string;
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
  auto_reply?: boolean;
  autoReply: boolean;
  response_delay?: number;
  responseDelay: number; // in seconds
  personality_prompt?: string;
  personalityPrompt: string;
}

interface Comment {
  id: number;
  comment_text: string;
  author_name: string;
  author_handle: string;
  post_title: string;
  post_url: string;
  platform_name: string;
  platform_icon: string;
  status: string;
  created_at: string;
}

const SocialMediaCommenter: React.FC<SocialMediaCommenterProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'ai-config' | 'activity' | 'comments'>('comments');
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    enabled: false,
    model: 'llama-3.2-1b-q4',
    autoReply: false,
    auto_reply: false,
    responseDelay: 30,
    response_delay: 30,
    personalityPrompt: 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.',
    personality_prompt: 'You are a helpful customer service representative. Respond professionally and friendly to customer comments.'
  });

  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState<number | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu !== null) {
        const target = event.target as Element;
        if (!target.closest('.comment-menu')) {
          setShowMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load platforms
        const platformsResponse = await fetch('http://localhost:3000/api/social-commenter?action=platforms');
        const platformsData = await platformsResponse.json();
        
        if (platformsData.success) {
          const transformedPlatforms = platformsData.platforms.map((p: any) => ({
            id: p.platform_type,
            name: p.name,
            icon: p.icon,
            connected: p.connected,
            platform_type: p.platform_type,
            accountInfo: p.account_info,
            lastActivity: p.last_activity ? new Date(p.last_activity) : undefined
          }));
          setPlatforms(transformedPlatforms);
        }

        // Load AI config
        const aiConfigResponse = await fetch('http://localhost:3000/api/social-commenter?action=ai-config');
        const aiConfigData = await aiConfigResponse.json();
        
        if (aiConfigData.success) {
          const config = aiConfigData.config;
          setAiConfig({
            enabled: config.enabled,
            model: config.model,
            autoReply: config.auto_reply,
            auto_reply: config.auto_reply,
            responseDelay: config.response_delay,
            response_delay: config.response_delay,
            personalityPrompt: config.personality_prompt,
            personality_prompt: config.personality_prompt
          });
        }

        // Load comments
        const commentsResponse = await fetch('http://localhost:3000/api/social-commenter?action=comments&status=pending');
        const commentsData = await commentsResponse.json();
        
        if (commentsData.success) {
          console.log('Comments loaded:', commentsData.comments);
          setComments(commentsData.comments);
        } else {
          console.log('No comments loaded:', commentsData);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

        <div className="ai-config-actions">
          <button className="save-config-btn" onClick={handleSaveAIConfig}>
            💾 Save Configuration
          </button>
          <button className="test-ai-btn" onClick={handleTestAI} disabled={!aiConfig.enabled}>
            🧪 Test AI Response
          </button>
        </div>
      </div>
    </div>
  );

  const handleSaveAIConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/social-commenter?action=update-ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            enabled: aiConfig.enabled,
            model: aiConfig.model,
            autoReply: aiConfig.autoReply,
            responseDelay: aiConfig.responseDelay,
            personalityPrompt: aiConfig.personalityPrompt
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('AI configuration saved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving AI config:', error);
      alert('Failed to save AI configuration');
    }
  };

  const handleTestAI = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/social-commenter?action=ai-respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: 0, // Test comment
          commentText: "This looks great! How much does it cost?",
          postContext: "Product showcase post"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Test AI Response:\n\n${data.response}\n\nConfidence: ${(data.confidence * 100).toFixed(1)}%`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      alert('Failed to test AI response');
    }
  };

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

  const renderCommentsTab = () => (
    <div className="comments-tab">
      <div className="tab-header">
        <h3>💬 Pending Comments</h3>
        <p>Manage and respond to comments from all platforms</p>
        <div className="comments-summary">
          <span className="count">{comments.length} pending</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">
          <div className="empty-state">
            <h4>🎉 All caught up!</h4>
            <p>No pending comments at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <div className="platform-info">
                  <span className="platform-icon">{comment.platform_icon}</span>
                  <span className="platform-name">{comment.platform_name}</span>
                </div>
                <div className="comment-meta">
                  <span className="comment-time">
                    {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()}
                  </span>
                  <div className="comment-menu">
                    <button 
                      className="menu-trigger"
                      onClick={() => {
                        console.log('Menu clicked for comment:', comment.id);
                        setShowMenu(showMenu === comment.id ? null : comment.id);
                      }}
                      title="Comment options"
                    >
                      ⋯
                    </button>
                    {showMenu === comment.id && (
                      <div className="menu-dropdown">
                        <button 
                          className="menu-item hide-option"
                          onClick={() => {
                            setShowMenu(null);
                            handleHideComment(comment);
                          }}
                        >
                          👁️‍🗨️ Hide Comment
                        </button>
                        <button 
                          className="menu-item delete-option"
                          onClick={() => {
                            setShowMenu(null);
                            handleDeleteComment(comment);
                          }}
                        >
                          🗑️ Delete Comment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="comment-content">
                <div className="post-context">
                  <strong>Post:</strong> {comment.post_title}
                </div>
                <div className="comment-text">
                  <strong>{comment.author_name} ({comment.author_handle}):</strong>
                  <p>{comment.comment_text}</p>
                </div>
              </div>

              <div className="comment-actions">
                <button 
                  className="action-btn ai-response"
                  onClick={() => handleGenerateAIResponse(comment)}
                >
                  🤖 AI Response
                </button>
                <button 
                  className="action-btn manual-reply"
                  onClick={() => handleManualReply(comment)}
                >
                  ✍️ Reply
                </button>
                <button 
                  className="action-btn mark-handled"
                  onClick={() => handleMarkHandled(comment)}
                >
                  ✅ Mark Handled
                </button>
                <a 
                  href={comment.post_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn view-post"
                >
                  👀 View Post
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleGenerateAIResponse = async (comment: Comment) => {
    try {
      const response = await fetch('http://localhost:3000/api/social-commenter?action=ai-respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id,
          commentText: comment.comment_text,
          postContext: comment.post_title
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`AI Suggestion:\n\n${data.response}\n\nConfidence: ${(data.confidence * 100).toFixed(1)}%`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      alert('Failed to generate AI response');
    }
  };

  const handleManualReply = (comment: Comment) => {
    const replyText = prompt(`Reply to ${comment.author_name}:\n\n"${comment.comment_text}"\n\nYour reply:`);
    if (replyText) {
      sendReply(comment, replyText);
    }
  };

  const sendReply = async (comment: Comment, replyText: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/social-commenter?action=send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id,
          replyText,
          platform: comment.platform_name.toLowerCase()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Reply sent successfully!');
        // Remove comment from pending list
        setComments(prev => prev.filter(c => c.id !== comment.id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    }
  };

  const handleMarkHandled = async (comment: Comment) => {
    try {
      const response = await fetch('http://localhost:3000/api/social-commenter?action=mark-handled', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId: comment.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove comment from pending list
        setComments(prev => prev.filter(c => c.id !== comment.id));
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error marking comment as handled:', error);
      alert('Failed to mark comment as handled');
    }
  };

  const handleHideComment = async (comment: Comment) => {
    try {
      const confirmHide = window.confirm(
        `Are you sure you want to hide this comment from ${comment.author_name}?\n\n"${comment.comment_text}"\n\nThis will remove it from your pending list but keep it in the database.`
      );
      
      if (!confirmHide) return;

      const response = await fetch(`http://localhost:3000/api/social-commenter?action=hide-comment&commentId=${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove comment from pending list
        setComments(prev => prev.filter(c => c.id !== comment.id));
        alert('Comment hidden successfully');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error hiding comment:', error);
      alert('Failed to hide comment');
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    try {
      const confirmDelete = window.confirm(
        `⚠️ Are you sure you want to PERMANENTLY DELETE this comment from ${comment.author_name}?\n\n"${comment.comment_text}"\n\nThis action CANNOT be undone and will remove the comment completely from the database.`
      );
      
      if (!confirmDelete) return;

      // Double confirmation for delete
      const doubleConfirm = window.confirm(
        `🚨 FINAL CONFIRMATION 🚨\n\nThis will PERMANENTLY DELETE the comment. Are you absolutely sure?\n\nClick OK to delete forever, or Cancel to abort.`
      );
      
      if (!doubleConfirm) return;

      const response = await fetch(`http://localhost:3000/api/social-commenter?action=delete-comment&commentId=${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove comment from pending list
        setComments(prev => prev.filter(c => c.id !== comment.id));
        alert('Comment permanently deleted');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

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
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          💬 Comments
        </button>
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
        {activeTab === 'comments' && renderCommentsTab()}
        {activeTab === 'connections' && renderConnectionsTab()}
        {activeTab === 'ai-config' && renderAIConfigTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </div>
    </div>
  );
};

export default SocialMediaCommenter;
