import React, { useState, useRef, useEffect } from 'react';
import VideoMessage from './VideoMessage';
import ContactManager from './ContactManager';
import ImageModal from './ImageModal';
import WhatsAppTemplateManager from './WhatsAppTemplateManager';
import MediaBrowser from './MediaBrowser';
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
  const [recentlyUsedEmojis, setRecentlyUsedEmojis] = useState<string[]>([]);
  const [newConversationPhone, setNewConversationPhone] = useState('+1 (868) ');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

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
  };  // Fetch WhatsApp messages for a specific conversation
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
          
          return {
            id: msg.whatsapp_message_id || msg.id.toString(),
            text: msg.content || '',
            sender: msg.direction === 'incoming' ? 'user' : 'agent',
            timestamp: new Date(parseInt(msg.timestamp) * 1000),
            type: (msg.message_type === 'audio' || msg.message_type === 'voice') ? 'voice' :
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
            failureReason: msg.failure_reason as '24_hour_rule' | 'general_error' | undefined
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
      // Comprehensive emoji name mapping for better search
      const emojiNames: { [key: string]: string[] } = {
        // Smileys & Emotion
        '😀': ['smile', 'happy', 'grin', 'face', 'joy'],
        '😃': ['smile', 'happy', 'joy', 'face', 'grin'],
        '😄': ['smile', 'happy', 'laugh', 'face', 'joy'],
        '😁': ['grin', 'smile', 'happy', 'face', 'beam'],
        '😆': ['laugh', 'happy', 'smile', 'face', 'squint'],
        '😅': ['sweat', 'laugh', 'nervous', 'face', 'relief'],
        '😂': ['joy', 'laugh', 'tears', 'face', 'crying'],
        '🤣': ['rolling', 'laugh', 'floor', 'face', 'rofl'],
        '😊': ['blush', 'smile', 'happy', 'face', 'warm'],
        '😇': ['innocent', 'halo', 'angel', 'face', 'saint'],
        '🙂': ['smile', 'happy', 'slight', 'face', 'content'],
        '🙃': ['upside', 'down', 'silly', 'face', 'sarcasm'],
        '😉': ['wink', 'smile', 'face', 'flirt'],
        '😌': ['relieved', 'peaceful', 'face', 'content'],
        '😍': ['love', 'heart', 'eyes', 'face', 'crush'],
        '🥰': ['love', 'hearts', 'smile', 'face', 'affection'],
        '😘': ['kiss', 'love', 'face', 'blow'],
        '😗': ['kiss', 'whistle', 'face'],
        '😙': ['kiss', 'smile', 'face'],
        '😚': ['kiss', 'closed', 'eyes', 'face'],
        '😋': ['tongue', 'tasty', 'face', 'yum', 'delicious'],
        '😛': ['tongue', 'out', 'face', 'playful'],
        '😝': ['tongue', 'wink', 'face', 'silly'],
        '😜': ['tongue', 'wink', 'face', 'joke'],
        '🤪': ['crazy', 'wild', 'face', 'zany'],
        '🤨': ['raised', 'eyebrow', 'face', 'suspicious'],
        '🧐': ['monocle', 'face', 'thinking', 'fancy'],
        '🤓': ['nerd', 'glasses', 'face', 'geek'],
        '😎': ['cool', 'sunglasses', 'face', 'awesome'],
        '🤩': ['star', 'eyes', 'wow', 'face', 'amazed'],
        '🥳': ['party', 'celebration', 'face', 'birthday'],
        '😏': ['smirk', 'face', 'sly', 'mischief'],
        '😒': ['unamused', 'face', 'bored'],
        '😞': ['disappointed', 'face', 'sad'],
        '😔': ['pensive', 'face', 'thoughtful', 'sad'],
        '😟': ['worried', 'face', 'concerned'],
        '😕': ['confused', 'face', 'slightly'],
        '🙁': ['frown', 'face', 'sad'],
        '☹️': ['frown', 'face', 'very', 'sad'],
        '😣': ['persevering', 'face', 'struggling'],
        '😖': ['confounded', 'face', 'frustrated'],
        '😫': ['tired', 'face', 'exhausted'],
        '😩': ['weary', 'face', 'fed', 'up'],
        '🥺': ['pleading', 'face', 'puppy', 'eyes'],
        '😢': ['cry', 'tear', 'sad', 'face'],
        '😭': ['cry', 'tears', 'sad', 'face', 'sobbing'],
        '😤': ['angry', 'mad', 'face', 'huffing'],
        '😠': ['angry', 'mad', 'face', 'grumpy'],
        '😡': ['angry', 'red', 'mad', 'face', 'rage'],
        '🤬': ['swearing', 'cursing', 'face', 'symbols'],
        '🤯': ['exploding', 'head', 'mind', 'blown'],
        '😳': ['flushed', 'face', 'embarrassed'],
        '🥵': ['hot', 'heat', 'face', 'sweating'],
        '🥶': ['cold', 'freeze', 'face', 'freezing'],
        '😱': ['scream', 'fear', 'face', 'shock'],
        '😨': ['fearful', 'face', 'scared'],
        '😰': ['anxious', 'sweat', 'face', 'worried'],
        '😥': ['sad', 'sweat', 'face', 'disappointed'],
        '😓': ['downcast', 'sweat', 'face'],
        '🤗': ['hug', 'face', 'embrace'],
        '🤔': ['thinking', 'face', 'hmm'],
        '🤭': ['hand', 'mouth', 'face', 'oops'],
        '🤫': ['shush', 'quiet', 'face', 'secret'],
        '🤥': ['lying', 'face', 'pinocchio'],
        '😶': ['no', 'mouth', 'face', 'speechless'],
        '😐': ['neutral', 'face', 'meh'],
        '😑': ['expressionless', 'face', 'blank'],
        '😬': ['grimace', 'face', 'awkward'],
        '🙄': ['eye', 'roll', 'face', 'whatever'],
        '😯': ['hushed', 'face', 'surprised'],
        '😦': ['frowning', 'open', 'mouth', 'face'],
        '😧': ['anguished', 'face', 'distressed'],
        '😮': ['open', 'mouth', 'face', 'wow'],
        '😲': ['astonished', 'face', 'shock'],
        '🥱': ['yawn', 'face', 'tired', 'sleepy'],
        '😴': ['sleep', 'face', 'zzz', 'tired'],
        '🤤': ['drool', 'face', 'sleep'],
        '😪': ['sleepy', 'face', 'tired'],

        // Hearts & Love
        '❤️': ['heart', 'love', 'red', 'romance'],
        '🧡': ['heart', 'orange', 'love'],
        '💛': ['heart', 'yellow', 'love'],
        '💚': ['heart', 'green', 'love'],
        '💙': ['heart', 'blue', 'love'],
        '💜': ['heart', 'purple', 'love'],
        '🤍': ['heart', 'white', 'love'],
        '🖤': ['heart', 'black', 'love'],
        '🤎': ['heart', 'brown', 'love'],
        '💔': ['broken', 'heart', 'love', 'sad'],
        '❣️': ['exclamation', 'heart', 'love'],
        '💕': ['hearts', 'love', 'two'],
        '💞': ['hearts', 'love', 'revolving'],
        '💓': ['heart', 'beating', 'love'],
        '💗': ['heart', 'growing', 'love'],
        '💖': ['heart', 'sparkling', 'love'],
        '💘': ['heart', 'arrow', 'cupid'],
        '💝': ['heart', 'gift', 'love'],
        '💟': ['heart', 'decoration', 'love'],
        '♥️': ['heart', 'suit', 'love'],

        // Gestures & Hands
        '👍': ['thumbs', 'up', 'good', 'like', 'yes'],
        '👎': ['thumbs', 'down', 'bad', 'dislike', 'no'],
        '👌': ['ok', 'hand', 'perfect', 'good'],
        '✌️': ['peace', 'victory', 'hand'],
        '🤞': ['fingers', 'crossed', 'luck', 'hand', 'hope'],
        '🤟': ['love', 'you', 'hand', 'sign'],
        '🤘': ['rock', 'on', 'hand', 'metal'],
        '🤙': ['call', 'me', 'hand', 'shaka'],
        '👈': ['point', 'left', 'hand'],
        '👉': ['point', 'right', 'hand'],
        '👆': ['point', 'up', 'hand'],
        '🖕': ['middle', 'finger', 'hand'],
        '👇': ['point', 'down', 'hand'],
        '☝️': ['index', 'point', 'up', 'hand'],
        '👋': ['wave', 'hello', 'goodbye', 'hand'],
        '🤚': ['raised', 'back', 'hand'],
        '🖐️': ['raised', 'hand', 'five'],
        '✋': ['raised', 'hand', 'stop'],
        '🖖': ['vulcan', 'spock', 'hand'],
        '👏': ['clap', 'applause', 'hand'],
        '🙌': ['praise', 'hands', 'celebration'],
        '👐': ['open', 'hands', 'hug'],
        '🤲': ['palms', 'up', 'hands'],
        '🤝': ['handshake', 'deal', 'hand'],
        '🙏': ['pray', 'thanks', 'please', 'hand'],

        // Animals & Nature
        '🐶': ['dog', 'puppy', 'animal', 'pet'],
        '🐱': ['cat', 'kitten', 'animal', 'pet'],
        '🐭': ['mouse', 'animal'],
        '🐹': ['hamster', 'animal', 'pet'],
        '🐰': ['rabbit', 'bunny', 'animal'],
        '🦊': ['fox', 'animal'],
        '🐻': ['bear', 'animal'],
        '🐼': ['panda', 'bear', 'animal'],
        '🐨': ['koala', 'animal'],
        '🐯': ['tiger', 'animal'],
        '🦁': ['lion', 'animal'],
        '🐮': ['cow', 'animal'],
        '🐷': ['pig', 'animal'],
        '🐸': ['frog', 'animal'],
        '🐵': ['monkey', 'animal'],
        '🐔': ['chicken', 'animal'],
        '🐧': ['penguin', 'animal'],
        '🐦': ['bird', 'animal'],
        '🦄': ['unicorn', 'animal', 'magical'],
        '🐝': ['bee', 'insect', 'honey'],
        '🦋': ['butterfly', 'insect'],
        '🐌': ['snail', 'slow'],
        '🐛': ['bug', 'insect'],
        '🐜': ['ant', 'insect'],
        '🌸': ['cherry', 'blossom', 'flower'],
        '🌺': ['hibiscus', 'flower'],
        '🌻': ['sunflower', 'flower'],
        '🌹': ['rose', 'flower'],
        '🥀': ['wilted', 'flower'],
        '🌷': ['tulip', 'flower'],
        '🌲': ['evergreen', 'tree'],
        '🌳': ['deciduous', 'tree'],
        '🌴': ['palm', 'tree'],
        '🌱': ['seedling', 'plant'],
        '🌿': ['herb', 'plant'],
        '☘️': ['shamrock', 'clover'],

        // Food & Drinks
        '🍎': ['apple', 'fruit', 'red'],
        '🍊': ['orange', 'fruit'],
        '🍋': ['lemon', 'fruit'],
        '🍌': ['banana', 'fruit'],
        '🍉': ['watermelon', 'fruit'],
        '🍇': ['grapes', 'fruit'],
        '🍓': ['strawberry', 'fruit'],
        '🥝': ['kiwi', 'fruit'],
        '🍅': ['tomato', 'vegetable'],
        '🥕': ['carrot', 'vegetable'],
        '🌽': ['corn', 'vegetable'],
        '🌶️': ['hot', 'pepper', 'spicy'],
        '🍞': ['bread', 'food'],
        '🥖': ['baguette', 'bread'],
        '🥨': ['pretzel', 'food'],
        '🧀': ['cheese', 'food'],
        '🥓': ['bacon', 'meat'],
        '🍳': ['egg', 'cooking'],
        '🍔': ['burger', 'food', 'hamburger'],
        '🍟': ['fries', 'food', 'french'],
        '🍕': ['pizza', 'food'],
        '🌭': ['hot', 'dog', 'food'],
        '🥪': ['sandwich', 'food'],
        '🌮': ['taco', 'food'],
        '🌯': ['burrito', 'food'],
        '🥗': ['salad', 'food', 'healthy'],
        '🍝': ['pasta', 'food', 'spaghetti'],
        '🍜': ['ramen', 'noodles', 'food'],
        '🍲': ['stew', 'food'],
        '🍱': ['bento', 'box', 'food'],
        '🍣': ['sushi', 'food'],
        '🍤': ['shrimp', 'food'],
        '🥟': ['dumpling', 'food'],
        '🍦': ['ice', 'cream', 'dessert'],
        '🍰': ['cake', 'dessert'],
        '🎂': ['birthday', 'cake', 'celebration'],
        '🍭': ['lollipop', 'candy'],
        '🍬': ['candy', 'sweet'],
        '🍫': ['chocolate', 'candy'],
        '🍿': ['popcorn', 'snack'],
        '☕': ['coffee', 'drink', 'hot'],
        '🍵': ['tea', 'drink', 'hot'],
        '🥤': ['soda', 'drink', 'cup'],
        '🍺': ['beer', 'drink', 'alcohol'],
        '🍷': ['wine', 'drink', 'alcohol'],
        '🥂': ['cheers', 'champagne', 'celebration'],
        '🍾': ['champagne', 'bottle', 'celebration'],
        '🍸': ['cocktail', 'drink', 'alcohol'],

        // Activities & Sports
        '⚽': ['soccer', 'football', 'sport', 'ball'],
        '🏀': ['basketball', 'sport', 'ball'],
        '🏈': ['american', 'football', 'sport'],
        '⚾': ['baseball', 'sport', 'ball'],
        '🥎': ['softball', 'sport', 'ball'],
        '🎾': ['tennis', 'sport', 'ball'],
        '🏐': ['volleyball', 'sport', 'ball'],
        '🏉': ['rugby', 'sport', 'ball'],
        '🥏': ['frisbee', 'sport'],
        '🎱': ['pool', 'billiards', 'eight', 'ball'],
        '🏓': ['ping', 'pong', 'table', 'tennis'],
        '🏸': ['badminton', 'sport'],
        '🏒': ['ice', 'hockey', 'sport'],
        '🏑': ['field', 'hockey', 'sport'],
        '🥍': ['lacrosse', 'sport'],
        '🏏': ['cricket', 'sport'],
        '🥅': ['goal', 'net', 'sport'],
        '⛳': ['golf', 'flag', 'sport'],
        '🏹': ['archery', 'bow', 'arrow'],
        '🎣': ['fishing', 'pole'],
        '🥊': ['boxing', 'glove', 'sport'],
        '🥋': ['martial', 'arts', 'karate'],
        '🎽': ['running', 'shirt', 'sport'],
        '🛹': ['skateboard', 'sport'],
        '🛷': ['sled', 'winter'],
        '⛸️': ['ice', 'skate', 'winter'],
        '🥌': ['curling', 'stone', 'winter'],
        '🎿': ['ski', 'winter', 'sport'],
        '⛷️': ['skier', 'winter', 'sport'],
        '🏂': ['snowboard', 'winter', 'sport'],

        // Travel & Places
        '🚗': ['car', 'vehicle', 'auto', 'drive'],
        '🚕': ['taxi', 'car', 'vehicle'],
        '🚙': ['suv', 'car', 'vehicle'],
        '🚌': ['bus', 'vehicle', 'public'],
        '🚎': ['trolley', 'bus', 'vehicle'],
        '🏎️': ['race', 'car', 'fast'],
        '🚓': ['police', 'car', 'vehicle'],
        '🚑': ['ambulance', 'emergency', 'vehicle'],
        '🚒': ['fire', 'truck', 'emergency'],
        '🚐': ['van', 'vehicle'],
        '🚚': ['truck', 'delivery', 'vehicle'],
        '🚛': ['truck', 'semi', 'vehicle'],
        '🚜': ['tractor', 'farm', 'vehicle'],
        '🏍️': ['motorcycle', 'bike', 'vehicle'],
        '🚲': ['bicycle', 'bike', 'cycle'],
        '🛴': ['scooter', 'kick'],
        '🚁': ['helicopter', 'aircraft'],
        '✈️': ['airplane', 'plane', 'travel', 'flight'],
        '🚀': ['rocket', 'space', 'travel'],
        '🛸': ['ufo', 'alien', 'space'],
        '🚢': ['ship', 'boat', 'cruise'],
        '⛵': ['sailboat', 'boat', 'sail'],
        '🏠': ['house', 'home', 'building'],
        '🏡': ['house', 'garden', 'home'],
        '🏢': ['office', 'building', 'work'],
        '🏬': ['department', 'store', 'shopping'],
        '🏭': ['factory', 'industry', 'building'],
        '🏰': ['castle', 'palace', 'building'],
        '🗼': ['tower', 'eiffel', 'building'],
        '🌉': ['bridge', 'golden', 'gate'],
        '🎡': ['ferris', 'wheel', 'amusement'],
        '🎢': ['roller', 'coaster', 'amusement'],
        '🎠': ['carousel', 'horse', 'amusement'],
        '⛱️': ['beach', 'umbrella', 'vacation'],
        '🏖️': ['beach', 'vacation', 'sand'],
        '🏝️': ['island', 'desert', 'tropical'],

        // Objects & Symbols
        '💼': ['briefcase', 'work', 'business'],
        '👔': ['necktie', 'formal', 'work'],
        '👗': ['dress', 'clothing', 'formal'],
        '👠': ['high', 'heel', 'shoe'],
        '👓': ['glasses', 'eyewear'],
        '🎓': ['graduation', 'cap', 'education'],
        '📚': ['books', 'education', 'study'],
        '📖': ['book', 'open', 'read'],
        '📝': ['memo', 'note', 'write'],
        '✏️': ['pencil', 'write', 'draw'],
        '📌': ['pushpin', 'pin'],
        '📎': ['paperclip', 'attach'],
        '📋': ['clipboard', 'list'],
        '📊': ['chart', 'bar', 'data'],
        '📈': ['chart', 'trending', 'up'],
        '📉': ['chart', 'trending', 'down'],
        '💰': ['money', 'bag', 'cash', 'rich'],
        '💵': ['money', 'dollar', 'cash'],
        '💳': ['credit', 'card', 'payment'],
        '💎': ['diamond', 'gem', 'precious', 'jewel'],
        '⚖️': ['scale', 'justice', 'law'],
        '🔧': ['wrench', 'tool', 'fix'],
        '⚙️': ['gear', 'settings', 'cog'],
        '🔨': ['hammer', 'tool', 'build'],

        // Technology & Entertainment
        '🎮': ['game', 'gaming', 'controller', 'video'],
        '🕹️': ['joystick', 'game', 'arcade'],
        '🎲': ['dice', 'game', 'random'],
        '🃏': ['joker', 'card', 'game'],
        '🎯': ['target', 'bullseye', 'dart'],
        '🎪': ['circus', 'tent', 'entertainment'],
        '🎨': ['art', 'palette', 'paint'],

        // Transportation - Comprehensive
        '🚗': ['car', 'vehicle', 'auto', 'drive', 'red'],
        '🚕': ['taxi', 'car', 'vehicle', 'yellow', 'cab'],
        '🚙': ['suv', 'car', 'vehicle', 'sport', 'utility'],
        '🚌': ['bus', 'vehicle', 'public', 'transport'],
        '🚎': ['trolley', 'bus', 'vehicle', 'electric'],
        '🏎️': ['race', 'car', 'fast', 'formula', 'speed'],
        '🚓': ['police', 'car', 'vehicle', 'cop'],
        '🚑': ['ambulance', 'emergency', 'vehicle', 'medical'],
        '🚒': ['fire', 'truck', 'emergency', 'firefighter'],
        '🚐': ['van', 'vehicle', 'minivan'],
        '🛻': ['pickup', 'truck', 'vehicle'],
        '🚚': ['truck', 'delivery', 'vehicle', 'lorry'],
        '🚛': ['truck', 'semi', 'vehicle', 'articulated'],
        '🚜': ['tractor', 'farm', 'vehicle', 'agriculture'],
        '🏍️': ['motorcycle', 'bike', 'vehicle', 'motorbike'],
        '🛵': ['scooter', 'motor', 'moped'],
        '🚲': ['bicycle', 'bike', 'cycle', 'pedal'],
        '🛴': ['scooter', 'kick', 'push'],
        '🛹': ['skateboard', 'skate', 'board'],
        '🛼': ['roller', 'skate', 'wheels'],
        '🚁': ['helicopter', 'aircraft', 'chopper'],
        '🛸': ['ufo', 'alien', 'space', 'flying', 'saucer'],
        '✈️': ['airplane', 'plane', 'travel', 'flight', 'aircraft'],
        '🛩️': ['small', 'airplane', 'aircraft'],
        '🛫': ['departure', 'takeoff', 'airplane'],
        '🛬': ['arrival', 'landing', 'airplane'],
        '🪂': ['parachute', 'skydiving', 'jump'],
        '💺': ['seat', 'airplane', 'chair'],
        '🚀': ['rocket', 'space', 'travel', 'launch'],
        '🛰️': ['satellite', 'space', 'communication'],
        '🚉': ['station', 'train', 'railway'],
        '🚞': ['mountain', 'railway', 'train'],
        '🚝': ['monorail', 'train', 'rail'],
        '🚄': ['high', 'speed', 'train', 'bullet'],
        '🚅': ['bullet', 'train', 'shinkansen'],
        '🚈': ['light', 'rail', 'train'],
        '🚂': ['locomotive', 'train', 'steam'],
        '🚆': ['train', 'railway', 'passenger'],
        '🚇': ['metro', 'subway', 'underground'],
        '🚊': ['tram', 'trolley', 'streetcar'],
        '🚟': ['suspension', 'railway', 'monorail'],
        '🚠': ['mountain', 'cableway', 'cable'],
        '🚡': ['aerial', 'tramway', 'cable'],
        '⛵': ['sailboat', 'boat', 'sail', 'yacht'],
        '🛶': ['canoe', 'boat', 'paddle'],
        '🚤': ['speedboat', 'boat', 'motorboat'],
        '🛥️': ['motor', 'boat', 'yacht'],
        '🛳️': ['passenger', 'ship', 'cruise'],
        '⛴️': ['ferry', 'boat', 'ship'],
        '🚢': ['ship', 'boat', 'cruise', 'ocean'],
        '⚓': ['anchor', 'ship', 'boat'],
        '⛽': ['fuel', 'pump', 'gas', 'station'],
        '🚧': ['construction', 'barrier', 'work'],
        '🚨': ['police', 'car', 'light', 'emergency'],
        '🚥': ['horizontal', 'traffic', 'light'],
        '🚦': ['vertical', 'traffic', 'light'],
        '🛑': ['stop', 'sign', 'octagon'],
        '🚏': ['bus', 'stop', 'sign'],

        // Weather & Nature - Comprehensive
        '🌍': ['earth', 'globe', 'africa', 'europe', 'world'],
        '🌎': ['earth', 'globe', 'americas', 'world'],
        '🌏': ['earth', 'globe', 'asia', 'australia', 'world'],
        '🌐': ['globe', 'meridians', 'world', 'internet'],
        '🗺️': ['world', 'map', 'geography'],
        '🗾': ['japan', 'map', 'silhouette'],
        '🧭': ['compass', 'navigation', 'direction'],
        '🏔️': ['snow', 'capped', 'mountain', 'peak'],
        '⛰️': ['mountain', 'peak', 'hill'],
        '🌋': ['volcano', 'eruption', 'lava'],
        '🗻': ['mount', 'fuji', 'mountain'],
        '🏕️': ['camping', 'tent', 'outdoor'],
        '🏖️': ['beach', 'umbrella', 'vacation'],
        '🏜️': ['desert', 'sand', 'dry'],
        '🏝️': ['desert', 'island', 'tropical'],
        '🏞️': ['national', 'park', 'landscape'],
        '🏟️': ['stadium', 'arena', 'sports'],
        '🏛️': ['classical', 'building', 'museum'],
        '🏗️': ['building', 'construction', 'crane'],
        '🧱': ['brick', 'wall', 'construction'],
        '☀️': ['sun', 'sunny', 'bright', 'hot'],
        '🌤️': ['sun', 'behind', 'small', 'cloud'],
        '⛅': ['sun', 'behind', 'cloud', 'partly'],
        '🌥️': ['sun', 'behind', 'large', 'cloud'],
        '☁️': ['cloud', 'cloudy', 'overcast'],
        '🌦️': ['sun', 'behind', 'rain', 'cloud'],
        '🌧️': ['cloud', 'with', 'rain', 'rainy'],
        '⛈️': ['cloud', 'lightning', 'rain', 'storm'],
        '🌩️': ['cloud', 'lightning', 'storm'],
        '🌨️': ['cloud', 'snow', 'snowy'],
        '❄️': ['snowflake', 'snow', 'cold', 'winter'],
        '☃️': ['snowman', 'snow', 'winter'],
        '⛄': ['snowman', 'without', 'snow', 'winter'],
        '🌬️': ['wind', 'face', 'blowing'],
        '💨': ['dashing', 'away', 'wind', 'fast'],
        '🌪️': ['tornado', 'cyclone', 'twister'],
        '🌫️': ['fog', 'misty', 'cloudy'],
        '🌈': ['rainbow', 'colorful', 'arc'],
        '🌙': ['crescent', 'moon', 'night'],
        '🌛': ['first', 'quarter', 'moon', 'face'],
        '🌜': ['last', 'quarter', 'moon', 'face'],
        '🌚': ['new', 'moon', 'face', 'dark'],
        '🌕': ['full', 'moon', 'bright'],
        '🌖': ['waning', 'gibbous', 'moon'],
        '🌗': ['last', 'quarter', 'moon'],
        '🌘': ['waning', 'crescent', 'moon'],
        '🌑': ['new', 'moon', 'dark'],
        '🌒': ['waxing', 'crescent', 'moon'],
        '🌓': ['first', 'quarter', 'moon'],
        '🌔': ['waxing', 'gibbous', 'moon'],
        '🌝': ['full', 'moon', 'face', 'bright'],
        '🌞': ['sun', 'with', 'face', 'bright'],
        '🪐': ['saturn', 'planet', 'rings'],
        '⭐': ['star', 'medium', 'white'],
        '🌟': ['glowing', 'star', 'bright'],
        '💫': ['dizzy', 'star', 'sparkle'],
        '✨': ['sparkles', 'glitter', 'magic'],
        '🌠': ['shooting', 'star', 'meteor'],
        '🌌': ['milky', 'way', 'galaxy', 'space'],
        '☄️': ['comet', 'space', 'tail'],
        '💥': ['collision', 'explosion', 'boom'],
        '🔥': ['fire', 'flame', 'hot', 'burn'],
        '🌊': ['water', 'wave', 'ocean', 'sea'],

        // Food Comprehensive - Fruits
        '🍎': ['apple', 'fruit', 'red', 'healthy'],
        '🍏': ['green', 'apple', 'fruit', 'sour'],
        '🍊': ['orange', 'fruit', 'citrus', 'vitamin'],
        '🍋': ['lemon', 'fruit', 'citrus', 'sour'],
        '🍌': ['banana', 'fruit', 'yellow', 'potassium'],
        '🍉': ['watermelon', 'fruit', 'summer', 'red'],
        '🍇': ['grapes', 'fruit', 'bunch', 'wine'],
        '🍓': ['strawberry', 'fruit', 'berry', 'red'],
        '🫐': ['blueberries', 'fruit', 'berry', 'antioxidant'],
        '🍈': ['melon', 'fruit', 'cantaloupe'],
        '🍒': ['cherries', 'fruit', 'red', 'pair'],
        '🍑': ['peach', 'fruit', 'fuzzy', 'sweet'],
        '🥭': ['mango', 'fruit', 'tropical', 'sweet'],
        '🍍': ['pineapple', 'fruit', 'tropical', 'spiky'],
        '🥥': ['coconut', 'fruit', 'tropical', 'water'],
        '🥝': ['kiwi', 'fruit', 'green', 'fuzzy'],

        // Vegetables
        '🍅': ['tomato', 'vegetable', 'red', 'salad'],
        '🍆': ['eggplant', 'vegetable', 'purple', 'aubergine'],
        '🥑': ['avocado', 'fruit', 'green', 'healthy'],
        '🥦': ['broccoli', 'vegetable', 'green', 'tree'],
        '🥬': ['leafy', 'greens', 'lettuce', 'salad'],
        '🥒': ['cucumber', 'vegetable', 'green', 'fresh'],
        '🌶️': ['hot', 'pepper', 'spicy', 'chili'],
        '🫑': ['bell', 'pepper', 'capsicum', 'sweet'],
        '🌽': ['corn', 'vegetable', 'cob', 'yellow'],
        '🥕': ['carrot', 'vegetable', 'orange', 'root'],
        '🫒': ['olive', 'fruit', 'oil', 'mediterranean'],
        '🧄': ['garlic', 'vegetable', 'clove', 'pungent'],
        '🧅': ['onion', 'vegetable', 'layers', 'tears'],
        '🥔': ['potato', 'vegetable', 'starch', 'tuber'],
        '🍠': ['roasted', 'sweet', 'potato', 'orange'],

        // Bread & Grains
        '🥐': ['croissant', 'bread', 'french', 'pastry'],
        '🥯': ['bagel', 'bread', 'round', 'hole'],
        '🍞': ['bread', 'loaf', 'slice', 'wheat'],
        '🥖': ['baguette', 'bread', 'french', 'long'],
        '🥨': ['pretzel', 'bread', 'twisted', 'salt'],
        '🧀': ['cheese', 'dairy', 'wedge', 'yellow'],

        // Meat & Protein
        '🥚': ['egg', 'protein', 'chicken', 'breakfast'],
        '🍳': ['cooking', 'egg', 'fried', 'pan'],
        '🧈': ['butter', 'dairy', 'spread'],
        '🥞': ['pancakes', 'breakfast', 'syrup', 'stack'],
        '🧇': ['waffle', 'breakfast', 'grid', 'syrup'],
        '🥓': ['bacon', 'meat', 'strip', 'pork'],
        '🥩': ['cut', 'meat', 'steak', 'raw'],
        '🍗': ['poultry', 'leg', 'chicken', 'drumstick'],
        '🍖': ['meat', 'bone', 'barbecue'],
        '🦴': ['bone', 'skeleton', 'dog'],
        '🌭': ['hot', 'dog', 'sausage', 'bun'],
        '🍔': ['hamburger', 'burger', 'fast', 'food'],
        '🍟': ['french', 'fries', 'potato', 'golden'],
        '🍕': ['pizza', 'slice', 'cheese', 'italian'],

        // Music & Entertainment Comprehensive
        '🎵': ['musical', 'note', 'music', 'melody'],
        '🎶': ['musical', 'notes', 'music', 'song'],
        '🎼': ['musical', 'score', 'sheet', 'music'],
        '🎹': ['musical', 'keyboard', 'piano', 'keys'],
        '🥁': ['drum', 'percussion', 'beat'],
        '🪘': ['long', 'drum', 'percussion'],
        '🎷': ['saxophone', 'sax', 'jazz', 'wind'],
        '🎺': ['trumpet', 'brass', 'horn'],
        '🎸': ['guitar', 'string', 'rock', 'acoustic'],
        '🪕': ['banjo', 'string', 'country'],
        '🎻': ['violin', 'string', 'classical'],
        '🪗': ['accordion', 'squeeze', 'folk'],
        '🪈': ['flute', 'wind', 'pipe'],
        '🎤': ['microphone', 'mic', 'sing', 'karaoke'],
        '🎧': ['headphones', 'listen', 'music'],
        '📻': ['radio', 'broadcast', 'music'],
        '🎙️': ['studio', 'microphone', 'podcast'],
        '🎚️': ['level', 'slider', 'mixer'],
        '🎛️': ['control', 'knobs', 'mixer'],

        // Sports & Activities Comprehensive
        '⚽': ['soccer', 'football', 'sport', 'ball', 'kick'],
        '🏀': ['basketball', 'sport', 'ball', 'hoop'],
        '🏈': ['american', 'football', 'sport', 'throw'],
        '⚾': ['baseball', 'sport', 'ball', 'bat'],
        '🥎': ['softball', 'sport', 'ball', 'underhand'],
        '🎾': ['tennis', 'sport', 'ball', 'racket'],
        '🏐': ['volleyball', 'sport', 'ball', 'net'],
        '🏉': ['rugby', 'sport', 'ball', 'oval'],
        '🥏': ['frisbee', 'disc', 'throw', 'ultimate'],
        '🎱': ['pool', 'billiards', 'eight', 'ball', 'cue'],
        '🪀': ['yo-yo', 'toy', 'string', 'up', 'down'],
        '🏓': ['ping', 'pong', 'table', 'tennis', 'paddle'],
        '🏸': ['badminton', 'sport', 'racket', 'shuttlecock'],
        '🏒': ['ice', 'hockey', 'sport', 'stick'],
        '🏑': ['field', 'hockey', 'sport', 'stick'],
        '🥍': ['lacrosse', 'sport', 'stick', 'net'],
        '🏏': ['cricket', 'sport', 'bat', 'wicket'],
        '🪃': ['boomerang', 'throw', 'return'],
        '🥅': ['goal', 'net', 'sport', 'soccer'],
        '⛳': ['flag', 'hole', 'golf', 'course'],
        '🪁': ['kite', 'fly', 'wind', 'string'],
        '🏹': ['bow', 'arrow', 'archery', 'target'],
        '🎣': ['fishing', 'pole', 'rod', 'hook'],
        '🤿': ['diving', 'mask', 'snorkel', 'underwater'],
        '🥊': ['boxing', 'glove', 'fight', 'punch'],
        '🥋': ['martial', 'arts', 'uniform', 'karate'],
        '🎽': ['running', 'shirt', 'tank', 'marathon'],
        '🛹': ['skateboard', 'skate', 'board', 'wheels'],
        '🛷': ['sled', 'sledding', 'snow', 'winter'],
        '⛸️': ['ice', 'skates', 'skating', 'rink'],
        '🥌': ['curling', 'stone', 'ice', 'sweep'],
        '🎿': ['skis', 'skiing', 'snow', 'alpine'],
        '⛷️': ['skier', 'skiing', 'downhill', 'snow'],
        '🏂': ['snowboarder', 'snowboard', 'snow'],
        '🪂': ['parachute', 'skydiving', 'jump'],
        '🏆': ['trophy', 'winner', 'champion', 'gold'],
        '🥇': ['first', 'place', 'medal', 'gold'],
        '🥈': ['second', 'place', 'medal', 'silver'],
        '🥉': ['third', 'place', 'medal', 'bronze'],
        '🏅': ['sports', 'medal', 'achievement'],
        '🎖️': ['military', 'medal', 'honor'],
        '🏵️': ['rosette', 'flower', 'award'],
        '🎗️': ['reminder', 'ribbon', 'awareness'],

        // Technology & Objects Comprehensive
        '⌚': ['watch', 'apple', 'time', 'wrist'],
        '📱': ['mobile', 'phone', 'smartphone', 'cell'],
        '📲': ['mobile', 'phone', 'arrow', 'receive'],
        '💻': ['laptop', 'computer', 'pc', 'work'],
        '⌨️': ['keyboard', 'computer', 'type'],
        '🖥️': ['desktop', 'computer', 'monitor'],
        '🖨️': ['printer', 'print', 'paper'],
        '🖱️': ['computer', 'mouse', 'click'],
        '🖲️': ['trackball', 'mouse', 'computer'],
        '🕹️': ['joystick', 'game', 'controller'],
        '🗜️': ['clamp', 'compress', 'tool'],
        '💽': ['computer', 'disk', 'minidisc'],
        '💾': ['floppy', 'disk', 'save'],
        '💿': ['optical', 'disk', 'cd'],
        '📀': ['dvd', 'disk', 'optical'],
        '📼': ['videocassette', 'tape', 'vhs'],
        '📷': ['camera', 'photo', 'picture'],
        '📸': ['camera', 'flash', 'photo'],
        '📹': ['video', 'camera', 'record'],
        '🎥': ['movie', 'camera', 'film'],
        '📽️': ['film', 'projector', 'movie'],
        '🎞️': ['film', 'frames', 'movie'],
        '📞': ['telephone', 'receiver', 'call'],
        '☎️': ['telephone', 'phone', 'call'],
        '📟': ['pager', 'beeper', 'message'],
        '📠': ['fax', 'machine', 'document'],
        '📺': ['television', 'tv', 'watch'],
        '📻': ['radio', 'broadcast', 'listen'],
        '🎙️': ['studio', 'microphone', 'broadcast'],
        '🎚️': ['level', 'slider', 'audio'],
        '🎛️': ['control', 'knobs', 'audio'],
        '🧭': ['compass', 'navigation', 'direction'],
        '⏱️': ['stopwatch', 'timer', 'time'],
        '⏲️': ['timer', 'clock', 'countdown'],
        '⏰': ['alarm', 'clock', 'time'],
        '🕰️': ['mantelpiece', 'clock', 'time'],
        '⌛': ['hourglass', 'done', 'time'],
        '⏳': ['hourglass', 'not', 'done'],
        '📡': ['satellite', 'antenna', 'communication'],
        '🔋': ['battery', 'power', 'energy'],
        '🔌': ['electric', 'plug', 'power'],
        '💡': ['light', 'bulb', 'idea'],
        '🔦': ['flashlight', 'torch', 'light'],
        '🕯️': ['candle', 'light', 'wax'],
        '🪔': ['diya', 'lamp', 'light'],
        '🧯': ['fire', 'extinguisher', 'safety'],
        '🛢️': ['oil', 'drum', 'barrel'],

        // Books & Office Comprehensive
        '📚': ['books', 'library', 'education', 'study'],
        '📖': ['open', 'book', 'read', 'novel'],
        '📗': ['green', 'book', 'textbook'],
        '📘': ['blue', 'book', 'textbook'],
        '📙': ['orange', 'book', 'textbook'],
        '📕': ['closed', 'book', 'red'],
        '📓': ['notebook', 'journal', 'write'],
        '📔': ['notebook', 'decorative', 'cover'],
        '📒': ['ledger', 'accounting', 'book'],
        '📝': ['memo', 'note', 'write', 'document'],
        '📄': ['page', 'facing', 'up', 'document'],
        '📃': ['page', 'curl', 'document'],
        '📑': ['bookmark', 'tabs', 'organize'],
        '📜': ['scroll', 'ancient', 'document'],
        '📰': ['newspaper', 'news', 'read'],
        '🗞️': ['rolled', 'newspaper', 'delivery'],
        '🔖': ['bookmark', 'save', 'page'],
        '🏷️': ['label', 'tag', 'price'],

        // Numbers & Symbols Comprehensive
        '0️⃣': ['zero', 'number', 'digit', 'keycap'],
        '1️⃣': ['one', 'number', 'digit', 'keycap'],
        '2️⃣': ['two', 'number', 'digit', 'keycap'],
        '3️⃣': ['three', 'number', 'digit', 'keycap'],
        '4️⃣': ['four', 'number', 'digit', 'keycap'],
        '5️⃣': ['five', 'number', 'digit', 'keycap'],
        '6️⃣': ['six', 'number', 'digit', 'keycap'],
        '7️⃣': ['seven', 'number', 'digit', 'keycap'],
        '8️⃣': ['eight', 'number', 'digit', 'keycap'],
        '9️⃣': ['nine', 'number', 'digit', 'keycap'],
        '🔟': ['ten', 'number', 'keycap'],
        '#️⃣': ['hash', 'number', 'sign', 'keycap'],
        '*️⃣': ['asterisk', 'star', 'keycap'],
        '⏏️': ['eject', 'button', 'symbol'],
        '▶️': ['play', 'button', 'triangle'],
        '⏸️': ['pause', 'button', 'double'],
        '⏯️': ['play', 'pause', 'button'],
        '⏹️': ['stop', 'button', 'square'],
        '⏺️': ['record', 'button', 'circle'],
        '⏭️': ['next', 'track', 'button'],
        '⏮️': ['last', 'track', 'button'],
        '⏩': ['fast', 'forward', 'button'],
        '⏪': ['fast', 'reverse', 'button'],
        '⏫': ['fast', 'up', 'button'],
        '⏬': ['fast', 'down', 'button'],
        '◀️': ['reverse', 'button', 'triangle'],
        '🔼': ['upwards', 'button', 'triangle'],
        '🔽': ['downwards', 'button', 'triangle'],
        '➡️': ['right', 'arrow', 'direction'],
        '⬅️': ['left', 'arrow', 'direction'],
        '⬆️': ['up', 'arrow', 'direction'],
        '⬇️': ['down', 'arrow', 'direction'],
        '↗️': ['up', 'right', 'arrow'],
        '↘️': ['down', 'right', 'arrow'],
        '↙️': ['down', 'left', 'arrow'],
        '↖️': ['up', 'left', 'arrow'],
        '↕️': ['up', 'down', 'arrow'],
        '↔️': ['left', 'right', 'arrow'],
        '↪️': ['left', 'arrow', 'curving'],
        '↩️': ['right', 'arrow', 'curving'],
        '⤴️': ['right', 'arrow', 'curving', 'up'],
        '⤵️': ['right', 'arrow', 'curving', 'down'],
        '🔀': ['twisted', 'rightwards', 'arrows'],
        '🔁': ['repeat', 'button', 'clockwise'],
        '🔂': ['repeat', 'single', 'button'],
        '🔄': ['counterclockwise', 'arrows', 'button'],
        '🔃': ['clockwise', 'vertical', 'arrows'],
        '➕': ['plus', 'add', 'math', 'cross'],
        '➖': ['minus', 'subtract', 'math'],
        '➗': ['divide', 'division', 'math'],
        '✖️': ['multiply', 'times', 'math'],
        '🟰': ['heavy', 'equals', 'sign'],
        '♾️': ['infinity', 'unlimited', 'forever'],
        '💲': ['heavy', 'dollar', 'sign'],
        '💱': ['currency', 'exchange'],
        '™️': ['trade', 'mark', 'trademark'],
        '©️': ['copyright', 'symbol'],
        '®️': ['registered', 'trademark'],
        '〰️': ['wavy', 'dash'],
        '➰': ['curly', 'loop'],
        '➿': ['double', 'curly', 'loop'],
        '🔚': ['end', 'arrow'],
        '🔙': ['back', 'arrow'],
        '🔛': ['on', 'arrow'],
        '🔝': ['top', 'arrow'],
        '🔜': ['soon', 'arrow'],

        // Flags Comprehensive
        '🏁': ['chequered', 'flag', 'race', 'finish'],
        '🚩': ['triangular', 'flag', 'red'],
        '🎌': ['crossed', 'flags', 'japan'],
        '🏴': ['black', 'flag', 'waving'],
        '🏳️': ['white', 'flag', 'surrender'],
        '🏳️‍🌈': ['rainbow', 'flag', 'pride'],
        '🏳️‍⚧️': ['transgender', 'flag', 'pride'],
        '🏴‍☠️': ['pirate', 'flag', 'jolly', 'roger'],
        '🇺🇸': ['united', 'states', 'america', 'usa'],
        '🇨🇦': ['canada', 'maple', 'leaf'],
        '🇲🇽': ['mexico', 'flag'],
        '🇬🇧': ['united', 'kingdom', 'britain', 'uk'],
        '🇫🇷': ['france', 'french', 'flag'],
        '🇩🇪': ['germany', 'german', 'flag'],
        '🇮🇹': ['italy', 'italian', 'flag'],
        '🇪🇸': ['spain', 'spanish', 'flag'],
        '🇯🇵': ['japan', 'japanese', 'flag'],
        '🇨🇳': ['china', 'chinese', 'flag'],
        '🇰🇷': ['south', 'korea', 'korean'],
        '🇮🇳': ['india', 'indian', 'flag'],
        '🇧🇷': ['brazil', 'brazilian', 'flag'],
        '🇦🇺': ['australia', 'australian', 'flag'],
        '🇷🇺': ['russia', 'russian', 'flag'],
        '🇿🇦': ['south', 'africa', 'african']
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

  const addToCart = (product: Product, _quantity: number = 1, _size?: string) => {
    // Placeholder for potential future e-commerce functionality
    console.log('Product added to cart:', product.name);
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                          <div className="emoji-section-title">😀 Smileys & Emotion</div>
                          <div className="emoji-row">
                            {filterEmojis(['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😈', '👿', '👹', '👺', '🤡', '👻', '💀', '☠️', '👽', '👾', '🤖'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👲', '👳‍♀️', '👳‍♂️', '🧕', '🤱', '👰‍♀️', '👰‍♂️', '🤵‍♀️', '🤵‍♂️', '👸', '🤴', '🦸‍♀️', '🦸‍♂️', '🦹‍♀️', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️', '🧚‍♀️', '🧚‍♂️', '🧛‍♀️', '🧛‍♂️', '🧜‍♀️', '🧜‍♂️', '🧝‍♀️', '🧝‍♂️', '🧞‍♀️', '🧞‍♂️', '🧟‍♀️', '🧟‍♂️', '👻', '👽', '🤖', '👮‍♀️', '👮‍♂️', '🕵️‍♀️', '🕵️‍♂️', '💂‍♀️', '💂‍♂️', '🥷', '👷‍♀️', '👷‍♂️', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '🤶', '🎅', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👨‍👨‍👧', '👨‍👨‍👦', '👨‍👨‍👧‍👦', '👩‍👩‍👧', '👩‍👩‍👦', '👩‍👩‍👧‍👦', '👨‍👧', '👨‍👦', '👨‍👧‍👦', '👩‍👧', '👩‍👦', '👩‍👧‍👦', '🗣️', '👤', '👥', '🫂', '👣'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['💂‍♀️', '💂‍♂️', '🥷', '👷‍♀️', '👷‍♂️', '🤴', '👸', '👩‍⚕️', '👨‍⚕️', '👩‍🌾', '👨‍🌾', '👩‍🍳', '👨‍🍳', '👩‍🎓', '👨‍🎓', '👩‍🎤', '👨‍🎤', '👩‍🏫', '👨‍🏫', '👩‍🏭', '👨‍🏭', '👩‍💻', '👨‍💻', '👩‍💼', '👨‍💼', '👩‍🔧', '👨‍🔧', '👩‍🔬', '👨‍🔬', '👩‍🎨', '👨‍🎨', '👩‍🚒', '👨‍🚒', '👩‍✈️', '👨‍✈️', '👩‍🚀', '👨‍🚀', '👩‍⚖️', '👨‍⚖️', '🤶', '🎅'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👨‍👨‍👧', '👨‍👨‍👦', '👨‍👨‍👧‍👦', '👩‍👩‍👧', '👩‍👩‍👦', '👩‍👩‍👧‍👦', '👨‍👧', '👨‍👦', '👨‍👧‍👦', '👩‍👧', '👩‍👦', '👩‍👧‍👦', '🗣️', '👤', '👥', '🫂', '👣'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫', '💦', '💨'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '🎯', '💡', '🔥', '💧', '🌈', '☀️', '🌙', '⚡', '💫', '💎', '🔮', '💰', '🗝️', '🎭', '🎪'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝', '🍅', '🥕', '🌽', '🌶️', '🍞', '🥖', '🥨', '🧀', '🥓', '🍳', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜', '🍲', '🍱', '🍣', '🍤', '🥟', '🍦', '🍰', '🎂', '🍭', '🍬', '🍫', '🍿', '☕', '🍵', '🥤', '🍺', '🍷', '🥂', '🍾', '🍸'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐝', '🦋', '🐌', '🐛', '🐜', '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛴', '🚁', '✈️', '🚀', '🛸', '🚢', '⛵', '🏠', '🏡', '🏢', '🏬', '🏭', '🏰', '🗼', '🌉', '🎡', '🎢', '🎠', '⛱️', '🏖️', '🏝️'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['💼', '👔', '👗', '👠', '👓', '🎓', '📚', '📖', '📝', '✏️', '📌', '📎', '📋', '📊', '📈', '📉', '💰', '💵', '💳', '💎', '⚖️', '🔧', '⚙️', '🔨'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['🎮', '🕹️', '🎲', '🃏', '🎯', '🎪', '🎨', '🎭', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌚', '📷', '📺', '🎬', '🎞️', '📽️', '🎸', '🥁', '🎹', '🎺'], searchQuery).map((emoji, index) => (
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
                            {filterEmojis(['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♂️'], searchQuery).map((emoji, index) => (
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

                        {/* New comprehensive emoji sections */}
                        <div className="emoji-section">
                          <div className="emoji-section-title">🌍 Nature & Weather</div>
                          <div className="emoji-row">
                            {filterEmojis(['🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🌤️ Weather & Sky</div>
                          <div className="emoji-row">
                            {filterEmojis(['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '🌙', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌝', '🌞', '🪐', '⭐', '🌟', '💫', '✨', '🌠', '🌌', '☄️', '💥', '🔥', '🌊'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🍎 Food & Fruits</div>
                          <div className="emoji-row">
                            {filterEmojis(['🍎', '🍏', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🍜 Meals & Drinks</div>
                          <div className="emoji-row">
                            {filterEmojis(['🥪', '🌮', '🌯', '🫔', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🫕', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🐙', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">☕ Beverages</div>
                          <div className="emoji-row">
                            {filterEmojis(['☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥛', '🧊', '🫖', '🍼'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🦁 Animals</div>
                          <div className="emoji-row">
                            {filterEmojis(['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦣', '🦏', '🦛', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦔'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">💎 Objects & Symbols</div>
                          <div className="emoji-row">
                            {filterEmojis(['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪓', '🪚', '🔩', '⚙️', '🪤', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🎯 Activities & Hobbies</div>
                          <div className="emoji-row">
                            {filterEmojis(['🎯', '🪀', '🪁', '🎱', '🔮', '🪩', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🚗 Transportation</div>
                          <div className="emoji-row">
                            {filterEmojis(['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚉', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚟', '🚠', '🚡', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">⚽ Sports & Games</div>
                          <div className="emoji-row">
                            {filterEmojis(['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🎵 Music & Arts</div>
                          <div className="emoji-row">
                            {filterEmojis(['🎵', '🎶', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '🪗', '🪈', '🎤', '🎧', '📻', '🎙️', '🎚️', '🎛️', '🎭', '🎨', '🖌️', '🖍️', '✏️', '✒️', '🖋️', '🖊️', '✂️', '📐', '📏', '📌', '📍', '🧷', '🔗', '📎', '🖇️'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">📚 Books & Office</div>
                          <div className="emoji-row">
                            {filterEmojis(['📚', '📖', '📗', '📘', '📙', '📕', '📓', '📔', '📒', '📝', '📄', '📃', '📑', '📜', '📰', '🗞️', '🔖', '🏷️', '💰', '🪙', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '📈', '📉', '📊', '📋', '🗃️', '🗄️', '🗑️'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🔣 Symbols & Numbers</div>
                          <div className="emoji-row">
                            {filterEmojis(['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '➕', '➖', '➗', '✖️', '🟰', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜'], searchQuery).map((emoji, index) => (
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
                          <div className="emoji-section-title">🏁 Flags</div>
                          <div className="emoji-row">
                            {filterEmojis(['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇨🇦', '🇲🇽', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇯🇵', '🇨🇳', '🇰🇷', '🇮🇳', '🇧🇷', '🇦🇺', '🇷🇺', '🇿🇦', '🇪🇬', '🇳🇬', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪', '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇵🇱', '🇺🇦', '🇷🇴', '🇬🇷', '🇹🇷', '🇮🇱', '🇸🇦', '🇦🇪', '🇮🇷', '🇮🇶', '🇵🇰', '🇧🇩', '🇹🇭', '🇻🇳', '🇲🇾', '🇸🇬', '🇮🇩', '🇵🇭', '🇳🇿'], searchQuery).map((emoji, index) => (
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
            <div className="panel-header">
              <h3>🛒 {shopifyStore?.connected && shopifyStore?.shop ? shopifyStore.shop : 'E-commerce Store'}</h3>
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
