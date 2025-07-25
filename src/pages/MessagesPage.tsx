import React from 'react';
import MessagesDashboard from '../components/MessagesDashboard';

interface MessagesPageProps {
  onClose?: () => void;
}

const MessagesPage: React.FC<MessagesPageProps> = ({ onClose }) => {
  return (
    <div className="messages-page">
      {onClose && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <button 
            onClick={onClose}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✖ Close
          </button>
        </div>
      )}
      <MessagesDashboard />
    </div>
  );
};

export default MessagesPage;
