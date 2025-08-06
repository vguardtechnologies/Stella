import React, { useState } from 'react';

interface Product {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  images: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
    available: boolean;
  }>;
  options: Array<{
    id: number;
    name: string;
    values: string[];
  }>;
}

interface ProductModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
  shopifyStore?: {
    domain: string;
  };
}

const ProductModal: React.FC<ProductModalProps> = ({ 
  isOpen, 
  product, 
  onClose, 
  onAddToCart,
  shopifyStore 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

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

  const variants = product.variants || [];
  const availableVariants = variants.filter((v: any) => (v.inventory_quantity || 0) > 0);
  const isAvailable = availableVariants.length > 0;
  
  const prices = variants.map((v: any) => parseFloat(v.price || '0')).filter((p: number) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const priceRange = minPrice === maxPrice ? `$${minPrice.toFixed(2)}` : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;

  const productImages = product.images || [];
  const hasMultipleImages = productImages.length > 1;

  const handleAddToCart = () => {
    if (onAddToCart && isAvailable) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div 
      className="product-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div 
        className="product-modal-content"
        style={{
          position: 'relative',
          maxWidth: '800px',
          maxHeight: '90vh',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
            transition: 'background-color 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)';
          }}
        >
          ×
        </button>

        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth > 768 ? 'row' : 'column',
          height: '100%'
        }}>
          {/* Product Images Section */}
          <div style={{ 
            flex: window.innerWidth > 768 ? '1' : 'none',
            position: 'relative',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ position: 'relative', height: window.innerWidth > 768 ? '100%' : '300px' }}>
              <img 
                src={productImages[currentImageIndex]?.src || 'https://via.placeholder.com/400x400/f0f0f0/666?text=No+Image'} 
                alt={`${product.title} - Image ${currentImageIndex + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (productImages[currentImageIndex]?.src) {
                    window.open(productImages[currentImageIndex].src, '_blank');
                  }
                }}
              />
              
              {/* Navigation Arrows - Only show if multiple images */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(currentImageIndex === 0 ? productImages.length - 1 : currentImageIndex - 1);
                    }}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      color: 'white',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                      zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(currentImageIndex === productImages.length - 1 ? 0 : currentImageIndex + 1);
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      color: 'white',
                      fontSize: '18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s ease',
                      zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)';
                    }}
                  >
                    ›
                  </button>
                </>
              )}
              
              {/* Image Counter */}
              {hasMultipleImages && (
                <div style={{
                  position: 'absolute',
                  bottom: '15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {currentImageIndex + 1} of {productImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {hasMultipleImages && (
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '15px',
                overflowX: 'auto',
                backgroundColor: 'white'
              }}>
                {productImages.map((image: any, index: number) => (
                  <img
                    key={index}
                    src={image.src}
                    alt={`${product.title} thumbnail ${index + 1}`}
                    onClick={() => setCurrentImageIndex(index)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      border: index === currentImageIndex ? '2px solid #2196F3' : '2px solid transparent',
                      transition: 'border-color 0.2s',
                      flexShrink: 0
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div style={{ 
            flex: window.innerWidth > 768 ? '1' : 'none',
            padding: '20px',
            overflowY: 'auto',
            backgroundColor: 'white'
          }}>
            {/* Availability Badge */}
            <div style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '15px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: isAvailable ? '#4CAF50' : '#f44336',
              color: 'white',
              marginBottom: '12px'
            }}>
              {isAvailable ? '✓ IN STOCK' : '✗ SOLD OUT'}
            </div>

            {/* Product Title */}
            <h2 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '24px', 
              fontWeight: 'bold',
              color: '#333',
              lineHeight: '1.3'
            }}>
              {product.title}
            </h2>

            {/* Vendor */}
            {product.vendor && (
              <p style={{
                margin: '0 0 12px 0',
                color: '#666',
                fontSize: '14px'
              }}>
                by <strong>{product.vendor}</strong>
              </p>
            )}

            {/* Price */}
            <div style={{ 
              margin: '0 0 16px 0', 
              fontSize: '28px', 
              fontWeight: 'bold',
              color: '#2196F3'
            }}>
              {priceRange}
            </div>

            {/* Product Description */}
            {product.body_html && (
              <div style={{
                margin: '0 0 20px 0',
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#555',
                maxHeight: '120px',
                overflowY: 'auto',
                border: '1px solid #eee',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#fafafa'
              }}>
                <div dangerouslySetInnerHTML={{ __html: product.body_html }} />
              </div>
            )}

            {/* Product Type */}
            {product.product_type && (
              <div style={{
                margin: '0 0 16px 0',
                padding: '8px 12px',
                backgroundColor: '#f0f4f8',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#555'
              }}>
                <strong>Category:</strong> {product.product_type}
              </div>
            )}

            {/* Quantity Selector */}
            <div style={{ 
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Quantity:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  -
                </button>
                <span style={{ padding: '8px 16px', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  backgroundColor: isAvailable ? '#4CAF50' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  transition: 'background-color 0.2s',
                  fontWeight: 'bold'
                }}
              >
                {isAvailable ? `🛒 Add ${quantity} to Cart` : '❌ Currently Unavailable'}
              </button>
              
              <a
                href={shopifyStore?.domain ? `https://${shopifyStore.domain}/products/${product.handle}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  textDecoration: 'none',
                  textAlign: 'center',
                  display: 'block'
                }}
              >
                🔗 View on Store
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
