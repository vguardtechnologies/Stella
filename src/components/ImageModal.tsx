import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, caption, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="image-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div 
        className="image-modal-content"
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-40px',
            right: '0',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
            zIndex: 1001,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Close (ESC)"
        >
          ×
        </button>

        {/* Image */}
        <img
          src={imageUrl}
          alt="Full size image"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        />

        {/* Caption */}
        {caption && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              color: '#333',
              fontSize: '14px',
              maxWidth: '80%',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
            }}
          >
            {caption}
          </div>
        )}

        {/* Download button */}
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'image';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '6px',
            color: '#333',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📥 Download
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
