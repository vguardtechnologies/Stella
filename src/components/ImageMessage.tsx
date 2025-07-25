import React, { useState } from 'react';

interface ImageMessageProps {
  message: {
    id: string;
    text?: string;
    media_url?: string;
    media_file_id?: string;
    timestamp: Date;
  };
  API_BASE: string;
  formatTime: (date: Date) => string;
}

const ImageMessage: React.FC<ImageMessageProps> = ({
  message,
  API_BASE,
  formatTime
}) => {
  const [showModal, setShowModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getImageUrl = () => {
    // Use local media storage if available, fallback to proxy
    if (message.media_file_id) {
      return `${API_BASE}/api/media/media/${message.media_file_id}`;
    } else if (message.media_url) {
      return `${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`;
    }
    return null;
  };

  const getThumbnailUrl = () => {
    // Only available for locally stored media
    if (message.media_file_id) {
      return `${API_BASE}/api/media/thumbnail/${message.media_file_id}/medium`;
    }
    return getImageUrl(); // Fallback to full image
  };

  const imageUrl = getImageUrl();
  const thumbnailUrl = getThumbnailUrl();

  if (!imageUrl) {
    return (
      <div style={{ 
        padding: '16px', 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: '12px', 
        color: 'rgba(255,255,255,0.7)', 
        fontSize: '13px',
        textAlign: 'center',
        maxWidth: '320px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
        <div>Image content unavailable</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        maxWidth: '320px',
        width: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        cursor: 'pointer'
      }}
      onClick={() => setShowModal(true)}
      >
        {/* Image Container */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '200px',
          background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {!imageLoaded && !imageError && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
              <div>Loading...</div>
            </div>
          )}

          {imageError && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
              <div>Failed to load image</div>
            </div>
          )}

          <img
            src={thumbnailUrl || ''}
            alt="Image message"
            style={{
              width: '100%',
              height: 'auto',
              display: imageLoaded ? 'block' : 'none',
              borderRadius: '12px'
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />

          {/* Click indicator */}
          {imageLoaded && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: '16px',
              padding: '4px 8px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)'
            }}>
              Click to expand
            </div>
          )}

          {/* Caption overlay */}
          {message.text && (
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              color: 'white',
              padding: '20px 12px 12px',
              fontSize: '13px',
              lineHeight: '1.4',
              fontWeight: '400'
            }}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Full Size Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowModal(false)}
        >
          {/* Modal Content */}
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.7)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}
            >
              ×
            </button>

            {/* Full Size Image */}
            <img
              src={imageUrl}
              alt="Full size image"
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />

            {/* Caption in Modal */}
            {message.text && (
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                color: 'white',
                padding: '30px 20px 20px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageMessage;
