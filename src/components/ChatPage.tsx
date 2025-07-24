import React, { useState, useRef, useEffect } from 'react';
import './ChatPage.css';

interface ChatPageProps {
  onClose: () => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'product' | 'order' | 'recommendation' | 'voice' | 'image' | 'document' | 'video' | 'sticker' | 'location';
  productData?: Product;
  orderData?: Order;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  // WhatsApp specific fields
  whatsapp_message_id?: string;
  media_url?: string;
  media_mime_type?: string;
  voice_duration?: number;
  direction?: 'incoming' | 'outgoing';
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  status: 'active' | 'pending' | 'resolved';
  avatar?: string;
  // WhatsApp specific fields
  display_name?: string;
  profile_name?: string;
  last_message_type?: string;
  isWhatsApp?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: 'water' | 'dispenser' | 'filter' | 'accessory';
  sizes?: string[];
  inStock: boolean;
}

interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'cart' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  size?: string;
}

const ChatPage: React.FC<ChatPageProps> = ({ onClose }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'recommendations'>('products');
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp Integration State
  const [whatsappConversations, setWhatsappConversations] = useState<Conversation[]>([]);

  const API_BASE = import.meta.env.VITE_API_URL || '/api';

  // Fetch WhatsApp conversations from the database
  const fetchWhatsAppConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations`);
      const data = await response.json();
      if (data.success) {
        const convertedConversations = data.data.map((conv: any) => ({
          id: `wa_${conv.phone_number}`,
          customerName: conv.display_name || conv.profile_name || conv.phone_number,
          customerPhone: conv.phone_number,
          lastMessage: conv.last_message_content || 'No messages yet',
          timestamp: new Date(conv.last_message_timestamp ? parseInt(conv.last_message_timestamp) * 1000 : conv.last_message_at),
          unreadCount: 0,
          status: 'active',
          display_name: conv.display_name,
          profile_name: conv.profile_name,
          last_message_type: conv.last_message_type,
          isWhatsApp: true
        }));
        setWhatsappConversations(convertedConversations);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp conversations:', error);
    }
  };  // Fetch WhatsApp messages for a specific conversation
  const fetchWhatsAppMessages = async (phoneNumber: string) => {
    try {
      const response = await fetch(`${API_BASE}/messages/conversations/${phoneNumber}`);
      const data = await response.json();
      if (data.success) {
        const convertedMessages = data.data.map((msg: any) => ({
          id: msg.whatsapp_message_id || msg.id.toString(),
          text: msg.content || '',
          sender: msg.direction === 'incoming' ? 'user' : 'agent',
          timestamp: new Date(parseInt(msg.timestamp) * 1000),
          type: msg.message_type,
          status: msg.status,
          whatsapp_message_id: msg.whatsapp_message_id,
          media_url: msg.media_url,
          media_mime_type: msg.media_mime_type,
          voice_duration: msg.voice_duration,
          direction: msg.direction
        }));
        setMessages(convertedMessages.reverse());
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    }
  };

  // Load WhatsApp data on component mount
  useEffect(() => {
    fetchWhatsAppConversations();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchWhatsAppConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh WhatsApp messages when conversation changes
  useEffect(() => {
    if (selectedConversation && selectedConversation.startsWith('wa_')) {
      const conversation = whatsappConversations.find(c => c.id === selectedConversation);
      if (conversation) {
        fetchWhatsAppMessages(conversation.customerPhone);
      }
    }
  }, [selectedConversation, whatsappConversations]);

  // Mock conversations
  const mockConversations: Conversation[] = [
    {
      id: '1',
      customerName: 'John Smith',
      customerPhone: '+1234567890',
      lastMessage: 'When will my water delivery arrive?',
      timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      unreadCount: 2,
      status: 'active'
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      customerPhone: '+1234567891',
      lastMessage: 'I need to order 10 gallons of water',
      timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
      unreadCount: 1,
      status: 'active'
    },
    {
      id: '3',
      customerName: 'Mike Davis',
      customerPhone: '+1234567892',
      lastMessage: 'Thank you for the quick delivery!',
      timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
      unreadCount: 0,
      status: 'resolved'
    },
    {
      id: '4',
      customerName: 'Lisa Wilson',
      customerPhone: '+1234567893',
      lastMessage: 'Do you have water dispensers available?',
      timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
      unreadCount: 3,
      status: 'pending'
    }
  ];

  // Combine WhatsApp and mock conversations
  const allConversations = [...whatsappConversations, ...mockConversations]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Mock products
  const products: Product[] = [
    {
      id: 'p1',
      name: '5-Gallon Spring Water',
      price: 8.99,
      image: '🪣',
      description: 'Premium spring water in 5-gallon containers',
      category: 'water',
      sizes: ['5 Gallon'],
      inStock: true
    },
    {
      id: 'p2',
      name: '1-Gallon Distilled Water',
      price: 1.99,
      image: '🥤',
      description: 'Pure distilled water in convenient 1-gallon bottles',
      category: 'water',
      sizes: ['1 Gallon'],
      inStock: true
    },
    {
      id: 'p3',
      name: 'Countertop Water Dispenser',
      price: 89.99,
      image: '🚰',
      description: 'Convenient countertop water dispenser',
      category: 'dispenser',
      inStock: true
    },
    {
      id: 'p4',
      name: 'Water Filter Cartridge',
      price: 24.99,
      image: '🔧',
      description: 'Replacement filter cartridge for dispensers',
      category: 'filter',
      inStock: true
    },
    {
      id: 'p5',
      name: 'Bottle Pump',
      price: 12.99,
      image: '⚙️',
      description: 'Manual pump for 5-gallon bottles',
      category: 'accessory',
      inStock: true
    }
  ];

  // Mock messages for selected conversation
  const mockMessages: { [key: string]: Message[] } = {
    '1': [
      {
        id: 'm1',
        text: 'Hi! I ordered 5 gallons of water yesterday. When will it arrive? 🚚',
        sender: 'user',
        timestamp: new Date(Date.now() - 10 * 60000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'm2',
        text: 'Hello John! Let me check your order status for you. 😊',
        sender: 'agent',
        timestamp: new Date(Date.now() - 8 * 60000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'm3',
        text: 'Your order is scheduled for delivery today between 2-4 PM. You should receive it within the next hour! 🎉',
        sender: 'agent',
        timestamp: new Date(Date.now() - 5 * 60000),
        type: 'text',
        status: 'delivered'
      }
    ],
    '2': [
      {
        id: 'm4',
        text: 'Hello! I need to order water for my office. We need about 10 gallons. 💼',
        sender: 'user',
        timestamp: new Date(Date.now() - 20 * 60000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'm5',
        text: 'Great! I can help you with that. Let me show you our available options. 💧',
        sender: 'agent',
        timestamp: new Date(Date.now() - 15 * 60000),
        type: 'text',
        status: 'sent'
      }
    ]
  };

  useEffect(() => {
    if (selectedConversation && mockMessages[selectedConversation]) {
      setMessages(mockMessages[selectedConversation]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `m${Date.now()}`,
      text: newMessage,
      sender: 'agent',
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setShowEmojiPicker(false);

    // Simulate message delivery status updates
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ));
    }, 500);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1500);

    // Simulate customer typing response
    setTimeout(() => {
      setIsTyping(true);
    }, 2000);

    setTimeout(() => {
      setIsTyping(false);
      const customerResponse: Message = {
        id: `m${Date.now() + 1}`,
        text: 'Thank you! That helps a lot! 😊',
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };
      setMessages(prev => [...prev, customerResponse]);
    }, 4000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addToCart = (product: Product, quantity: number = 1, size?: string) => {
    const item: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      size
    };

    setCurrentOrder(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.size === size
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, item];
      }
    });
  };

  const sendProductRecommendation = (product: Product) => {
    if (!selectedConversation) return;

    const message: Message = {
      id: `m${Date.now()}`,
      text: `I recommend this product for you: 💡`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'product',
      productData: product,
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);

    // Simulate delivery status
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  };

  const sendSizeGuide = () => {
    if (!selectedConversation) return;

    const sizeGuideText = `📏 **Water Size Guide** 💧\n\n🥤 **1 Gallon** - Perfect for:\n• Individual use (1-2 people) 👤\n• Daily drinking water 🚰\n• Small households 🏠\n\n🪣 **5 Gallons** - Perfect for:\n• Families (3-5 people) 👨‍👩‍👧‍👦\n• Office use 🏢\n• Water dispensers 🚰\n• Long-term storage 📦\n\n💡 **Recommendation**: For your needs, I suggest starting with our 5-gallon option! 🎯`;

    const message: Message = {
      id: `m${Date.now()}`,
      text: sizeGuideText,
      sender: 'agent',
      timestamp: new Date(),
      type: 'recommendation',
      status: 'sending'
    };

    setMessages(prev => [...prev, message]);

    // Simulate delivery status
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ));
    }, 1000);
  };

  const removeFromCart = (index: number) => {
    setCurrentOrder(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    setCurrentOrder(prev => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const getTotalPrice = () => {
    return currentOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = () => {
    if (currentOrder.length === 0) {
      alert('Please add items to your cart first');
      return;
    }

    const order: Order = {
      id: `ORD${Date.now()}`,
      customerId: selectedConversation || '',
      items: currentOrder,
      total: getTotalPrice(),
      status: 'pending',
      createdAt: new Date()
    };

    // Send order confirmation message
    const orderMessage: Message = {
      id: `m${Date.now()}`,
      text: `Order placed successfully! 🎉`,
      sender: 'agent',
      timestamp: new Date(),
      type: 'order',
      orderData: order,
      status: 'delivered'
    };

    setMessages(prev => [...prev, orderMessage]);
    setCurrentOrder([]);
    alert(`Order #${order.id} placed successfully! Total: $${order.total.toFixed(2)}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'resolved': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: 'sending' | 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sending': return '🔄';
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const getStatusIconColor = (status: 'sending' | 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sending': return '#999';
      case 'sent': return '#999';
      case 'delivered': return '#2196F3';
      case 'read': return '#4CAF50';
      default: return '#999';
    }
  };

  // Common emojis for water business
  const commonEmojis = [
    '😊', '😃', '👍', '👋', '🙏', '❤️', '🎉', '✨',
    '💧', '🚰', '🪣', '🥤', '🚚', '📦', '🏠', '🏢',
    '👤', '👨‍👩‍👧‍👦', '💼', '📞', '📱', '⏰', '📍', '🎯'
  ];

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Filter conversations based on search query
  const filteredConversations = allConversations.filter((conversation: Conversation) => 
    conversation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.customerPhone.includes(searchQuery) ||
    conversation.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Customer Chat & Orders</h1>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-content">
          {/* Conversation List */}
          <div className="conversations-panel">
            <div className="panel-header">
              <h3>💬 Conversations</h3>
              <div className="search-box">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search by name, phone, or message..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="no-conversations-found">
                  <p>No conversations found</p>
                  <span>Try a different search term</span>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation === conversation.id ? 'selected' : ''}`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="conversation-avatar">
                      {conversation.avatar || conversation.customerName.charAt(0)}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span 
                          className="customer-name"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(conversation.customerName, searchQuery) 
                          }}
                        />
                        <span className="timestamp">{formatTime(conversation.timestamp)}</span>
                      </div>
                      <div 
                        className="last-message"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(conversation.lastMessage, searchQuery) 
                        }}
                      />
                      <div className="conversation-meta">
                        <span 
                          className="status-indicator"
                          style={{ color: getStatusColor(conversation.status) }}
                        >
                          ● {conversation.status}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="unread-count">{conversation.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="chat-panel">
            {selectedConversation ? (
              <>
                <div className="chat-header-info">
                  <div className="customer-details">
                    <h3>{allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerName}</h3>
                    <span>{allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerPhone}</span>
                  </div>
                  <div className="chat-actions">
                    <button className="action-btn" onClick={sendSizeGuide}>
                      📏 Send Size Guide
                    </button>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender === 'agent' ? 'agent-message' : 'user-message'}`}
                    >
                      {message.type === 'product' && message.productData ? (
                        <div className="product-message">
                          <div className="product-card">
                            <div className="product-image">{message.productData.image}</div>
                            <div className="product-details">
                              <h4>{message.productData.name}</h4>
                              <p>{message.productData.description}</p>
                              <div className="product-price">${message.productData.price}</div>
                              <button 
                                className="add-to-cart-btn"
                                onClick={() => addToCart(message.productData!)}
                              >
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : message.type === 'order' && message.orderData ? (
                        <div className="order-message">
                          <div className="order-confirmation">
                            <h4>🎉 Order Confirmed!</h4>
                            <p>Order ID: #{message.orderData.id}</p>
                            <p>Total: ${message.orderData.total.toFixed(2)}</p>
                            <p>Status: {message.orderData.status}</p>
                          </div>
                        </div>
                      ) : message.type === 'voice' ? (
                        <div className="whatsapp-message voice-message">
                          🎵 Voice message ({message.voice_duration}s)
                          {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                        </div>
                      ) : message.type === 'image' ? (
                        <div className="whatsapp-message image-message">
                          📷 Image
                          {message.text && <div className="caption">{message.text}</div>}
                          {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                        </div>
                      ) : message.type === 'document' ? (
                        <div className="whatsapp-message document-message">
                          📄 Document
                          {message.text && <div className="filename">{message.text}</div>}
                          {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                        </div>
                      ) : message.type === 'video' ? (
                        <div className="whatsapp-message video-message">
                          🎥 Video
                          {message.text && <div className="caption">{message.text}</div>}
                          {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                        </div>
                      ) : message.type === 'sticker' ? (
                        <div className="whatsapp-message sticker-message">
                          😄 Sticker
                          {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                        </div>
                      ) : message.type === 'location' ? (
                        <div className="whatsapp-message location-message">
                          📍 Location
                          {message.text && <div className="location-data">{message.text}</div>}
                        </div>
                      ) : (
                        <div className="message-content">
                          <div className="message-text">{message.text}</div>
                          {message.sender === 'agent' && (
                            <div className="message-status">
                              <span 
                                className="status-icon"
                                style={{ color: getStatusIconColor(message.status) }}
                              >
                                {getStatusIcon(message.status)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="message-timestamp">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="typing-indicator">
                      <div className="typing-bubble">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-text">Customer is typing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                <div className="message-input-container">
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <div className="emoji-grid">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            className="emoji-button"
                            onClick={() => addEmoji(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="message-input-wrapper">
                    <button 
                      className="emoji-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      😊
                    </button>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="message-input"
                      rows={2}
                    />
                    <button 
                      className="send-btn"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <h3>💬 Select a conversation to start chatting</h3>
                <p>Choose a customer from the conversation list to begin assisting them with their water delivery needs.</p>
              </div>
            )}
          </div>

          {/* Shopify Integration Panel */}
          <div className="shopify-panel">
            <div className="panel-header">
              <h3>🛒 Shop & Orders</h3>
              <div className="shop-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
                  onClick={() => setActiveTab('products')}
                >
                  Products
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  Cart ({currentOrder.length})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  Recommend
                </button>
              </div>
            </div>

            <div className="shop-content">
              {activeTab === 'products' && (
                <div className="products-grid">
                  {products.map((product) => (
                    <div key={product.id} className="product-card">
                      <div className="product-image">{product.image}</div>
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p className="product-description">{product.description}</p>
                        <div className="product-price">${product.price}</div>
                        {product.sizes && (
                          <div className="product-sizes">
                            {product.sizes.map(size => (
                              <span key={size} className="size-tag">{size}</span>
                            ))}
                          </div>
                        )}
                        <div className="product-actions">
                          <button 
                            className="add-to-cart-btn"
                            onClick={() => addToCart(product)}
                            disabled={!product.inStock}
                          >
                            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                          </button>
                          <button 
                            className="recommend-btn"
                            onClick={() => sendProductRecommendation(product)}
                            disabled={!selectedConversation}
                          >
                            Recommend
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="cart-container">
                  {currentOrder.length === 0 ? (
                    <div className="empty-cart">
                      <h4>🛒 Cart is empty</h4>
                      <p>Add products to start building an order for your customer.</p>
                    </div>
                  ) : (
                    <>
                      <div className="cart-items">
                        {currentOrder.map((item, index) => (
                          <div key={index} className="cart-item">
                            <div className="item-info">
                              <h4>{item.productName}</h4>
                              {item.size && <span className="item-size">{item.size}</span>}
                            </div>
                            <div className="item-controls">
                              <div className="quantity-controls">
                                <button 
                                  onClick={() => updateQuantity(index, item.quantity - 1)}
                                  className="qty-btn"
                                >
                                  -
                                </button>
                                <span className="quantity">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(index, item.quantity + 1)}
                                  className="qty-btn"
                                >
                                  +
                                </button>
                              </div>
                              <div className="item-price">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                              <button 
                                onClick={() => removeFromCart(index)}
                                className="remove-btn"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="cart-summary">
                        <div className="total-price">
                          <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
                        </div>
                        <button 
                          className="place-order-btn"
                          onClick={placeOrder}
                          disabled={!selectedConversation}
                        >
                          Place Order
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'recommendations' && (
                <div className="recommendations-container">
                  <h4>💡 Quick Recommendations</h4>
                  <div className="recommendation-actions">
                    <button 
                      className="recommendation-btn"
                      onClick={sendSizeGuide}
                      disabled={!selectedConversation}
                    >
                      📏 Send Size Guide
                    </button>
                    <button 
                      className="recommendation-btn"
                      onClick={() => sendProductRecommendation(products[0])}
                      disabled={!selectedConversation}
                    >
                      🪣 Recommend 5-Gallon Water
                    </button>
                    <button 
                      className="recommendation-btn"
                      onClick={() => sendProductRecommendation(products[2])}
                      disabled={!selectedConversation}
                    >
                      🚰 Recommend Dispenser
                    </button>
                  </div>
                  
                  <div className="size-guide-preview">
                    <h5>📏 Water Size Guide</h5>
                    <div className="size-option">
                      <strong>1 Gallon</strong> - Individual use, 1-2 people
                    </div>
                    <div className="size-option">
                      <strong>5 Gallons</strong> - Families, offices, dispensers
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
