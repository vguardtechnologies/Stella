import React, { useState, useRef, useEffect } from 'react';
import VideoMessage from './VideoMessage';
import ContactManager from './ContactManager';
import ImageModal from './ImageModal';
import ProductModal from './ProductModal';
import WhatsAppTemplateManager from './WhatsAppTemplateManager';
import MediaBrowser from './MediaBrowser';
import FacebookEmojiPicker from './FacebookEmojiPicker';
import { shopifyService } from '../services/shopifyService';
import SocialMediaService from '../services/socialMediaService';
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
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  type: 'text' | 'product' | 'order' | 'cart' | 'recommendation' | 'voice' | 'image' | 'document' | 'video' | 'sticker' | 'location' | 'social_post' | 'social_comment' | 'page_reply' | 'reply_input';
  productData?: Product;
  orderData?: Order;
  cartData?: {
    items: any[];
    total: number;
    finalTotal: number;
    discount?: any;
    itemCount: number;
  };
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'draft';
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
  // Social Media specific fields
  platform?: string;
  post?: {
    title: string;
    url: string;
    image?: string;
  };
  author?: string;
  placeholder?: string;
  // Social comment specific fields
  commentId?: number;
  senderName?: string;
  senderHandle?: string;
  postContext?: {
    title: string;
    url: string;
    mediaUrl?: string;
  };
  statusIndicators?: {
    isEdited?: boolean;
    lastEditedAt?: string;
    editCount?: number;
    originalText?: string;
  };
  content?: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
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
  // Social Media specific fields
  isSocialMedia?: boolean;
  platform?: string;
  post_title?: string;
  post_url?: string;
  post_image?: string;
  comment_id?: string;
  post_id?: string;
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
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFacebookEmojiPicker, setShowFacebookEmojiPicker] = useState(false);
  const [facebookEmojiPickerPosition, setFacebookEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const [activeCommentForReaction, setActiveCommentForReaction] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>([]);
  const [emojiUsageCount, setEmojiUsageCount] = useState<Record<string, number>>({});
  
  // Track which comments have page replies for showing "Replied" indicators
  const [commentPageReplies, setCommentPageReplies] = useState<Record<string, { count: number; hasReplies: boolean }>>({});
  
  // Cache for reply data to prevent excessive API calls
  const [replyDataCache, setReplyDataCache] = useState<Record<string, { data: any; timestamp: number }>>({});
  const REPLY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // Track last reply fetch time to reduce frequency
  const [lastReplyFetchTime, setLastReplyFetchTime] = useState<number>(0);
  const REPLY_FETCH_COOLDOWN = 2 * 60 * 1000; // Only fetch reply indicators every 2 minutes max
  
  const [newConversationPhone, setNewConversationPhone] = useState('+1 (868) ');
  const [actualShopName, setActualShopName] = useState<string>('');
  const [shopNameLoading, setShopNameLoading] = useState(true);
  
  // Ref to track current expanded state for intervals
  const showAllCommentsRef = useRef(false);
  const [isShopifyConfigured, setIsShopifyConfigured] = useState(false);
  const [shopifyProducts, setShopifyProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [messagesRefreshing, setMessagesRefreshing] = useState(false);
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
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    shippingAddress: {
      address1: '',
      address2: '',
      city: '',
      province: '',
      zip: '',
      country: 'US'
    },
    paymentMethod: 'stripe',
    orderNotes: ''
  });
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    description: string;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // Smart Auto Cart UX Enhancement States
  const [cartFocusMode, setCartFocusMode] = useState(false);
  const [isHoveringCart, setIsHoveringCart] = useState(false);
  const [lastCartInteraction, setLastCartInteraction] = useState<number>(0);
  const [autoRecoveryTimer, setAutoRecoveryTimer] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [productImageIndices, setProductImageIndices] = useState<{[messageId: string]: number}>({});

  // WhatsApp Integration State
  const [whatsappConversations, setWhatsappConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any>(null);
  const [whatsappConfigured] = useState(true); // Assume configured since we have permanent token
  
  // Social Media Integration State
  const [socialMediaConversations, setSocialMediaConversations] = useState<Conversation[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestedReply, setAiSuggestedReply] = useState<string>('');
  const [allComments, setAllComments] = useState<any[]>([]);
  
  // Bulk Comment Management State
  const [showAllComments, setShowAllComments] = useState(false);
  const [bulkAIResponses, setBulkAIResponses] = useState<any[]>([]);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [editableResponses, setEditableResponses] = useState<{[key: number]: string}>({});
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  
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
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // File Preview State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  // Privacy Configuration - can be controlled via environment variable
  const PRIVACY_MODE = import.meta.env.VITE_PRIVACY_MODE === 'true' || true; // Default to privacy-enabled

  // Template Management State
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  
  // Media Browser State
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);

  // WhatsApp Gallery State
  const [showWhatsAppGallery, setShowWhatsAppGallery] = useState(false);

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
        
        // Remove duplicates based on phone number (primary key)
        const uniqueConversations = convertedConversations.filter((conv: any, index: number, array: any[]) =>
          index === array.findIndex((c: any) => c.customerPhone === conv.customerPhone)
        );        console.log(`Original conversations: ${convertedConversations.length}, Unique conversations: ${uniqueConversations.length}`);
        setWhatsappConversations(uniqueConversations);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp conversations:', error);
    }
  };

  // Fetch Social Media conversations from the database
  const fetchSocialMediaConversations = async () => {
    try {
      console.log('Fetching Social Media conversations...');
      const socialMediaService = new SocialMediaService(API_BASE);
      // Get all comments (deleted comments are automatically removed from database)
      const allComments = await socialMediaService.getComments();
      
      console.log('All social media comments:', allComments);
      
      // Filter out page replies (comments made by our page/business account)
      // Page replies should not appear as separate conversations
      const customerComments = allComments.filter((comment: any) => {
        // Filter out SUSA page replies by author ID and name
        const isPageReply = comment.author_id === '113981868340389' || 
                           comment.author_name === 'SUSA' ||
                           comment.author_handle === '@113981868340389';
        
        if (isPageReply) {
          console.log('🚫 Filtering out page reply:', comment.id, comment.author_name, comment.comment_text?.substring(0, 50));
        }
        
        return !isPageReply;
      });
      
      console.log(`🔍 Filtered ${allComments.length - customerComments.length} page replies from conversation list`);
      
      const convertedConversations = customerComments.map((comment: any) => ({
        id: `sm_${comment.id}`,
        customerName: comment.author_name || comment.author_username || 'Social Media User',
        customerPhone: `social_${comment.platform}_${comment.author_id}`,
        lastMessage: comment.comment_text || comment.content || 'Social media comment',
        timestamp: new Date(comment.created_at),
        unreadCount: comment.reply_count || 0,
        status: 'active',
        display_name: comment.author_name || comment.author_username,
        profile_name: comment.author_name,
        last_message_type: 'social_comment',
        isSocialMedia: true,
        platform: comment.platform,
        post_title: comment.post_title,
        post_url: comment.post_url,
        post_image: comment.post_image,
        comment_id: comment.id,
        post_id: comment.post_id
      }));
      
      console.log(`✅ Social Media conversations (customer comments only): ${convertedConversations.length}`);
      setSocialMediaConversations(convertedConversations);
      
      // Fetch page replies for all customer comments to show "Replied" indicators
      // But only if enough time has passed since last fetch to avoid overloading the API
      const now = Date.now();
      const shouldFetchReplies = (now - lastReplyFetchTime) > REPLY_FETCH_COOLDOWN;
      
      if (customerComments.length > 0 && shouldFetchReplies) {
        console.log('⏰ Reply fetch cooldown period passed, fetching fresh reply indicators...');
        setLastReplyFetchTime(now);
        
        const commentIds = customerComments.map((comment: any) => comment.id.toString());
        console.log('🔍 Fetching page reply status for conversation list...');
        console.log('📋 Comment IDs to fetch replies for:', commentIds);
        
        try {
          const repliesData = await fetchPageRepliesForIndicators(commentIds);
          console.log('📊 Page replies data received for indicators:', repliesData);
          
          // Process the replies data to create our indicator mapping
          const replyMapping: Record<string, { count: number; hasReplies: boolean }> = {};
          
          if (repliesData) {
            console.log('📊 Processing replies data keys:', Object.keys(repliesData));
            Object.keys(repliesData).forEach(commentId => {
              const replies = repliesData[commentId] || [];
              console.log(`📝 Comment ${commentId} has ${replies.length} total replies:`, replies);
              // Count only SUSA/page replies
              const pageReplies = replies.filter((reply: any) => 
                reply.from?.name === 'SUSA' || reply.from?.id === '113981868340389'
              );
              console.log(`📝 Comment ${commentId} has ${pageReplies.length} page replies from SUSA`);
              
              replyMapping[commentId] = {
                count: pageReplies.length,
                hasReplies: pageReplies.length > 0
              };
            });
          }
          
          console.log('📈 Reply indicator mapping created:', replyMapping);
          setCommentPageReplies(replyMapping);
        } catch (error) {
          console.error('❌ Error fetching page reply indicators:', error);
        }
      } else if (customerComments.length > 0) {
        console.log(`⏰ Reply fetch cooldown active (${Math.round((REPLY_FETCH_COOLDOWN - (now - lastReplyFetchTime)) / 1000)}s remaining), skipping reply indicator fetch`);
      }
    } catch (error) {
      console.error('Error fetching Social Media conversations:', error);
    }
  };

  // Fetch page replies for social media comments to show "Replied" indicators
  const fetchPageRepliesForIndicators = async (commentIds: string[]) => {
    if (commentIds.length === 0) return {};
    
    // Check cache first and filter out comments we already have fresh data for
    const now = Date.now();
    const cachedResults: Record<string, any> = {};
    const uncachedIds: string[] = [];
    
    commentIds.forEach(id => {
      const cached = replyDataCache[id];
      if (cached && (now - cached.timestamp) < REPLY_CACHE_DURATION) {
        // Use cached data
        cachedResults[id] = cached.data;
        console.log(`💾 Using cached reply data for comment ${id}`);
      } else {
        // Need to fetch fresh data
        uncachedIds.push(id);
      }
    });
    
    // Only fetch data for comments not in cache
    let freshResults: Record<string, any> = {};
    if (uncachedIds.length > 0) {
      console.log(`🔍 Fetching fresh page reply status for ${uncachedIds.length} comments:`, uncachedIds);
      
      try {
        // Direct API call for uncached comments only
        const response = await fetch(`${API_BASE}/api/social-commenter?action=comment-replies&comment_ids=${uncachedIds.join(',')}`);
        const data = await response.json();
        
        if (data.success) {
          console.log(`📊 Fresh page replies data received for ${uncachedIds.length} comments`);
          freshResults = data.replies || {};
          
          // Update cache with fresh data
          const newCache = { ...replyDataCache };
          uncachedIds.forEach(id => {
            if (freshResults[id]) {
              newCache[id] = {
                data: freshResults[id],
                timestamp: now
              };
            }
          });
          setReplyDataCache(newCache);
          
        } else {
          console.error('Failed to fetch page replies:', data.error);
        }
        
      } catch (error) {
        console.error('❌ Error fetching page replies:', error);
      }
    } else {
      console.log(`💾 All ${commentIds.length} comments found in cache, no API calls needed`);
    }
    
    // Combine cached and fresh results
    return { ...cachedResults, ...freshResults };
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

  // Handle variant option selection with toggle support
  const handleVariantOptionSelect = (productId: string, optionName: string, optionValue: string) => {
    setSelectedVariants(prev => {
      const currentSelections = prev[productId] || {};
      
      // Check if this option value is already selected - if so, toggle it off
      if (currentSelections[optionName] === optionValue) {
        const newSelections = { ...currentSelections };
        delete newSelections[optionName]; // Remove the selection (toggle off)
        
        return {
          ...prev,
          [productId]: newSelections
        };
      }
      
      // Otherwise, select the new option value
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
      
      // If we're selecting a size, check if it's available in the currently selected color
      if (optionName.toLowerCase().includes('size')) {
        const currentColor = currentSelections['Color'] || currentSelections['Colour'];
        if (currentColor) {
          // Find the product to check inventory
          const product = shopifyProducts.find(p => p.id === productId);
          if (product) {
            // Check if this size is available in the selected color
            const variants = product.variants || [];
            const sizeInColorInventory = variants.filter((variant: any) => {
              const colorMatch = variant.option1?.toLowerCase() === currentColor.toLowerCase() ||
                               variant.option2?.toLowerCase() === currentColor.toLowerCase() ||
                               variant.option3?.toLowerCase() === currentColor.toLowerCase();
              const sizeMatch = variant.option1?.toLowerCase() === optionValue.toLowerCase() ||
                              variant.option2?.toLowerCase() === optionValue.toLowerCase() ||
                              variant.option3?.toLowerCase() === optionValue.toLowerCase();
              return colorMatch && sizeMatch;
            }).reduce((total: number, variant: any) => total + (variant.inventory_quantity || 0), 0);
            
            // If the size is not available in the selected color, don't select it
            if (sizeInColorInventory === 0) {
              return prev; // Don't update selections if combination is not available
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
            text: `Check out this specific variant from SUSA SHAPEWEAR! 💫\n\n*Selected:* ${optionsText}\n*Price:* ${price}${comparePrice}\n*Stock:* ${selectedVariant?.inventory_quantity > 0 ? `${selectedVariant.inventory_quantity} available` : 'Out of stock'}`
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
  // Helper function to check if all required options are selected for a product
  const areAllOptionsSelected = (product: any): { isValid: boolean; missingOptions: string[] } => {
    // If product has no options, no validation needed
    if (!product.options || product.options.length === 0) {
      return { isValid: true, missingOptions: [] };
    }

    // If product only has one variant, likely no meaningful options to select
    if (product.variants && product.variants.length <= 1) {
      return { isValid: true, missingOptions: [] };
    }

    // Filter out options that don't need user selection
    const meaningfulOptions = product.options.filter((option: any) => {
      const optionName = option.name?.toLowerCase() || '';
      
      // Skip default "Title" option - this is Shopify's default when no real options exist
      if (optionName === 'title') {
        return false;
      }
      
      // Skip options with only one value - no choice to make
      if (option.values && option.values.length <= 1) {
        return false;
      }
      
      return true;
    });

    // If no meaningful options after filtering, no validation needed
    if (meaningfulOptions.length === 0) {
      return { isValid: true, missingOptions: [] };
    }

    // Get selected options for this product
    const selectedOptions = selectedVariants[product.id] || {};
    const requiredOptions = meaningfulOptions.map((option: any) => option.name);
    const missingOptions: string[] = [];

    // Check each required option
    for (const optionName of requiredOptions) {
      if (!selectedOptions[optionName]) {
        missingOptions.push(optionName);
      }
    }

    return {
      isValid: missingOptions.length === 0,
      missingOptions
    };
  };

  const addToShopifyCart = (product: any, quantity: number = 1) => {
    // Validate that all required options are selected
    const optionValidation = areAllOptionsSelected(product);
    
    if (!optionValidation.isValid) {
      // Show error message indicating which options need to be selected
      const missingOptionsText = optionValidation.missingOptions.join(', ');
      const errorMessage = `Please select all required options: ${missingOptionsText}`;
      
      setCartNotification(errorMessage);
      
      // Clear notification after 5 seconds (longer for error messages)
      setTimeout(() => setCartNotification(''), 5000);
      
      console.warn(`❌ Cannot add to cart - Missing options: ${missingOptionsText}`);
      return;
    }

    // Get the selected variant based on options
    let selectedVariant = product.variants?.[0]; // Default to first variant
    const selectedOptions = selectedVariants[product.id] || {};
    
    if (Object.keys(selectedOptions).length > 0 && product.variants) {
      selectedVariant = product.variants.find((variant: any) => {
        return Object.entries(selectedOptions).every(([, optionValue]) => {
          return variant.option1?.toLowerCase() === optionValue.toLowerCase() ||
                 variant.option2?.toLowerCase() === optionValue.toLowerCase() ||
                 variant.option3?.toLowerCase() === optionValue.toLowerCase();
        });
      }) || product.variants[0];
    }

    // Check if selected variant is in stock
    if (selectedVariant && selectedVariant.inventory_quantity <= 0) {
      setCartNotification(`Selected variant is out of stock`);
      setTimeout(() => setCartNotification(''), 5000);
      console.warn(`❌ Cannot add to cart - Selected variant out of stock`);
      return;
    }

    // Create a unique cart item ID that includes selected options
    const optionsHash = Object.entries(selectedOptions).sort().map(([k,v]) => `${k}:${v}`).join('|');
    const uniqueCartItemId = `cart_${product.id}_${optionsHash}_${Date.now()}`;
    
    // Check if exact same product with same options already exists in cart
    const existingItem = cartItems.find(item => {
      if (item.id !== product.id) return false;
      
      // Compare selected options
      const itemOptions = item.selectedOptions || {};
      const currentOptions = selectedOptions;
      
      const itemOptionsStr = Object.entries(itemOptions).sort().map(([k,v]) => `${k}:${v}`).join('|');
      const currentOptionsStr = Object.entries(currentOptions).sort().map(([k,v]) => `${k}:${v}`).join('|');
      
      return itemOptionsStr === currentOptionsStr;
    });
    
    if (existingItem) {
      // Update quantity if item with same options already exists
      setCartItems(prev => prev.map(item => 
        item.cartItemId === existingItem.cartItemId 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
      const optionsText = Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ');
      setCartNotification(`Updated ${product.title} ${optionsText ? `(${optionsText})` : ''} quantity in cart`);
    } else {
      // Add new item to cart with selected options and optimized images
      const optimizedImages = product.images?.map((img: any) => ({
        ...img,
        src: optimizeImageUrl(img.src)
      })) || [];
      
      const cartItem = {
        ...product,
        quantity,
        cartItemId: uniqueCartItemId,
        addedAt: new Date(),
        selectedOptions: selectedOptions,
        selectedVariant: selectedVariant,
        displayPrice: selectedVariant?.price || product.variants?.[0]?.price || '0.00',
        images: optimizedImages, // Use optimized images for better WhatsApp quality
        // Also optimize single image property if it exists
        image: product.image ? { ...product.image, src: optimizeImageUrl(product.image.src) } : undefined
      };
      setCartItems(prev => [...prev, cartItem]);
      
      const optionsText = Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ');
      const displayText = optionsText ? `${product.title} (${optionsText})` : product.title;
      setCartNotification(`Added ${displayText} to cart`);
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => setCartNotification(''), 3000);
    
    const optionsText = Object.entries(selectedOptions).map(([key, value]) => `${key}: ${value}`).join(', ');
    console.log(`✅ Added to cart: ${product.title} ${optionsText ? `(${optionsText})` : ''} (${quantity}x)`);
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

  // Function to optimize Shopify image URLs for better WhatsApp quality
  const optimizeImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '';
    
    // Remove existing parameters and add high-quality parameters
    const baseUrl = imageUrl.split('?')[0];
    // Request high quality: 800x800 max, 90% quality, WebP format for better compression
    return `${baseUrl}?width=800&height=800&quality=90&format=webp`;
  };

  const sendCartInChat = async () => {
    if (!selectedConversation) {
      alert('Please select a conversation first');
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty');
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

    console.log('🛒 Sending cart as WhatsApp product list');
    console.log('Cart items:', cartItems);
    console.log('Phone number:', phoneNumber);

    try {
      const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      console.log('API_BASE:', API_BASE);
      
      // First, send a product image card with the first product in cart
      if (cartItems.length > 0) {
        console.log('🎯 ENTERING IMAGE SECTION - Cart has items');
        const firstProduct = cartItems[0];
        console.log('First product in cart:', firstProduct);
        
        // Optimize the image URL if it's a Shopify image
        const optimizeImageUrl = (url: string | undefined | null) => {
          if (!url || typeof url !== 'string') {
            // Use a simple, reliable placeholder image
            return 'https://via.placeholder.com/400x400/25D366/ffffff?text=Product';
          }
          if (url.includes('shopify.com')) {
            const separator = url.includes('?') ? '&' : '?';
            return `${url}${separator}width=800&height=800&quality=90&format=webp`;
          }
          return url;
        };

        const imageUrl = optimizeImageUrl(firstProduct.image || firstProduct.imageSrc);
        console.log('Image URL to send:', imageUrl);
        console.log('Original image URLs:', { image: firstProduct.image, imageSrc: firstProduct.imageSrc });

        // Always send image message (with placeholder if needed)
        if (imageUrl) {
          const productImagePayload = {
            to: phoneNumber.replace(/[^\d]/g, ''),
            type: 'image',
            mediaUrl: imageUrl,
            caption: `🛒 ${firstProduct.title}\n💰 $${firstProduct.displayPrice || firstProduct.price} TTD\n📦 Quantity: ${firstProduct.quantity}\n\nYour cart details below:`
          };
          console.log('Sending product image with payload:', productImagePayload);

          const productImageResponse = await fetch(`${API_BASE}/api/whatsapp`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productImagePayload)
          });

          const imageResult = await productImageResponse.json();
          console.log('Product image result:', imageResult);

          if (!imageResult.success) {
            console.error('❌ Product image failed:', imageResult);
            // Don't throw error, just log and continue with cart list
            console.warn('⚠️ Continuing with cart list despite image failure');
          } else {
            console.log('✅ Product image sent successfully');
            // Wait longer before sending the cart list
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Send cart as WhatsApp interactive list with checkout option
      const cartListPayload = {
        to: phoneNumber.replace(/[^\d]/g, ''),
        type: 'interactive',
        interactive: {
          type: 'list',
          header: {
            type: 'text',
            text: '🛒 Your Shopping Cart'
          },
          body: {
            text: `You have ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart.\n\nTotal: $${getFinalTotal().toFixed(2)} TTD\n${appliedDiscount ? `Discount: -$${calculateDiscountAmount().toFixed(2)} TTD\n` : ''}Ready for checkout!`
          },
          footer: {
            text: 'Select an option below'
          },
          action: {
            button: 'View Options',
            sections: [
              {
                title: 'Cart Items',
                rows: cartItems.slice(0, 9).map((item, index) => ({ // WhatsApp limits to 10 rows total
                  id: `view_item_${item.id}`,
                  title: item.title.substring(0, 24), // WhatsApp title limit
                  description: `$${item.displayPrice || item.price} × ${item.quantity}`.substring(0, 72) // WhatsApp description limit
                }))
              },
              {
                title: 'Actions',
                rows: [
                  {
                    id: 'proceed_checkout',
                    title: 'Check-out',
                    description: 'Processing your purchase'
                  }
                ]
              }
            ]
          }
        }
      };
      console.log('Cart list payload:', JSON.stringify(cartListPayload, null, 2));

      const cartResponse = await fetch(`${API_BASE}/api/whatsapp/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartListPayload)
      });

      const cartResult = await cartResponse.json();
      console.log('Interactive list cart result:', cartResult);

      if (cartResult.success) {
        alert('Cart sent successfully to WhatsApp!');
        
        // Update the conversation in the sidebar
        if (currentConversation) {
          const now = new Date().toISOString();
          const cartMessage = {
            id: Date.now().toString() + Math.random(),
            content: `🛒 Cart with ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} sent - $${getFinalTotal().toFixed(2)} TTD`,
            timestamp: now,
            sender: 'user'
          };
          
          const updatedConversation = {
            ...currentConversation,
            lastMessage: cartMessage.content,
            lastMessageTime: now,
            messages: [...(currentConversation.messages || []), cartMessage]
          };
          
          setCurrentConversation(updatedConversation);
        }
      } else {
        console.error('❌ Cart list failed:', cartResult);
        alert(`Failed to send cart: ${cartResult.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('❌ Error sending cart:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      alert(`Failed to send cart due to error: ${error.message || 'Unknown error'}`);
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

  // Checkout functionality
  const processCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty');
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // Create Shopify draft order
      const lineItems = cartItems.map(item => ({
        variant_id: item.variants?.[0]?.id || item.id,
        quantity: item.quantity,
        title: item.title,
        price: parseFloat(item.variants?.[0]?.price || '0')
      }));

      const draftOrderData: any = {
        draft_order: {
          line_items: lineItems,
          customer: {
            first_name: checkoutData.customerInfo.firstName,
            last_name: checkoutData.customerInfo.lastName,
            email: checkoutData.customerInfo.email,
            phone: checkoutData.customerInfo.phone
          },
          shipping_address: {
            first_name: checkoutData.customerInfo.firstName,
            last_name: checkoutData.customerInfo.lastName,
            address1: checkoutData.shippingAddress.address1,
            address2: checkoutData.shippingAddress.address2,
            city: checkoutData.shippingAddress.city,
            province: checkoutData.shippingAddress.province,
            zip: checkoutData.shippingAddress.zip,
            country: checkoutData.shippingAddress.country,
            phone: checkoutData.customerInfo.phone
          },
          note: checkoutData.orderNotes + (appliedDiscount ? `\nDiscount Applied: ${appliedDiscount.code} (-$${calculateDiscountAmount().toFixed(2)})` : ''),
          email: checkoutData.customerInfo.email
        }
      };

      // Add discount information if applied
      if (appliedDiscount) {
        draftOrderData.draft_order.applied_discount = {
          description: appliedDiscount.description,
          value: calculateDiscountAmount(),
          value_type: 'fixed_amount',
          amount: calculateDiscountAmount()
        };
      }

      const response = await fetch(`${API_BASE}/api/shopify/draft-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftOrderData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Send order confirmation to WhatsApp
        if (selectedConversation) {
          const phoneNumber = selectedConversation.replace('wa_', '');
          const orderMessage = `🎉 *Order Created Successfully!*\n\n` +
            `📋 Order #${result.draft_order.id}\n` +
            `👤 Customer: ${checkoutData.customerInfo.firstName} ${checkoutData.customerInfo.lastName}\n` +
            `📧 Email: ${checkoutData.customerInfo.email}\n` +
            `📱 Phone: ${checkoutData.customerInfo.phone}\n\n` +
            `📦 *Items:*\n` +
            cartItems.map((item, index) => 
              `${index + 1}. ${item.title} - $${parseFloat(item.variants?.[0]?.price || '0')} x ${item.quantity}`
            ).join('\n') +
            `\n\n💰 *Subtotal: $${cartTotal.toFixed(2)}*\n` +
            (appliedDiscount ? `💳 *Discount (${appliedDiscount.code}): -$${calculateDiscountAmount().toFixed(2)}*\n` : '') +
            `🏷️ *Final Total: $${getFinalTotal().toFixed(2)}*\n\n` +
            `📍 *Shipping Address:*\n` +
            `${checkoutData.shippingAddress.address1}\n` +
            `${checkoutData.shippingAddress.city}, ${checkoutData.shippingAddress.province} ${checkoutData.shippingAddress.zip}\n` +
            `${checkoutData.shippingAddress.country}\n\n` +
            `✅ We'll process your order and send updates soon!`;

          await fetch(`${API_BASE}/api/whatsapp/send-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: phoneNumber,
              message: orderMessage,
              type: 'text'
            })
          });
        }

        // Clear cart and close modal
        clearCart();
        setShowCheckoutModal(false);
        alert(`Order created successfully! Order ID: ${result.draft_order.id}`);
        
      } else {
        const error = await response.text();
        console.error('Checkout failed:', error);
        alert('Checkout failed. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout error. Please try again.');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const updateCheckoutData = (section: string, field: string, value: string) => {
    setCheckoutData(prev => {
      if (section === 'customerInfo') {
        return {
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            [field]: value
          }
        };
      } else if (section === 'shippingAddress') {
        return {
          ...prev,
          shippingAddress: {
            ...prev.shippingAddress,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  // Apply discount code
  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsApplyingDiscount(true);
    setDiscountError('');

    try {
      const response = await fetch(`${API_BASE}/api/shopify/validate-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          cartTotal: cartTotal,
          lineItems: cartItems.map(item => ({
            variant_id: item.variants?.[0]?.id || item.id,
            quantity: item.quantity,
            price: parseFloat(item.variants?.[0]?.price || '0')
          }))
        })
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setAppliedDiscount({
          code: discountCode.trim(),
          type: result.type,
          value: result.value,
          description: result.description
        });
        setDiscountError('');
      } else {
        setDiscountError(result.message || 'Invalid discount code');
        setAppliedDiscount(null);
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      setDiscountError('Failed to apply discount code');
      setAppliedDiscount(null);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  // Remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    if (appliedDiscount.type === 'percentage') {
      return cartTotal * (appliedDiscount.value / 100);
    } else {
      return Math.min(appliedDiscount.value, cartTotal);
    }
  };

  // Calculate final total with discount
  const getFinalTotal = () => {
    return cartTotal - calculateDiscountAmount();
  };

  // Smart Auto Cart UX Enhancement Functions
  const handleCartInteraction = () => {
    setLastCartInteraction(Date.now());
    if (!cartFocusMode) {
      setCartFocusMode(true);
    }
    
    // Clear any existing recovery timer
    if (autoRecoveryTimer) {
      clearTimeout(autoRecoveryTimer);
    }
    
    // Set a new recovery timer for 8 seconds of inactivity
    const newTimer = setTimeout(() => {
      if (!isHoveringCart) {
        setCartFocusMode(false);
      }
    }, 8000);
    
    setAutoRecoveryTimer(newTimer);
  };

  const handleCartMouseEnter = () => {
    setIsHoveringCart(true);
    handleCartInteraction();
  };

  const handleCartMouseLeave = () => {
    setIsHoveringCart(false);
    
    // Start recovery timer when mouse leaves cart
    if (autoRecoveryTimer) {
      clearTimeout(autoRecoveryTimer);
    }
    
    const newTimer = setTimeout(() => {
      setCartFocusMode(false);
    }, 3000); // 3 seconds after mouse leaves
    
    setAutoRecoveryTimer(newTimer);
  };

  const handleProductsMouseEnter = () => {
    // If user hovers over products while cart is in focus mode, give them 5 seconds before auto-recovery
    if (cartFocusMode && autoRecoveryTimer) {
      clearTimeout(autoRecoveryTimer);
      
      const newTimer = setTimeout(() => {
        if (!isHoveringCart) {
          setCartFocusMode(false);
        }
      }, 5000);
      
      setAutoRecoveryTimer(newTimer);
    }
  };

  // Cleanup timer on component unmount
  React.useEffect(() => {
    return () => {
      if (autoRecoveryTimer) {
        clearTimeout(autoRecoveryTimer);
      }
    };
  }, [autoRecoveryTimer]);

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
        // Debug: Show what we got from server
        console.log(`📨 Server returned ${data.data.length} messages for auto-refresh`);
        data.data.forEach((msg: any, idx: number) => {
          console.log(`   ${idx}: id=${msg.whatsapp_message_id} type=${msg.message_type} content=${msg.message_content?.substring(0, 30)}...`);
        });

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

          // Preserve local messages (cart, product messages) that have rich formatting
          console.log(`🔍 Auto-refresh detected - checking ${messages.length} existing messages for preservation`);
          
          const localMessages = messages.filter(msg => 
            (msg.type === 'cart' && msg.cartData) || 
            (msg.type === 'product' && msg.id.startsWith('product_')) ||
            (msg.id.startsWith('cart_') || msg.id.startsWith('product_variant_'))
          );
          
          console.log(`🔍 Found ${localMessages.length} potential local messages:`, localMessages.map(m => ({ id: m.id, type: m.type, hasCartData: !!m.cartData })));
          
          // For cart messages, always preserve the local version with cartData over server's plain text version
          const serverMessageIds = new Set(convertedMessages.map((m: any) => m.whatsapp_message_id || m.id));
          console.log(`📋 Server message IDs:`, Array.from(serverMessageIds));
          
          const localMessagesToKeep = localMessages.filter(msg => {
            // Always preserve cart messages with cartData, regardless of server version
            if (msg.type === 'cart' && msg.cartData) {
              console.log(`🛒 FORCE-PRESERVING cart message ${msg.id} with cartData (whatsapp_id: ${msg.whatsapp_message_id})`);
              return true;
            }
            
            // Always preserve product messages with productData
            if (msg.type === 'product' && msg.productData) {
              console.log(`📦 FORCE-PRESERVING product message ${msg.id} with productData (whatsapp_id: ${msg.whatsapp_message_id})`);
              return true;
            }
            
            // For other messages, check if server doesn't have them
            const shouldKeep = !serverMessageIds.has(msg.whatsapp_message_id || msg.id);
            console.log(`🔍 Message ${msg.id} (whatsapp_id: ${msg.whatsapp_message_id}) - Should keep: ${shouldKeep}`);
            return shouldKeep;
          });
          
          // Remove server versions of cart messages that we want to keep local versions of
          const cartMessagesToKeep = localMessagesToKeep.filter(msg => msg.type === 'cart' && msg.cartData);
          console.log(`🛒 Found ${cartMessagesToKeep.length} local cart messages to preserve during auto-refresh`);
          
          if (cartMessagesToKeep.length > 0) {
            cartMessagesToKeep.forEach(cartMsg => {
              console.log(`🛒 Preserving cart message: ${cartMsg.id}, whatsapp_id: ${cartMsg.whatsapp_message_id}, has cartData: ${!!cartMsg.cartData}`);
            });
            
            const cartMessageIds = new Set(cartMessagesToKeep.map(msg => msg.whatsapp_message_id).filter(id => id));
            console.log(`🛒 Cart message WhatsApp IDs to filter from server:`, Array.from(cartMessageIds));
            
            // Filter out server versions of cart messages to preserve local formatting
            const originalServerCount = convertedMessages.length;
            const filteredServerMessages = convertedMessages.filter((serverMsg: any) => {
              const messageContent = serverMsg.message_content || serverMsg.text || '';
              const isCartMessage = cartMessageIds.has(serverMsg.whatsapp_message_id || serverMsg.id) || 
                                   messageContent.includes('🛒 *SHOPPING CART SUMMARY*') ||
                                   messageContent.includes('SHOPPING CART SUMMARY') ||
                                   messageContent.includes('═══════════════════════════') ||
                                   (messageContent.includes('🛒') && messageContent.includes('TOTAL:'));
              
              if (isCartMessage) {
                console.log(`🗑️ Removing server version of cart message ${serverMsg.whatsapp_message_id || serverMsg.id} to keep local cart formatting`);
                console.log(`   Server message content preview: ${messageContent.substring(0, 100)}...`);
              }
              
              return !isCartMessage;
            });
            
            console.log(`🛒 Filtered server messages from ${originalServerCount} to ${filteredServerMessages.length}`);
            // Replace convertedMessages with the filtered array
            convertedMessages.splice(0, convertedMessages.length, ...filteredServerMessages);
          }
          
          if (localMessagesToKeep.length > 0) {
            console.log('🔄 Preserving', localMessagesToKeep.length, 'local messages during refresh');
            localMessagesToKeep.forEach(msg => {
              console.log(`   - ${msg.id}: type=${msg.type}, cartData=${!!msg.cartData}, productData=${!!msg.productData}`);
            });
            convertedMessages.push(...localMessagesToKeep);
          }
          
          // Final validation: Ensure all cart messages have proper type and cartData
          convertedMessages.forEach((msg: any, index: number) => {
            if (msg.type === 'cart' && !msg.cartData) {
              console.warn(`⚠️ Cart message at index ${index} missing cartData:`, msg.id);
            }
            if (msg.text && msg.text.includes('🛒 *SHOPPING CART SUMMARY*') && msg.type !== 'cart') {
              console.warn(`⚠️ Message with cart content but wrong type:`, { id: msg.id, type: msg.type, hasCartData: !!msg.cartData });
              // Force correct the type
              msg.type = 'cart';
              if (!msg.cartData) {
                console.log(`🔧 Attempting to reconstruct cartData from text for message ${msg.id}`);
                // Basic cartData reconstruction (better than nothing)
                msg.cartData = {
                  items: [],
                  total: 0,
                  finalTotal: 0,
                  itemCount: 0
                };
              }
            }
          });
          
          console.log('📋 Final message array:', convertedMessages.map((m: any) => ({ 
            id: m.id, 
            type: m.type, 
            hasCartData: !!m.cartData,
            isCart: m.type === 'cart',
            preview: (m.text || m.message_content || '').substring(0, 50)
          })));
        }
        
        setMessages(convertedMessages.reverse());
        
        // Debug: Show final message array composition
        if (convertedMessages.length > 0) {
          console.log('📋 Final message array composition:');
          convertedMessages.forEach((msg: any, idx: number) => {
            console.log(`   ${idx}: ${msg.id} (type: ${msg.type}, cartData: ${!!msg.cartData}) - ${msg.text?.substring(0, 30)}...`);
          });
        }
      } else {
        console.warn('Messages fetch was not successful:', data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
    }
  };

  // General function to fetch messages for any conversation
  const fetchMessages = async (conversationId: string, isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setMessagesRefreshing(true);
    }
    
    try {
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
      } else if (conversationId.startsWith('sm_')) {
        // Social Media conversation - fetch comment thread
        await fetchSocialMediaMessages(conversationId, isAutoRefresh ? showAllCommentsRef.current : false);
      }
      // Can add other conversation types here in the future
    } finally {
      if (isAutoRefresh) {
        setMessagesRefreshing(false);
      }
    }
  };

  // Helper function to fetch existing page replies for comments
  const fetchPageReplies = async (commentIds: string[]) => {
    try {
      const response = await fetch(`${API_BASE}/api/social-commenter?action=comment-replies&comment_ids=${commentIds.join(',')}`);
      const data = await response.json();
      
      if (data.success) {
        return data.replies;
      } else {
        console.error('Failed to fetch page replies:', data.error);
        return {};
      }
    } catch (error) {
      console.error('Error fetching page replies:', error);
      return {};
    }
  };

  // Fetch Social Media messages (comments and replies)
  const fetchSocialMediaMessages = async (conversationId: string, preserveExpandedState = false) => {
    try {
      // Find the social media conversation
      const conversation = socialMediaConversations.find(c => c.id === conversationId);
      
      if (!conversation) {
        console.warn('Social media conversation not found:', conversationId);
        return;
      }

      // If preserveExpandedState is true, we should maintain the expanded view
      // Don't rely on showAllComments state as it might be stale
      const shouldMaintainExpandedView = preserveExpandedState;

      console.log('�🔍 Social media conversation details:', {
        id: conversation.id,
        post_id: conversation.post_id,
        comment_id: conversation.comment_id,
        platform: conversation.platform,
        customerName: conversation.customerName,
        lastMessage: conversation.lastMessage,
        preserveExpandedState
      });

      // Initialize messages array with the original post
      const mockMessages: any[] = [
        // Original post display
        {
          id: `post_${conversation.post_id}`,
          sender: 'system' as const,
          text: '',
          timestamp: new Date(conversation.timestamp),
          type: 'social_post' as const,
          platform: conversation.platform,
          status: 'sent' as const,
          post: {
            title: conversation.post_title!,
            url: conversation.post_url!,
            image: conversation.post_image
          }
        }
      ];

      // Get all comments for this post
      const socialMediaService = new SocialMediaService(API_BASE);
      let allCommentsData = [];
      
      console.log(`🔍 Attempting to fetch comments for post_id: ${conversation.post_id}, platform: ${conversation.platform}`);
      
      try {
        allCommentsData = await socialMediaService.getPostComments(
          conversation.post_id!,
          conversation.platform
        );
        console.log(`📬 Found ${allCommentsData.length} comments for post ${conversation.post_id}`);
        console.log('📋 Comments details:', allCommentsData);
      } catch (error) {
        console.error('❌ Error fetching post comments:', error);
        // Fallback to single comment if API fails
        allCommentsData = [{
          id: conversation.comment_id,
          comment_text: conversation.lastMessage,
          author_name: conversation.customerName,
          created_at: conversation.timestamp,
          platform_type: conversation.platform
        }];
        console.log('🔄 Using fallback comment:', allCommentsData[0]);
      }

      // Store all comments for later use (always update this)
      setAllComments(allCommentsData);

      // Get comment IDs for fetching page replies
      const commentIds = allCommentsData.map((comment: any) => comment.id);
      console.log('🔍 Fetching page replies for comments:', commentIds);
      
      // Fetch existing page replies
      const pageRepliesByComment = await fetchPageReplies(commentIds);
      console.log('📱 Page replies fetched:', pageRepliesByComment);

      // Check if we should show all comments (expanded state) or just initial comment
      if (shouldMaintainExpandedView) {
        // Show all comments - use the expanded view
        console.log(`🔄 Maintaining expanded view with all ${allCommentsData.length} comments`);
        
        allCommentsData.forEach((comment: any, index: number) => {
          console.log(`📝 Adding comment ${index + 1}:`, comment);
          
          // Use the service method to properly convert comment to message with status indicators
          const socialMediaService = new SocialMediaService(API_BASE);
          const commentMessage = socialMediaService.convertCommentToMessage(comment);
          
          // Ensure proper sender assignment for chat display
          mockMessages.push({
            ...commentMessage,
            sender: 'user' as const,
            text: `${comment.author_name}: ${comment.comment_text}`,
            type: 'social_comment' as const,
            status: 'sent' as const,
            author: comment.author_name,
            platform: conversation.platform,
            commentId: comment.id,
            reactions: [] // Will be loaded async
          });

          // Add existing page replies for this comment (if any)
          const pageReplies = pageRepliesByComment[comment.id] || [];
          pageReplies.forEach((reply: any, replyIndex: number) => {
            mockMessages.push({
              id: `page_reply_${comment.id}_${replyIndex}`,
              sender: 'agent' as const,
              text: reply.message,
              timestamp: new Date(reply.created_time),
              type: 'page_reply' as const,
              status: 'sent' as const,
              author: reply.from?.name || 'SUSA',
              platform: conversation.platform,
              commentId: comment.id,
              isPageReply: true
            });
          });

          // Add individual reply input bubble for this comment
          mockMessages.push({
            id: `reply_${comment.id}`,
            sender: 'agent' as const,
            text: '',
            placeholder: `Reply to ${comment.author_name}...`,
            timestamp: new Date(),
            type: 'reply_input' as const,
            status: 'draft' as const,
            author: 'Agent',
            platform: conversation.platform,
            commentId: comment.id
          });
        });
        
        console.log(`✅ Maintained expanded view with all ${allCommentsData.length} comments`);
        
      } else {
        // Show only initial comment (collapsed state)
        const targetComment = allCommentsData.find((comment: any) => comment.id === conversation.comment_id);
        const initialComment = targetComment || allCommentsData[0];

        if (initialComment) {
          console.log(`📝 Initially showing only comment: ${initialComment.id}`);
          
          // Use the service method to properly convert comment to message with status indicators
          const socialMediaService = new SocialMediaService(API_BASE);
          const commentMessage = socialMediaService.convertCommentToMessage(initialComment);
          
          // Add the initial comment with proper status indicators
          mockMessages.push({
            ...commentMessage,
            id: `comment_${initialComment.id}`,
            sender: 'user' as const,
            text: `${initialComment.author_name}: ${initialComment.comment_text}`,
            type: 'social_comment' as const,
            status: 'sent' as const,
            author: initialComment.author_name,
            platform: conversation.platform,
            commentId: initialComment.id,
            reactions: [] // Will be loaded async
          });

          // Add existing page replies for the initial comment (if any)
          const pageReplies = pageRepliesByComment[initialComment.id] || [];
          pageReplies.forEach((reply: any, replyIndex: number) => {
            mockMessages.push({
              id: `page_reply_${initialComment.id}_${replyIndex}`,
              sender: 'agent' as const,
              text: reply.message,
              timestamp: new Date(reply.created_time),
              type: 'page_reply' as const,
              status: 'sent' as const,
              author: reply.from?.name || 'SUSA',
              platform: conversation.platform,
              commentId: initialComment.id,
              isPageReply: true
            });
          });

          mockMessages.push({
            id: `reply_${initialComment.id}`,
            sender: 'agent' as const,
            text: '',
            placeholder: `Reply to ${initialComment.author_name}...`,
            timestamp: new Date(),
            type: 'reply_input' as const,
            status: 'draft' as const,
            author: 'Agent',
            platform: conversation.platform,
            commentId: initialComment.id
          });

          // If there are more comments, add a "Show all comments" indicator
          if (allCommentsData.length > 1) {
            mockMessages.push({
              id: `show_all_indicator`,
              sender: 'system' as const,
              text: `💬 ${allCommentsData.length - 1} more comments available. Click "Show All Comments" above to see them.`,
              timestamp: new Date(),
              type: 'text' as const,
              status: 'sent' as const,
              author: 'System',
              platform: conversation.platform,
              isSystemMessage: true
            });
          }
        }
        
        console.log(`✅ Initially showing 1 comment out of ${allCommentsData.length} total comments`);
      }
      
      console.log('Setting social media messages:', mockMessages);
      
      // Smart message merging to prevent glitching during auto-refresh
      if (preserveExpandedState && messages.length > 0) {
        // Merge new messages with existing ones, preserving reactions and UI state
        setMessages(prevMessages => {
          const newMessages = [...mockMessages];
          
          // Preserve existing reactions for matching messages
          prevMessages.forEach(prevMsg => {
            const matchingNewMsg = newMessages.find(newMsg => 
              newMsg.id === prevMsg.id || 
              (newMsg.commentId && newMsg.commentId === prevMsg.commentId)
            );
            
            if (matchingNewMsg && prevMsg.reactions && prevMsg.reactions.length > 0) {
              console.log(`🔄 Preserving reactions for message ${matchingNewMsg.id}:`, prevMsg.reactions);
              matchingNewMsg.reactions = prevMsg.reactions;
            }
          });
          
          return newMessages;
        });
      } else {
        // Initial load - set messages normally
        setMessages(mockMessages);
      }
      
      // Load reactions for all social comment messages
      await loadReactionsForMessages(mockMessages);
      
      // Only reset showAllComments to false on initial load (not auto-refresh)  
      // If we're maintaining expanded view, keep it expanded
      if (!preserveExpandedState) {
        setShowAllComments(false);
      } else if (shouldMaintainExpandedView) {
        console.log('✅ Auto-refresh completed - maintained expanded comments view');
        // Keep showAllComments as true - no need to re-expand since we handled it above
      }
      
    } catch (error) {
      console.error('Error fetching social media messages:', error);
    }
  };

  // Function to expand and show all comments
  const expandAllComments = async () => {
    if (!selectedConversation || !selectedConversation.startsWith('sm_') || allComments.length === 0) {
      return;
    }

    const conversation = socialMediaConversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    console.log(`🔄 Expanding to show all ${allComments.length} comments`);

    // Initialize messages array with the original post
    const expandedMessages: any[] = [
      // Original post display
      {
        id: `post_${conversation.post_id}`,
        sender: 'system' as const,
        text: '',
        timestamp: new Date(conversation.timestamp),
        type: 'social_post' as const,
        platform: conversation.platform,
        status: 'sent' as const,
        post: {
          title: conversation.post_title!,
          url: conversation.post_url!,
          image: conversation.post_image
        }
      }
    ];

    // Add all comments with their reply bubbles
    allComments.forEach((comment: any, index: number) => {
      console.log(`📝 Adding comment ${index + 1}:`, comment);
      
      // Add comment message
      expandedMessages.push({
        id: `comment_${comment.id}`,
        sender: 'user' as const,
        text: `${comment.author_name}: ${comment.comment_text}`,
        timestamp: new Date(comment.created_at),
        type: 'social_comment' as const,
        status: 'sent' as const,
        author: comment.author_name,
        platform: conversation.platform,
        commentId: comment.id,
        reactions: [] // Will be loaded async
      });

      // Add individual reply input bubble for this comment
      expandedMessages.push({
        id: `reply_${comment.id}`,
        sender: 'agent' as const,
        text: '',
        placeholder: `Reply to ${comment.author_name}...`,
        timestamp: new Date(),
        type: 'reply_input' as const,
        status: 'draft' as const,
        author: 'Agent',
        platform: conversation.platform,
        commentId: comment.id
      });
    });

    console.log(`✅ Expanded to show all ${allComments.length} comments`);
    setMessages(expandedMessages);
    
    // Load reactions for the expanded comments
    await loadReactionsForMessages(expandedMessages);
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
      const updated = [emoji, ...filtered].slice(0, 8); // Keep only 8 most recent (same as reactions)
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('stella_recent_emojis', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save recent emojis to localStorage:', error);
      }
      
      return updated;
    });
    
    setShowEmojiPicker(false);
    setSearchQuery(''); // Clear search when emoji is selected
  };

  // Track emoji usage frequency
  const trackEmojiUsage = (emoji: string) => {
    setEmojiUsageCount(prev => {
      const updated = {
        ...prev,
        [emoji]: (prev[emoji] || 0) + 1
      };
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('stella_emoji_usage', JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to save emoji usage to localStorage:', error);
      }
      
      return updated;
    });
    
    // Also update recently used emojis
    setRecentlyUsedEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 8);
    });
  };

  // Handle comment emoji reactions
  const handleCommentReaction = async (commentId: number, emoji: string) => {
    try {
      console.log(`🎭 Adding reaction ${emoji} to comment ${commentId}`);
      
      // Track emoji usage for dynamic quick reactions
      trackEmojiUsage(emoji);
      
      const socialMediaService = new SocialMediaService(API_BASE);
      const result = await socialMediaService.toggleReaction(commentId, emoji);
      
      console.log('Reaction result:', result);
      
      // Update recently used emojis when an emoji is used
      setRecentlyUsedEmojis(prev => {
        const filtered = prev.filter(e => e !== emoji);
        const updated = [emoji, ...filtered].slice(0, 8); // Keep only 8 most recent
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem('stella_recent_emojis', JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save recent emojis to localStorage:', error);
        }
        
        return updated;
      });
      
      // Update the message in state with new reactions
      setMessages(prev => prev.map(msg => {
        if (msg.commentId === commentId) {
          return {
            ...msg,
            reactions: result.reactions || []
          };
        }
        return msg;
      }));
      
      console.log(`✅ ${result.action === 'added' ? 'Added' : 'Removed'} reaction ${emoji} on comment ${commentId}`);
      
    } catch (error) {
      console.error('❌ Failed to toggle reaction:', error);
      // Optionally show user feedback here
    }
  };

  // Get quick reaction emojis - 4 most frequently used emojis
  const getQuickReactionEmojis = (): string[] => {
    // Default fallback emojis
    const defaultEmojis = ['👍', '❤️', '😍', '😂'];
    
    // Get emojis sorted by usage frequency (highest first)
    const sortedByFrequency = Object.entries(emojiUsageCount)
      .sort(([, a], [, b]) => b - a)
      .map(([emoji]) => emoji);
    
    // Take the top 4 most used emojis
    const mostUsedEmojis = sortedByFrequency.slice(0, 4);
    
    // If we have fewer than 4 frequent emojis, fill with defaults
    const result = [...mostUsedEmojis];
    for (const defaultEmoji of defaultEmojis) {
      if (result.length < 4 && !result.includes(defaultEmoji)) {
        result.push(defaultEmoji);
      }
    }
    
    return result.slice(0, 4); // Ensure exactly 4 emojis
  };

  // Load reactions for all social comment messages
  const loadReactionsForMessages = async (messages: Message[]) => {
    try {
      const commentIds = messages
        .filter(msg => msg.type === 'social_comment' && msg.commentId)
        .map(msg => msg.commentId!)
        .filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates

      if (commentIds.length === 0) return;

      console.log(`🎭 Loading reactions for ${commentIds.length} comments`);
      
      const socialMediaService = new SocialMediaService(API_BASE);
      const reactionsByComment = await socialMediaService.getReactions(undefined, commentIds);

      // Update messages with reactions - use functional update to prevent unnecessary re-renders
      setMessages(prev => {
        let hasChanges = false;
        const newMessages = prev.map(msg => {
          if (msg.type === 'social_comment' && msg.commentId && reactionsByComment[msg.commentId]) {
            const newReactions = reactionsByComment[msg.commentId] || [];
            // Only update if reactions have actually changed
            if (!msg.reactions || JSON.stringify(msg.reactions) !== JSON.stringify(newReactions)) {
              hasChanges = true;
              return {
                ...msg,
                reactions: newReactions
              };
            }
          }
          return msg;
        });
        
        // Only trigger re-render if there were actual changes
        return hasChanges ? newMessages : prev;
      });

      console.log('✅ Loaded reactions for all comments');
      
    } catch (error) {
      console.error('❌ Failed to load reactions:', error);
    }
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

  // Keep ref in sync with showAllComments state for use in intervals
  useEffect(() => {
    showAllCommentsRef.current = showAllComments;
  }, [showAllComments]);

  // Load recently used emojis and usage counts from localStorage on component mount
  useEffect(() => {
    try {
      // Load recent emojis
      const storedRecent = localStorage.getItem('stella_recent_emojis');
      if (storedRecent) {
        const recentEmojis = JSON.parse(storedRecent);
        if (Array.isArray(recentEmojis)) {
          setRecentlyUsedEmojis(recentEmojis.slice(0, 8)); // Ensure max 8 items
          console.log('💾 Loaded recent emojis from localStorage:', recentEmojis);
        }
      }
      
      // Load emoji usage counts
      const storedUsage = localStorage.getItem('stella_emoji_usage');
      if (storedUsage) {
        const usageData = JSON.parse(storedUsage);
        if (typeof usageData === 'object' && usageData !== null) {
          setEmojiUsageCount(usageData);
          console.log('💾 Loaded emoji usage counts from localStorage:', usageData);
        }
      }
    } catch (error) {
      console.warn('Failed to load emoji data from localStorage:', error);
      // Initialize with some default recent emojis if localStorage fails
      setRecentlyUsedEmojis(['👍', '❤️']);
    }
  }, []);

  // Load WhatsApp and Social Media data on component mount
  useEffect(() => {
    fetchWhatsAppConversations();
    fetchSocialMediaConversations();
    
    // Simple auto-refresh - fetch conversations every 30 seconds
    const interval = setInterval(() => {
      console.log('Auto-refreshing conversations');
      fetchWhatsAppConversations();
      // Always refresh social media conversations to pick up status changes (edits/deletes)
      // even when comments are expanded - this ensures edit badges appear properly
      fetchSocialMediaConversations();
    }, 30000);
    
    return () => clearInterval(interval);
    
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
  }, [selectedConversation]);

  // Auto-refresh messages for the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {      
      console.log('Auto-refreshing messages for selected conversation');
      fetchMessages(selectedConversation, true); // Pass true for isAutoRefresh
    }, 30000); // Refresh messages every 30 seconds (increased from 15s)

    return () => {
      clearInterval(interval);
    };
  }, [selectedConversation]); // Removed showAllComments dependency to prevent timer restart

  // Use real WhatsApp conversations and Social Media conversations
  const allConversations = [...whatsappConversations, ...socialMediaConversations]
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

  // Handle sending social media replies
  const handleSendSocialMediaReply = async () => {
    if (!newMessage.trim() || !selectedConversation || !activeReplyCommentId) return;

    const conversation = socialMediaConversations.find(c => c.id === selectedConversation);
    if (!conversation) {
      console.error('Social media conversation not found:', selectedConversation);
      return;
    }

    // Store the message before clearing
    const messageToSend = newMessage;
    const commentIdToReplyTo = activeReplyCommentId;
    setNewMessage('');
    setActiveReplyCommentId(null);

    try {
      // Add optimistic message to UI
      const newReplyMessage = {
        id: `temp_${Date.now()}`,
        sender: 'agent' as const,
        text: messageToSend,
        timestamp: new Date(),
        type: 'text' as const,
        status: 'sending' as const,
        platform: conversation.platform,
        commentId: commentIdToReplyTo ? parseInt(commentIdToReplyTo) : undefined
      };

      setMessages(prev => [...prev, newReplyMessage]);

      // Send to API using the specific comment ID
      const socialMediaService = new SocialMediaService(API_BASE);
      if (commentIdToReplyTo) {
        await socialMediaService.sendReply(
          parseInt(commentIdToReplyTo),
          messageToSend,
          conversation.platform!
        );
        
        // Invalidate cache for this comment to ensure fresh reply indicator
        const newCache = { ...replyDataCache };
        delete newCache[commentIdToReplyTo];
        setReplyDataCache(newCache);
        console.log(`💾 Cache invalidated for comment ${commentIdToReplyTo} after sending reply`);
      }

      console.log(`✅ Social media reply sent successfully to comment ${commentIdToReplyTo}`);
      
    } catch (error) {
      console.error('❌ Error sending social media reply:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
      setNewMessage(messageToSend); // Restore message
      setActiveReplyCommentId(commentIdToReplyTo); // Restore active comment
      
      // Show error in console (or could show in UI if needed)
      console.error('Failed to send social media reply. Please try again.');
    }
  };

  const handleAISuggestReply = async () => {
    if (!selectedConversation?.startsWith('sm_') || isGeneratingAI) return;

    const conversation = socialMediaConversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    setIsGeneratingAI(true);
    
    try {
      console.log('🤖 Generating AI suggestion for social media comment...');
      
      const socialMediaService = new SocialMediaService(API_BASE);
      const response = await socialMediaService.generateAIResponse(
        parseInt(conversation.comment_id!),
        conversation.lastMessage,
        conversation.post_title || ''
      );

      console.log('✅ AI suggestion generated:', response);
      
      // Set the suggested reply in the message input
      setNewMessage(response.response);
      setAiSuggestedReply(response.response);
      
      // Show a subtle notification that AI generated a reply
      console.log(`🎯 AI Confidence: ${(response.confidence * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Error generating AI suggestion:', error);
      alert('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Bulk AI Response Generation Handler
  const handleBulkAIGenerate = async () => {
    if (isBulkGenerating) return;

    const currentConversation = socialMediaConversations.find(c => c.id === selectedConversation);
    if (!currentConversation || !selectedConversation?.startsWith('sm_')) return;

    setIsBulkGenerating(true);
    
    try {
      console.log('🤖 Generating bulk AI responses...');
      
      const socialMediaService = new SocialMediaService(API_BASE);
      const result = await socialMediaService.generateBulkAIResponses({
        post_id: currentConversation.post_id,
        platform: currentConversation.platform,
        exclude_replied: true
      });

      console.log(`✅ Generated ${result.responses.length} AI responses`);
      
      // Set bulk responses and initialize editable responses
      setBulkAIResponses(result.responses);
      const initialEditable: {[key: number]: string} = {};
      result.responses.forEach((response: any) => {
        initialEditable[response.comment_id] = response.ai_response;
      });
      setEditableResponses(initialEditable);
      
      // Show notification
      alert(`Generated AI responses for ${result.responses.length} comments`);
      
    } catch (error) {
      console.error('❌ Error generating bulk AI responses:', error);
      alert('Failed to generate bulk AI responses. Please try again.');
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // Handle editing individual AI responses
  const handleEditResponse = (commentId: number, newResponse: string) => {
    setEditableResponses(prev => ({
      ...prev,
      [commentId]: newResponse
    }));
  };

  // Toggle comment selection for bulk operations
  const handleToggleCommentSelection = (commentId: number) => {
    setSelectedComments(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(commentId)) {
        newSelected.delete(commentId);
      } else {
        newSelected.add(commentId);
      }
      return newSelected;
    });
  };

  // Select all/none comments
  const handleSelectAllComments = (selectAll: boolean) => {
    if (selectAll) {
      const allCommentIds = bulkAIResponses.map(response => response.comment_id);
      setSelectedComments(new Set(allCommentIds));
    } else {
      setSelectedComments(new Set());
    }
  };

  // Send bulk replies
  const handleBulkSend = async () => {
    if (isBulkSending || selectedComments.size === 0) return;

    const repliesToSend = bulkAIResponses
      .filter(response => selectedComments.has(response.comment_id))
      .map(response => ({
        comment_id: response.comment_id,
        response_text: editableResponses[response.comment_id] || response.ai_response,
        platform: response.platform
      }));

    if (repliesToSend.length === 0) {
      alert('No replies selected');
      return;
    }

    const confirmed = window.confirm(`Send ${repliesToSend.length} replies?`);
    if (!confirmed) return;

    setIsBulkSending(true);

    try {
      console.log(`📤 Sending ${repliesToSend.length} bulk replies...`);
      
      const socialMediaService = new SocialMediaService(API_BASE);
      const result = await socialMediaService.sendBulkReplies(repliesToSend);

      console.log(`✅ Bulk send completed: ${result.summary.successful} successful, ${result.summary.failed} failed`);
      
      // Invalidate cache for all comment IDs that had replies sent to force fresh indicators
      const newCache = { ...replyDataCache };
      repliesToSend.forEach(reply => {
        delete newCache[reply.comment_id.toString()];
      });
      setReplyDataCache(newCache);
      console.log(`💾 Cache invalidated for ${repliesToSend.length} comments after bulk send`);
      
      // Update the conversations to reflect sent replies
      await fetchSocialMediaConversations();
      
      // Clear selections and bulk data
      setSelectedComments(new Set());
      setBulkAIResponses([]);
      setEditableResponses({});
      
      alert(`Bulk send completed:\n✅ ${result.summary.successful} successful\n❌ ${result.summary.failed} failed`);
      
    } catch (error) {
      console.error('❌ Error sending bulk replies:', error);
      alert('Failed to send bulk replies. Please try again.');
    } finally {
      setIsBulkSending(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation) return;

    // Handle social media conversation replies
    if (selectedConversation.startsWith('sm_')) {
      console.log('📤 Sending social media reply...');
      await handleSendSocialMediaReply();
      return;
    }

    // Check for cart commands before sending (WhatsApp only)
    if (newMessage.trim().toLowerCase().startsWith('add to cart ')) {
      handleChatCartCommand(newMessage.trim());
      setNewMessage('');
      return;
    }

    // WhatsApp conversation handling
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

    console.log('📤 Sending WhatsApp message to:', phoneNumber);

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
      setActiveReplyCommentId(null);
      setNewMessage('');
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
      setActiveReplyCommentId(null);
      setNewMessage('');
      
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

  const getStatusIcon = (status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'draft') => {
    switch (status) {
      case 'sending': return 'Sending...';
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'read': return 'Read';
      case 'failed': return 'Failed';
      case 'draft': return 'Draft';
      default: return '';
    }
  };

  const getStatusIconColor = (status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'draft') => {
    switch (status) {
      case 'sending': return '#999';
      case 'sent': return '#999';
      case 'delivered': return '#2196F3';
      case 'read': return '#4CAF50';
      case 'failed': return '#f44336';
      case 'draft': return '#999';
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
    <>
      {/* Smart Auto Cart UX Enhancement CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .no-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowWhatsAppGallery(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#128C7E';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#25D366';
              }}
              title="View WhatsApp Message Templates"
            >
              📱 WhatsApp Gallery
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
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
                  fontSize: '10px',
                  color: '#666',
                  marginTop: '3px',
                  padding: '0 8px',
                  lineHeight: '1.2'
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
                    data-platform={conversation.platform || 'whatsapp'}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      setActiveReplyCommentId(null);
                      setNewMessage('');
                    }}
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
                        {/* Show "Replied" indicator for social media conversations */}
                        {(conversation.isSocialMedia || conversation.platform) && 
                         conversation.comment_id && 
                         commentPageReplies[conversation.comment_id]?.hasReplies && (
                          <span style={{
                            fontSize: '10px',
                            color: '#666',
                            marginLeft: '4px'
                          }} title={`SUSA has replied to this comment (${conversation.comment_id ? (commentPageReplies[conversation.comment_id]?.count || 0) : 0} replies)`}>
                            Replied
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
                    {(() => {
                      const currentConversation = allConversations.find((c: Conversation) => c.id === selectedConversation);
                      const isSocialMedia = currentConversation?.id?.startsWith('sm_');
                      
                      if (isSocialMedia) {
                        return (
                          <>
                            <h3>{currentConversation?.customerName || 'Social Media User'}</h3>
                            <div className="social-media-info">
                              <span className="platform-badge">{currentConversation?.platform?.toUpperCase()}</span>
                              {currentConversation?.post_title && (
                                <span className="post-title">Post: {currentConversation.post_title}</span>
                              )}
                            </div>
                            {currentConversation?.post_url && (
                              <a 
                                href={currentConversation.post_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="post-link"
                              >
                                View Original Post
                              </a>
                            )}
                          </>
                        );
                      } else {
                        return (
                          <>
                            <h3>{getDisplayNameForPhone(
                              currentConversation?.customerPhone || '',
                              currentConversation?.customerName
                            )}</h3>
                            {savedContacts.has(currentConversation?.customerPhone || '') && (
                              <div className="contact-saved-badge">
                                Contact Saved
                              </div>
                            )}
                            <span>{currentConversation?.customerPhone}</span>
                          </>
                        );
                      }
                    })()}
                  </div>
                  <div className="chat-actions">
                    {(() => {
                      const currentConversation = allConversations.find((c: Conversation) => c.id === selectedConversation);
                      const isSocialMedia = currentConversation?.id?.startsWith('sm_');
                      
                      if (isSocialMedia) {
                        return (
                          <>
                            <button 
                              className="action-btn" 
                              onClick={handleAISuggestReply}
                              disabled={isGeneratingAI}
                              style={{
                                backgroundColor: isGeneratingAI ? '#9b59b6' : '#6c5ce7',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: isGeneratingAI ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {isGeneratingAI ? '🤖 Generating...' : '🤖 AI Suggest Reply'}
                            </button>
                            
                            <button 
                              className="action-btn" 
                              onClick={async () => {
                                if (!showAllComments) {
                                  // Expanding comments - load all comments first
                                  await expandAllComments();
                                  setShowAllComments(true);
                                } else {
                                  // Collapsing comments - reload the conversation to show initial state
                                  if (selectedConversation) {
                                    await fetchSocialMediaMessages(selectedConversation);
                                  }
                                  setShowAllComments(false);
                                }
                              }}
                              style={{
                                backgroundColor: showAllComments ? '#e74c3c' : '#3498db',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {showAllComments ? '📝 Hide All Comments' : '📋 Show All Comments'}
                            </button>

                            {showAllComments && (
                              <button 
                                className="action-btn" 
                                onClick={handleBulkAIGenerate}
                                disabled={isBulkGenerating}
                                style={{
                                  backgroundColor: isBulkGenerating ? '#f39c12' : '#e67e22',
                                  color: 'white',
                                  border: 'none',
                                  padding: '8px 16px',
                                  borderRadius: '6px',
                                  cursor: isBulkGenerating ? 'not-allowed' : 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isBulkGenerating ? '🔄 Generating...' : '🚀 AI Respond to All'}
                              </button>
                            )}
                          </>
                        );
                      } else {
                        return (
                          <>
                            {!savedContacts.has(currentConversation?.customerPhone || '') && (
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
                          </>
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="messages-container" onScroll={handleScroll}>
                  {messagesRefreshing && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      zIndex: 1000
                    }}>
                      🔄 Refreshing...
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message ${message.sender === 'agent' ? 'agent-message' : 'user-message'} ${message.type === 'reply_input' ? 'reply-input-container' : ''}`}
                    >
                      {message.type === 'product' && message.productData ? (
                        <div className="product-message" style={{ 
                          maxWidth: '280px',
                          margin: message.sender === 'agent' ? '0 0 0 auto' : '0 auto 0 0'
                        }}>
                          {(() => {
                            const product = message.productData;
                            
                            // Debug product data
                            console.log('🛍️ Rendering product card:', {
                              title: (product as any).title,
                              images: (product as any).images,
                              imageCount: (product as any).images?.length || 0,
                              firstImageSrc: (product as any).images?.[0]?.src
                            });
                            
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
                                      objectFit: 'contain',
                                      borderRadius: '6px',
                                      cursor: 'default',
                                      transition: 'transform 0.2s ease',
                                      backgroundColor: '#f8f9fa'
                                    } as React.CSSProperties}
                                    onLoad={() => {
                                      console.log('✅ Product image loaded:', productImages[currentImageIndex]?.src);
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Product image failed to load:', productImages[currentImageIndex]?.src);
                                      console.log('Product images array:', productImages);
                                      // Fallback to placeholder
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/280x180/f0f0f0/666?text=Image+Error';
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
                                      gap: '1px',
                                      zIndex: 2
                                    }}>
                                      {productImages.map((_: any, index: number) => (
                                        <button
                                          key={index}
                                          className="tiny-dot-indicator"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setProductImageIndices(prev => ({
                                              ...prev,
                                              [messageId]: index
                                            }));
                                          }}
                                          style={{
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: index === currentImageIndex 
                                              ? 'white' 
                                              : 'rgba(255,255,255,0.6)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                          } as React.CSSProperties}
                                          onMouseEnter={(e) => {
                                            if (index !== currentImageIndex) {
                                              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (index !== currentImageIndex) {
                                              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
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
                                    disabled={(() => {
                                      // Check if all required options are selected
                                      const optionValidation = areAllOptionsSelected(product);
                                      return !isAvailable || !optionValidation.isValid;
                                    })()}
                                    style={(() => {
                                      // Check if all required options are selected
                                      const optionValidation = areAllOptionsSelected(product);
                                      const canAddToCart = isAvailable && optionValidation.isValid;
                                      
                                      let buttonColor = '#4CAF50';
                                      if (!isAvailable) {
                                        buttonColor = '#ccc';
                                      } else if (!optionValidation.isValid) {
                                        buttonColor = '#FF9800'; // Orange for missing options
                                      }
                                      
                                      return {
                                        width: '100%',
                                        padding: '6px',
                                        fontSize: '10px',
                                        backgroundColor: buttonColor,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: canAddToCart ? 'pointer' : 'not-allowed',
                                        transition: 'background-color 0.2s',
                                        fontWeight: 'bold'
                                      };
                                    })()}
                                    title={(() => {
                                      const optionValidation = areAllOptionsSelected(product);
                                      if (!isAvailable) return 'Product unavailable';
                                      if (!optionValidation.isValid) return `Please select: ${optionValidation.missingOptions.join(', ')}`;
                                      return 'Add to cart';
                                    })()}
                                  >
                                    {(() => {
                                      const optionValidation = areAllOptionsSelected(product);
                                      if (!isAvailable) return '❌ Unavailable';
                                      if (!optionValidation.isValid) return `⚠️ Select ${optionValidation.missingOptions.join(', ')}`;
                                      return '🛒 Add to Cart';
                                    })()}
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
                                      display: 'block',
                                      marginBottom: '3px'
                                    }}
                                  >
                                    👁️ View Details
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      // Send this product as a WhatsApp message with "View Item" functionality
                                      console.log('📱 View Item clicked for:', (product as any).title);
                                      sendProductInChat(product);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '4px',
                                      fontSize: '9px',
                                      backgroundColor: '#25D366',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      transition: 'background-color 0.2s',
                                      textDecoration: 'none',
                                      textAlign: 'center',
                                      display: 'block'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#128C7E';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#25D366';
                                    }}
                                    title="Send this item to WhatsApp chat"
                                  >
                                    📱 View Item
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : message.type === 'social_post' && message.post ? (
                        <div className="social-post-message" style={{
                          border: '2px solid #e1e5e9',
                          borderRadius: '12px',
                          padding: '16px',
                          margin: '8px 0',
                          backgroundColor: '#f8f9fa',
                          maxWidth: '400px'
                        }}>
                          <div className="post-header" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '12px'
                          }}>
                            <div className="platform-badge" style={{
                              background: message.platform === 'facebook' ? '#1877f2' : 
                                         message.platform === 'instagram' ? '#e4405f' : 
                                         message.platform === 'tiktok' ? '#ff0050' : '#666',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {message.platform?.toUpperCase()} POST
                            </div>
                          </div>
                          
                          {message.post.image && (
                            <div className="post-image" style={{ marginBottom: '12px' }}>
                              <img 
                                src={message.post.image} 
                                alt="Social media post" 
                                style={{
                                  width: '100%',
                                  borderRadius: '8px',
                                  maxHeight: '200px',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="post-content">
                            <h4 style={{ 
                              margin: '0 0 8px 0', 
                              fontSize: '14px',
                              color: '#333'
                            }}>
                              {message.post.title}
                            </h4>
                            
                            <a 
                              href={message.post.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                color: '#6c5ce7',
                                textDecoration: 'none',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}
                            >
                              View Original Post →
                            </a>
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
                      ) : message.type === 'cart' && message.cartData ? (
                        (() => {
                          console.log('🛒 Rendering cart message:', message.id, 'Type:', message.type, 'Has cartData:', !!message.cartData);
                          return (
                        <div className="cart-message" style={{ 
                          maxWidth: '350px',
                          margin: message.sender === 'agent' ? '0 0 0 auto' : '0 auto 0 0'
                        }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            color: 'white',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            {/* Cart Header */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '16px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                              <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                fontSize: '24px'
                              }}>
                                🛒
                              </div>
                              <div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                                  Shopping Cart
                                </div>
                                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                  {message.cartData.itemCount} item{message.cartData.itemCount !== 1 ? 's' : ''} • SUSA SHAPEWEAR
                                </div>
                              </div>
                            </div>

                            {/* Cart Items */}
                            <div style={{ marginBottom: '16px' }}>
                              {message.cartData.items.slice(0, 3).map((item: any, index: number) => (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '12px',
                                  padding: '8px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  backdropFilter: 'blur(10px)'
                                }}>
                                  <img 
                                    src={item.images?.[0]?.src || 'https://via.placeholder.com/40x40/667eea/white?text=P'} 
                                    alt={item.title}
                                    style={{ 
                                      width: '40px', 
                                      height: '40px', 
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                      marginRight: '12px',
                                      border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ 
                                      fontSize: '14px', 
                                      fontWeight: 'bold',
                                      marginBottom: '4px',
                                      lineHeight: '1.2'
                                    }}>
                                      {item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title}
                                    </div>
                                    <div style={{ 
                                      fontSize: '11px', 
                                      opacity: 0.8,
                                      marginBottom: '2px'
                                    }}>
                                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                        <>
                                          {Object.entries(item.selectedOptions)
                                            .map(([key, value]) => `${key}: ${value}`)
                                            .join(', ')}
                                          <br />
                                        </>
                                      )}
                                      Qty: {item.quantity} × ${parseFloat(item.selectedVariant?.price || item.variants?.[0]?.price || '0').toFixed(2)}
                                    </div>
                                  </div>
                                  <div style={{ 
                                    fontSize: '14px', 
                                    fontWeight: 'bold',
                                    textAlign: 'right'
                                  }}>
                                    ${(parseFloat(item.selectedVariant?.price || item.variants?.[0]?.price || '0') * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              
                              {message.cartData.items.length > 3 && (
                                <div style={{
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  opacity: 0.8,
                                  padding: '8px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '8px',
                                  marginBottom: '12px'
                                }}>
                                  +{message.cartData.items.length - 3} more item{message.cartData.items.length - 3 !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>

                            {/* Cart Total */}
                            <div style={{
                              paddingTop: '12px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                              {message.cartData.discount && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  marginBottom: '8px',
                                  opacity: 0.9
                                }}>
                                  <span>Subtotal:</span>
                                  <span>${message.cartData.total.toFixed(2)}</span>
                                </div>
                              )}
                              {message.cartData.discount && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  marginBottom: '8px',
                                  color: '#4ade80'
                                }}>
                                  <span>Discount ({message.cartData.discount.code}):</span>
                                  <span>-${(message.cartData.total - message.cartData.finalTotal).toFixed(2)}</span>
                                </div>
                              )}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                marginTop: '8px'
                              }}>
                                <span>Total:</span>
                                <span>${message.cartData.finalTotal.toFixed(2)} TTD</span>
                              </div>
                            </div>

                            {/* Action Hint */}
                            <div style={{
                              marginTop: '16px',
                              padding: '12px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              textAlign: 'center',
                              fontSize: '12px',
                              opacity: 0.9
                            }}>
                              🚀 Ready to checkout? Just let me know!
                            </div>

                            {/* Message Status */}
                            <div style={{ 
                              fontSize: '10px', 
                              opacity: 0.7, 
                              textAlign: 'right', 
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px'
                            }}>
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                              })}
                              {message.status === 'sent' && <span style={{ color: '#4ade80' }}>✓✓</span>}
                              {message.status === 'sending' && <span style={{ color: '#fbbf24' }}>⏳</span>}
                              {message.status === 'failed' && <span style={{ color: '#f87171' }}>✗</span>}
                            </div>
                          </div>
                        </div>
                        );
                        })()
                      ) : message.type === 'voice' ? (
                        <div className="whatsapp-message voice-message" style={{ padding: '0', background: 'transparent' }}>
                          {message.media_file_id ? (
                            <VoiceMessageComponent 
                              audioSrc={`${API_BASE}/api/media/media/${message.media_file_id}`}
                              duration={message.voice_duration}
                              sender={message.sender === 'system' ? 'agent' : message.sender}
                              mimeType={message.media_mime_type}
                            />
                          ) : message.media_url ? (
                            <VoiceMessageComponent 
                              audioSrc={`${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`}
                              duration={message.voice_duration}
                              sender={message.sender === 'system' ? 'agent' : message.sender}
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
                      ) : message.type === 'reply_input' ? (
                        <div 
                          className="reply-input-bubble" 
                          onClick={() => {
                            setActiveReplyCommentId(message.commentId?.toString() || null);
                            messageInputRef.current?.focus();
                          }}
                        >
                          <div className="reply-input-content">
                            {(activeReplyCommentId === message.commentId?.toString() ? newMessage : '') || message.placeholder || 'Reply here...'}
                          </div>
                        </div>
                      ) : message.type === 'social_comment' ? (
                        <div className="social-comment-message">
                          <div className="social-comment-header">
                            <div className="platform-badge" style={{
                              backgroundColor: message.platform === 'facebook' ? '#1877f2' : message.platform === 'instagram' ? '#E4405F' : '#333',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>
                              {message.platform}
                            </div>
                            <div className="comment-author" style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#555'
                            }}>
                              {message.senderName || 'Unknown User'}
                              {message.senderHandle && (
                                <span style={{ color: '#999', marginLeft: '4px' }}>
                                  @{message.senderHandle}
                                </span>
                              )}
                            </div>
                            {/* Status Indicators */}
                            <div className="status-badges" style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                              {message.statusIndicators?.isEdited && (
                                <span className="edited-badge" style={{
                                  backgroundColor: '#ffc107',
                                  color: '#212529',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontSize: '9px',
                                  fontWeight: 'bold'
                                }} title={`Edited ${message.statusIndicators.editCount || 1} time(s). Last edited: ${message.statusIndicators.lastEditedAt ? new Date(message.statusIndicators.lastEditedAt).toLocaleString() : 'N/A'}`}>
                                  ✏️ EDITED ({message.statusIndicators.editCount || 1}x)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="social-comment-content" style={{
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            marginTop: '6px'
                          }}>
                            <div className="comment-text" style={{
                              fontSize: '14px',
                              lineHeight: '1.4',
                              color: '#333'
                            }}>
                              {message.content || message.text}
                            </div>
                            {message.statusIndicators?.isEdited && message.statusIndicators?.originalText && (
                              <div style={{
                                marginTop: '8px',
                                padding: '6px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6'
                              }}>
                                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                                  Original text:
                                </div>
                                <div style={{ fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                                  {message.statusIndicators.originalText}
                                </div>
                              </div>
                            )}
                            {message.postContext && (
                              <div className="post-context" style={{
                                marginTop: '8px',
                                fontSize: '12px',
                                color: '#666',
                                borderTop: '1px solid #eee',
                                paddingTop: '6px'
                              }}>
                                <div style={{ fontWeight: '500' }}>Post: {message.postContext.title}</div>
                                {message.postContext.url && (
                                  <a href={message.postContext.url} target="_blank" rel="noopener noreferrer" 
                                     style={{ color: '#25d366', textDecoration: 'none' }}>
                                    View Original Post →
                                  </a>
                                )}
                              </div>
                            )}
                            
                            {/* Display reactions at bottom of white comment box - Facebook style */}
                            {(message.reactions || []).length > 0 && (
                              <div className="comment-reactions" style={{
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #e9ecef',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '8px',
                                justifyContent: 'flex-end'
                              }}>
                                {(message.reactions || []).map((reaction: any, index: number) => (
                                  <div
                                    key={index}
                                    className="reaction-display"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      cursor: 'pointer'
                                    }}
                                    title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.emoji}`}
                                  >
                                    <span style={{ fontSize: '18px' }}>
                                      {reaction.emoji}
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                                      {reaction.count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Emoji Reactions */}
                          <div className="comment-reactions" style={{
                            marginTop: '8px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            alignItems: 'center'
                          }}>
                            {/* Quick Reaction Buttons */}
                            <div className="quick-reactions" style={{
                              display: 'flex',
                              gap: '4px'
                            }}>
                              {getQuickReactionEmojis().map(emoji => (
                                <button
                                  key={emoji}
                                  className="reaction-button"
                                  onClick={() => {
                                    if (message.commentId !== undefined) {
                                      handleCommentReaction(message.commentId, emoji);
                                    }
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '4px',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                  title={`React with ${emoji}`}
                                >
                                  <span>
                                    {emoji}
                                  </span>
                                </button>
                              ))}
                              
                              {/* More Emojis Button */}
                              <button
                                className="more-emojis-button"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setFacebookEmojiPickerPosition({
                                    top: rect.bottom + 8,
                                    left: rect.left
                                  });
                                  if (message.commentId !== undefined) {
                                    setActiveCommentForReaction(message.commentId);
                                    setShowFacebookEmojiPicker(true);
                                  }
                                }}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '4px',
                                  fontSize: '24px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#666'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title="More emoji reactions"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="message-meta" style={{ marginTop: '4px' }}>
                            <div className="message-timestamp" style={{ fontSize: '11px', color: '#999' }}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ) : message.type === 'page_reply' ? (
                        <div className="page-reply-message" style={{
                          backgroundColor: '#e3f2fd',
                          border: '2px solid #2196f3',
                          borderRadius: '12px',
                          padding: '12px',
                          margin: '8px 0',
                          position: 'relative',
                          boxShadow: '0 2px 4px rgba(33,150,243,0.1)'
                        }}>
                          <div className="page-reply-header" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#1976d2'
                          }}>
                            <span style={{ 
                              backgroundColor: '#2196f3',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px'
                            }}>
                              PAGE REPLY
                            </span>
                            <span>{message.author}</span>
                          </div>
                          <div className="page-reply-content" style={{
                            fontSize: '14px',
                            lineHeight: '1.4',
                            color: '#1565c0'
                          }}>
                            {message.text}
                          </div>
                          <div className="message-meta" style={{ marginTop: '6px' }}>
                            <div className="message-timestamp" style={{ fontSize: '11px', color: '#1976d2' }}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ) : message.type === 'location' ? (
                        <div className="whatsapp-message location-message">
                          📍 Location
                          {message.text && <div className="location-data">{message.text}</div>}
                        </div>
                      ) : (
                        (() => {
                          console.log('📝 Rendering regular message:', message.id, 'Type:', message.type, 'Text preview:', message.text?.substring(0, 50));
                          return (
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
                        );
                        })()
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
                
                {/* Bulk Comments Management Interface */}
                {showAllComments && selectedConversation?.startsWith('sm_') && (
                  <div className="bulk-comments-interface" style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e1e8ed',
                    borderRadius: '8px',
                    margin: '10px',
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    <div style={{
                      padding: '15px',
                      borderBottom: '1px solid #e1e8ed',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px 8px 0 0',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#333' }}>
                          📋 All Comments {bulkAIResponses.length > 0 && `(${bulkAIResponses.length})`}
                        </h4>
                        {bulkAIResponses.length > 0 && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleSelectAllComments(selectedComments.size !== bulkAIResponses.length)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                              }}
                            >
                              {selectedComments.size === bulkAIResponses.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                              onClick={handleBulkSend}
                              disabled={selectedComments.size === 0 || isBulkSending}
                              style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                border: 'none',
                                borderRadius: '4px',
                                backgroundColor: selectedComments.size > 0 ? '#28a745' : '#6c757d',
                                color: 'white',
                                cursor: selectedComments.size > 0 && !isBulkSending ? 'pointer' : 'not-allowed'
                              }}
                            >
                              {isBulkSending ? '📤 Sending...' : `📤 Send Selected (${selectedComments.size})`}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {bulkAIResponses.length === 0 ? (
                        <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                          Click "🚀 AI Respond to All" to generate AI responses for all pending comments.
                        </p>
                      ) : (
                        <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                          Review and edit AI-generated responses before sending. Select comments to send in bulk.
                        </p>
                      )}
                    </div>

                    {bulkAIResponses.length > 0 && (
                      <div style={{ padding: '10px' }}>
                        {bulkAIResponses.map((response) => (
                          <div key={response.comment_id} style={{
                            backgroundColor: 'white',
                            border: '1px solid #e1e8ed',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '10px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            {/* Comment Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedComments.has(response.comment_id)}
                                  onChange={() => handleToggleCommentSelection(response.comment_id)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <div>
                                  <strong style={{ color: '#333' }}>{response.author_name}</strong>
                                  <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                                    {response.author_handle} • {response.platform}
                                  </span>
                                </div>
                              </div>
                              <div style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                backgroundColor: response.confidence > 0.8 ? '#d4edda' : response.confidence > 0.6 ? '#fff3cd' : '#f8d7da',
                                color: response.confidence > 0.8 ? '#155724' : response.confidence > 0.6 ? '#856404' : '#721c24'
                              }}>
                                {Math.round(response.confidence * 100)}% confidence
                              </div>
                            </div>

                            {/* Original Comment */}
                            <div style={{
                              backgroundColor: '#f8f9fa',
                              padding: '10px',
                              borderRadius: '6px',
                              marginBottom: '10px',
                              borderLeft: '3px solid #3498db'
                            }}>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Original Comment:</div>
                              <div style={{ color: '#333', fontSize: '14px' }}>{response.comment_text}</div>
                            </div>

                            {/* AI Response Editor */}
                            <div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>AI Response:</div>
                              <textarea
                                value={editableResponses[response.comment_id] || response.ai_response}
                                onChange={(e) => handleEditResponse(response.comment_id, e.target.value)}
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  padding: '8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontFamily: 'inherit',
                                  resize: 'vertical'
                                }}
                                placeholder="Edit AI response..."
                              />
                            </div>

                            {/* Post Context */}
                            {response.post_title && (
                              <div style={{
                                fontSize: '12px',
                                color: '#666',
                                marginTop: '8px',
                                paddingTop: '8px',
                                borderTop: '1px solid #eee'
                              }}>
                                Post: {response.post_title}
                                {response.post_url && (
                                  <a
                                    href={response.post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ marginLeft: '8px', color: '#3498db' }}
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Message Input Container */}
                <div className="message-input-container">
                  {/* Reply Indicator for Social Media */}
                  {selectedConversation?.startsWith('sm_') && activeReplyCommentId && (
                    <div style={{
                      padding: '8px 16px',
                      backgroundColor: '#f0f8ff',
                      borderLeft: '3px solid #6c5ce7',
                      fontSize: '12px',
                      color: '#666',
                      borderRadius: '4px 4px 0 0'
                    }}>
                      💬 Replying to comment #{activeReplyCommentId}
                      <button
                        onClick={() => {
                          setActiveReplyCommentId(null);
                          setNewMessage('');
                        }}
                        style={{
                          marginLeft: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#999',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
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
                      ref={messageInputRef}
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
                    disabled={
                      (!newMessage.trim() && selectedFiles.length === 0) || 
                      (selectedConversation?.startsWith('sm_') && !activeReplyCommentId)
                    }
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
            <div style={{ padding: '6px 12px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                🛒 {shopNameLoading ? 'Loading store...' : (actualShopName || 'E-commerce Store')}
                {isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#22c55e', fontWeight: 'normal' }}>● Connected</span>}
                {!isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ef4444', fontWeight: 'normal' }}>● Demo Mode</span>}
              </h3>
            </div>
            
            {/* First Section - Products */}
            <div 
              className="shopify-section" 
              style={{ 
                padding: '8px', 
                border: '1px solid #334155', 
                margin: '8px 0', 
                borderRadius: '8px', 
                backgroundColor: '#1e293b',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: cartFocusMode ? 'scale(0.85)' : 'scale(1)',
                opacity: cartFocusMode ? 0.6 : 1,
                maxHeight: cartFocusMode ? '200px' : 'none',
                overflow: cartFocusMode ? 'hidden' : 'visible',
                position: 'relative'
              }}
              onMouseEnter={handleProductsMouseEnter}
            >
              {/* Smart Auto Cart Overlay */}
              {cartFocusMode && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    color: '#cbd5e1',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🛒</div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Cart Focus Mode</div>
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      Products minimized for better cart experience
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '8px' }}>
                      Hover here or wait to restore
                    </div>
                  </div>
                </div>
              )}
              {/* Products Header */}
              <div style={{ marginBottom: '6px' }}>
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                  🛍️ Products ({shopifyProducts.length})
                  {!isShopifyConfigured && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#fbbf24', fontWeight: 'normal' }}>(Demo Products)</span>}
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
                    padding: '3px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '10px',
                    outline: 'none',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                    height: '24px'
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

                    // Helper function to get specific inventory for any option combination
                    const getVariantInventory = (color?: string, size?: string, optionName?: string, optionValue?: string) => {
                      // If specific option is provided, use that; otherwise fall back to color/size logic
                      if (optionName && optionValue && !color && !size) {
                        const matchingVariants = variants.filter((variant: any) => {
                          // Check if this variant matches the specific option value
                          return variant[optionName]?.toLowerCase() === optionValue.toLowerCase() ||
                                 variant.option1?.toLowerCase() === optionValue.toLowerCase() ||
                                 variant.option2?.toLowerCase() === optionValue.toLowerCase() ||
                                 variant.option3?.toLowerCase() === optionValue.toLowerCase();
                        });
                        
                        return matchingVariants.reduce((total: number, variant: any) => 
                          total + (variant.inventory_quantity || 0), 0);
                      }
                      
                      // Original color/size logic
                      if (!color && !size && !optionName) return 0;
                      
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

                        {/* Product Options - Dynamic Renderer */}
                        <div style={{ marginBottom: '3px', fontSize: '9px', lineHeight: '1.2' }}>
                          {/* Render ALL product options dynamically */}
                          {product.options && product.options
                            .filter((option: any) => {
                              // Filter out meaningless options like "Title" with only one "Default Title" value
                              const optionValues = option.values || [];
                              return optionValues.length > 1 || !(optionValues[0] && String(optionValues[0]).toLowerCase().includes('default'));
                            })
                            .map((option: any) => {
                              // Get all values for this option directly from option.values
                              const optionValues = option.values || [];

                              if (optionValues.length === 0) return null;

                              // Get option icon based on name
                              const getOptionIcon = (optionName: string) => {
                                const name = optionName.toLowerCase();
                                if (name.includes('color') || name.includes('colour')) return '🎨';
                                if (name.includes('size')) return '📏';
                                if (name.includes('style')) return '✨';
                                if (name.includes('material')) return '🧵';
                                if (name.includes('pattern')) return '🔷';
                                if (name.includes('type')) return '📋';
                                if (name.includes('variant')) return '🔄';
                                if (name.includes('model')) return '🏷️';
                                if (name.includes('finish')) return '🎯';
                                return '⚙️'; // Default icon
                              };

                              // Get option color based on name for variety
                              const getOptionColor = (optionName: string) => {
                                const name = optionName.toLowerCase();
                                if (name.includes('color') || name.includes('colour')) return '#2196F3';
                                if (name.includes('size')) return '#4CAF50';
                                if (name.includes('style')) return '#9C27B0';
                                if (name.includes('material')) return '#FF9800';
                                if (name.includes('pattern')) return '#E91E63';
                                if (name.includes('type')) return '#00BCD4';
                                if (name.includes('variant')) return '#795548';
                                if (name.includes('model')) return '#607D8B';
                                if (name.includes('finish')) return '#3F51B5';
                                return '#757575'; // Default color
                              };

                              const optionColor = getOptionColor(option.name);
                              const optionIcon = getOptionIcon(option.name);

                              return (
                                <div key={option.name} style={{ marginBottom: '2px' }}>
                                  <div style={{ 
                                    color: '#e2e8f0', 
                                    fontWeight: 'bold', 
                                    marginBottom: '1px', 
                                    fontSize: '8px', 
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)' 
                                  }}>
                                    {optionIcon} {option.name}:
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>
                                    {optionValues.map((value: any) => {
                                      const isSelected = selectedVariants[product.id]?.[option.name] === value;
                                      const isValueAvailable = isOptionValueAvailable(option.name.toLowerCase(), value);
                                      const valueInventory = getVariantInventory(
                                        option.name.toLowerCase().includes('color') ? value : undefined,
                                        option.name.toLowerCase().includes('size') ? value : undefined,
                                        option.name,
                                        value
                                      );
                                      
                                      return (
                                        <button
                                          key={value}
                                          onClick={() => {
                                            if (!isValueAvailable) return;
                                            handleVariantOptionSelect(product.id, option.name, value);
                                          }}
                                          disabled={!isValueAvailable}
                                          title={`${value}: ${valueInventory} in stock`}
                                          style={{
                                            padding: '1px 3px',
                                            fontSize: '7px',
                                            border: `1px solid ${isSelected && isValueAvailable ? optionColor : '#ddd'}`,
                                            borderRadius: '6px',
                                            backgroundColor: isSelected && isValueAvailable ? optionColor : !isValueAvailable ? '#f5f5f5' : 'white',
                                            color: isSelected && isValueAvailable ? 'white' : !isValueAvailable ? '#999' : '#555',
                                            cursor: isValueAvailable ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s',
                                            opacity: isValueAvailable ? 1 : 0.5,
                                            position: 'relative'
                                          }}
                                        >
                                          {value}
                                          {isValueAvailable && (
                                            <span style={{ 
                                              fontSize: '6px', 
                                              marginLeft: '2px', 
                                              opacity: 0.8,
                                              fontWeight: 'bold'
                                            }}>
                                              ({valueInventory})
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Current Selection Summary */}
                        {Object.keys(selectedVariants[product.id] || {}).length > 0 && (
                          <div style={{ marginBottom: '2px', padding: '2px 4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '7px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                              📦 Selected: {Object.entries(selectedVariants[product.id] || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
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

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '2px', flexDirection: 'column' }}>
                          <button
                            onClick={() => addToShopifyCart(product, 1)}
                            disabled={(() => {
                              // Check if all required options are selected
                              const optionValidation = areAllOptionsSelected(product);
                              return !isAvailable || !optionValidation.isValid;
                            })()}
                            style={(() => {
                              // Check if all required options are selected
                              const optionValidation = areAllOptionsSelected(product);
                              const canAddToCart = isAvailable && optionValidation.isValid;
                              
                              let buttonColor = '#4CAF50';
                              if (!isAvailable) {
                                buttonColor = '#ccc';
                              } else if (!optionValidation.isValid) {
                                buttonColor = '#FF9800'; // Orange for missing options
                              }
                              
                              return {
                                width: '100%',
                                padding: '4px',
                                fontSize: '8px',
                                backgroundColor: buttonColor,
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: canAddToCart ? 'pointer' : 'not-allowed',
                                transition: 'background-color 0.2s',
                                fontWeight: 'bold'
                              };
                            })()}
                            onMouseEnter={(e) => {
                              const optionValidation = areAllOptionsSelected(product);
                              const canAddToCart = isAvailable && optionValidation.isValid;
                              if (canAddToCart) e.currentTarget.style.backgroundColor = '#45a049';
                            }}
                            onMouseLeave={(e) => {
                              const optionValidation = areAllOptionsSelected(product);
                              const canAddToCart = isAvailable && optionValidation.isValid;
                              if (canAddToCart) e.currentTarget.style.backgroundColor = '#4CAF50';
                            }}
                            title={(() => {
                              const optionValidation = areAllOptionsSelected(product);
                              if (!isAvailable) return 'Product unavailable';
                              if (!optionValidation.isValid) return `Please select: ${optionValidation.missingOptions.join(', ')}`;
                              return 'Add to cart';
                            })()}
                          >
                            {(() => {
                              const optionValidation = areAllOptionsSelected(product);
                              if (!isAvailable) return '❌ Unavailable';
                              if (!optionValidation.isValid) return `⚠️ Select ${optionValidation.missingOptions.join(', ')}`;
                              return '🛒 Add to Cart';
                            })()}
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
            <div 
              className="shopify-section" 
              style={{ 
                padding: '8px', 
                border: cartFocusMode ? '2px solid #4CAF50' : '1px solid #ddd', 
                margin: '8px 0', 
                borderRadius: '4px', 
                backgroundColor: cartFocusMode ? '#f0f8ff' : '#f9f9f9',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: cartFocusMode ? 'scale(1.02)' : 'scale(1)',
                boxShadow: cartFocusMode ? '0 8px 32px rgba(76, 175, 80, 0.2)' : 'none',
                position: 'relative'
              }}
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
              onClick={handleCartInteraction}
            >
              {/* Smart Auto Cart Enhancement Indicator */}
              {cartFocusMode && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  zIndex: 10,
                  animation: 'pulse 2s infinite'
                }}>
                  ✨ Cart Focus Mode
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: '0', fontSize: '12px', color: '#333' }}>
                  🛒 Cart ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})
                </h4>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#4CAF50' }}>
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
                            onClick={() => {
                              handleCartInteraction();
                              updateCartQuantity(item.cartItemId || item.id, item.quantity - 1);
                            }}
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
                            onClick={() => {
                              handleCartInteraction();
                              updateCartQuantity(item.cartItemId || item.id, item.quantity + 1);
                            }}
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
                            onClick={() => {
                              handleCartInteraction();
                              removeFromCart(item.cartItemId || item.id);
                            }}
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
                  
                  {/* Discount Code Section */}
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <h5 style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#333' }}>💳 Discount Code</h5>
                    
                    {appliedDiscount ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                            ✅ {appliedDiscount.code} Applied
                          </div>
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            {appliedDiscount.description}
                          </div>
                          <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>
                            -${calculateDiscountAmount().toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={removeDiscount}
                          style={{
                            padding: '5px 10px',
                            fontSize: '11px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                          <input
                            type="text"
                            placeholder="Enter discount code"
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '5px',
                              fontSize: '11px',
                              border: '1px solid #ddd',
                              borderRadius: '2px',
                              outline: 'none'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCartInteraction();
                                applyDiscountCode();
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              handleCartInteraction();
                              applyDiscountCode();
                            }}
                            disabled={isApplyingDiscount || !discountCode.trim()}
                            style={{
                              padding: '5px 10px',
                              fontSize: '10px',
                              backgroundColor: isApplyingDiscount ? '#ccc' : '#2196F3',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: isApplyingDiscount ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {isApplyingDiscount ? 'Applying...' : 'Apply'}
                          </button>
                        </div>
                        {discountError && (
                          <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '5px' }}>
                            {discountError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Updated Cart Total with Discount */}
                  <div style={{ 
                    marginBottom: '10px', 
                    padding: '8px', 
                    backgroundColor: '#f0f8ff', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <div style={{ fontSize: '11px', color: '#333' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Subtotal:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      {appliedDiscount && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4CAF50' }}>
                          <span>Discount ({appliedDiscount.code}):</span>
                          <span>-${calculateDiscountAmount().toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontWeight: 'bold', 
                        fontSize: '13px',
                        marginTop: '5px',
                        paddingTop: '5px',
                        borderTop: '1px solid #ddd',
                        color: '#333'
                      }}>
                        <span>Total:</span>
                        <span>${getFinalTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cart Actions */}
                  <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                    <button
                      onClick={() => {
                        handleCartInteraction();
                        // Close other modals to prevent conflicts
                        setShowContactManager(false);
                        setShowImageModal(false);
                        setShowProductModal(false);
                        setShowTemplateManager(false);
                        setShowMediaBrowser(false);
                        // Open checkout modal
                        setShowCheckoutModal(true);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginBottom: '5px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                    >
                      🛒 Checkout (${getFinalTotal().toFixed(2)})
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCartInteraction();
                        sendCartInChat();
                      }}
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
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1976D2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2196F3'}
                    >
                      💬 Send Cart in Chat
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCartInteraction();
                        clearCart();
                      }}
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
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cc3333'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
                    >
                      🗑️ Clear Cart
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
                  🛒 Your cart is empty<br />
                  <small style={{ color: '#999', fontSize: '10px' }}>Add products from Section 1 above</small>
                </div>
              )}
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

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>🛒 Checkout</h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Order Summary */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📋 Order Summary</h3>
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                {cartItems.map((item, index) => (
                  <div key={item.cartItemId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < cartItems.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{item.title}</span>
                      <span style={{ color: '#666', marginLeft: '10px' }}>x {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>
                      ${(parseFloat(item.variants?.[0]?.price || '0') * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                {/* Order Totals */}
                <div style={{ marginTop: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    fontSize: '14px'
                  }}>
                    <span>Subtotal:</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {appliedDiscount && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 0',
                      fontSize: '14px',
                      color: '#28a745'
                    }}>
                      <span>Discount ({appliedDiscount.code}):</span>
                      <span>-${calculateDiscountAmount().toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderTop: '2px solid #333',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    <span>Total:</span>
                    <span>${getFinalTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>👤 Customer Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="First Name *"
                  value={checkoutData.customerInfo.firstName}
                  onChange={(e) => updateCheckoutData('customerInfo', 'firstName', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={checkoutData.customerInfo.lastName}
                  onChange={(e) => updateCheckoutData('customerInfo', 'lastName', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={checkoutData.customerInfo.email}
                  onChange={(e) => updateCheckoutData('customerInfo', 'email', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    gridColumn: '1 / -1'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={checkoutData.customerInfo.phone}
                  onChange={(e) => updateCheckoutData('customerInfo', 'phone', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    gridColumn: '1 / -1'
                  }}
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📍 Shipping Address</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                <input
                  type="text"
                  placeholder="Address Line 1 *"
                  value={checkoutData.shippingAddress.address1}
                  onChange={(e) => updateCheckoutData('shippingAddress', 'address1', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={checkoutData.shippingAddress.address2}
                  onChange={(e) => updateCheckoutData('shippingAddress', 'address2', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <input
                    type="text"
                    placeholder="City *"
                    value={checkoutData.shippingAddress.city}
                    onChange={(e) => updateCheckoutData('shippingAddress', 'city', e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="State/Province *"
                    value={checkoutData.shippingAddress.province}
                    onChange={(e) => updateCheckoutData('shippingAddress', 'province', e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="ZIP/Postal Code *"
                    value={checkoutData.shippingAddress.zip}
                    onChange={(e) => updateCheckoutData('shippingAddress', 'zip', e.target.value)}
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <select
                  value={checkoutData.shippingAddress.country}
                  onChange={(e) => updateCheckoutData('shippingAddress', 'country', e.target.value)}
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>

            {/* Order Notes */}
            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📝 Order Notes (Optional)</h3>
              <textarea
                placeholder="Any special instructions for your order..."
                value={checkoutData.orderNotes}
                onChange={(e) => setCheckoutData(prev => ({ ...prev, orderNotes: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Checkout Actions */}
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{
                  flex: 1,
                  padding: '15px',
                  fontSize: '16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processCheckout}
                disabled={isProcessingCheckout || 
                  !checkoutData.customerInfo.firstName || 
                  !checkoutData.customerInfo.lastName || 
                  !checkoutData.customerInfo.email ||
                  !checkoutData.shippingAddress.address1 ||
                  !checkoutData.shippingAddress.city}
                style={{
                  flex: 2,
                  padding: '15px',
                  fontSize: '16px',
                  backgroundColor: isProcessingCheckout ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessingCheckout ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isProcessingCheckout ? '⏳ Processing...' : `✅ Place Order ($${getFinalTotal().toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Gallery Modal */}
      {showWhatsAppGallery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '1200px',
            height: '85%',
            maxHeight: '900px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #333'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  color: 'white', 
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}>
                  📱 WhatsApp Message Templates
                </h2>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '14px' 
                }}>
                  All supported WhatsApp Business API message formats
                </p>
              </div>
              <button 
                onClick={() => setShowWhatsAppGallery(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: '20px',
              height: 'calc(100% - 90px)',
              overflowY: 'auto',
              background: '#1a1a1a'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '20px'
              }}>

                {/* 1. Text Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    📝 Text Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    Hello! Welcome to SUSA SHAPEWEAR. How can I help you today?
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Basic text message - supports formatting (*bold*, _italic_)
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 2. Image Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    🖼️ Image Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '120px',
                      backgroundColor: '#555',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      fontSize: '24px'
                    }}>
                      🛍️
                    </div>
                    <div>Check out our latest product collection!</div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Image with caption - JPEG, PNG supported, max 5MB
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 3. Button Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    🔘 Button Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{ marginBottom: '12px' }}>
                      What would you like to do next?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}>
                        🛒 View Products
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}>
                        📞 Contact Support
                      </div>
                      <div style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)', 
                        padding: '8px', 
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '12px'
                      }}>
                        ℹ️ About Us
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Interactive buttons - up to 3 buttons per message
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 4. List Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    📋 List Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                      Choose a category:
                    </div>
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '8px', 
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}>
                      📱 See all options
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    List with sections - up to 10 options total
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 5. Product Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    🛍️ Product Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#555',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        👗
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          Bodysuit Shaper
                        </div>
                        <div style={{ color: '#ccc', fontSize: '12px' }}>
                          $408.00 TTD
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Single product from catalog - requires catalog setup
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 6. Product List Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    🛒 Product List
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                      🛍️ Your Cart Items
                    </div>
                    <div style={{ marginBottom: '8px', fontSize: '12px' }}>
                      Review your 3 selected items:
                    </div>
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '8px', 
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}>
                      📱 View Products
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Multiple products from catalog - perfect for cart
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 7. Location Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    📍 Location Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: '#555',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}>
                      🗺️
                    </div>
                    <div style={{ fontSize: '12px' }}>
                      Our Store Location
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Share location with coordinates
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 8. Template Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    📄 Template Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      Hi John! Your order #12345 has been shipped and will arrive tomorrow.
                    </div>
                    <div style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '8px', 
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '12px'
                    }}>
                      📦 Track Package
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    Pre-approved templates with variables - required for marketing
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

                {/* 9. Document Message */}
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid #333'
                }}>
                  <h3 style={{ color: '#25D366', margin: '0 0 12px 0' }}>
                    📄 Document Message
                  </h3>
                  <div style={{
                    backgroundColor: '#075E54',
                    padding: '12px',
                    borderRadius: '8px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      padding: '8px',
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '20px' }}>📋</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          Product_Catalog.pdf
                        </div>
                        <div style={{ fontSize: '10px', color: '#ccc' }}>
                          2.3 MB
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                    PDF, DOC, XLS files - max 100MB
                  </div>
                  <button style={{
                    backgroundColor: '#25D366',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}>
                    Use Template
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Emoji Picker */}
      <FacebookEmojiPicker
        isOpen={showFacebookEmojiPicker}
        onClose={() => {
          setShowFacebookEmojiPicker(false);
          setActiveCommentForReaction(null);
        }}
        onEmojiSelect={(emoji) => {
          if (activeCommentForReaction) {
            handleCommentReaction(activeCommentForReaction, emoji);
          }
        }}
        position={facebookEmojiPickerPosition}
      />

    </div>
    </>
  );
};

export default ChatPage;
