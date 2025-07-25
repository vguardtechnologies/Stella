import React, { useState } from 'react';
import './MultimediaMessageSender.css';

interface MultimediaMessageSenderProps {
  onSendMessage: (messageData: MultimediaMessageData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export interface MultimediaMessageData {
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  message?: string;
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
}

const MultimediaMessageSender: React.FC<MultimediaMessageSenderProps> = ({ 
  onSendMessage, 
  onCancel,
  isLoading = false 
}) => {
  const [messageType, setMessageType] = useState<'text' | 'image' | 'video' | 'audio' | 'document'>('text');
  const [textMessage, setTextMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    if (messageType === 'text' && !textMessage.trim()) return;
    if (messageType !== 'text' && !mediaUrl.trim()) return;

    const messageData: MultimediaMessageData = {
      type: messageType,
      message: messageType === 'text' ? textMessage : undefined,
      mediaUrl: messageType !== 'text' ? mediaUrl : undefined,
      fileName: messageType === 'document' ? fileName : undefined,
      caption: (messageType === 'image' || messageType === 'video' || messageType === 'document') ? caption : undefined
    };

    onSendMessage(messageData);
    
    // Clear form
    setTextMessage('');
    setMediaUrl('');
    setFileName('');
    setCaption('');
  };

  const isValidMessage = () => {
    if (messageType === 'text') return textMessage.trim().length > 0;
    return mediaUrl.trim().length > 0;
  };

  return (
    <div className="multimedia-sender">
      <div className="message-type-selector">
        <label>Message Type:</label>
        <select 
          value={messageType} 
          onChange={(e) => setMessageType(e.target.value as any)}
          className="type-select"
        >
          <option value="text">📝 Text</option>
          <option value="image">🖼️ Image</option>
          <option value="video">🎥 Video</option>
          <option value="audio">🎵 Audio</option>
          <option value="document">📄 Document</option>
        </select>
      </div>

      {messageType === 'text' ? (
        <div className="text-input-section">
          <textarea
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            placeholder="Type your message..."
            className="text-input"
            rows={3}
          />
        </div>
      ) : (
        <div className="media-input-section">
          <div className="input-group">
            <label>Media URL:</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={`Enter ${messageType} URL...`}
              className="media-url-input"
            />
          </div>

          {messageType === 'document' && (
            <div className="input-group">
              <label>File Name:</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name..."
                className="filename-input"
              />
            </div>
          )}

          {(messageType === 'image' || messageType === 'video' || messageType === 'document') && (
            <div className="input-group">
              <label>Caption (optional):</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="caption-input"
              />
            </div>
          )}
        </div>
      )}

      <div className="send-section">
        {onCancel && (
          <button
            onClick={onCancel}
            className="cancel-multimedia-btn"
          >
            ❌ Cancel
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={!isValidMessage() || isLoading}
          className="send-multimedia-btn"
        >
          {isLoading ? '⏳ Sending...' : '📤 Send Message'}
        </button>
      </div>

      <div className="format-help">
        <h4>Supported Formats:</h4>
        <ul>
          <li><strong>Images:</strong> JPEG, PNG, WebP (max 5MB)</li>
          <li><strong>Videos:</strong> MP4, 3GPP (max 16MB)</li>
          <li><strong>Audio:</strong> AAC, M4A, AMR, MP3, OGG (max 16MB)</li>
          <li><strong>Documents:</strong> PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (max 100MB)</li>
        </ul>
        <p><em>Note: Media files must be publicly accessible via HTTPS URL</em></p>
      </div>
    </div>
  );
};

export default MultimediaMessageSender;
