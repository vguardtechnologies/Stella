import React, { useState, useMemo } from 'react';
import EmojiImage from './EmojiImage';
import { 
  getAllEmojis, 
  getEmojisByCategory,
  type EmojiMapping 
} from '../utils/emojiMapping';

interface VectorEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

const VectorEmojiPicker: React.FC<VectorEmojiPickerProps> = ({
  onEmojiSelect,
  isOpen,
  onClose,
  position = { top: 0, left: 0 }
}) => {
  const [activeCategory, setActiveCategory] = useState<EmojiMapping['category'] | null>(null); // null means show all
  const [searchTerm, setSearchTerm] = useState('');

  const categories: { key: EmojiMapping['category'] | null; label: string; icon: string }[] = [
    { key: null, label: 'All', icon: '🌟' },
    { key: 'reactions', label: 'Reactions', icon: '👍' },
    { key: 'faces', label: 'Faces', icon: '😊' },
    { key: 'gestures', label: 'Gestures', icon: '👋' },
    { key: 'objects', label: 'Objects', icon: '🔥' },
    { key: 'other', label: 'Other', icon: '🎯' }
  ];

  const filteredEmojis = useMemo(() => {
    let emojis = activeCategory ? getEmojisByCategory(activeCategory) : getAllEmojis();
    
    // Debug logging
    console.log('🐛 VectorEmojiPicker Debug:');
    console.log('- Active category:', activeCategory || 'All');
    console.log('- Total emojis from getAllEmojis():', getAllEmojis().length);
    console.log('- Emojis for category:', emojis.length);
    console.log('- First 5 emojis:', emojis.slice(0, 5));
    
    if (searchTerm) {
      emojis = emojis.filter(emoji => 
        emoji.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emoji.unicode.includes(searchTerm)
      );
      console.log('- After search filter:', emojis.length);
    }
    
    return emojis;
  }, [activeCategory, searchTerm]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          zIndex: 998
        }}
        onClick={onClose}
      />
      
      {/* Picker Container */}
      <div
        style={{
          position: 'fixed',
          top: Math.min(position.top, window.innerHeight - 450), // Increased from 400
          left: Math.min(position.left, window.innerWidth - 320),
          width: '320px',
          maxHeight: '430px', // Increased from 380px
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header with Search */}
        <div style={{ 
          padding: '12px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{
          display: 'flex',
          padding: '8px 12px',
          gap: '4px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          overflowX: 'auto'
        }}>
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              style={{
                padding: '6px 10px',
                border: 'none',
                borderRadius: '6px',
                background: activeCategory === category.key ? 'rgba(37, 211, 102, 0.1)' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: activeCategory === category.key ? '#25d366' : '#666',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              title={category.label}
            >
              {category.icon}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div
          style={{
            flex: 1,
            padding: '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
            maxHeight: '320px', // Increased from 240px
            minHeight: '200px'
          }}
        >
          {filteredEmojis.map((emoji) => (
            <button
              key={emoji.unicode + emoji.filename}
              onClick={() => {
                onEmojiSelect(emoji.unicode);
                onClose();
              }}
              style={{
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '6px',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(37, 211, 102, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title={emoji.name}
            >
              <EmojiImage
                emoji={emoji.unicode}
                size={24}
                fallbackToText={true}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '11px',
          color: '#999',
          textAlign: 'center'
        }}>
          {filteredEmojis.length} emojis available {activeCategory ? `(${activeCategory})` : '(all)'}
        </div>
      </div>
    </>
  );
};

export default VectorEmojiPicker;
