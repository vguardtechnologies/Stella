import React, { useState } from 'react';
import './OptInOutPage.css';

interface OptInOutPageProps {
  onClose: () => void;
}

interface OptInTemplate {
  id: string;
  name: string;
  message: string;
  type: 'opt-in' | 'opt-out' | 'order-confirmation';
}

const OptInOutPage: React.FC<OptInOutPageProps> = ({ onClose }) => {
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<'opt-in' | 'opt-out' | 'order-confirmation'>('opt-in');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Default templates
  const defaultTemplates: OptInTemplate[] = [
    {
      id: '1',
      name: 'Basic Opt-In',
      message: 'Hi! 👋 Would you like to receive updates about your orders and special offers? Reply YES to opt-in or NO to decline.',
      type: 'opt-in'
    },
    {
      id: '2',
      name: 'Simple Opt-Out',
      message: 'You can stop receiving messages anytime. Reply STOP to unsubscribe or CONTINUE to keep receiving updates.',
      type: 'opt-out'
    },
    {
      id: '3',
      name: 'Order Confirmation Card',
      message: '🛒 **Order Confirmation Required**\n\nOrder #{{ORDER_ID}}\nTotal: ${{TOTAL}}\nItems: {{ITEMS}}\n\n✅ **Confirm Order** - Reply YES\n❌ **Cancel Order** - Reply NO\n\n⚠️ *Orders not confirmed within 10 minutes will be automatically cancelled.*',
      type: 'order-confirmation'
    }
  ];

  const [templates, setTemplates] = useState<OptInTemplate[]>(defaultTemplates);

  // Mock contacts
  const mockContacts = [
    { id: '1', name: 'John Doe', phone: '+1234567890' },
    { id: '2', name: 'Jane Smith', phone: '+1234567891' },
    { id: '3', name: 'Mike Johnson', phone: '+1234567892' },
    { id: '4', name: 'Sarah Wilson', phone: '+1234567893' },
    { id: '5', name: 'David Brown', phone: '+1234567894' },
    { id: '6', name: 'Lisa Davis', phone: '+1234567895' }
  ];

  const handleSendOptInMessage = () => {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    console.log('Sending', messageType, 'message to:', selectedContacts);
    console.log('Message:', messageText);
    alert(`${messageType} message sent to ${selectedContacts.length} contact(s)!`);
  };

  const handleTemplateSelect = (template: OptInTemplate) => {
    setMessageText(template.message);
    setMessageType(template.type);
  };

  const handleSaveTemplate = () => {
    if (!messageText.trim()) {
      alert('Please enter a message to save as template');
      return;
    }

    const templateName = prompt('Enter template name:');
    if (templateName) {
      const newTemplate: OptInTemplate = {
        id: Date.now().toString(),
        name: templateName,
        message: messageText,
        type: messageType
      };
      setTemplates([...templates, newTemplate]);
      alert('Template saved successfully!');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const beforeCursor = messageText.substring(0, cursorPosition);
    const afterCursor = messageText.substring(cursorPosition);
    const newMessage = beforeCursor + emoji + afterCursor;
    setMessageText(newMessage);
    setCursorPosition(cursorPosition + emoji.length);
    setShowEmojiPicker(false);
  };

  const handleInsertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      alert('Please enter both link text and URL');
      return;
    }

    const linkMarkdown = `[${linkText}](${linkUrl})`;
    const beforeCursor = messageText.substring(0, cursorPosition);
    const afterCursor = messageText.substring(cursorPosition);
    const newMessage = beforeCursor + linkMarkdown + afterCursor;
    setMessageText(newMessage);
    setCursorPosition(cursorPosition + linkMarkdown.length);
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  // Common emojis for messaging
  const commonEmojis = [
    '😊', '👍', '❤️', '🎉', '✅', '📱', '💬', '🔔', '⭐', '🛍️',
    '💰', '🎁', '📦', '🚚', '🏠', '👥', '📞', '✨', '🌟', '💫',
    '🙌', '👋', '🤝', '💯', '🔥', '⚡', '🎯', '📈', '💡', '🔖'
  ];

  const getPlaceholderText = () => {
    switch (messageType) {
      case 'opt-in':
        return 'Enter your opt-in message here. Make sure to include clear YES/NO response instructions for customers.';
      case 'opt-out':
        return 'Enter your opt-out message here. Allow customers to easily unsubscribe from future messages.';
      case 'order-confirmation':
        return 'Enter your order confirmation message here. Use {{ORDER_ID}}, {{TOTAL}}, {{ITEMS}} placeholders. Include YES/NO voting options for customers to confirm or cancel their orders.';
      default:
        return 'Enter your message here...';
    }
  };

  return (
    <div className="opt-in-out-page">
      <div className="opt-in-out-container">
        <div className="opt-in-out-header">
          <h1>Customer Messaging & Order Confirmation</h1>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="opt-in-out-content">
          {/* Message Type Selection */}
          <div className="message-type-section">
            <h3>Message Type</h3>
            <div className="type-selector">
              <label className={`type-option ${messageType === 'opt-in' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="opt-in"
                  checked={messageType === 'opt-in'}
                  onChange={(e) => setMessageType(e.target.value as 'opt-in' | 'opt-out' | 'order-confirmation')}
                />
                <span className="type-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Opt-In Request
                </span>
                <small>Ask customers to consent to receive messages</small>
              </label>
              
              <label className={`type-option ${messageType === 'opt-out' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="opt-out"
                  checked={messageType === 'opt-out'}
                  onChange={(e) => setMessageType(e.target.value as 'opt-in' | 'opt-out' | 'order-confirmation')}
                />
                <span className="type-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Opt-Out Offer
                </span>
                <small>Allow customers to unsubscribe from messages</small>
              </label>

              <label className={`type-option ${messageType === 'order-confirmation' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="order-confirmation"
                  checked={messageType === 'order-confirmation'}
                  onChange={(e) => setMessageType(e.target.value as 'opt-in' | 'opt-out' | 'order-confirmation')}
                />
                <span className="type-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Order Confirmation Card
                </span>
                <small>Send voting cards for customers to confirm or cancel orders</small>
              </label>
            </div>
          </div>

          {/* Message Composer */}
          <div className="message-composer-section">
            <h3>Compose Message</h3>
            <div className="composer-controls">
              <div className="message-toolbar">
                <button 
                  type="button" 
                  className="toolbar-btn emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                >
                  😊
                </button>
                <button 
                  type="button" 
                  className="toolbar-btn link-btn"
                  onClick={() => setShowLinkModal(true)}
                  title="Insert link"
                >
                  🔗
                </button>
              </div>
              <textarea
                placeholder={getPlaceholderText()}
                value={messageText}
                onChange={handleTextareaChange}
                onClick={handleTextareaClick}
                onKeyUp={handleTextareaKeyUp}
                className="message-textarea"
                rows={6}
              />
              
              {showEmojiPicker && (
                <div className="emoji-picker">
                  <div className="emoji-picker-header">
                    <span>Select an emoji</span>
                    <button 
                      className="emoji-close-btn"
                      onClick={() => setShowEmojiPicker(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="emoji-grid">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        className="emoji-btn"
                        onClick={() => handleEmojiSelect(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="composer-actions">
                <button className="save-template-btn" onClick={handleSaveTemplate}>
                  Save as Template
                </button>
                <div className="character-count">
                  {messageText.length}/1000 characters
                </div>
              </div>
            </div>
          </div>

          {/* Link Modal */}
          {showLinkModal && (
            <div className="modal-overlay">
              <div className="link-modal">
                <div className="link-modal-header">
                  <h3>Insert Link</h3>
                  <button 
                    className="modal-close-btn"
                    onClick={() => setShowLinkModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="link-modal-content">
                  <div className="input-group">
                    <label>Link Text:</label>
                    <input
                      type="text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Enter text to display"
                    />
                  </div>
                  <div className="input-group">
                    <label>URL:</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="link-modal-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setShowLinkModal(false);
                        setLinkText('');
                        setLinkUrl('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="insert-btn"
                      onClick={handleInsertLink}
                      disabled={!linkText.trim() || !linkUrl.trim()}
                    >
                      Insert Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates Section */}
          <div className="templates-section">
            <h3>Message Templates</h3>
            <div className="templates-grid">
              {templates.map((template) => (
                <div key={template.id} className={`template-card ${template.type}`}>
                  <div className="template-header">
                    <h4>{template.name}</h4>
                    <span className="template-type">{template.type}</span>
                  </div>
                  <p className="template-preview">{template.message.substring(0, 100)}...</p>
                  <button
                    className="use-template-btn"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Selection */}
          <div className="contact-selection-section">
            <h3>Select Contacts</h3>
            <div className="contact-list">
              {mockContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`contact-item ${selectedContacts.includes(contact.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedContacts.includes(contact.id)) {
                      setSelectedContacts(selectedContacts.filter((id: string) => id !== contact.id));
                    } else {
                      setSelectedContacts([...selectedContacts, contact.id]);
                    }
                  }}
                >
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-phone">{contact.phone}</span>
                  </div>
                  {selectedContacts.includes(contact.id) && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message Preview & Send */}
          <div className="preview-section">
            <h3>Message Preview</h3>
            <div className="message-preview">
              <div className="whatsapp-preview">
                <div className="preview-header">WhatsApp Message</div>
                <div className="preview-content">
                  {messageText || 'Your message will appear here...'}
                </div>
                {messageType === 'order-confirmation' && (
                  <div className="voting-buttons-preview">
                    <button className="vote-yes">✅ YES - Confirm Order</button>
                    <button className="vote-no">❌ NO - Cancel Order</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send Actions */}
          <div className="send-actions">
            <div className="selected-count">
              {selectedContacts.length} contact(s) selected
            </div>
            <div className="response-buttons">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="send-btn" 
                onClick={handleSendOptInMessage}
                disabled={!messageText.trim() || selectedContacts.length === 0}
              >
                Send {messageType === 'order-confirmation' ? 'Voting Cards' : 'Messages'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptInOutPage;