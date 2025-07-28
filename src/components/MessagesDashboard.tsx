import React, { useState, useEffect } from 'react';
import './MessagesDashboard.css';

interface Message {
  id: number;
  whatsapp_message_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  message_type: string;
  content: string;
  media_url?: string;
  media_mime_type?: string;
  voice_duration?: number;
  timestamp: string;
  status: string;
  created_at: string;
  display_name?: string;
  profile_name?: string;
}

interface Conversation {
  id: number;
  phone_number: string;
  display_name?: string;
  profile_name?: string;
  last_message_at: string;
  last_message?: string;
  last_message_type?: string;
  last_message_timestamp?: string;
}

interface Stats {
  totalConversations: number;
  totalMessages: number;
  incomingMessages: number;
  outgoingMessages: number;
  messagesByType: Array<{ message_type: string; count: string }>;
  recentActivity: number;
}

const MessagesDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations`);
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      setError('Failed to fetch conversations');
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (phoneNumber: string) => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations/${phoneNumber}`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.data.reverse()); // Reverse to show newest first
      }
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Error fetching messages:', err);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchConversations(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleConversationClick = (phoneNumber: string) => {
    setSelectedConversation(phoneNumber);
    fetchMessages(phoneNumber);
  };

  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) * 1000 : timestamp);
    return date.toLocaleString();
  };

  const renderMessageContent = (message: Message) => {
    switch (message.message_type) {
      case 'text':
        return <div className="message-text">{message.content}</div>;
      case 'voice':
        return (
          <div className="message-voice">
            🎵 Voice message ({message.voice_duration}s)
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'image':
        return (
          <div className="message-image">
            📷 Image
            {message.content && <div className="caption">{message.content}</div>}
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'document':
        return (
          <div className="message-document">
            📄 Document
            {message.content && <div className="filename">{message.content}</div>}
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'audio':
        return (
          <div className="message-audio">
            🎵 Audio
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'video':
        return (
          <div className="message-video">
            🎥 Video
            {message.content && <div className="caption">{message.content}</div>}
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'sticker':
        return (
          <div className="message-sticker">
            😄 Sticker
            {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
          </div>
        );
      case 'location':
        return (
          <div className="message-location">
            📍 Location
            {message.content && <div className="location-data">{message.content}</div>}
          </div>
        );
      default:
        return <div className="message-other">{message.content || 'Unknown message type'}</div>;
    }
  };

  if (loading) {
    return <div className="messages-dashboard loading">Loading messages...</div>;
  }

  if (error) {
    return <div className="messages-dashboard error">Error: {error}</div>;
  }

  return (
    <div className="messages-dashboard">
      <div className="dashboard-header">
        <h2>WhatsApp Messages Dashboard</h2>
        <button 
          className="refresh-button"
          onClick={() => {
            fetchConversations();
            fetchStats();
            if (selectedConversation) {
              fetchMessages(selectedConversation);
            }
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-section">
          <div className="stat-card">
            <h3>📊 Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Conversations:</span>
                <span className="stat-value">{stats.totalConversations}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Messages:</span>
                <span className="stat-value">{stats.totalMessages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Incoming:</span>
                <span className="stat-value">{stats.incomingMessages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Outgoing:</span>
                <span className="stat-value">{stats.outgoingMessages}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Recent Activity (24h):</span>
                <span className="stat-value">{stats.recentActivity}</span>
              </div>
            </div>
            
            {stats.messagesByType.length > 0 && (
              <div className="message-types">
                <h4>Message Types:</h4>
                {stats.messagesByType.map((type, index) => (
                  <div key={index} className="type-item">
                    <span>{type.message_type}:</span>
                    <span>{type.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Conversations List */}
        <div className="conversations-panel">
          <h3>💬 Conversations ({conversations.length})</h3>
          {conversations.length === 0 ? (
            <div className="no-conversations">
              No conversations yet. Send a message to your WhatsApp Business number to get started!
            </div>
          ) : (
            <div className="conversations-list">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation === conv.phone_number ? 'selected' : ''}`}
                  onClick={() => handleConversationClick(conv.phone_number)}
                >
                  <div className="conversation-header">
                    <div className="phone-number">{conv.phone_number}</div>
                    <div className="last-message-time">
                      {formatTimestamp(conv.last_message_timestamp || conv.last_message_at)}
                    </div>
                  </div>
                  <div className="conversation-preview">
                    {conv.display_name && <div className="display-name">{conv.display_name}</div>}
                    {conv.last_message && (
                      <div className="last-message">
                        {conv.last_message_type === 'text' 
                          ? conv.last_message 
                          : `${conv.last_message_type} message`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages Panel */}
        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <h3>📱 Messages with {selectedConversation}</h3>
              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="no-messages">No messages in this conversation</div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-item ${message.direction}`}
                    >
                      <div className="message-header">
                        <span className="message-type">{message.message_type}</span>
                        <span className="message-time">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        <span className="message-status">{message.status}</span>
                      </div>
                      <div className="message-content">
                        {renderMessageContent(message)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="select-conversation">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesDashboard;
