import { useState } from 'react';
import VectorEmojiPicker from './components/VectorEmojiPicker';
import { getAllEmojis } from './utils/emojiMapping';

function EmojiDebugTest() {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  
  const allEmojis = getAllEmojis();
  
  console.log('Total emojis available:', allEmojis.length);
  console.log('First 5 emojis:', allEmojis.slice(0, 5));
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Emoji Picker Debug Test</h1>
      <p>Total emojis in mapping: {allEmojis.length}</p>
      <p>Selected: {selectedEmoji}</p>
      
      <button 
        onClick={() => setShowPicker(!showPicker)}
        style={{ 
          padding: '10px 20px', 
          background: '#25d366', 
          color: 'white', 
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer' 
        }}
      >
        {showPicker ? 'Close' : 'Open'} Emoji Picker
      </button>
      
      {showPicker && (
        <VectorEmojiPicker
          isOpen={showPicker}
          onClose={() => setShowPicker(false)}
          onEmojiSelect={(emoji) => {
            setSelectedEmoji(emoji);
            setShowPicker(false);
          }}
          position={{ top: 60, left: 20 }}
        />
      )}
      
      <div style={{ marginTop: '20px' }}>
        <h3>Sample Emojis from Mapping:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px' }}>
          {allEmojis.slice(0, 20).map((emoji, index) => (
            <div key={index} style={{ textAlign: 'center', fontSize: '12px' }}>
              <img 
                src={`/assets/emojis/vector-emojis/64px/No Outline/${emoji.filename}`}
                alt={emoji.name}
                style={{ width: '32px', height: '32px', display: 'block' }}
                onError={(e) => {
                  console.error('Image load error for:', emoji.filename);
                  e.currentTarget.style.border = '2px solid red';
                }}
                onLoad={() => {
                  console.log('Image loaded:', emoji.filename);
                }}
              />
              <div>{emoji.unicode}</div>
              <div>{emoji.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmojiDebugTest;
