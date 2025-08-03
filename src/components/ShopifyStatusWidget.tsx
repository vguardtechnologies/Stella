import React, { useState, useEffect } from 'react';
import { useShopify, shopifyService } from '../services/shopifyService';

// Example component showing how to access Shopify data from anywhere in the app
const ShopifyStatusWidget: React.FC = () => {
  const { store, isConnected } = useShopify();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadShopifyData();
    }
  }, [isConnected]);

  const loadShopifyData = async () => {
    setLoading(true);
    try {
      // Example: Load products and orders
      const [productsResponse, ordersResponse] = await Promise.all([
        shopifyService.getProducts(5), // Get first 5 products
        shopifyService.getOrders(5)    // Get first 5 orders
      ]);
      
      setProducts(productsResponse.products || []);
      setOrders(ordersResponse.orders || []);
    } catch (error) {
      console.error('Error loading Shopify data:', error);
      // Handle demo mode or connection errors gracefully
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div style={{
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        margin: '1rem 0'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
          🛒 Shopify Integration
        </h4>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>
          Connect your Shopify store to access products and orders
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '1rem',
      background: '#f8fff8',
      borderRadius: '8px',
      border: '1px solid #95bf47',
      margin: '1rem 0'
    }}>
      <h4 style={{ margin: '0 0 0.5rem 0', color: '#659624' }}>
        ✅ {store?.name} Connected
      </h4>
      <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.9rem' }}>
        {store?.domain}
      </p>

      {loading ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>Loading Shopify data...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              📦 Products ({products.length})
            </h5>
            {products.slice(0, 3).map((product: any) => (
              <div key={product.id} style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginBottom: '0.25rem' 
              }}>
                • {product.title}
              </div>
            ))}
          </div>
          
          <div>
            <h5 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              📋 Orders ({orders.length})
            </h5>
            {orders.slice(0, 3).map((order: any) => (
              <div key={order.id} style={{ 
                fontSize: '0.8rem', 
                color: '#666', 
                marginBottom: '0.25rem' 
              }}>
                • #{order.order_number} - ${order.total_price}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyStatusWidget;
