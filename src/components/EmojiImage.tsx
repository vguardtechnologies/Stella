import React, { useState } from 'react';
import { getEmojiImageUrl } from '../utils/emojiMapping';

interface EmojiImageProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  fallbackToText?: boolean;
}

const EmojiImage: React.FC<EmojiImageProps> = ({
  emoji,
  size = 18,
  className = '',
  style = {},
  fallbackToText = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const emojiImageUrl = getEmojiImageUrl(emoji);

  // If no vector image available or image failed to load, fallback to text
  if (!emojiImageUrl || imageError) {
    return fallbackToText ? (
      <span 
        className={className}
        style={{ 
          fontSize: `${size}px`, 
          lineHeight: '1',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style 
        }}
      >
        {emoji}
      </span>
    ) : null;
  }

  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        ...style
      }}
    >
      {isLoading && fallbackToText && (
        <span 
          style={{ 
            fontSize: `${size * 0.8}px`, 
            position: 'absolute',
            opacity: 0.5
          }}
        >
          {emoji}
        </span>
      )}
      <img
        src={emojiImageUrl}
        alt={emoji}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          display: isLoading ? 'none' : 'block'
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setImageError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
};

export default EmojiImage;
