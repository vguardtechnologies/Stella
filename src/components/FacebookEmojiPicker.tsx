import { useState, useMemo } from 'react';

interface FacebookEmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
}

// Facebook-style emoji categories with expanded popular emojis
const emojiCategories = {
  reactions: {
    name: 'Reactions',
    icon: '👍',
    emojis: ['👍', '👎', '❤️', '😍', '😂', '😮', '😢', '😡', '👏', '🎉', '🔥', '💯', '✨', '💪', '🙏', '🤩', '🥰', '😘', '🤗', '👌', '🫶', '🤌', '🤝', '🫡', '🤟']
  },
  hearts: {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💗',
      '💓', '💕', '💖', '💘', '💝', '💟', '♥️', '💔', '❣️', '💋',
      '🫶', '💐', '🌹', '🌺', '🌷', '🌸', '💒', '💍', '💎', '🎀',
      '🫧', '✨', '💫', '⭐', '🌟', '💖', '💗', '💓', '💞', '💕'
    ]
  },
  faces: {
    name: 'Faces',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '🫠', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚',
      '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
      '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '🫥', '�‍🌫️', '�😏',
      '😒', '🙄', '😬', '😮‍💨', '🤥', '😔', '😪', '🤤', '😴', '😷',
      '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫',
      '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁',
      '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰',
      '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫'
    ]
  },
  dancing: {
    name: 'Dancing',
    icon: '💃',
    emojis: [
      '💃', '🕺', '👯', '👯‍♀️', '👯‍♂️', '🕴️', '🤸', '🤸‍♀️', '🤸‍♂️',
      '🤾', '🤾‍♀️', '🤾‍♂️', '🏃', '🏃‍♀️', '🏃‍♂️', '🚶', '🚶‍♀️', '🚶‍♂️',
      '🧘', '🧘‍♀️', '🧘‍♂️', '🤹', '🤹‍♀️', '🤹‍♂️', '🎭', '🎪', '🎨',
      '🎤', '🎧', '🎼', '🎵', '🎶', '🎸', '🥁', '🎺', '🎷', '🎹',
      '🎻', '🪕', '🎯', '🎳', '🎮', '🕹️', '🎰', '🎲', '🧩', '🃏',
      '🀄', '🎴', '🎊', '🎉', '🎈', '🎁', '🎀', '🏆', '🥇', '🥈'
    ]
  },
  gestures: {
    name: 'Gestures',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌',
      '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '👊', '✊', '🤛',
      '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
      '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠'
    ]
  },
  objects: {
    name: 'Objects',
    icon: '💎',
    emojis: [
      '💎', '💍', '👑', '🎁', '🎈', '🎉', '🎊', '🎀', '🏆', '🥇',
      '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱',
      '🔥', '💯', '💢', '💦', '💨', '⭐', '🌟', '✨', '⚡', '☄️',
      '🎯', '🎪', '🎨', '🎭', '🎮', '🕹️', '🎰', '🎲', '🧩', '🃏',
      '🀄', '🎴', '🎻', '🎺', '🎷', '🎸', '🥁', '🎹', '🎤', '🎧',
      '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿'
    ]
  }
};

const FacebookEmojiPicker: React.FC<FacebookEmojiPickerProps> = ({
  onEmojiSelect,
  isOpen,
  onClose,
  position = { top: 0, left: 0 }
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof emojiCategories>('reactions');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmojis = useMemo(() => {
    let emojis = emojiCategories[activeCategory].emojis;
    
    if (searchTerm) {
      // For search, look through all categories
      const allEmojis = Object.values(emojiCategories).flatMap(cat => cat.emojis);
      emojis = allEmojis.filter(emoji => 
        emoji.includes(searchTerm)
      );
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
          top: Math.min(position.top, window.innerHeight - 420),
          left: Math.min(position.left, window.innerWidth - 300),
          width: '300px',
          height: '400px',
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
        {!searchTerm && (
          <div style={{
            display: 'flex',
            padding: '8px 12px 16px 12px',
            gap: '4px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            overflowX: 'auto'
          }}>
            {Object.entries(emojiCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key as keyof typeof emojiCategories)}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: '6px',
                  background: activeCategory === key ? 'rgba(24, 119, 242, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: activeCategory === key ? '#1877f2' : '#666',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                title={category.name}
              >
                {category.icon}
              </button>
            ))}
          </div>
        )}

        {/* Emoji Grid */}
        <div
          style={{
            height: '240px',
            padding: '12px',
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px'
          }}
        >
          {filteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => {
                onEmojiSelect(emoji);
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
                fontSize: '20px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(24, 119, 242, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
              title={emoji}
            >
              {emoji}
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
          {searchTerm ? `${filteredEmojis.length} found` : `${filteredEmojis.length} ${emojiCategories[activeCategory].name.toLowerCase()}`}
        </div>
      </div>
    </>
  );
};

export default FacebookEmojiPicker;
