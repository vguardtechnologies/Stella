import React from 'react';
import './GlassComponents.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  hover?: boolean;
  glow?: 'rose' | 'purple' | 'pink';
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  size = 'medium',
  hover = true,
  glow 
}) => {
  const sizeClass = {
    small: 'glass-card-small',
    medium: 'glass-card',
    large: 'glass-card-large'
  }[size];

  const hoverClass = hover ? 'glass-hover' : '';
  const glowClass = glow ? `glow-${glow}` : '';

  return (
    <div className={`${sizeClass} ${hoverClass} ${glowClass} ${className}`}>
      {children}
    </div>
  );
};

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = {
    small: 'btn-sm',
    medium: 'btn-md',
    large: 'btn-lg'
  }[size];

  return (
    <button
      className={`glass-btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  placeholder,
  value,
  onChange,
  type = 'text',
  className = '',
  disabled = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`glass-input ${className}`}
    />
  );
};

interface GlassModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  children,
  isOpen,
  onClose,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-content" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="glass-modal-header">
            <h2>{title}</h2>
            <button className="glass-modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
        )}
        <div className="glass-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
