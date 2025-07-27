import React from 'react';
import './ActionBar.css';

interface ActionBarProps {
  onHomeClick?: () => void;
  onWhatsAppClick?: () => void;
  onOtpClick?: () => void;
  onOcClick?: () => void;
  onChatClick?: () => void;
  onContactsClick?: () => void;
  onLoginClick?: () => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  onHomeClick, 
  onWhatsAppClick,
  onOtpClick, 
  onOcClick, 
  onChatClick,
  onContactsClick,
  onLoginClick 
}) => {
  return (
    <div className="action-bar">
      <button 
        className="action-button home-button" 
        onClick={onHomeClick}
        title="Home"
      >
        <img 
          src="/assets/icons/Home 3D Fluency.png" 
          alt="Home" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      {/* Additional action buttons can be added here */}
      <div className="action-divider"></div>
      
      <button 
        className="action-button whatsapp-button" 
        title="WhatsApp"
        onClick={onWhatsAppClick || (() => window.open('https://wa.me/', '_blank'))}
      >
        <img 
          src="/assets/icons/WhatsApp 3D Fluency.png" 
          alt="WhatsApp" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button 
        className="action-button otp-button" 
        title="Opt-In/Opt-Out"
        onClick={onOtpClick || (() => console.log('Opt-In/Opt-Out functionality'))}
      >
        <img 
          src="/assets/icons/Check Mark 3D Fluency.png" 
          alt="Opt-In/Out" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button 
        className="action-button oc-button" 
        title="Order Confirmation"
        onClick={onOcClick || (() => console.log('Order Confirmation functionality'))}
      >
        <img 
          src="/assets/icons/Purchase Order Isometric Color.png" 
          alt="Order Confirmation" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button 
        className="action-button chat-button" 
        title="Chat"
        onClick={onChatClick || (() => console.log('Chat functionality'))}
      >
        <img 
          src="/assets/icons/Speech Bubble 3D Fluency.png" 
          alt="Chat" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button 
        className="action-button contacts-button" 
        title="Contacts & Customer Profiles"
        onClick={onContactsClick || (() => console.log('Contacts functionality'))}
      >
        <span style={{ fontSize: '20px', fontWeight: 'bold' }}>📇</span>
      </button>
      
      <div className="action-divider"></div>
      
      <button 
        className="action-button login-button" 
        title="Login / Sign Up"
        onClick={onLoginClick || (() => console.log('Login functionality'))}
      >
        <img 
          src="/assets/icons/Padlock 3D Fluency.png" 
          alt="Login" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button className="action-button" title="Menu">
        <img 
          src="/assets/icons/Bulleted List Isometric Color.png" 
          alt="Menu" 
          width="24" 
          height="24"
          style={{ objectFit: 'contain' }}
        />
      </button>
      
      <button className="action-button" title="Settings">
        ⚙️
      </button>
    </div>
  );
};

export default ActionBar;
