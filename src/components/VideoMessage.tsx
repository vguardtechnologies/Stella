import React, { useState } from 'react';

interface VideoMessageProps {
  message: {
    id: string;
    text?: string;
    media_url?: string;
    media_file_id?: string;
    videoUrl?: string;
    timestamp: Date;
  };
  whatsappConfigured: boolean;
  API_BASE: string;
  setMessages: (updater: (prev: any[]) => any[]) => void;
  formatTime: (date: Date) => string;
  onVideoAction?: () => void;
}

const VideoMessage: React.FC<VideoMessageProps> = ({
  message,
  API_BASE,
  onVideoAction
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  const handlePlayClick = async () => {
    // Disable auto-scroll when user interacts with video
    if (onVideoAction) onVideoAction();
    
    if (!modalVideoUrl) {
      console.log('🎬 Loading video for modal player');
      try {
        let videoUrl: string;
        
        // Check if we have a local media file ID (new system)
        if (message.media_file_id) {
          videoUrl = `${API_BASE}/api/media/media/${message.media_file_id}`;
          console.log('Using local media storage URL:', videoUrl);
        } else if (message.media_url) {
          // Fallback to proxy URL (old system)
          videoUrl = `${API_BASE}/api/whatsapp/media-proxy/${message.media_url}`;
          console.log('Using proxy URL fallback:', videoUrl);
        } else {
          throw new Error('No video URL available');
        }
        
        setModalVideoUrl(videoUrl);
        setShowModal(true);
        
        console.log('✅ Video modal opened');
      } catch (error) {
        console.error('Video load error:', error);
        alert('Error loading video: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } else {
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (!message.media_url && !message.media_file_id) {
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
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📹</div>
        <div>Video content unavailable</div>
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
        maxWidth: '450px',
        minWidth: '320px',
        width: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        {/* Video Thumbnail with Play Button */}
        <div 
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            background: 'linear-gradient(135deg, #2a2a2a, #1a1a1a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundImage: message.media_file_id 
              ? `url(${API_BASE}/api/media/thumbnail/${message.media_file_id}/medium)` 
              : message.media_url
                ? `url(${API_BASE}/api/whatsapp/media-proxy/${message.media_url})`
                : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          onClick={handlePlayClick}
        >
          {/* Video Placeholder (only show if no thumbnail) */}
          {!message.media_file_id && !message.media_url && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.8)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📹</div>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Video Message</div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>Click to play</div>
            </div>
          )}
          
          {/* Play Button Overlay */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.7)';
            e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
          }}
          >
            <div style={{
              width: '0',
              height: '0',
              borderLeft: '20px solid rgba(255,255,255,0.9)',
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              marginLeft: '4px'
            }} />
          </div>
          
          {/* Caption overlay for thumbnail */}
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

      {/* Chat-Scoped Modal Player */}
      {showModal && modalVideoUrl && (
        <div 
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(10px)'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking video
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'rgba(0,0,0,0.7)',
                border: 'none',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2001,
                backdropFilter: 'blur(10px)'
              }}
            >
              ×
            </button>
            
            {/* Modal Video Player */}
            <video 
              controls 
              autoPlay
              style={{ 
                width: '100%',
                height: 'auto',
                maxHeight: '90vh',
                borderRadius: '12px'
              }}
              onError={() => {
                console.log('🎬 Modal video error, closing modal');
                closeModal();
              }}
            >
              <source src={modalVideoUrl} type="video/mp4" />
              Your browser does not support the video element.
            </video>
            
            {/* Modal Caption */}
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
                lineHeight: '1.4'
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

export default VideoMessage;
