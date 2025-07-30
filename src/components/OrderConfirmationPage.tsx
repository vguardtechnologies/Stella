import React, { useState } from 'react';
import './OrderConfirmationPage.css';

interface OrderConfirmationPageProps {
  onClose: () => void;
}

interface OrderTemplate {
  id: string;
  name: string;
  message: string;
  category: 'delivery' | 'pickup' | 'delay' | 'ready';
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderItems: string;
  totalAmount: number;
  orderDate: string;
  status: 'pending' | 'ready' | 'delivered';
}

const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ onClose }) => {
  const [messageText, setMessageText] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [messageCategory, setMessageCategory] = useState<'delivery' | 'pickup' | 'delay' | 'ready'>('ready');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Default order confirmation templates
  const defaultTemplates: OrderTemplate[] = [
    {
      id: '1',
      name: 'Order Ready for Pickup',
      message: '� **Your Order is Ready!** �\n\nHi {{CUSTOMER_NAME}},\n\nGreat news! Your order is ready for pickup:\n\n📋 **Order Details:**\n- Order #{{ORDER_ID}}\n- Items: {{ORDER_ITEMS}}\n- Total: ${{TOTAL_AMOUNT}}\n\n📍 **Pickup Location:** [Your Store Address]\n🕒 **Pickup Hours:** 9:00 AM - 6:00 PM\n\nPlease bring your order confirmation. Thank you for choosing us! 🙏',
      category: 'pickup'
    },
    {
      id: '2',
      name: 'Out for Delivery',
      message: '🚚 **Your Order is Out for Delivery!** 🚚\n\nHi {{CUSTOMER_NAME}},\n\nYour order is on its way to you!\n\n📋 **Order Details:**\n- Order #{{ORDER_ID}}\n- Items: {{ORDER_ITEMS}}\n- Total: ${{TOTAL_AMOUNT}}\n\n🕒 **Estimated Delivery:** Within 2 hours\n📱 **Track your order:** [Tracking Link]\n\nPlease be available to receive your order. Thank you! �',
      category: 'delivery'
    },
    {
      id: '3',
      name: 'Order Delay Notification',
      message: '⏰ **Order Delay Notification** ⏰\n\nHi {{CUSTOMER_NAME}},\n\nWe apologize for the inconvenience. Your order has been slightly delayed:\n\n📋 **Order Details:**\n- Order #{{ORDER_ID}}\n- Items: {{ORDER_ITEMS}}\n\n🕒 **New Estimated Time:** {{NEW_TIME}}\n\nWe appreciate your patience and will notify you as soon as your order is ready. Thank you for understanding! 🙏',
      category: 'delay'
    },
    {
      id: '4',
      name: 'Delivery Completed',
      message: '✅ **Order Delivered Successfully!** ✅\n\nHi {{CUSTOMER_NAME}},\n\nYour order has been delivered successfully!\n\n📋 **Order Details:**\n- Order #{{ORDER_ID}}\n- Items: {{ORDER_ITEMS}}\n- Total: ${{TOTAL_AMOUNT}}\n\n� Enjoy your purchase!\n🌟 Please rate your experience: [Rating Link]\n\nThank you for choosing us! We look forward to serving you again. 🙏',
      category: 'delivery'
    }
  ];

  const [templates, setTemplates] = useState<OrderTemplate[]>(defaultTemplates);

  // Mock orders
  const mockOrders: Order[] = [
    {
      id: 'WO001',
      customerName: 'John Smith',
      customerPhone: '+1234567890',
      orderItems: '5 x Product A, 2 x Product B',
      totalAmount: 45.99,
      orderDate: '2025-07-19',
      status: 'ready'
    },
    {
      id: 'WO002', 
      customerName: 'Sarah Johnson',
      customerPhone: '+1234567891',
      orderItems: '10 x 1-Gallon Bottles, 1 x Water Filter',
      totalAmount: 32.50,
      orderDate: '2025-07-19',
      status: 'pending'
    },
    {
      id: 'WO003',
      customerName: 'Mike Davis',
      customerPhone: '+1234567892', 
      orderItems: '3 x 5-Gallon Bottles',
      totalAmount: 25.99,
      orderDate: '2025-07-18',
      status: 'ready'
    },
    {
      id: 'WO004',
      customerName: 'Lisa Wilson',
      customerPhone: '+1234567893',
      orderItems: '8 x 1-Gallon Bottles, 1 x Cooler',
      totalAmount: 67.99,
      orderDate: '2025-07-18', 
      status: 'delivered'
    }
  ];

  const handleSendConfirmation = () => {
    if (!messageText.trim()) {
      alert('Please enter a confirmation message');
      return;
    }

    if (selectedOrders.length === 0) {
      alert('Please select at least one order');
      return;
    }

    console.log('Sending order confirmations to:', selectedOrders);
    console.log('Message:', messageText);
    alert(`Order confirmation sent to ${selectedOrders.length} customer(s)!`);
  };

  const handleTemplateSelect = (template: OrderTemplate) => {
    setMessageText(template.message);
    setMessageCategory(template.category);
  };

  const handleSaveTemplate = () => {
    if (!messageText.trim()) {
      alert('Please enter a message to save as template');
      return;
    }

    const templateName = prompt('Enter template name:');
    if (templateName) {
      const newTemplate: OrderTemplate = {
        id: Date.now().toString(),
        name: templateName,
        message: messageText,
        category: messageCategory
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageText(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPosition(target.selectionStart);
  };

  // Common emojis for water business
  const waterEmojis = [
    '💧', '🚚', '✅', '📦', '🏠', '⏰', '📱', '🙏', '⭐', '🌟',
    '💯', '👍', '❤️', '😊', '🎉', '🔔', '📞', '✨', '💫', '🤝',
    '🥤', '🚿', '🌊', '💎', '🔵', '🧊', '🌈', '☀️', '🌙', '⚡'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#4CAF50';
      case 'pending': return '#FF9800'; 
      case 'delivered': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '✅';
      case 'pending': return '⏳';
      case 'delivered': return '🚚';
      default: return '📦';
    }
  };

  return (
    <div className="order-confirmation-page">
      <div className="order-confirmation-container">
        <div className="order-confirmation-header">
          <h1>Order Confirmation Messages</h1>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="order-confirmation-content">
          {/* Message Category Selection */}
          <div className="category-section">
            <h3>Message Category</h3>
            <div className="category-selector">
              <label className={`category-option ${messageCategory === 'ready' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="ready"
                  checked={messageCategory === 'ready'}
                  onChange={(e) => setMessageCategory(e.target.value as any)}
                />
                <span className="category-label">
                  ✅ Order Ready
                </span>
                <small>Notify customers their order is ready for pickup</small>
              </label>
              
              <label className={`category-option ${messageCategory === 'delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="delivery"
                  checked={messageCategory === 'delivery'}
                  onChange={(e) => setMessageCategory(e.target.value as any)}
                />
                <span className="category-label">
                  🚚 Delivery Update
                </span>
                <small>Send delivery status and tracking information</small>
              </label>

              <label className={`category-option ${messageCategory === 'delay' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="delay"
                  checked={messageCategory === 'delay'}
                  onChange={(e) => setMessageCategory(e.target.value as any)}
                />
                <span className="category-label">
                  ⏰ Delay Notice
                </span>
                <small>Inform customers about order delays</small>
              </label>

              <label className={`category-option ${messageCategory === 'pickup' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  value="pickup"
                  checked={messageCategory === 'pickup'}
                  onChange={(e) => setMessageCategory(e.target.value as any)}
                />
                <span className="category-label">
                  📍 Pickup Ready
                </span>
                <small>Ready for customer pickup notifications</small>
              </label>
            </div>
          </div>

          {/* Message Composer */}
          <div className="message-composer-section">
            <h3>Compose Order Confirmation Message</h3>
            <div className="composer-controls">
              <div className="message-toolbar">
                <button 
                  type="button" 
                  className="toolbar-btn emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                >
                  💧
                </button>
                <div className="toolbar-info">
                  <span>Available variables: {'{'}CUSTOMER_NAME{'}'}, {'{'}ORDER_ID{'}'}, {'{'}ORDER_ITEMS{'}'}, {'{'}TOTAL_AMOUNT{'}'}</span>
                </div>
              </div>
              
              <textarea
                placeholder="Enter your order confirmation message here. Use variables like {{CUSTOMER_NAME}} and {{ORDER_ID}} for personalization."
                value={messageText}
                onChange={handleTextareaChange}
                onClick={handleTextareaClick}
                className="message-textarea"
                rows={8}
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
                    {waterEmojis.map((emoji, index) => (
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

          {/* Templates Section */}
          <div className="templates-section">
            <h3>Order Confirmation Templates</h3>
            <div className="templates-grid">
              {templates.filter(t => t.category === messageCategory).map((template) => (
                <div key={template.id} className={`template-card ${template.category}`}>
                  <div className="template-header">
                    <h4>{template.name}</h4>
                    <span className="template-category">{template.category}</span>
                  </div>
                  <p className="template-preview">{template.message.substring(0, 120)}...</p>
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

          {/* Order Selection */}
          <div className="orders-section">
            <h3>Select Water Orders</h3>
            <div className="orders-list">
              {mockOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${selectedOrders.includes(order.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedOrders.includes(order.id)) {
                      setSelectedOrders(selectedOrders.filter((id: string) => id !== order.id));
                    } else {
                      setSelectedOrders([...selectedOrders, order.id]);
                    }
                  }}
                >
                  <div className="order-status">
                    <span className="status-icon">{getStatusIcon(order.status)}</span>
                    <span className="status-text" style={{color: getStatusColor(order.status)}}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="order-info">
                    <div className="order-header">
                      <span className="order-id">#{order.id}</span>
                      <span className="order-date">{order.orderDate}</span>
                    </div>
                    <div className="customer-info">
                      <span className="customer-name">{order.customerName}</span>
                      <span className="customer-phone">{order.customerPhone}</span>
                    </div>
                    <div className="order-details">
                      <span className="order-items">{order.orderItems}</span>
                      <span className="order-total">${order.totalAmount}</span>
                    </div>
                  </div>
                  {selectedOrders.includes(order.id) && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Message Preview */}
          <div className="preview-section">
            <h3>Message Preview</h3>
            <div className="message-preview">
              <div className="whatsapp-preview">
                <div className="preview-header">✨ Stella Business Service</div>
                <div className="preview-content">
                  {messageText || 'Your order confirmation message will appear here...'}
                </div>
              </div>
            </div>
          </div>

          {/* Send Actions */}
          <div className="send-actions">
            <div className="selected-count">
              {selectedOrders.length} order(s) selected
            </div>
            <div className="action-buttons">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button 
                className="send-btn" 
                onClick={handleSendConfirmation}
                disabled={!messageText.trim() || selectedOrders.length === 0}
              >
                Send Order Confirmations
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
