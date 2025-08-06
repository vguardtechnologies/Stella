import React, { useState, useRef, useEffect } from 'react';
import VideoMessage from './VideoMessage';
import ContactManager from './ContactManager';
import ImageModal from './ImageModal';
import ProductModal from './ProductModal';
import WhatsAppTemplateManager from './WhatsAppTemplateManager';
import MediaBrowser from './MediaBrowser';
import { shopifyService } from '../services/shopifyService';
import './ChatPage.css';

// Template interface for WhatsApp templates
interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  content: string;
  variables: string[];
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  description: string;
}

// Voice Message Component with audio controls
const VoiceMessageComponent: React.FC<{
  audioSrc: string;
  duration?: number;
  sender: 'user' | 'agent';
  mimeType?: string;
}> = ({ audioSrc, duration, sender, mimeType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    return Math.round(time);
  };

  return (
    <div className="whatsapp-voice-container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: sender === 'user' ? '#e7ffdb' : '#ffffff',
      borderRadius: '7.5px',
      maxWidth: '250px',
      border: '1px solid #e1e8ed',
      position: 'relative',
      zIndex: 1
    }}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#25d366',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          outline: 'none',
          zIndex: 2
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span style={{ color: 'white', fontSize: '12px', userSelect: 'none' }}>
          {isPlaying ? 'Pause' : 'Play'}
        </span>
      </button>
      
      {/* Waveform Visualization */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '1px',
        height: '32px',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onClick={togglePlayPause}
      >
        {/* Generate waveform bars */}
        {Array.from({ length: 20 }, (_, i) => {
          const progress = audioDuration > 0 ? currentTime / audioDuration : 0;
          const barProgress = i / 20;
          const isActive = barProgress <= progress;
          
          return (
            <div
              key={i}
              style={{
                width: '2px',
                height: `${Math.random() * 20 + 5}px`,
                backgroundColor: isActive ? '#25d366' : '#d1d7db',
                borderRadius: '1px',
                opacity: isActive ? 1 : 0.5,
                transition: 'all 0.1s ease'
              }}
            />
          );
        })}
      </div>
      
      {/* Duration */}
      <span style={{
        fontSize: '12px',
        color: '#667781',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        flexShrink: 0,
        minWidth: '25px',
        userSelect: 'none'
      }}>
        {isPlaying ? `${formatTime(currentTime)}"` : `${formatTime(audioDuration)}"`}
      </span>
      
      {/* Audio element */}
      <audio 
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        style={{ display: 'none' }}
      >
        <source src={audioSrc} type={mimeType || 'audio/ogg'} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

interface ChatPageProps {
  onClose: () => void;
  shopifyStore?: {
    shop: string;
    domain: string;
    connected: boolean;
  };
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'product' | 'order' | 'recommendation' | 'voice' | 'image' | 'document' | 'video' | 'sticker' | 'location';
  productData?: Product;
  orderData?: Order;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  // WhatsApp specific fields
  whatsapp_message_id?: string;
  media_url?: string;
  media_file_id?: string;
  media_mime_type?: string;
  voice_duration?: number;
  direction?: 'incoming' | 'outgoing';
  // Enhanced video support
  videoUrl?: string;
  // Template message properties
  isTemplate?: boolean;
  templateName?: string;
  // Failure reason for display
  failureReason?: '24_hour_rule' | 'general_error';
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
  category: 'electronics' | 'accessories' | 'apparel' | 'home' | 'wearables' | 'audio';
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

const ChatPage: React.FC<ChatPageProps> = ({ onClose, shopifyStore }) => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>([]);
  const [newConversationPhone, setNewConversationPhone] = useState('+1 (868) ');
  const [actualShopName, setActualShopName] = useState<string>('');
  const [shopNameLoading, setShopNameLoading] = useState(true);
  const [isShopifyConfigured, setIsShopifyConfigured] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const productSearchFilter = 'all'; // Always search all fields
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<{[productId: string]: {[optionName: string]: string}}>({});
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [productsLastUpdated, setProductsLastUpdated] = useState<Date | null>(null);
  const updateInterval = 300000; // Fixed at 5 minutes
  const [retryCount, setRetryCount] = useState(0);
  const [cartNotification, setCartNotification] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [productImageIndices, setProductImageIndices] = useState<{[messageId: string]: number}>({});

  // WhatsApp Integration State
  const [whatsappConversations, setWhatsappConversations] = useState<Conversation[]>([]);
  const [whatsappConfigured] = useState(true); // Assume configured since we have permanent token

  // Contact Management State
  const [showContactManager, setShowContactManager] = useState(false);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [savedContacts, setSavedContacts] = useState<Map<string, any>>(new Map());

  // Image Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageCaption, setModalImageCaption] = useState('');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);

  // Attachment Menu State
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File Preview State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  // Privacy Configuration - can be controlled via environment variable
  const PRIVACY_MODE = import.meta.env.VITE_PRIVACY_MODE === 'true' || true; // Default to privacy-enabled

  // Template Management State
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Media Browser State
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || '';

  // Function to generate privacy-safe file description
  // When PRIVACY_MODE is enabled, file names are never exposed in messages or logs
  // This protects user privacy by only showing generic file type descriptions
  const getFileDescription = (file: File): string => {
    if (!PRIVACY_MODE) return file.name;
    
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type.startsWith('video/')) return 'Video';
    return 'Document';
  };

  // Function to open image modal
  const openImageModal = (imageUrl: string, caption?: string) => {
    setModalImageUrl(imageUrl);
    setModalImageCaption(caption || '');
    setShowImageModal(true);
  };

  // Function to close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
    setModalImageCaption('');
  };

  // Function to open product modal
  const openProductModal = (product: any) => {
    setModalProduct(product);
    setShowProductModal(true);
  };

  // Function to close product modal
  const closeProductModal = () => {
    setShowProductModal(false);
    setModalProduct(null);
  };

  // Fetch WhatsApp conversations from the database
  const fetchWhatsAppConversations = async () => {
    try {
      console.log('Fetching WhatsApp conversations from:', `${API_BASE}/api/messages/conversations`);
      const response = await fetch(`${API_BASE}/api/messages/conversations`);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        return;
      }

      const responseText = await response.text();
      console.log('Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Response was not valid JSON:', responseText);
        return;
      }

      console.log('Parsed data:', data);
      
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
  };

  // Fetch Shopify products for display using new database-first API
  const fetchShopifyProducts = async () => {
    // Check if Shopify is configured via database-first API
    try {
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const statusResponse = await fetch(`${baseUrl}/api/shopify/status`);
      const statusData = await statusResponse.json();
      
      setIsShopifyConfigured(statusData.isConfigured || false);
      
      if (!statusData.isConfigured) {
        // Show demo products if not connected
        setShopifyProducts([
          {
            id: 'demo1',
            title: 'Premium T-Shirt',
            handle: 'premium-t-shirt',
            vendor: 'SUSA',
            product_type: 'Apparel',
            status: 'active',
            variants: [{ id: 'var1', price: '29.99', compare_at_price: '39.99' }],
            images: [{ src: 'https://via.placeholder.com/150x150/4CAF50/white?text=T-Shirt' }],
            tags: 'featured,clothing'
          },
          {
            id: 'demo2', 
            title: 'Wireless Headphones',
            handle: 'wireless-headphones',
            vendor: 'SUSA',
            product_type: 'Electronics',
            status: 'active',
            variants: [{ id: 'var2', price: '79.99', compare_at_price: '99.99' }],
            images: [{ src: 'https://via.placeholder.com/150x150/2196F3/white?text=Headphones' }],
            tags: 'electronics,audio'
          },
          {
            id: 'demo3',
            title: 'Coffee Mug Set',
            handle: 'coffee-mug-set', 
            vendor: 'SUSA',
            product_type: 'Home & Garden',
            status: 'active',
            variants: [{ id: 'var3', price: '24.99', compare_at_price: '34.99' }],
            images: [{ src: 'https://via.placeholder.com/150x150/FF9800/white?text=Mugs' }],
            tags: 'home,kitchen'
          }
        ]);
        return;
      }
    } catch (error) {
      console.error('Error checking Shopify status:', error);
      setIsShopifyConfigured(false);
      setShopifyProducts([]);
      return;
    }

    setProductsLoading(true);
    try {
      // Fetch ALL products using new database-first API with pagination
      let allProducts: any[] = [];
      let hasMore = true;
      let sinceId: string | null = null;
      
      while (hasMore) {
        const endpoint: string = sinceId 
          ? `/products.json?limit=250&since_id=${sinceId}`
          : '/products.json?limit=250';
          
        const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
        const response: Response = await fetch(`${baseUrl}/api/shopify/proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint: endpoint,
            method: 'GET'
          })
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }
        
        const data: any = await response.json();
        
        if (data?.products && data.products.length > 0) {
          allProducts = [...allProducts, ...data.products];
          
          // Check if we got the full limit, indicating there might be more
          if (data.products.length === 250) {
            sinceId = data.products[data.products.length - 1].id;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
        
        // Safety break to prevent infinite loops
        if (allProducts.length > 10000) {
          console.warn('Product fetch limit reached (10,000). Breaking pagination.');
          break;
        }
      }
      
      console.log(`✅ Fetched ${allProducts.length} products from Shopify via database-first API`);
      setShopifyProducts(allProducts);
      setProductsLastUpdated(new Date());
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching Shopify products:', error);
      setRetryCount(prev => prev + 1);
      
      // Keep existing products if fetch fails
      if (shopifyProducts.length === 0) {
        setShopifyProducts([]);
      }
    } finally {
      setProductsLoading(false);
    }
  };

  // Filter products based on search query and filter type
  const filterProducts = (products: any[], query: string, filterType: string) => {
    if (!query.trim()) return products;

    const searchTerm = query.toLowerCase();
    
    // Helper function to safely handle tags (can be string or array)
    const getTagsString = (tags: any) => {
      if (!tags) return '';
      if (typeof tags === 'string') return tags.toLowerCase();
      if (Array.isArray(tags)) return tags.join(' ').toLowerCase();
      return '';
    };

    // Helper function to safely handle options
    const getOptionsString = (options: any) => {
      if (!options || !Array.isArray(options)) return '';
      return options.map((opt: any) => {
        const name = opt?.name || '';
        const values = opt?.values;
        let valuesStr = '';
        if (Array.isArray(values)) {
          valuesStr = values.join(' ');
        } else if (typeof values === 'string') {
          valuesStr = values;
        }
        return `${name} ${valuesStr}`;
      }).join(' ').toLowerCase();
    };
    
    return products.filter(product => {
      switch (filterType) {
        case 'price':
          const price = product.variants?.[0]?.price || '0';
          // Enhanced price search with better matching
          const priceStr = price.toString();
          const normalizedPrice = priceStr.replace(/[$£€¥]/g, '').trim();
          const normalizedSearchTerm = searchTerm.replace(/[$£€¥]/g, '').trim();
          
          // Multiple matching strategies
          const exactMatch = normalizedPrice === normalizedSearchTerm;
          const startsWithMatch = normalizedPrice.startsWith(normalizedSearchTerm);
          const containsMatch = normalizedPrice.includes(normalizedSearchTerm);
          const formattedMatch = `$${normalizedPrice}`.toLowerCase().includes(searchTerm);
          const rawMatch = priceStr.toLowerCase().includes(searchTerm);
          
          return exactMatch || startsWithMatch || containsMatch || formattedMatch || rawMatch;
        
        case 'color':
          // Search in title, tags, and options for color-related terms
          const colorFields = [
            product.title?.toLowerCase() || '',
            getTagsString(product.tags),
            getOptionsString(product.options)
          ].join(' ');
          return colorFields.includes(searchTerm);
        
        case 'size':
          // Search in title, tags, and options for size-related terms
          const sizeFields = [
            product.title?.toLowerCase() || '',
            getTagsString(product.tags),
            getOptionsString(product.options)
          ].join(' ');
          return sizeFields.includes(searchTerm) || 
                 /\b(xs|s|m|l|xl|xxl|small|medium|large|extra|size)\b/.test(sizeFields);
        
        case 'availability':
          const availability = product.variants?.[0]?.inventory_quantity > 0 ? 'in stock' : 'out of stock';
          const totalInventory = product.variants?.reduce((sum: number, variant: any) => sum + (variant.inventory_quantity || 0), 0) || 0;
          const isInStock = totalInventory > 0;
          
          return availability.includes(searchTerm) || 
                 (searchTerm.includes('available') && isInStock) ||
                 (searchTerm.includes('unavailable') && !isInStock) ||
                 (searchTerm.includes('sold out') && !isInStock) ||
                 (searchTerm.includes('soldout') && !isInStock) ||
                 (searchTerm.includes('out of stock') && !isInStock) ||
                 (searchTerm.includes('outofstock') && !isInStock) ||
                 (searchTerm.includes('in stock') && isInStock) ||
                 (searchTerm.includes('instock') && isInStock) ||
                 (searchTerm.includes('stock') && (isInStock ? searchTerm.includes('in') : searchTerm.includes('out')));
        
        case 'all':
        default:
          // Enhanced price search function
          const searchInPrice = (priceStr: string, searchTerm: string) => {
            if (!priceStr) return false;
            
            // Remove currency symbols and normalize
            const normalizedPrice = priceStr.replace(/[$£€¥]/g, '').trim();
            const normalizedSearch = searchTerm.replace(/[$£€¥]/g, '').trim();
            
            // Check exact match
            if (normalizedPrice === normalizedSearch) return true;
            
            // Check if search term is at start of price (e.g., "16" matches "160")
            if (normalizedPrice.startsWith(normalizedSearch)) return true;
            
            // Check if price contains search term
            if (normalizedPrice.includes(normalizedSearch)) return true;
            
            // Check formatted price with dollar sign
            if (`$${normalizedPrice}`.includes(searchTerm)) return true;
            if (priceStr.includes(searchTerm)) return true;
            
            return false;
          };

          // Enhanced inventory search function
          const searchInInventory = (product: any, searchTerm: string) => {
            const totalInventory = product.variants?.reduce((sum: number, variant: any) => sum + (variant.inventory_quantity || 0), 0) || 0;
            const isInStock = totalInventory > 0;
            
            // Check various stock status terms
            if (searchTerm.includes('sold out') || searchTerm.includes('soldout')) return !isInStock;
            if (searchTerm.includes('out of stock') || searchTerm.includes('outofstock')) return !isInStock;
            if (searchTerm.includes('in stock') || searchTerm.includes('instock')) return isInStock;
            if (searchTerm.includes('available') && !searchTerm.includes('unavailable')) return isInStock;
            if (searchTerm.includes('unavailable')) return !isInStock;
            if (searchTerm === 'stock') return true; // Show all products when just "stock" is searched
            
            return false;
          };

          // Get price for search
          const productPrice = product.variants?.[0]?.price?.toString() || '';
          
          // Search across all fields including enhanced price search and inventory
          const allFields = [
            product.title?.toLowerCase() || '',
            product.body_html?.toLowerCase() || '',
            getTagsString(product.tags),
            getOptionsString(product.options)
          ].join(' ');
          
          return allFields.includes(searchTerm) || 
                 searchInPrice(productPrice, searchTerm) || 
                 searchInInventory(product, searchTerm);
      }
    });
  };

  // Send product as WhatsApp message with proper product card support
  const sendProductInChat = async (product: any) => {
    if (!selectedConversation) {
      alert('Please select a conversation first');
      return;
    }

    // Extract phone number from conversation
    const conversation = whatsappConversations.find(c => c.id === selectedConversation);
    let phoneNumber: string;
    if (!conversation) {
      if (selectedConversation.startsWith('wa_')) {
        phoneNumber = '+' + selectedConversation.replace('wa_', '');
      } else {
        console.error('No conversation found for ID:', selectedConversation);
        return;
      }
    } else {
      phoneNumber = conversation.customerPhone;
    }

    // Create a formatted product message
    const variant = product.variants?.[0];
    const price = variant?.price ? `$${variant.price} TTD` : 'Price on request';
    const comparePrice = variant?.compare_at_price && variant.compare_at_price !== variant.price 
      ? ` (was $${variant.compare_at_price} TTD)` : '';
    
    const productDescription = `🛍️ *${product.title}*\n\n` +
      `💰 *Price:* ${price}${comparePrice}\n` +
      `📦 *Type:* ${product.product_type || 'General'}\n` +
      `🏢 *Brand:* ${product.vendor || 'SUSA SHAPEWEAR'}\n` +
      `📋 *Status:* ${product.status === 'active' ? '✅ Available' : '❌ Not Available'}\n\n` +
      `${product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Premium quality product from our collection.'}\n\n` +
      `🔗 Product ID: ${product.handle || product.id}`;

    // Get product image URL (use first image if available)
    const productImageUrl = product.images?.[0]?.src || product.image?.src;

    // Add product card as a visual message in the chat (optimistic update)
    const newMessage: Message = {
      id: `product_${Date.now()}`,
      text: productDescription,
      sender: 'agent',
      timestamp: new Date(),
      status: 'sending',
      type: 'product',
      direction: 'outgoing',
      productData: product,
      media_url: productImageUrl
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      // Try to send as proper WhatsApp interactive product message first
      const productPayload = {
        to: phoneNumber.replace(/[^\d]/g, ''),
        type: 'interactive',
        interactive: {
          type: 'product',
          body: {
            text: `Check out this amazing product from SUSA SHAPEWEAR! 💫`
          },
          action: {
            catalog_id: '923378196624516', // Our synced catalog ID
            product_retailer_id: product.id.toString() // Use Shopify product ID
          }
        },
        productData: product // Include product data for database storage
      };

      const productResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      const productResult = await productResponse.json();
      
      if (productResult.success) {
        console.log('✅ Product card sent successfully as interactive product message:', product.title);
        
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { 
            ...msg, 
            status: 'sent',
            whatsapp_message_id: productResult.data.messageId 
          } : msg
        ));
      } else {
        console.warn('⚠️ Interactive product message failed, falling back to image+caption:', productResult.message);
        
        // Fallback 1: Send as image with caption if product has image
        if (productImageUrl) {
          const imagePayload = {
            to: phoneNumber.replace(/[^\d]/g, ''),
            type: 'image',
            mediaUrl: productImageUrl,
            caption: productDescription,
            productData: product // Include product data for database storage
          };

          const imageResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(imagePayload),
          });

          const imageResult = await imageResponse.json();
          
          if (imageResult.success) {
            console.log('✅ Product card sent successfully with image fallback:', product.title);
            
            // Update message status to sent
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id ? { 
                ...msg, 
                status: 'sent',
                whatsapp_message_id: imageResult.data.messageId 
              } : msg
            ));
          } else {
            console.warn('⚠️ Image fallback failed, using text fallback:', imageResult.message);
            
            // Fallback 2: Send as text-only message
            const textPayload = {
              to: phoneNumber.replace(/[^\d]/g, ''),
              message: productDescription,
              type: 'text',
              productData: product // Include product data for database storage
            };

            const textResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(textPayload),
            });

            const textResult = await textResponse.json();
            
            if (textResult.success) {
              console.log('✅ Product card sent successfully as text fallback:', product.title);
              
              // Update message to remove failed image URL and mark as sent
              setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { 
                  ...msg, 
                  media_url: undefined,
                  status: 'sent',
                  whatsapp_message_id: textResult.data.messageId 
                } : msg
              ));
            } else {
              console.error('❌ All fallbacks failed:', textResult.message);
              
              // Update message status to failed
              setMessages(prev => prev.map(msg => 
                msg.id === newMessage.id ? { 
                  ...msg, 
                  status: 'failed'
                } : msg
              ));
            }
          }
        } else {
          // No image available, send as text directly
          const textPayload = {
            to: phoneNumber.replace(/[^\d]/g, ''),
            message: productDescription,
            type: 'text',
            productData: product // Include product data for database storage
          };

          const textResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(textPayload),
          });

          const textResult = await textResponse.json();
          
          if (textResult.success) {
            console.log('✅ Product card sent successfully as text:', product.title);
            
            // Update message status to sent
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id ? { 
                ...msg, 
                status: 'sent',
                whatsapp_message_id: textResult.data.messageId 
              } : msg
            ));
          } else {
            console.error('❌ Failed to send product card as text:', textResult.message);
            
            // Update message status to failed
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id ? { 
                ...msg, 
                status: 'failed'
              } : msg
            ));
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending product card:', error);
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { 
          ...msg, 
          status: 'failed'
        } : msg
      ));
    }
  };

  // Handle variant option selection
  const handleVariantOptionSelect = (productId: string, optionName: string, optionValue: string) => {
    setSelectedVariants(prev => {
      const currentSelections = prev[productId] || {};
      const newSelections = {
        ...currentSelections,
        [optionName]: optionValue
      };
      
      // If we're selecting a color, check if the currently selected size is available in this color
      if (optionName.toLowerCase().includes('color') || optionName.toLowerCase().includes('colour')) {
        const currentSize = currentSelections['Size'];
        if (currentSize) {
          // Find the product to check inventory
          const product = shopifyProducts.find(p => p.id === productId);
          if (product) {
            // Check if this size is available in the new color
            const variants = product.variants || [];
            const sizeInColorInventory = variants.filter((variant: any) => {
              const colorMatch = variant.option1?.toLowerCase() === optionValue.toLowerCase() ||
                               variant.option2?.toLowerCase() === optionValue.toLowerCase() ||
                               variant.option3?.toLowerCase() === optionValue.toLowerCase();
              const sizeMatch = variant.option1?.toLowerCase() === currentSize.toLowerCase() ||
                              variant.option2?.toLowerCase() === currentSize.toLowerCase() ||
                              variant.option3?.toLowerCase() === currentSize.toLowerCase();
              return colorMatch && sizeMatch;
            }).reduce((total: number, variant: any) => total + (variant.inventory_quantity || 0), 0);
            
            // If the size is not available in the new color, remove the size selection
            if (sizeInColorInventory === 0) {
              delete newSelections['Size'];
            }
          }
        }
      }
      
      return {
        ...prev,
        [productId]: newSelections
      };
    });
  };

  // Send product with selected variants as WhatsApp message
  const sendSelectedVariantInChat = async (product: any) => {
    if (!selectedConversation) {
      alert('Please select a conversation first');
      return;
    }

    // Extract phone number from conversation
    const conversation = whatsappConversations.find(c => c.id === selectedConversation);
    let phoneNumber: string;
    if (!conversation) {
      if (selectedConversation.startsWith('wa_')) {
        phoneNumber = '+' + selectedConversation.replace('wa_', '');
      } else {
        console.error('No conversation found for ID:', selectedConversation);
        return;
      }
    } else {
      phoneNumber = conversation.customerPhone;
    }

    const selectedOptions = selectedVariants[product.id] || {};
    
    // Find the specific variant based on selected options
    let selectedVariant = product.variants?.[0]; // Default to first variant
    if (Object.keys(selectedOptions).length > 0 && product.variants) {
      selectedVariant = product.variants.find((variant: any) => {
        return Object.entries(selectedOptions).every(([, optionValue]) => {
          return variant.option1?.toLowerCase() === optionValue.toLowerCase() ||
                 variant.option2?.toLowerCase() === optionValue.toLowerCase() ||
                 variant.option3?.toLowerCase() === optionValue.toLowerCase();
        });
      }) || product.variants[0];
    }

    // Build selected options text
    const optionsText = Object.keys(selectedOptions).length > 0 
      ? Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ')
      : 'Default variant';

    // Create a formatted product message with selected options
    const price = selectedVariant?.price ? `$${selectedVariant.price} TTD` : 'Price on request';
    const comparePrice = selectedVariant?.compare_at_price && selectedVariant.compare_at_price !== selectedVariant.price 
      ? ` (was $${selectedVariant.compare_at_price} TTD)` : '';
    
    const productMessage = `🛍️ *${product.title}*\n\n` +
      `✅ *Selected Options:* ${optionsText}\n` +
      `💰 *Price:* ${price}${comparePrice}\n` +
      `📦 *Type:* ${product.product_type || 'General'}\n` +
      `🏢 *Brand:* ${product.vendor || 'SUSA SHAPEWEAR'}\n` +
      `📋 *Availability:* ${selectedVariant?.inventory_quantity > 0 ? `✅ In Stock (${selectedVariant.inventory_quantity})` : '❌ Out of Stock'}\n\n` +
      `${product.body_html ? product.body_html.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Premium quality product from our collection.'}\n\n` +
      `🔗 Product ID: ${product.handle || product.id}`;

    // Get product image URL (use first image if available)
    const productImageUrl = product.images?.[0]?.src || product.image?.src;

    // Add product card with selected options as a visual message in the chat (optimistic update)
    const newMessage: Message = {
      id: `product_variant_${Date.now()}`,
      text: productMessage,
      sender: 'agent',
      timestamp: new Date(),
      status: 'sending',
      type: 'product', // Always use product type for consistent UI formatting
      direction: 'outgoing',
      productData: {
        ...product,
        selectedOptions,
        selectedVariant
      },
      media_url: productImageUrl // Include image URL if available
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      
      // Try to send as proper WhatsApp interactive product message first
      const productPayload = {
        to: phoneNumber.replace(/[^\d]/g, ''),
        type: 'interactive',
        interactive: {
          type: 'product',
          body: {
            text: `Check out this specific variant from SUSA SHAPEWEAR! 💫\n\n*Selected:* ${optionsText}`
          },
          action: {
            catalog_id: '923378196624516', // Our synced catalog ID
            product_retailer_id: product.id.toString() // Use main Shopify product ID
          }
        },
        productData: { ...product, selectedOptions } // Include product data with selected options for database storage
      };

      const productResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productPayload),
      });

      const productResult = await productResponse.json();
      
      if (productResult.success) {
        console.log('✅ Product variant card sent successfully as interactive product message:', product.title);
        
        // Send additional variant details as a follow-up text message
        const variantDetailsPayload = {
          to: phoneNumber.replace(/[^\d]/g, ''),
          message: `*Specific Variant Details:*\n• ${optionsText}\n• Price: ${price}${comparePrice}\n• Stock: ${selectedVariant?.inventory_quantity > 0 ? `${selectedVariant.inventory_quantity} available` : 'Out of stock'}\n• SKU: ${selectedVariant?.sku || 'N/A'}`,
          type: 'text'
        };

        await fetch(`${API_BASE}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variantDetailsPayload),
        });
        
        // Update message status to sent
        setMessages(prev => prev.map(msg => 
          msg.id === newMessage.id ? { 
            ...msg, 
            status: 'sent',
            whatsapp_message_id: productResult.data.messageId 
          } : msg
        ));
        return;
      } else {
        console.warn('⚠️ Interactive product message failed, falling back to image+caption:', productResult.message);
      }
      
      // Fallback 1: First, try to send as image with caption if product has image
      if (productImageUrl) {
        const imagePayload = {
          to: phoneNumber.replace(/[^\d]/g, ''),
          type: 'image',
          mediaUrl: productImageUrl,
          caption: productMessage,
          productData: { ...product, selectedOptions } // Include product data with selected options
        };

        const imageResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imagePayload),
        });

        const imageResult = await imageResponse.json();
        
        if (imageResult.success) {
          console.log('✅ Product variant card sent successfully with image:', product.title);
          
          // Update message status to sent with image
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { 
              ...msg, 
              status: 'sent',
              whatsapp_message_id: imageResult.messageId 
            } : msg
          ));
        } else {
          console.warn('⚠️ Image send failed, falling back to text:', imageResult.error);
          
          // Fallback: Send as text-only message
          const textPayload = {
            to: phoneNumber.replace(/[^\d]/g, ''),
            message: productMessage,
            type: 'text'
          };

          const textResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(textPayload),
          });

          const textResult = await textResponse.json();
          
          if (textResult.success) {
            console.log('✅ Product variant card sent successfully as text fallback:', product.title);
            
            // Update message to text type and mark as sent
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id ? { 
                ...msg, 
                type: 'product', // Keep as product type for UI formatting
                media_url: undefined, // Remove failed image URL
                status: 'sent',
                whatsapp_message_id: textResult.messageId 
              } : msg
            ));
          } else {
            console.error('❌ Text fallback also failed:', textResult.error);
            
            // Update message status to failed
            setMessages(prev => prev.map(msg => 
              msg.id === newMessage.id ? { 
                ...msg, 
                status: 'failed'
              } : msg
            ));
          }
        }
      } else {
        // No image available, send as text directly
        const textPayload = {
          to: phoneNumber.replace(/[^\d]/g, ''),
          message: productMessage,
          type: 'text'
        };

        const response = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(textPayload),
        });

        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Product variant card sent successfully as text:', product.title);
          
          // Update message status to sent
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { 
              ...msg, 
              status: 'sent',
              whatsapp_message_id: result.messageId 
            } : msg
          ));
        } else {
          console.error('❌ Failed to send product variant card:', result.error);
          
          // Update message status to failed
          setMessages(prev => prev.map(msg => 
            msg.id === newMessage.id ? { 
              ...msg, 
              status: 'failed'
            } : msg
          ));
        }
      }
    } catch (error) {
      console.error('❌ Error sending product variant card:', error);
      
      // Update message status to failed
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id ? { 
          ...msg, 
          status: 'failed'
        } : msg
      ));
    }
  };

  // Cart management functions
  const addToShopifyCart = (product: any, quantity: number = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      setCartItems(prev => prev.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
      setCartNotification(`Updated ${product.title} quantity in cart`);
    } else {
      // Add new item to cart
      const cartItem = {
        ...product,
        quantity,
        cartItemId: `cart_${product.id}_${Date.now()}`,
        addedAt: new Date()
      };
      setCartItems(prev => [...prev, cartItem]);
      setCartNotification(`Added ${product.title} to cart`);
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => setCartNotification(''), 3000);
    
    console.log(`✅ Added to cart: ${product.title} (${quantity}x)`);
  };

  const removeFromCart = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    
    setCartItems(prev => prev.map(item => 
      item.cartItemId === cartItemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setCartTotal(0);
  };

  // Send cart summary in chat
  const sendCartInChat = async () => {
    if (!selectedConversation) {
      alert('Please select a conversation first');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    let cartMessage = '🛒 *Shopping Cart Summary*\n\n';
    
    cartItems.forEach((item, index) => {
      const price = parseFloat(item.variants?.[0]?.price || '0');
      const itemTotal = price * item.quantity;
      cartMessage += `${index + 1}. *${item.title}*\n`;
      cartMessage += `   💰 $${price} x ${item.quantity} = $${itemTotal.toFixed(2)}\n\n`;
    });
    
    cartMessage += `📊 *Total: $${cartTotal.toFixed(2)}*\n\n`;
    cartMessage += `Ready to checkout? Let me know! 😊`;

    try {
      const phoneNumber = selectedConversation.replace('wa_', '');
      
      const response = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,  // Fix: API expects 'to', not 'phoneNumber'
          message: cartMessage,
          type: 'text'
        })
      });

      if (response.ok) {
        const newMessage: Message = {
          id: `cart_${Date.now()}`,
          text: cartMessage,
          sender: 'agent',
          timestamp: new Date(),
          status: 'sent',
          type: 'text',
          direction: 'outgoing'
        };
        
        setMessages(prev => [...prev, newMessage]);
        console.log(`✅ Cart sent to chat`);
      } else {
        console.error('Failed to send cart message');
        alert('Failed to send cart. Please try again.');
      }
    } catch (error) {
      console.error('Error sending cart message:', error);
      alert('Error sending cart. Please try again.');
    }
  };

  // Add product to cart from chat commands
  const handleChatCartCommand = (productTitle: string, quantity: number = 1) => {
    const product = shopifyProducts.find(p => 
      p.title.toLowerCase().includes(productTitle.toLowerCase())
    );
    
    if (product) {
      addToShopifyCart(product, quantity);
      return `✅ Added ${product.title} (${quantity}x) to cart!`;
    } else {
      return `❌ Product "${productTitle}" not found. Please check the spelling.`;
    }
  };

  // Update cart total when cart items change
  React.useEffect(() => {
    const total = cartItems.reduce((sum, item) => {
      const price = parseFloat(item.variants?.[0]?.price || '0');
      return sum + (price * item.quantity);
    }, 0);
    setCartTotal(total);
  }, [cartItems]);

  // Fetch WhatsApp messages for a specific conversation
  const fetchWhatsAppMessages = async (phoneNumber: string, isAutoRefresh = false) => {
    try {
      console.log('Fetching messages for phone:', phoneNumber);
      const response = await fetch(`${API_BASE}/api/messages/conversations/${phoneNumber}`);
      
      console.log('Messages response status:', response.status);
      
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        return;
      }

      const responseText = await response.text();
      console.log('Raw messages response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parsing failed for messages:', parseError);
        console.error('Response was not valid JSON:', responseText);
        return;
      }

      console.log('Parsed messages data:', data);
      
      if (data.success) {
        const convertedMessages = data.data.map((msg: any) => {
          // Voice message detection
          if (msg.message_type === 'voice' || msg.message_type === 'audio' || msg.media_mime_type?.includes('audio') || msg.voice_duration || 
              msg.media_mime_type?.includes('ogg') || msg.media_mime_type?.includes('mpeg') || 
              msg.media_mime_type?.includes('wav') || msg.media_mime_type?.includes('m4a')) {
            // Voice message detected - no debug output needed
          }
          
          // Parse product data if available
          let productData = null;
          try {
            if (msg.product_data && typeof msg.product_data === 'string') {
              productData = JSON.parse(msg.product_data);
            } else if (msg.product_data && typeof msg.product_data === 'object') {
              productData = msg.product_data;
            }
          } catch (error) {
            console.warn('Failed to parse product data:', error);
          }
          
          return {
            id: msg.whatsapp_message_id || msg.id.toString(),
            text: msg.content || '',
            sender: msg.direction === 'incoming' ? 'user' : 'agent',
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            type: productData ? 'product' : // If we have product data, it's a product message
                  (msg.message_type === 'audio' || msg.message_type === 'voice') ? 'voice' :
                  (msg.media_mime_type?.includes('audio') || 
                   msg.media_mime_type?.includes('ogg') || 
                   msg.media_mime_type?.includes('mpeg') || 
                   msg.media_mime_type?.includes('wav') || 
                   msg.media_mime_type?.includes('m4a') ||
                   msg.voice_duration ? 'voice' : (msg.message_type || 'text')), // Enhanced audio detection
            status: msg.status,
            whatsapp_message_id: msg.whatsapp_message_id,
            media_url: msg.media_url,
            media_mime_type: msg.media_mime_type,
            media_file_id: msg.media_file_id, // Add media_file_id for thumbnails
            voice_duration: msg.voice_duration,
            direction: msg.direction,
            failureReason: msg.failure_reason as '24_hour_rule' | 'general_error' | undefined,
            productData: productData // Include parsed product data
          };
        });
        console.log('Converted messages:', convertedMessages);
        console.log('Message types found:', [...new Set(convertedMessages.map((m: any) => m.type))]);
        
        // Check if there are new messages during auto-refresh
        if (isAutoRefresh && messages.length > 0) {
          const oldMessageIds = new Set(messages.map((m: Message) => m.id));
          const hasNewMessages = convertedMessages.some((m: any) => !oldMessageIds.has(m.id));
          // const hasNewIncomingMessages = convertedMessages.some((m: any) => 
          //   !oldMessageIds.has(m.id) && m.sender === 'user'
          // );
          
          // Only enable auto-scroll for auto-refresh if user is near bottom or if there are genuinely new incoming messages
          if (hasNewMessages && !isNearBottom) {
            console.log('📩 New messages detected, but user is not near bottom - maintaining scroll position');
            // Don't change shouldAutoScroll state
          } else if (hasNewMessages && isNearBottom) {
            console.log('📩 New messages detected and user is near bottom - enabling auto-scroll');
            setShouldAutoScroll(true);
          }
          
          // Preserve existing videoUrl states during auto-refresh
          const existingVideoUrls = new Map();
          messages.forEach(msg => {
            if (msg.videoUrl) {
              existingVideoUrls.set(msg.id, msg.videoUrl);
            }
          });
          
          // Merge existing video URLs with refreshed messages
          convertedMessages.forEach((msg: any) => {
            if (existingVideoUrls.has(msg.id)) {
              msg.videoUrl = existingVideoUrls.get(msg.id);
            }
          });
        }
        
        setMessages(convertedMessages.reverse());
      } else {
        console.warn('Messages fetch was not successful:', data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    }
  };

  // General function to fetch messages for any conversation
  const fetchMessages = async (conversationId: string, isAutoRefresh = false) => {
    if (conversationId.startsWith('wa_')) {
      // WhatsApp conversation - extract phone number from ID
      let phoneNumber: string;
      const conversation = whatsappConversations.find(c => c.id === conversationId);
      
      if (conversation) {
        phoneNumber = conversation.customerPhone;
      } else {
        // Extract phone from wa_<phone> format and add + prefix if needed
        phoneNumber = conversationId.replace('wa_', '');
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+' + phoneNumber;
        }
      }
      
      console.log('Fetching messages for conversation ID:', conversationId, 'Phone:', phoneNumber);
      await fetchWhatsAppMessages(phoneNumber.replace(/[^\d]/g, ''), isAutoRefresh);
    }
    // Can add other conversation types here in the future
  };

  // Function to get actual media URL from WhatsApp media ID
  // const getMediaUrl = async (mediaId: string): Promise<string | null> => {
  //   try {
  //     console.log(`Attempting to fetch media URL for ID: ${mediaId}`);
  //     const response = await fetch(`${API_BASE}/api/whatsapp/media/${mediaId}`);
      
  //     if (!response.ok) {
  //       console.error(`Media fetch failed with status ${response.status} for media ID: ${mediaId}`);
  //       return null;
  //     }
      
  //     const data = await response.json();
  //     console.log(`✅ Media URL obtained for ${mediaId}:`, data.url?.substring(0, 100) + '...');
  //     return data.url;
  //   } catch (error) {
  //     console.error('Error fetching media URL:', error);
  //     return null;
  //   }
  // };

  // Attachment Menu Functions
  const handleAttachmentClick = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
    setShowEmojiPicker(false); // Close emoji picker if open
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  const handlePhotoVideoSelect = () => {
    imageInputRef.current?.click();
    setShowAttachmentMenu(false);
  };

  const handleContactSelect = () => {
    // TODO: Implement contact sharing
    console.log('Contact sharing selected');
    setShowAttachmentMenu(false);
  };

  const handlePollSelect = () => {
    // TODO: Implement poll creation
    console.log('Poll creation selected');
    setShowAttachmentMenu(false);
  };

  const handleEventSelect = () => {
    // TODO: Implement event creation
    console.log('Event creation selected');
    setShowAttachmentMenu(false);
  };

  const handleLocationSelect = () => {
    // TODO: Implement location sharing
    console.log('Location sharing selected');
    setShowAttachmentMenu(false);
  };

  const handleMediaSelect = () => {
    console.log('Media gallery selected');
    setShowAttachmentMenu(false);
    setShowMediaBrowser(true);
  };

  const handleMediaFromBrowser = (mediaUrl: string, caption?: string) => {
    console.log('Media selected from browser:', mediaUrl);
    
    // Create a fake message with the selected media
    const newMessage: Message = {
      id: Date.now().toString(),
      text: caption || 'Shared media from social account',
      sender: 'agent' as const,
      timestamp: new Date(),
      type: mediaUrl.includes('.mp4') || mediaUrl.includes('video') ? 'video' : 'image',
      status: 'sent',
      media_url: mediaUrl
    };

    setMessages(prev => [...prev, newMessage]);
    setShowMediaBrowser(false);
  };

  // Helper function to filter emojis based on search query
  const filterEmojis = (emojiArray: string[], query: string) => {
    if (!query.trim()) return emojiArray;
    return emojiArray.filter(emoji => {
      // Enhanced emoji name mapping for better search
      const emojiNames: { [key: string]: string[] } = {
        '😀': ['smile', 'happy', 'grin', 'face'],
        '😃': ['smile', 'happy', 'joy', 'face'],
        '😄': ['smile', 'happy', 'laugh', 'face'],
        '😁': ['grin', 'smile', 'happy', 'face'],
        '😆': ['laugh', 'happy', 'smile', 'face'],
        '😅': ['sweat', 'laugh', 'nervous', 'face'],
        '😂': ['joy', 'laugh', 'tears', 'face'],
        '🤣': ['rolling', 'laugh', 'floor', 'face'],
        '😊': ['blush', 'smile', 'happy', 'face'],
        '😇': ['innocent', 'halo', 'angel', 'face'],
        '🙂': ['smile', 'happy', 'slight', 'face'],
        '😉': ['wink', 'smile', 'face'],
        '😍': ['love', 'heart', 'eyes', 'face'],
        '🥰': ['love', 'hearts', 'smile', 'face'],
        '😘': ['kiss', 'love', 'face'],
        '😋': ['tongue', 'tasty', 'face'],
        '😎': ['cool', 'sunglasses', 'face'],
        '🤩': ['star', 'eyes', 'wow', 'face'],
        '😭': ['cry', 'tears', 'sad', 'face'],
        '😤': ['angry', 'mad', 'face'],
        '😠': ['angry', 'mad', 'face'],
        '😡': ['angry', 'red', 'mad', 'face'],
        '🥵': ['hot', 'heat', 'face'],
        '🥶': ['cold', 'freeze', 'face'],
        '❤️': ['heart', 'love', 'red'],
        '💙': ['heart', 'blue', 'love'],
        '💚': ['heart', 'green', 'love'],
        '💛': ['heart', 'yellow', 'love'],
        '💜': ['heart', 'purple', 'love'],
        '🧡': ['heart', 'orange', 'love'],
        '🤍': ['heart', 'white', 'love'],
        '🖤': ['heart', 'black', 'love'],
        '💕': ['hearts', 'love', 'two'],
        '💞': ['hearts', 'love', 'revolving'],
        '💓': ['heart', 'beating', 'love'],
        '💗': ['heart', 'growing', 'love'],
        '💖': ['heart', 'sparkling', 'love'],
        '💘': ['heart', 'arrow', 'cupid'],
        '💝': ['heart', 'gift', 'love'],
        '👍': ['thumbs', 'up', 'good', 'like'],
        '👎': ['thumbs', 'down', 'bad', 'dislike'],
        '👋': ['wave', 'hello', 'goodbye', 'hand'],
        '🙏': ['pray', 'thanks', 'please', 'hand'],
        '👏': ['clap', 'applause', 'hand'],
        '🤝': ['handshake', 'deal', 'hand'],
        '✌️': ['peace', 'victory', 'hand'],
        '🤞': ['fingers', 'crossed', 'luck', 'hand'],
        '🎉': ['party', 'celebration', 'confetti'],
        '🎊': ['party', 'confetti', 'celebration'],
        '🎈': ['balloon', 'party', 'celebration'],
        '🎂': ['cake', 'birthday', 'celebration'],
        '🎁': ['gift', 'present', 'celebration'],
        '🔥': ['fire', 'hot', 'flame', 'lit'],
        '⭐': ['star', 'favorite', 'cool'],
        '✨': ['sparkles', 'magic', 'shiny'],
        '💎': ['diamond', 'gem', 'precious'],
        '🏆': ['trophy', 'winner', 'award'],
        '🐶': ['dog', 'puppy', 'animal'],
        '🐱': ['cat', 'kitten', 'animal'],
        '🐭': ['mouse', 'animal'],
        '🐹': ['hamster', 'animal'],
        '🐰': ['rabbit', 'bunny', 'animal'],
        '🦊': ['fox', 'animal'],
        '🐻': ['bear', 'animal'],
        '🐼': ['panda', 'bear', 'animal'],
        '🚗': ['car', 'vehicle', 'auto'],
        '🚕': ['taxi', 'car', 'vehicle'],
        '✈️': ['airplane', 'plane', 'travel'],
        '🚀': ['rocket', 'space', 'travel'],
        '🍕': ['pizza', 'food'],
        '🍔': ['burger', 'food'],
        '🍟': ['fries', 'food'],
        '☕': ['coffee', 'drink'],
        '🍺': ['beer', 'drink'],
        '⚽': ['soccer', 'football', 'sport'],
        '🏀': ['basketball', 'sport'],
        '🎮': ['game', 'gaming', 'controller'],
        '📱': ['phone', 'mobile', 'device'],
        '💻': ['laptop', 'computer', 'device'],
        '💰': ['money', 'cash', 'bag'],
        '💵': ['money', 'dollar', 'cash']
      };
      
      const names = emojiNames[emoji] || [];
      return names.some(name => name.toLowerCase().includes(query.toLowerCase()));
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log('Emoji selected:', emoji);
    console.log('Current newMessage:', newMessage);
    setNewMessage(prev => prev + emoji);
    console.log('New message will be:', newMessage + emoji);
    
    // Update recently used emojis
    setRecentlyUsedEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 12); // Keep only 12 most recent
    });
    
    setShowEmojiPicker(false);
    setSearchQuery(''); // Clear search when emoji is selected
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      console.log('Files selected:', PRIVACY_MODE ? `${files.length} files` : files.map(f => f.name));
      
      // Add new files to existing selection
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Create preview URLs for images and videos
      const newPreviewUrls: string[] = [];
      files.forEach(file => {
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          const previewUrl = URL.createObjectURL(file);
          newPreviewUrls.push(previewUrl);
        } else {
          newPreviewUrls.push(''); // Empty string for non-media files
        }
      });
      
      setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setShowAttachmentMenu(false);
    }
  };

  const handleImageVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      console.log('Images/Videos selected:', PRIVACY_MODE ? `${files.length} files` : files.map(f => f.name));
      
      // Add new files to existing selection
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Create preview URLs for all files
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      setFilePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      setShowAttachmentMenu(false);
    }
  };

  const clearFilePreview = () => {
    // Revoke all object URLs to free memory
    filePreviewUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setSelectedFiles([]);
    setFilePreviewUrls([]);
  };

  const removeFile = (index: number) => {
    // Revoke the specific URL
    if (filePreviewUrls[index]) {
      URL.revokeObjectURL(filePreviewUrls[index]);
    }
    
    // Remove the file and its preview URL
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Load WhatsApp data on component mount
  useEffect(() => {
    fetchWhatsAppConversations();
    
    // Simple auto-refresh - fetch conversations every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing conversations');
      fetchWhatsAppConversations();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch actual shop name from database-first API
  useEffect(() => {
    const fetchShopName = async () => {
      setShopNameLoading(true);
      try {
        const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
        
        // Check Shopify configuration status
        const statusResponse = await fetch(`${baseUrl}/api/shopify/status`);
        if (!statusResponse.ok) {
          setShopNameLoading(false);
          return;
        }
        
        const statusData = await statusResponse.json();
        if (!statusData.isConfigured) {
          setShopNameLoading(false);
          return;
        }
        
        // Get configuration data which includes store name
        const configResponse = await fetch(`${baseUrl}/api/shopify/config`);
        if (!configResponse.ok) return;
        
        const configData = await configResponse.json();
        if (configData.success && configData.data) {
          // Always fetch the actual business name from Shopify shop API
          try {
            const shopResponse = await fetch(`${baseUrl}/api/shopify/proxy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                endpoint: '/shop.json',
                method: 'GET'
              })
            });
            
            if (shopResponse.ok) {
              const shopData = await shopResponse.json();
              if (shopData.shop?.name) {
                console.log('✅ Setting actual shop name:', shopData.shop.name);
                setActualShopName(shopData.shop.name);
                setShopNameLoading(false);
              } else {
                // Fallback to config name if available
                if (configData.data.name && configData.data.name !== 'undefined') {
                  setActualShopName(configData.data.name);
                }
                setShopNameLoading(false);
              }
            } else {
              // Fallback to config name if API call fails
              if (configData.data.name && configData.data.name !== 'undefined') {
                setActualShopName(configData.data.name);
              }
              setShopNameLoading(false);
            }
          } catch (error) {
            console.error('Error fetching shop details:', error);
            // Fallback to config name if available
            if (configData.data.name && configData.data.name !== 'undefined') {
              setActualShopName(configData.data.name);
            }
            setShopNameLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching shop name from database API:', error);
        setShopNameLoading(false);
      }
    };

    fetchShopName();

    // Only retry if we don't have a shop name AND we're not currently loading
    const retryInterval = setInterval(() => {
      if (!actualShopName && !shopNameLoading) {
        console.log('🔄 Retrying shop name fetch...');
        fetchShopName();
      }
    }, 10000);

    // Listen for shop name updates from localStorage (backup)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopifyStore' && e.newValue) {
        try {
          const store = JSON.parse(e.newValue);
          if (store?.shopName) {
            setActualShopName(store.shopName);
            setShopNameLoading(false);
          }
        } catch (error) {
          console.error('Error parsing stored shop data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(retryInterval);
    };
  }, []);

  // Clear retry behavior when shop name is successfully fetched  
  useEffect(() => {
    if (actualShopName) {
      setShopNameLoading(false);
      console.log('✅ Shop name loaded, stopping retry:', actualShopName);
    }
  }, [actualShopName]);

  // Fetch Shopify products when component mounts or when database configuration changes
  useEffect(() => {
    // Always attempt to fetch products using database-first approach
    fetchShopifyProducts();
    
    // Set up an interval to periodically check for configuration changes
    const checkInterval = setInterval(() => {
      fetchShopifyProducts();
    }, 60000); // Check every minute
    
    return () => clearInterval(checkInterval);
  }, []); // Remove dependency on shopifyStore?.connected since we're using database-first

  // Update filtered products when products, search query, or filter changes
  useEffect(() => {
    const filtered = filterProducts(shopifyProducts, productSearchQuery, productSearchFilter);
    setFilteredProducts(filtered);
  }, [shopifyProducts, productSearchQuery, productSearchFilter]);

  // Auto-update products from Shopify store every 5 minutes
  useEffect(() => {
    if (!shopifyStore?.connected || !shopifyService.isConnected()) {
      return;
    }

    const intervalId = setInterval(async () => {
      console.log('🔄 Auto-updating Shopify products...');
      try {
        await fetchShopifyProducts();
      } catch (error) {
        console.error('Auto-update failed:', error);
        // If retry count is less than 3, try again in half the interval
        if (retryCount < 3) {
          setTimeout(() => {
            console.log(`🔄 Retrying auto-update (attempt ${retryCount + 1}/3)...`);
            fetchShopifyProducts();
          }, updateInterval / 2);
        }
      }
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [shopifyStore?.connected, retryCount]);

  // Check for product updates when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && shopifyStore?.connected && shopifyService.isConnected()) {
        const now = new Date();
        const lastUpdate = productsLastUpdated;
        
        // If it's been more than 10 minutes since last update, refresh
        if (!lastUpdate || (now.getTime() - lastUpdate.getTime()) > 600000) {
          console.log('🔄 Tab visible - refreshing products...');
          fetchShopifyProducts();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [shopifyStore?.connected, productsLastUpdated]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('stella_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        setCartItems(cartData.items || []);
        setCartTotal(cartData.total || 0);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartData = {
      items: cartItems,
      total: cartTotal,
      timestamp: Date.now()
    };
    localStorage.setItem('stella_cart', JSON.stringify(cartData));
  }, [cartItems, cartTotal]);

  // Refresh messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, whatsappConversations]);

  // Auto-refresh messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing messages for selected conversation');
      
      fetchMessages(selectedConversation, true); // Pass true for isAutoRefresh
    }, 15000); // Refresh messages every 15 seconds

    return () => {
      clearInterval(interval);
    };
  }, [selectedConversation]);

  // Use only real WhatsApp conversations - no mock data
  const allConversations = whatsappConversations
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Smart scroll behavior - only scroll to bottom when appropriate
  useEffect(() => {
    if (shouldAutoScroll && isNearBottom) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, isNearBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Track scroll position to determine if user is near bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const threshold = 100; // pixels from bottom
    const isNear = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    setIsNearBottom(isNear);
    
    // If user scrolls back to bottom, re-enable auto-scroll
    if (isNear) {
      setShouldAutoScroll(true);
    } else {
      // If user scrolls away from bottom, disable auto-scroll during refresh
      setShouldAutoScroll(false);
    }
  };

  // Handle scroll to bottom button click
  const handleScrollToBottom = () => {
    setShouldAutoScroll(true);
    setIsNearBottom(true);
    scrollToBottom();
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    // Check for cart commands before sending
    if (newMessage.trim().toLowerCase().startsWith('add to cart ')) {
      handleChatCartCommand(newMessage.trim());
      setNewMessage('');
      return;
    }

    // Extract phone number from conversation ID
    const conversation = whatsappConversations.find(c => c.id === selectedConversation);
    
    // If conversation not found in the list, try to extract phone from the conversation ID
    let phoneNumber: string;
    if (!conversation) {
      console.warn('Conversation not found in list, extracting from ID:', selectedConversation);
      // Extract phone number from wa_<phone> format
      if (selectedConversation.startsWith('wa_')) {
        phoneNumber = '+' + selectedConversation.replace('wa_', '');
      } else {
        console.error('No conversation found for ID:', selectedConversation);
        return;
      }
    } else {
      phoneNumber = conversation.customerPhone;
    }

    console.log('📤 Sending message to:', phoneNumber);

    // Store values before clearing
    const messageToSend = newMessage;
    const filesToSend = [...selectedFiles];
    
    // Clear input and file preview immediately
    setNewMessage('');
    clearFilePreview();

    // Enable auto-scroll and force scroll to bottom when sending a message
    setShouldAutoScroll(true);
    setIsNearBottom(true);
    setTimeout(() => scrollToBottom(), 100);

    try {
      // If there are files, send them first
      if (filesToSend.length > 0) {
        for (let i = 0; i < filesToSend.length; i++) {
          const file = filesToSend[i];
          const isLastFile = i === filesToSend.length - 1;
          
          // Create a message for each file
          const fileMessage: Message = {
            id: `m${Date.now()}_${i}`,
            text: `[${getFileDescription(file)}]`,
            sender: 'agent',
            timestamp: new Date(),
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
            status: 'sending',
            media_url: filePreviewUrls[i] || undefined
          };

          // Add message to UI immediately (optimistic update)
          setMessages(prev => [...prev, fileMessage]);

          // Send file via WhatsApp API
          const formData = new FormData();
          formData.append('to', phoneNumber.replace(/[^\d]/g, ''));
          formData.append('file', file);
          
          // Add caption only to the last file if there's a text message
          if (isLastFile && messageToSend) {
            formData.append('caption', messageToSend);
          }

          const response = await fetch(`${API_BASE}/api/whatsapp/send-media`, {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          console.log('Media upload result:', result);
          
          if (result.success) {
            console.log('Media sent successfully:', result);
            
            // Update message status to sent
            setMessages(prev => prev.map(msg => 
              msg.id === fileMessage.id ? { 
                ...msg, 
                status: 'sent',
                whatsapp_message_id: result.messageId 
              } : msg
            ));

            // Update to delivered after a short delay
            setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === fileMessage.id ? { ...msg, status: 'delivered' } : msg
              ));
            }, 1000);

          } else {
            console.error('Failed to send media:', result);
            
            // Update message status to failed
            setMessages(prev => prev.map(msg => 
              msg.id === fileMessage.id ? { 
                ...msg, 
                status: 'failed',
                failureReason: 'general_error'
              } : msg
            ));
            
            alert('Failed to send file: ' + (result.error || 'Unknown error'));
          }
        }
        
        // If there's a text message and it wasn't sent as caption, send it separately
        if (messageToSend && filesToSend.length > 1) {
          const textMessage: Message = {
            id: `m${Date.now()}_text`,
            text: messageToSend,
            sender: 'agent',
            timestamp: new Date(),
            type: 'text',
            status: 'sending'
          };

          setMessages(prev => [...prev, textMessage]);

          const response = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: phoneNumber.replace(/[^\d]/g, ''),
              message: messageToSend,
              type: 'text'
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            setMessages(prev => prev.map(msg => 
              msg.id === textMessage.id ? { 
                ...msg, 
                status: 'sent',
                whatsapp_message_id: result.messageId 
              } : msg
            ));

            setTimeout(() => {
              setMessages(prev => prev.map(msg => 
                msg.id === textMessage.id ? { ...msg, status: 'delivered' } : msg
              ));
            }, 1000);
          } else {
            setMessages(prev => prev.map(msg => 
              msg.id === textMessage.id ? { 
                ...msg, 
                status: 'failed',
                failureReason: 'general_error'
              } : msg
            ));
            alert('Failed to send text message: ' + (result.error || 'Unknown error'));
          }
        }
        
      } else if (messageToSend) {
        // Handle text-only message
        const textMessage: Message = {
          id: `m${Date.now()}`,
          text: messageToSend,
          sender: 'agent',
          timestamp: new Date(),
          type: 'text',
          status: 'sending'
        };

        setMessages(prev => [...prev, textMessage]);

        const response = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: phoneNumber.replace(/[^\d]/g, ''),
            message: messageToSend,
            type: 'text'
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          setMessages(prev => prev.map(msg => 
            msg.id === textMessage.id ? { 
              ...msg, 
              status: 'sent',
              whatsapp_message_id: result.messageId 
            } : msg
          ));

          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.id === textMessage.id ? { ...msg, status: 'delivered' } : msg
            ));
          }, 1000);
        } else {
          console.error('Failed to send message:', result);
          
          const isReEngagementError = result.error && 
            (result.error.includes('24 hours') || 
             result.error.includes('Re-engagement') ||
             result.error.includes('131047'));
          
          setMessages(prev => prev.map(msg => 
            msg.id === textMessage.id ? { 
              ...msg, 
              status: 'failed',
              failureReason: isReEngagementError ? '24_hour_rule' : 'general_error'
            } : msg
          ));
          
          if (isReEngagementError) {
            alert('⏰ Cannot send message: WhatsApp Business policy requires customers to message first or you must wait for them to reply within 24 hours. The customer needs to send you a message before you can respond.');
          } else {
            alert('Failed to send message: ' + (result.error || 'Unknown error'));
          }
        }

      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error sending message: ' + errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Contact Management Functions
  // const checkContactStatus = async (phoneNumber: string) => {
  //   try {
  //     const response = await fetch(`${API_BASE}/api/contacts/check/${phoneNumber}`);
  //     if (!response.ok) return null;
      
  //     const data = await response.json();
  //     return data.exists ? data.contact : null;
  //   } catch (error) {
  //     console.error('Error checking contact status:', error);
  //     return null;
  //   }
  // };

  const handleSaveContact = () => {
    const conversation = whatsappConversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    setCurrentContact({
      phoneNumber: conversation.customerPhone,
      displayName: conversation.display_name,
      whatsappProfileName: conversation.profile_name
    });
    setShowContactManager(true);
  };

  const handleContactSaved = (contactInfo: any) => {
    // Update the saved contacts map
    setSavedContacts(prev => {
      const newMap = new Map(prev);
      newMap.set(contactInfo.phone_number, contactInfo);
      return newMap;
    });

    // Update the conversation list to show the saved name
    setWhatsappConversations(prev => 
      prev.map(conv => 
        conv.customerPhone === contactInfo.phone_number
          ? { ...conv, customerName: contactInfo.displayName }
          : conv
      )
    );

    console.log('Contact saved successfully:', contactInfo);
  };

  // Handle starting a new WhatsApp conversation
  const handleStartNewConversation = async () => {
    const phoneNumber = newConversationPhone.trim();
    
    // Check if user has entered enough digits
    if (phoneNumber.length <= 10) {
      return;
    }

    // Format phone number (remove any non-numeric characters except +)
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if this conversation already exists in the database conversations
    const existingConversation = whatsappConversations.find(
      conv => conv.customerPhone === cleanedPhone || conv.customerPhone === cleanedPhone.replace('+', '')
    );

    if (existingConversation) {
      // Select the existing conversation
      setSelectedConversation(existingConversation.id);
      setNewConversationPhone('+1 (868) ');
      return;
    }

    try {
      // Create a new conversation entry with database-compatible ID format
      // Use the same format as database conversations: wa_<phone_without_plus>
      const phoneForId = cleanedPhone.replace('+', '');
      const newConversation: Conversation = {
        id: `wa_${phoneForId}`,
        customerName: cleanedPhone,
        customerPhone: cleanedPhone,
        lastMessage: 'New conversation',
        timestamp: new Date(),
        unreadCount: 0,
        status: 'active',
        isWhatsApp: true,
        avatar: 'user-avatar.png'
      };

      // Add to conversations list
      setWhatsappConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(newConversation.id);
      
      // Reset the input to the prefix
      setNewConversationPhone('+1 (868) ');
      
      console.log('New WhatsApp conversation started for:', cleanedPhone);
    } catch (error) {
      console.error('Error starting new conversation:', error);
    }
  };

  // Handle using a WhatsApp template
  const handleUseTemplate = async (template: WhatsAppTemplate, variables: Record<string, string>) => {
    try {
      // Replace template variables with actual values
      let templateContent = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        templateContent = templateContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      });

      // Get the current conversation phone number
      const currentConversation = whatsappConversations.find(conv => conv.id === selectedConversation);
      const targetPhone = currentConversation?.customerPhone;

      if (!targetPhone || !selectedConversation) {
        alert('Please select a conversation first');
        return;
      }

      // Send the template message using WhatsApp Business API
      const response = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetPhone.replace(/[^\d]/g, ''), // Send only digits to the API
          message: templateContent,
          type: 'template',
          template_name: template.name
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send template: ${response.statusText}`);
      }

      const result = await response.json();

      // Add the template message to the conversation
      const newMessage: Message = {
        id: `template_${Date.now()}`,
        text: templateContent,
        sender: 'agent',
        timestamp: new Date(),
        type: 'text',
        isTemplate: true,
        templateName: template.name,
        status: 'sent'
      };

      // Add message to current conversation
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation in the list
      setWhatsappConversations(prev => prev.map(conv => 
        conv.id === selectedConversation 
          ? { ...conv, lastMessage: templateContent, timestamp: new Date() }
          : conv
      ));

      console.log('Template message sent successfully:', result);
    } catch (error) {
      console.error('Error sending template:', error);
      alert('Failed to send template message. Please try again.');
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/[^\d]/g, '');
    
    // Start with +1 (868) and format the remaining digits
    const prefix = '+1 (868) ';
    
    // If user tries to clear everything, keep the prefix
    if (cleaned.length === 0) {
      return prefix;
    }
    
    // Take only the digits after 868 (max 7 digits for Trinidad phone numbers)
    const remainingDigits = cleaned.slice(0, 7);
    
    // Format as XXX-XXXX
    if (remainingDigits.length <= 3) {
      return prefix + remainingDigits;
    } else {
      return prefix + remainingDigits.slice(0, 3) + '-' + remainingDigits.slice(3);
    }
  };

  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // If user tries to delete the prefix, prevent it
    const prefix = '+1 (868) ';
    if (value.length < prefix.length) {
      setNewConversationPhone(prefix);
      return;
    }
    
    // Extract only the numbers after the prefix
    const afterPrefix = value.slice(prefix.length);
    const formatted = formatPhoneNumber(afterPrefix);
    setNewConversationPhone(formatted);
  };

  const getDisplayNameForPhone = (phoneNumber: string, originalName?: string) => {
    // First check if we have a saved contact with custom name
    const savedContact = savedContacts.get(phoneNumber);
    if (savedContact) {
      return savedContact.has_susa_suffix 
        ? `${savedContact.saved_name} 🦋Susa`
        : savedContact.saved_name;
    }
    
    // Then check if we have WhatsApp profile information
    const conversation = whatsappConversations.find(c => c.customerPhone === phoneNumber);
    if (conversation) {
      // Prioritize display_name (which includes the best name from WhatsApp)
      if (conversation.display_name && conversation.display_name !== phoneNumber) {
        return conversation.display_name;
      }
      // Fall back to profile_name if available
      if (conversation.profile_name && conversation.profile_name !== phoneNumber) {
        return conversation.profile_name;
      }
    }
    
    // Finally fall back to original name or phone number
    return originalName || phoneNumber;
  };

  // Load saved contacts on component mount
  useEffect(() => {
    const loadSavedContacts = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/contacts`);
        if (response.ok) {
          const contacts = await response.json();
          const contactsMap = new Map();
          contacts.forEach((contact: any) => {
            contactsMap.set(contact.phone_number, contact);
          });
          setSavedContacts(contactsMap);
        }
      } catch (error) {
        console.error('Error loading saved contacts:', error);
      }
    };

    loadSavedContacts();
  }, [API_BASE]);

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

  const getStatusIcon = (status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => {
    switch (status) {
      case 'sending': return 'Sending...';
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      case 'failed': return 'Failed';
      default: return '';
    }
  };

  const getStatusIconColor = (status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed') => {
    switch (status) {
      case 'sending': return '#999';
      case 'sent': return '#999';
      case 'delivered': return '#2196F3';
      case 'read': return '#4CAF50';
      case 'failed': return '#f44336';
      default: return '#999';
    }
  };

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAttachmentMenu || showEmojiPicker) {
        const target = event.target as HTMLElement;
        if (!target.closest('.attachment-menu') && 
            !target.closest('.attachment-btn') &&
            !target.closest('.emoji-menu') &&
            !target.closest('.emoji-picker-btn')) {
          setShowAttachmentMenu(false);
          setShowEmojiPicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachmentMenu, showEmojiPicker]);

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
      {/* Cart Notification */}
      {cartNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '6px',
          zIndex: 1000,
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {cartNotification}
        </div>
      )}
      
      <div className="chat-container">
        <div className="chat-header">
          <h1>WhatsApp E-commerce Platform</h1>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-content">
          {/* Conversation List */}
          <div className="conversations-panel">
            <div className="panel-header">
              <h3>Conversations</h3>
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
              
              {/* WhatsApp Conversation Starter */}
              <div className="whatsapp-starter">
                <div className="starter-input-wrapper">
                  <input
                    type="tel"
                    placeholder="Type 7 digits (e.g., 251-3268)"
                    className="starter-input"
                    value={newConversationPhone}
                    onChange={handlePhoneNumberChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newConversationPhone.length > 10) {
                        handleStartNewConversation();
                      }
                    }}
                  />
                  {newConversationPhone.length > 10 && (
                    <button 
                      className="start-chat-btn"
                      onClick={handleStartNewConversation}
                      title="Start WhatsApp conversation"
                    >
                      💬
                    </button>
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  marginTop: '4px',
                  padding: '0 8px',
                  lineHeight: '1.3'
                }}>
                  ⏰ Note: You can only send messages to customers who have messaged you within the last 24 hours
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
                      {conversation.avatar || getDisplayNameForPhone(conversation.customerPhone, conversation.customerName).charAt(0)}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span 
                          className="customer-name"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(
                              getDisplayNameForPhone(conversation.customerPhone, conversation.customerName), 
                              searchQuery
                            ) 
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
                        {savedContacts.has(conversation.customerPhone) && (
                          <span style={{
                            fontSize: '10px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            marginLeft: '4px'
                          }}>
                            📇
                          </span>
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
                    <h3>{getDisplayNameForPhone(
                      allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerPhone || '',
                      allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerName
                    )}</h3>
                    {savedContacts.has(allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerPhone || '') && (
                      <div className="contact-saved-badge">
                        Contact Saved
                      </div>
                    )}
                    <span>{allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerPhone}</span>
                  </div>
                  <div className="chat-actions">
                    {!savedContacts.has(allConversations.find((c: Conversation) => c.id === selectedConversation)?.customerPhone || '') && (
                      <button className="action-btn" onClick={handleSaveContact} style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        📇 Save Contact
                      </button>
                    )}
                    <button 
                      className="action-btn" 
                      onClick={() => setShowTemplateManager(true)}
                      style={{
                        backgroundColor: '#25d366',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: '8px'
                      }}
                    >
                      📝 Templates
                    </button>
                  </div>
                </div>

                <div className="messages-container" onScroll={handleScroll}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender === 'agent' ? 'agent-message' : 'user-message'}`}
                    >
                      {message.type === 'product' && message.productData ? (
                        <div className="product-message" style={{ 
                          maxWidth: '280px',
                          margin: message.sender === 'agent' ? '0 0 0 auto' : '0 auto 0 0'
                        }}>
                          {(() => {
                            const product = message.productData;
                            const variants = (product as any).variants || [];
                            const availableVariants = variants.filter((v: any) => (v.inventory_quantity || 0) > 0);
                            const isAvailable = availableVariants.length > 0;
                            
                            const prices = variants.map((v: any) => parseFloat(v.price || '0')).filter((p: number) => p > 0);
                            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                            const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

                            // Check if this product has selected options
                            const selectedOptions = (product as any).selectedOptions || {};
                            const hasSelectedOptions = Object.keys(selectedOptions).length > 0;
                            
                            // Image carousel state - using message ID as key
                            const messageId = message.id;
                            const currentImageIndex = productImageIndices[messageId] || 0;
                            const productImages = (product as any).images || [];
                            const hasMultipleImages = productImages.length > 1;

                            return (
                              <div style={{ 
                                border: '1px solid rgba(255,255,255,0.2)', 
                                borderRadius: '6px', 
                                padding: '6px', 
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                position: 'relative'
                              }}>
                                {/* Availability Badge */}
                                <div style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontSize: '8px',
                                  fontWeight: 'bold',
                                  backgroundColor: isAvailable ? '#4CAF50' : '#f44336',
                                  color: 'white',
                                  zIndex: 1
                                }}>
                                  {isAvailable ? '✓ IN STOCK' : '✗ SOLD OUT'}
                                </div>

                                {/* Product Image Carousel */}
                                <div style={{ position: 'relative', marginBottom: '6px' }}>
                                  <img 
                                    src={productImages[currentImageIndex]?.src || 'https://via.placeholder.com/280x180/f0f0f0/666?text=No+Image'} 
                                    alt={`${(product as any).title} - Image ${currentImageIndex + 1}`}
                                    style={{ 
                                      width: '100%', 
                                      height: '160px', 
                                      objectFit: 'cover', 
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s ease'
                                    } as React.CSSProperties}
                                    onClick={() => {
                                      // Open full size image in new tab
                                      if (productImages[currentImageIndex]?.src) {
                                        window.open(productImages[currentImageIndex].src, '_blank');
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                  
                                  {/* Navigation Arrows - Only show if multiple images */}
                                  {hasMultipleImages && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProductImageIndices(prev => ({
                                            ...prev,
                                            [messageId]: currentImageIndex === 0 ? productImages.length - 1 : currentImageIndex - 1
                                          }));
                                        }}
                                        style={{
                                          position: 'absolute',
                                          left: '6px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          background: 'rgba(0,0,0,0.6)',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '24px',
                                          height: '24px',
                                          color: 'white',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'background-color 0.2s ease',
                                          zIndex: 2
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                                        }}
                                      >
                                        ‹
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProductImageIndices(prev => ({
                                            ...prev,
                                            [messageId]: currentImageIndex === productImages.length - 1 ? 0 : currentImageIndex + 1
                                          }));
                                        }}
                                        style={{
                                          position: 'absolute',
                                          right: '6px',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          background: 'rgba(0,0,0,0.6)',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '24px',
                                          height: '24px',
                                          color: 'white',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'background-color 0.2s ease',
                                          zIndex: 2
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                                        }}
                                      >
                                        ›
                                      </button>
                                    </>
                                  )}
                                  
                                  {/* Dot Indicators - Only show if multiple images */}
                                  {hasMultipleImages && (
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '8px',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      display: 'flex',
                                      gap: '4px',
                                      zIndex: 2
                                    }}>
                                      {productImages.map((_: any, index: number) => (
                                        <button
                                          key={index}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setProductImageIndices(prev => ({
                                              ...prev,
                                              [messageId]: index
                                            }));
                                          }}
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: index === currentImageIndex 
                                              ? 'white' 
                                              : 'rgba(255,255,255,0.5)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (index !== currentImageIndex) {
                                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (index !== currentImageIndex) {
                                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                                            }
                                          }}
                                        />
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Image Counter */}
                                  {hasMultipleImages && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '6px',
                                      left: '6px',
                                      background: 'rgba(0,0,0,0.6)',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontSize: '9px',
                                      fontWeight: 'bold',
                                      zIndex: 2
                                    }}>
                                      {currentImageIndex + 1}/{productImages.length}
                                    </div>
                                  )}
                                </div>

                                {/* Product Title */}
                                <h5 style={{ 
                                  margin: '0 0 3px 0', 
                                  fontSize: '12px', 
                                  fontWeight: 'bold',
                                  color: '#ffffff',
                                  lineHeight: '1.2',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                  {(product as any).title}
                                </h5>

                                {/* Selected Options (if any) */}
                                {hasSelectedOptions && (
                                  <div style={{
                                    margin: '0 0 6px 0',
                                    padding: '3px 6px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    borderRadius: '3px',
                                    border: '1px solid rgba(59, 130, 246, 0.3)'
                                  }}>
                                    <div style={{ 
                                      color: '#60a5fa', 
                                      fontWeight: 'bold', 
                                      fontSize: '9px',
                                      marginBottom: '2px',
                                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                      📋 Selected Options:
                                    </div>
                                    {Object.entries(selectedOptions).map(([name, value]: [string, unknown]) => (
                                      <div key={name} style={{
                                        color: '#cbd5e1',
                                        fontSize: '8px',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                      }}>
                                        • {name}: {String(value)}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Price Range */}
                                <div style={{ 
                                  margin: '0 0 6px 0', 
                                  fontSize: '14px', 
                                  fontWeight: 'bold',
                                  color: '#60a5fa',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                }}>
                                  {priceRange}
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '3px', flexDirection: 'column' }}>
                                  <button
                                    onClick={() => addToShopifyCart(product, 1)}
                                    disabled={!isAvailable}
                                    style={{
                                      width: '100%',
                                      padding: '6px',
                                      fontSize: '10px',
                                      backgroundColor: isAvailable ? '#4CAF50' : '#ccc',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                                      transition: 'background-color 0.2s',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {isAvailable ? '🛒 Add to Cart' : '❌ Unavailable'}
                                  </button>
                                  
                                  <button
                                    onClick={() => openProductModal(product)}
                                    style={{
                                      width: '100%',
                                      padding: '4px',
                                      fontSize: '9px',
                                      backgroundColor: '#2196F3',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s',
                                      textDecoration: 'none',
                                      textAlign: 'center',
                                      display: 'block'
                                    }}
                                  >
                                    � View Details
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
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
                        <div className="whatsapp-message voice-message" style={{ padding: '0', background: 'transparent' }}>
                          {message.media_file_id ? (
                            <VoiceMessageComponent 
                              audioSrc={`${API_BASE}/api/media/media/${message.media_file_id}`}
                              duration={message.voice_duration}
                              sender={message.sender}
                              mimeType={message.media_mime_type}
                            />
                          ) : message.media_url ? (
                            <VoiceMessageComponent 
                              audioSrc={`${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`}
                              duration={message.voice_duration}
                              sender={message.sender}
                              mimeType={message.media_mime_type}
                            />
                          ) : (
                            <div className="whatsapp-voice-container" style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              backgroundColor: message.sender === 'user' ? '#e7ffdb' : '#ffffff',
                              borderRadius: '7.5px',
                              maxWidth: '250px',
                              border: '1px solid #e1e8ed'
                            }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#25d366',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <span style={{ color: 'white', fontSize: '12px' }}>🎵</span>
                              </div>
                              
                              <span style={{ flex: 1, fontSize: '14px', color: '#333' }}>
                                Voice message
                              </span>
                              
                              <span style={{
                                fontSize: '12px',
                                color: '#667781',
                                flexShrink: 0
                              }}>
                                {message.voice_duration ? `${message.voice_duration}"` : '0"'}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : message.type === 'image' ? (
                        <div className="whatsapp-message image-message" style={{ padding: '0', background: 'transparent' }}>
                          {message.media_file_id ? (
                            <div className="image-preview-container">
                              <img 
                                src={`${API_BASE}/api/media/thumbnail/${message.media_file_id}/medium`}
                                alt="Image message"
                                className="image-preview"
                                style={{ 
                                  maxWidth: '300px', 
                                  maxHeight: '200px', 
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'block'
                                }}
                                onClick={() => {
                                  // Open image in modal
                                  openImageModal(`${API_BASE}/api/media/media/${message.media_file_id}`, message.text);
                                }}
                              />
                              {message.text && <div className="caption" style={{marginTop: '8px', fontSize: '14px', padding: '0 8px'}}>{message.text}</div>}
                            </div>
                          ) : message.media_url ? (
                            <div className="image-preview-container">
                              <img 
                                src={`${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`}
                                alt="Image message"
                                className="image-preview"
                                style={{ 
                                  maxWidth: '300px', 
                                  maxHeight: '200px', 
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: '#f0f0f0',
                                  display: 'block'
                                }}
                                onClick={() => {
                                  // Open image in modal
                                  openImageModal(`${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`, message.text);
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'block';
                                  }
                                }}
                              />
                              <div style={{ display: 'none', padding: '20px', border: '1px dashed #ccc', borderRadius: '8px', textAlign: 'center' }}>
                                📷 Image (ID: {message.media_url})
                                <br />
                                <small>Click to download</small>
                              </div>
                              {message.text && <div className="caption" style={{marginTop: '8px', fontSize: '14px', padding: '0 8px'}}>{message.text}</div>}
                            </div>
                          ) : (
                            <div>
                              📷 Image
                              {message.text && <div className="caption">{message.text}</div>}
                              {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                            </div>
                          )}
                        </div>
                      ) : message.type === 'document' ? (
                        <div className="whatsapp-message document-message">
                          {message.media_file_id ? (
                            <div className="document-preview-container" style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              padding: '12px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              backgroundColor: '#f9f9f9',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Open/download document
                              window.open(`${API_BASE}/api/media/media/${message.media_file_id}`, '_blank');
                            }}>
                              <div style={{ fontSize: '24px' }}>📄</div>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                  {message.text || 'Document'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {message.media_mime_type || 'Unknown type'} • Click to open
                                </div>
                              </div>
                            </div>
                          ) : message.media_url ? (
                            <div className="document-preview-container" style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              padding: '12px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              backgroundColor: '#f9f9f9',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              // Open/download document via WhatsApp proxy
                              window.open(`${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`, '_blank');
                            }}>
                              <div style={{ fontSize: '24px' }}>📄</div>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                  {message.text || 'Document'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {message.media_mime_type || 'Document'} • Click to open
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              📄 Document
                              {message.text && <div className="filename">{message.text}</div>}
                              {message.media_url && <div className="media-id">ID: {message.media_url}</div>}
                            </div>
                          )}
                        </div>
                      ) : message.type === 'video' ? (
                        <div className="whatsapp-message video-message" style={{ padding: '0', background: 'transparent' }}>
                          <VideoMessage
                            message={message}
                            whatsappConfigured={whatsappConfigured}
                            API_BASE={API_BASE}
                            setMessages={setMessages}
                            formatTime={formatTime}
                            onVideoAction={() => setShouldAutoScroll(false)}
                          />
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
                          <div className="message-meta">
                            <div className="message-timestamp">
                              {formatTime(message.timestamp)}
                            </div>
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
                          {/* Show helpful note for failed messages due to 24-hour rule */}
                          {message.status === 'failed' && message.failureReason === '24_hour_rule' && (
                            <div style={{
                              backgroundColor: '#fff3cd',
                              border: '1px solid #ffeaa7',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              marginTop: '8px',
                              fontSize: '12px',
                              color: '#856404',
                              lineHeight: '1.4'
                            }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                ⏰ Message failed - 24-hour rule
                              </div>
                              <div>
                                WhatsApp Business requires customers to message you first, or you must wait for them to reply within 24 hours. Consider using a <strong>template message</strong> instead.
                              </div>
                              <button
                                onClick={() => setShowTemplateManager(true)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#25d366',
                                  textDecoration: 'underline',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  padding: '0',
                                  marginTop: '4px',
                                  fontWeight: '500'
                                }}
                              >
                                📝 Open Templates
                              </button>
                            </div>
                          )}
                          {/* Show note for general failures */}
                          {message.status === 'failed' && message.failureReason === 'general_error' && (
                            <div style={{
                              backgroundColor: '#f8d7da',
                              border: '1px solid #f5c6cb',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              marginTop: '8px',
                              fontSize: '12px',
                              color: '#721c24',
                              lineHeight: '1.4'
                            }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                                ❌ Message failed to send
                              </div>
                              <div>
                                There was an error sending this message. Please try again or check your connection.
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to Bottom Button - only show when not near bottom */}
                {!isNearBottom && (
                  <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: '20px',
                    zIndex: 1000,
                  }}>
                    <button
                      onClick={handleScrollToBottom}
                      style={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '48px',
                        height: '48px',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                      }}
                      title="Scroll to bottom"
                    >
                      ↓
                    </button>
                  </div>
                )}

                {/* File Preview */}
                {selectedFiles.length > 0 && (
                  <div className="file-preview-container">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="file-preview" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                          {filePreviewUrls[index] && file.type.startsWith('image/') && (
                            <div className="preview-image">
                              <img 
                                src={filePreviewUrls[index]} 
                                alt={file.name}
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                            </div>
                          )}
                          {filePreviewUrls[index] && file.type.startsWith('video/') && (
                            <div className="preview-video">
                              <video 
                                src={filePreviewUrls[index]} 
                                controls
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'cover',
                                  borderRadius: '8px'
                                }}
                              />
                            </div>
                          )}
                          {!filePreviewUrls[index] && (
                            <div className="preview-document">
                              <div 
                                className="document-icon"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#f0f0f0',
                                  borderRadius: '8px',
                                  fontSize: '32px'
                                }}
                              >
                                📄
                              </div>
                            </div>
                          )}
                          <div className="file-info" style={{ flex: 1, minWidth: '120px' }}>
                            <div className="file-name" style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>{file.name}</div>
                            <div className="file-size" style={{ fontSize: '11px', color: '#666' }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button 
                            className="remove-file-btn"
                            onClick={() => removeFile(index)}
                            title="Remove file"
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '18px',
                              cursor: 'pointer',
                              color: '#999',
                              padding: '2px 6px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#666' }}>
                      <span>📎 {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected</span>
                      <button 
                        onClick={clearFilePreview}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#007bff', 
                          cursor: 'pointer', 
                          fontSize: '12px',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Message Input Container */}
                <div className="message-input-container">
                  <div className="message-input-wrapper" style={{ position: 'relative' }}>
                  {/* Attachment Menu - moved inside wrapper for proper positioning */}
                  {showAttachmentMenu && (
                    <div className="attachment-menu">
                      <div className="attachment-option" onClick={handleFileSelect}>
                        <div className="attachment-icon">📄</div>
                        <span>Document</span>
                      </div>
                      <div className="attachment-option" onClick={handlePhotoVideoSelect}>
                        <div className="attachment-icon">🖼️</div>
                        <span>Photos & Videos</span>
                      </div>
                      <div className="attachment-option" onClick={handleContactSelect}>
                        <div className="attachment-icon">👤</div>
                        <span>Contact</span>
                      </div>
                      <div className="attachment-option" onClick={handlePollSelect}>
                        <div className="attachment-icon">📊</div>
                        <span>Poll</span>
                      </div>
                      <div className="attachment-option" onClick={handleEventSelect}>
                        <div className="attachment-icon">📅</div>
                        <span>Event</span>
                      </div>
                      <div className="attachment-option" onClick={handleLocationSelect}>
                        <div className="attachment-icon">📍</div>
                        <span>Location</span>
                      </div>
                      
                      {/* Separator line */}
                      <div style={{ 
                        height: '2px', 
                        backgroundColor: '#d1d7db', 
                        margin: '12px 8px',
                        borderRadius: '1px',
                        opacity: 1,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}></div>
                      
                      {/* Media section */}
                      <div className="attachment-option" onClick={handleMediaSelect}>
                        <div className="attachment-icon">🎬</div>
                        <span>Media</span>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="attachment-btn"
                    onClick={handleAttachmentClick}
                    title="Attach files"
                  >
                    📎
                  </button>
                  <div className="textarea-wrapper" style={{ position: 'relative' }}>
                    {/* Second Attachment Menu - positioned relative to textarea wrapper */}
                    {showEmojiPicker && (
                      <div className="emoji-menu" onClick={(e) => e.stopPropagation()}>
                        {/* Search Section */}
                        <div className="emoji-search-section">
                          <input
                            type="text"
                            placeholder="Search emojis..."
                            value={emojiSearchQuery}
                            onChange={(e) => setEmojiSearchQuery(e.target.value)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onFocus={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="emoji-search-input"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: 'white',
                              fontSize: '14px',
                              marginBottom: '10px',
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Recently Used Section */}
                        {recentlyUsedEmojis.length > 0 && !searchQuery && (
                          <div className="emoji-section">
                            <div className="emoji-section-title">🕒 Recently Used</div>
                            <div className="emoji-row">
                              {recentlyUsedEmojis.map((emoji, index) => (
                                <button
                                  key={`recent-${index}`}
                                  className="emoji-button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEmojiSelect(emoji);
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s'
                                  }}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="emoji-section">
                          <div className="emoji-section-title">😀 Smileys</div>
                          <div className="emoji-row">
                            {filterEmojis(['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Emoji button clicked:', emoji);
                                  handleEmojiSelect(emoji);
                                }}
                                style={{
                                  cursor: 'pointer',
                                  background: 'none',
                                  border: 'none',
                                  fontSize: '20px',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">�‍👩‍👧‍👦 People & Family</div>
                          <div className="emoji-row">
                            {filterEmojis(['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '🤱', '👰‍♀️', '👰‍♂️', '🤵‍♀️', '🤵‍♂️', '👸', '🤴', '🦸‍♀️', '🦸‍♂️', '🦹‍♀️', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️', '🧚‍♀️', '🧚‍♂️', '🧛‍♀️', '🧛‍♂️', '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🧞‍♀️', '🧞‍♂️', '🧟‍♀️', '🧟‍♂️', '👻', '👽', '🤖', '👮‍♀️', '👮‍♂️', '🕵️‍♀️', '🕵️‍♂️'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="emoji-row">
                            {filterEmojis(['💂‍♀️', '💂‍♂️', '🥷', '👷‍♀️', '👷‍♂️', '🤴', '👸', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '🤶', '🎅'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="emoji-row">
                            {filterEmojis(['👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👨‍👨‍👧', '👨‍👨‍👦', '👨‍👨‍👧‍👦', '👩‍👩‍👧', '👩‍👩‍👦', '👩‍👩‍👧‍👦', '👨‍👧', '👨‍👦', '👨‍👧‍👦', '👩‍👧', '👩‍👦', '👩‍👧‍👦', '🗣️', '👤', '👥', '🫂', '👣'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">�💕 Hearts & Love (36 total)</div>
                          <div className="emoji-row">
                            {filterEmojis(['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦', '💨'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">👋 Gestures</div>
                          <div className="emoji-row">
                            {filterEmojis(['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">🎉 Celebrations & Symbols</div>
                          <div className="emoji-row">
                            {filterEmojis(['🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '🎯', '💡', '🔥', '💧', '🌈', '☀️', '🌙', '⚡', '💫', '💎', '🔮', '💰', '🗝️', '🎭', '🎪'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">🌮 Food & Drinks</div>
                          <div className="emoji-row">
                            {filterEmojis(['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍅', '🥕', '🌽', '🌶️', '🍞', '🥖', '🥨', '🧀', '🥓', '🍳', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍱', '🍣', '🍤', '🥟', '🍦', '🍰', '🎂', '🍭', '🍬', '🍫', '🍿', '☕', '🍵', '🥤', '🍺', '🍷', '🥂', '🍾', '🍸'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">🐶 Animals & Nature</div>
                          <div className="emoji-row">
                            {filterEmojis(['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐝', '🦋', '🐌', '🐛', '🐜', '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">🚗 Travel & Places</div>
                          <div className="emoji-row">
                            {filterEmojis(['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛴', '🚁', '✈️', '🚀', '🛸', '🚢', '⛵', '🏠', '🏡', '🏢', '🏬', '🏭', '🏰', '🗼', '🌉', '🎡', '🎢', '🎠', '⛱️', '🏖️', '🏝️'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">💼 Work & School</div>
                          <div className="emoji-row">
                            {filterEmojis(['💼', '👔', '👗', '👠', '👓', '🎓', '📚', '📖', '📝', '✏️', '📌', '📎', '📋', '📊', '📈', '📉', '💰', '💵', '💳', '💎', '⚖️', '🔧', '⚙️', '🔨'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">🎮 Entertainment</div>
                          <div className="emoji-row">
                            {filterEmojis(['🎮', '🕹️', '🎲', '🃏', '🎯', '🎪', '🎨', '🎭', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌚', '📷', '📺', '🎬', '🎞️', '📽️', '🎸', '🥁', '🎹', '🎺'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="emoji-section">
                          <div className="emoji-section-title">⚽ Sports & Activities</div>
                          <div className="emoji-row">
                            {filterEmojis(['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♂️'], emojiSearchQuery).map((emoji, index) => (
                              <button
                                key={index}
                                className="emoji-button"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="message-input"
                      rows={2}
                      style={{ paddingRight: '50px' }}
                    />
                    <button 
                      className="emoji-picker-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Emoji picker button clicked, current state:', showEmojiPicker);
                        setShowEmojiPicker(!showEmojiPicker);
                        console.log('Setting showEmojiPicker to:', !showEmojiPicker);
                      }}
                      title="Open emoji picker"
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        padding: '0',
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}
                    >
                      😀
                    </button>
                  </div>
                  <button 
                    className="send-btn"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && selectedFiles.length === 0}
                  >
                    Send
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageVideoUpload}
                  accept="image/*,video/*"
                />
                </div>
              </>
            ) : (
              <div className="no-conversation-selected">
                <h3>💬 Select a conversation to start chatting</h3>
                <p>Choose a customer from the conversation list to begin assisting them with their e-commerce needs.</p>
              </div>
            )}
          </div>

          {/* E-commerce Integration Panel */}
          <div className="shopify-panel">
            <div style={{ padding: '4px 8px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                🛒 {shopNameLoading ? 'Loading store...' : (actualShopName || 'E-commerce Store')}
                {isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#22c55e', fontWeight: 'normal' }}>● Connected</span>}
                {!isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#ef4444', fontWeight: 'normal' }}>● Demo Mode</span>}
              </h3>
            </div>
            
            {/* First Section - Products */}
            <div className="shopify-section" style={{ padding: '10px', border: '1px solid #334155', margin: '10px 0', borderRadius: '8px', backgroundColor: '#1e293b' }}>
              {/* Products Header */}
              <div style={{ marginBottom: '8px' }}>
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                  🛍️ Products ({shopifyProducts.length})
                  {!isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#fbbf24', fontWeight: 'normal' }}>(Demo Products)</span>}
                </h4>
              </div>

              {/* Search Bar */}
              <div style={{ marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="Search all products..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    outline: 'none',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                    height: '28px'
                  }}
                />
                
                {productSearchQuery && (
                  <div style={{ fontSize: '8px', color: '#cccccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span>
                      Searching all fields for "{productSearchQuery}"
                    </span>
                    <span>
                      {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} found
                    </span>
                  </div>
                )}
              </div>
              
              {productsLoading ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>Loading products...</div>
              ) : (productSearchQuery ? filteredProducts : shopifyProducts).length > 0 ? (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                className="no-scrollbar"
                >
                  {(productSearchQuery ? filteredProducts : shopifyProducts)
                    .sort((a, b) => {
                      // Sort by availability: in-stock products first, sold-out products last
                      const aVariants = a.variants || [];
                      const bVariants = b.variants || [];
                      const aInStock = aVariants.some((v: any) => (v.inventory_quantity || 0) > 0);
                      const bInStock = bVariants.some((v: any) => (v.inventory_quantity || 0) > 0);
                      
                      // In stock products come first (true = 1, false = 0, so we reverse the comparison)
                      if (aInStock && !bInStock) return -1; // a comes first
                      if (!aInStock && bInStock) return 1;  // b comes first
                      return 0; // keep original order for products with same availability status
                    })
                    .map((product) => {
                    // Calculate availability and variants info
                    const variants = product.variants || [];
                    const availableVariants = variants.filter((v: any) => (v.inventory_quantity || 0) > 0);
                    const isAvailable = availableVariants.length > 0;
                    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0);
                    
                    // Extract sizes, colors, and prices
                    const sizes = new Set<string>();
                    const colors = new Set<string>();
                    const prices = variants.map((v: any) => parseFloat(v.price || '0')).filter((p: number) => p > 0);
                    
                    // Parse options for sizes and colors
                    (product.options || []).forEach((option: any) => {
                      if (option.name?.toLowerCase().includes('size')) {
                        (option.values || []).forEach((value: string) => sizes.add(value));
                      }
                      if (option.name?.toLowerCase().includes('color') || option.name?.toLowerCase().includes('colour')) {
                        (option.values || []).forEach((value: string) => colors.add(value));
                      }
                    });

                    // Helper function to get specific inventory for color/size combination
                    const getVariantInventory = (color?: string, size?: string) => {
                      if (!color && !size) return 0;
                      
                      const matchingVariants = variants.filter((variant: any) => {
                        let colorMatch = !color; // If no color specified, match all
                        let sizeMatch = !size;   // If no size specified, match all
                        
                        // Check color match
                        if (color) {
                          colorMatch = variant.option1?.toLowerCase() === color.toLowerCase() ||
                                     variant.option2?.toLowerCase() === color.toLowerCase() ||
                                     variant.option3?.toLowerCase() === color.toLowerCase();
                        }
                        
                        // Check size match  
                        if (size) {
                          sizeMatch = variant.option1?.toLowerCase() === size.toLowerCase() ||
                                    variant.option2?.toLowerCase() === size.toLowerCase() ||
                                    variant.option3?.toLowerCase() === size.toLowerCase();
                        }
                        
                        return colorMatch && sizeMatch;
                      });
                      
                      return matchingVariants.reduce((total: number, variant: any) => 
                        total + (variant.inventory_quantity || 0), 0);
                    };

                    // Helper function to check if a specific option value is available
                    const isOptionValueAvailable = (_optionName: string, optionValue: string) => {
                      // Find variants that match this specific option value
                      const matchingVariants = variants.filter((variant: any) => {
                        // Check if this variant has the specified option value
                        return variant.option1?.toLowerCase() === optionValue.toLowerCase() || 
                               variant.option2?.toLowerCase() === optionValue.toLowerCase() || 
                               variant.option3?.toLowerCase() === optionValue.toLowerCase();
                      });
                      
                      // Check if any matching variant has inventory
                      return matchingVariants.some((variant: any) => (variant.inventory_quantity || 0) > 0);
                    };

                    // Get selected color and size for inventory calculation
                    const selectedColor = selectedVariants[product.id]?.['Color'] || selectedVariants[product.id]?.['Colour'];
                    const selectedSize = selectedVariants[product.id]?.['Size'];
                    const selectedInventory = getVariantInventory(selectedColor, selectedSize);

                    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                    const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

                    return (
                      <div 
                        key={product.id} 
                        style={{ 
                          border: '1px solid rgba(255,255,255,0.2)', 
                          borderRadius: '8px', 
                          padding: '4px', 
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-3px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        }}
                      >
                        {/* Availability Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          backgroundColor: isAvailable ? '#4CAF50' : '#f44336',
                          color: 'white',
                          zIndex: 1
                        }}>
                          {isAvailable ? `✓ ${totalStock} in stock` : '✗ SOLD OUT'}
                        </div>

                        {/* Product Image */}
                        <img 
                          src={product.images?.[0]?.src || 'https://via.placeholder.com/200x150/f0f0f0/666?text=No+Image'} 
                          alt={product.title}
                          style={{ 
                            width: '100%', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            marginBottom: '6px'
                          }}
                        />

                        {/* Product Title */}
                        <h5 style={{ 
                          margin: '0 0 2px 0', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          color: '#ffffff',
                          lineHeight: '1.1',
                          height: '22px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {product.title}
                        </h5>

                        {/* Price Range */}
                        <div style={{ 
                          margin: '0 0 3px 0', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          color: '#60a5fa',
                          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}>
                          {priceRange}
                        </div>

                        {/* Product Details */}
                        <div style={{ marginBottom: '3px', fontSize: '9px', lineHeight: '1.2' }}>
                          {/* Clickable Colors */}
                          {colors.size > 0 && (
                            <div style={{ marginBottom: '2px' }}>
                              <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '1px', fontSize: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>🎨 Colors:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
                                {Array.from(colors).map((color) => {
                                  const isSelected = selectedVariants[product.id]?.['Color'] === color || selectedVariants[product.id]?.['Colour'] === color;
                                  const isColorAvailable = isOptionValueAvailable('color', color);
                                  const colorInventory = getVariantInventory(color);
                                  
                                  return (
                                    <button
                                      key={color}
                                      onClick={() => {
                                        if (!isColorAvailable) return; // Don't allow selection if this color is not available
                                        const colorOptionName = product.options?.find((opt: any) => 
                                          opt.name?.toLowerCase().includes('color') || opt.name?.toLowerCase().includes('colour')
                                        )?.name || 'Color';
                                        handleVariantOptionSelect(product.id, colorOptionName, color);
                                      }}
                                      disabled={!isColorAvailable}
                                      title={`${color}: ${colorInventory} in stock`}
                                      style={{
                                        padding: '1px 3px',
                                        fontSize: '7px',
                                        border: `1px solid ${isSelected && isColorAvailable ? '#2196F3' : '#ddd'}`,
                                        borderRadius: '6px',
                                        backgroundColor: isSelected && isColorAvailable ? '#2196F3' : !isColorAvailable ? '#f5f5f5' : 'white',
                                        color: isSelected && isColorAvailable ? 'white' : !isColorAvailable ? '#999' : '#555',
                                        cursor: isColorAvailable ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: isColorAvailable ? 1 : 0.5,
                                        position: 'relative'
                                      }}
                                    >
                                      {color}
                                      {isColorAvailable && (
                                        <span style={{ 
                                          fontSize: '6px', 
                                          marginLeft: '2px', 
                                          opacity: 0.8,
                                          fontWeight: 'bold'
                                        }}>
                                          ({colorInventory})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Clickable Sizes */}
                          {sizes.size > 0 && (
                            <div style={{ marginBottom: '2px' }}>
                              <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '1px', fontSize: '8px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>📏 Sizes:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
                                {Array.from(sizes).map((size) => {
                                  const isSelected = selectedVariants[product.id]?.['Size'] === size;
                                  
                                  // Check if this size is available in the selected color (or any color if none selected)
                                  const sizeInventory = selectedColor 
                                    ? getVariantInventory(selectedColor, size) 
                                    : getVariantInventory(undefined, size);
                                    
                                  const isSizeAvailable = selectedColor 
                                    ? sizeInventory > 0  // If color is selected, check specific combination
                                    : isOptionValueAvailable('size', size); // If no color selected, check general availability
                                  
                                  return (
                                    <button
                                      key={size}
                                      onClick={() => {
                                        if (!isSizeAvailable) return; // Don't allow selection if this size is not available
                                        const sizeOptionName = product.options?.find((opt: any) => 
                                          opt.name?.toLowerCase().includes('size')
                                        )?.name || 'Size';
                                        handleVariantOptionSelect(product.id, sizeOptionName, size);
                                      }}
                                      disabled={!isSizeAvailable}
                                      title={selectedColor 
                                        ? `${size} in ${selectedColor}: ${sizeInventory} in stock`
                                        : `${size}: ${sizeInventory} in stock`}
                                      style={{
                                        padding: '1px 3px',
                                        fontSize: '7px',
                                        border: `1px solid ${isSelected && isSizeAvailable ? '#4CAF50' : '#ddd'}`,
                                        borderRadius: '6px',
                                        backgroundColor: isSelected && isSizeAvailable ? '#4CAF50' : !isSizeAvailable ? '#f5f5f5' : 'white',
                                        color: isSelected && isSizeAvailable ? 'white' : !isSizeAvailable ? '#999' : '#555',
                                        cursor: isSizeAvailable ? 'pointer' : 'not-allowed',
                                        transition: 'all 0.2s',
                                        opacity: isSizeAvailable ? 1 : 0.5
                                      }}
                                    >
                                      {size}
                                      {isSizeAvailable && (
                                        <span style={{ 
                                          fontSize: '6px', 
                                          marginLeft: '2px', 
                                          opacity: 0.8,
                                          fontWeight: 'bold'
                                        }}>
                                          ({sizeInventory})
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Current Selection Inventory */}
                          {(selectedColor || selectedSize) && (
                            <div style={{ marginBottom: '2px', padding: '2px 4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                              <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '7px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                📦 Selected: {selectedColor && selectedSize ? `${selectedColor} - ${selectedSize}` : selectedColor || selectedSize} 
                                <span style={{ color: selectedInventory > 0 ? '#22c55e' : '#ef4444', marginLeft: '4px' }}>
                                  ({selectedInventory} in stock)
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Variants Count */}
                          <div style={{ marginBottom: '1px', display: 'flex', alignItems: 'center', gap: '1px' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '7px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>🔄 Variants:</span>
                            <span style={{ color: '#cbd5e1', fontSize: '7px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                              {variants.length} option{variants.length !== 1 ? 's' : ''} available
                            </span>
                          </div>

                          {/* Stock Status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 'bold', fontSize: '7px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>📦 Stock:</span>
                            <span style={{ 
                              color: isAvailable ? '#4ade80' : '#f87171',
                              fontWeight: 'bold',
                              fontSize: '7px',
                              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                            }}>
                              {isAvailable ? `${totalStock} units` : 'Out of stock'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                          <button
                            onClick={() => addToShopifyCart(product, 1)}
                            disabled={!isAvailable}
                            style={{
                              width: '100%',
                              padding: '4px',
                              fontSize: '8px',
                              backgroundColor: isAvailable ? '#4CAF50' : '#ccc',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: isAvailable ? 'pointer' : 'not-allowed',
                              transition: 'background-color 0.2s',
                              fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => {
                              if (isAvailable) e.currentTarget.style.backgroundColor = '#45a049';
                            }}
                            onMouseLeave={(e) => {
                              if (isAvailable) e.currentTarget.style.backgroundColor = '#4CAF50';
                            }}
                          >
                            {isAvailable ? '🛒 Add to Cart' : '❌ Unavailable'}
                          </button>
                          
                          <button
                            onClick={() => {
                              const hasSelectedOptions = selectedVariants[product.id] && Object.keys(selectedVariants[product.id]).length > 0;
                              if (hasSelectedOptions) {
                                sendSelectedVariantInChat(product);
                              } else {
                                sendProductInChat(product);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '3px',
                              fontSize: '7px',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                          >
                            {selectedVariants[product.id] && Object.keys(selectedVariants[product.id]).length > 0 
                              ? '💬 Send Selected' 
                              : '💬 Send in Chat'
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  {productSearchQuery 
                    ? `No products found for "${productSearchQuery}"`
                    : shopifyStore?.connected 
                      ? 'No products found' 
                      : 'Connect Shopify to see products'
                  }
                  {productSearchQuery && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          setProductSearchQuery('');
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Second Section - Cart */}
            <div className="shopify-section" style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: '0', fontSize: '14px', color: '#333' }}>
                  🛒 Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                </h4>
                <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4CAF50' }}>
                  Total: ${cartTotal.toFixed(2)}
                </div>
              </div>
              
              {cartItems.length > 0 ? (
                <div>
                  {/* Cart Items */}
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
                    {cartItems.map((item, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        marginBottom: '5px',
                        border: '1px solid #eee'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            ${item.variants?.[0]?.price || item.price || 'N/A'} each
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId || item.id, item.quantity - 1)}
                            style={{
                              width: '20px',
                              height: '20px',
                              padding: '0',
                              fontSize: '12px',
                              backgroundColor: '#ff4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            -
                          </button>
                          
                          <span style={{ 
                            minWidth: '25px', 
                            textAlign: 'center', 
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {item.quantity}
                          </span>
                          
                          <button
                            onClick={() => updateCartQuantity(item.cartItemId || item.id, item.quantity + 1)}
                            style={{
                              width: '20px',
                              height: '20px',
                              padding: '0',
                              fontSize: '12px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer'
                            }}
                          >
                            +
                          </button>
                          
                          <button
                            onClick={() => removeFromCart(item.cartItemId || item.id)}
                            style={{
                              width: '20px',
                              height: '20px',
                              padding: '0',
                              fontSize: '10px',
                              backgroundColor: '#666',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              marginLeft: '5px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cart Actions */}
                  <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <button
                      onClick={sendCartInChat}
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '11px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Send Cart in Chat
                    </button>
                    
                    <button
                      onClick={clearCart}
                      style={{
                        width: '100%',
                        padding: '6px',
                        fontSize: '10px',
                        backgroundColor: '#ff4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#666', 
                  padding: '20px',
                  fontSize: '12px' 
                }}>
                  Your cart is empty<br />
                  <small>Add products from Section 1 above</small>
                </div>
              )}
            </div>
            
            {/* Third Section */}
            <div className="shopify-section" style={{ padding: '10px', border: '1px dashed #ccc', margin: '10px 0', borderRadius: '4px' }}>
              <p style={{ color: '#666', textAlign: 'center', margin: '20px 0' }}>Section 3 - Ready for content</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Manager Modal */}
      {showContactManager && currentContact && (
        <ContactManager
          phoneNumber={currentContact.phoneNumber}
          displayName={currentContact.displayName}
          whatsappProfileName={currentContact.whatsappProfileName}
          onContactSaved={handleContactSaved}
          onClose={() => setShowContactManager(false)}
        />
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        imageUrl={modalImageUrl}
        caption={modalImageCaption}
        onClose={closeImageModal}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={showProductModal}
        product={modalProduct}
        onClose={closeProductModal}
        onAddToCart={addToShopifyCart}
        shopifyStore={shopifyStore}
      />

      {/* WhatsApp Template Manager */}
      <WhatsAppTemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        onUseTemplate={handleUseTemplate}
      />

      {/* Media Browser */}
      {showMediaBrowser && (
        <MediaBrowser
          onClose={() => setShowMediaBrowser(false)}
          onSelectMedia={handleMediaFromBrowser}
        />
      )}

    </div>
  );
};

export default ChatPage;
