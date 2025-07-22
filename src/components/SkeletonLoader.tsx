import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'avatar' | 'button';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  lines = 1,
  animation = 'pulse',
  className = ''
}) => {
  const getSkeletonStyle = () => {
    const style: React.CSSProperties = {};
    
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    
    return style;
  };

  const renderSkeleton = () => {
    if (variant === 'text' && lines > 1) {
      return (
        <div className="skeleton-text-block">
          {Array.from({ length: lines }, (_, index) => (
            <div
              key={index}
              className={`skeleton skeleton-text ${animation} ${className}`}
              style={{
                ...getSkeletonStyle(),
                width: index === lines - 1 ? '60%' : '100%'
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        className={`skeleton skeleton-${variant} ${animation} ${className}`}
        style={getSkeletonStyle()}
      />
    );
  };

  return renderSkeleton();
};

// Pre-built skeleton components for common use cases
export const MessageSkeleton: React.FC = () => (
  <div className="message-skeleton">
    <div className="message-skeleton-avatar">
      <SkeletonLoader variant="circular" width={40} height={40} />
    </div>
    <div className="message-skeleton-content">
      <SkeletonLoader variant="text" width="100%" lines={2} />
      <SkeletonLoader variant="text" width="40%" />
    </div>
  </div>
);

export const ConversationSkeleton: React.FC = () => (
  <div className="conversation-skeleton">
    <SkeletonLoader variant="circular" width={48} height={48} />
    <div className="conversation-skeleton-info">
      <SkeletonLoader variant="text" width="70%" height={16} />
      <SkeletonLoader variant="text" width="90%" height={14} />
      <SkeletonLoader variant="text" width="30%" height={12} />
    </div>
  </div>
);

export const ChatHeaderSkeleton: React.FC = () => (
  <div className="chat-header-skeleton">
    <SkeletonLoader variant="circular" width={40} height={40} />
    <div className="chat-header-skeleton-info">
      <SkeletonLoader variant="text" width="120px" height={16} />
      <SkeletonLoader variant="text" width="80px" height={12} />
    </div>
    <div className="chat-header-skeleton-actions">
      <SkeletonLoader variant="circular" width={32} height={32} />
      <SkeletonLoader variant="circular" width={32} height={32} />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="product-card-skeleton">
    <SkeletonLoader variant="rectangular" width="100%" height={200} />
    <div className="product-card-skeleton-content">
      <SkeletonLoader variant="text" width="80%" height={18} />
      <SkeletonLoader variant="text" width="100%" lines={2} />
      <SkeletonLoader variant="text" width="40%" height={16} />
      <SkeletonLoader variant="button" width="100%" height={36} />
    </div>
  </div>
);

export const OrderSkeleton: React.FC = () => (
  <div className="order-skeleton">
    <div className="order-skeleton-header">
      <SkeletonLoader variant="text" width="100px" height={16} />
      <SkeletonLoader variant="text" width="60px" height={14} />
    </div>
    <div className="order-skeleton-customer">
      <SkeletonLoader variant="text" width="150px" height={16} />
      <SkeletonLoader variant="text" width="120px" height={14} />
    </div>
    <div className="order-skeleton-items">
      <SkeletonLoader variant="text" width="200px" height={14} />
      <SkeletonLoader variant="text" width="80px" height={16} />
    </div>
  </div>
);

export const TemplateSkeleton: React.FC = () => (
  <div className="template-skeleton">
    <div className="template-skeleton-header">
      <SkeletonLoader variant="text" width="120px" height={16} />
      <SkeletonLoader variant="rectangular" width={60} height={20} />
    </div>
    <SkeletonLoader variant="text" width="100%" lines={3} />
    <div className="template-skeleton-footer">
      <SkeletonLoader variant="text" width="80px" height={12} />
      <SkeletonLoader variant="button" width={60} height={24} />
    </div>
  </div>
);

export default SkeletonLoader;
