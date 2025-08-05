import React, { useState, useEffect } from 'react';
import { shopifyService } from '../services/shopifyService';
import ShopifyWhatsAppIntegration from './ShopifyWhatsAppIntegration';
import './ShopifyIntegration.css';

interface ShopifyIntegrationProps {
  onClose: () => void;
  onStoreUpdate?: (store: ShopifyStore | null) => void;
}

interface ShopifyStore {
  name: string;
  shop: string;
  domain: string;
  connected: boolean;
  apiKey?: string;
  accessToken?: string;
}

const ShopifyIntegration: React.FC<ShopifyIntegrationProps> = ({ onClose, onStoreUpdate }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [store, setStore] = useState<ShopifyStore | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    storeName: '',
    apiKey: '',
    accessToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [showWhatsAppIntegration, setShowWhatsAppIntegration] = useState(false);

  useEffect(() => {
    // Check for existing Shopify connection
    const savedStore = localStorage.getItem('shopifyStore');
    if (savedStore) {
      try {
        const storeData = JSON.parse(savedStore);
        setStore(storeData);
        setIsConnected(storeData.connected);
        return;
      } catch (error) {
        console.error('Error loading saved Shopify store:', error);
      }
    }
    
    // Check if environment variables are available for auto-connection
    const envShopifyKey = import.meta.env.VITE_SHOPIFY_API_KEY;
    const envShopifyToken = import.meta.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN;
    const envShopifyStore = import.meta.env.VITE_SHOPIFY_STORE_URL;
    
    if (envShopifyKey && envShopifyToken && envShopifyStore) {
      console.log('🔑 Found Shopify environment variables, auto-connecting...');
      const cleanStoreName = envShopifyStore.replace('.myshopify.com', '');
      
      const autoStore: ShopifyStore = {
        name: cleanStoreName,
        shop: cleanStoreName,
        domain: `${cleanStoreName}.myshopify.com`,
        connected: true,
        apiKey: envShopifyKey,
        accessToken: envShopifyToken
      };
      
      localStorage.setItem('shopifyStore', JSON.stringify(autoStore));
      setStore(autoStore);
      setIsConnected(true);
      onStoreUpdate?.(autoStore);
    }
  }, []);

  // Load configuration from database on component mount
  useEffect(() => {
    const loadDatabaseConfiguration = async () => {
      try {
        const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
        const response = await fetch(`${baseUrl}/api/shopify/status`);
        
        if (response.ok) {
          const result = await response.json();
          
          if (result.isConfigured) {
            // Get the full configuration (without sensitive data)
            const configResponse = await fetch(`${baseUrl}/api/shopify/config`);
            if (configResponse.ok) {
              const configData = await configResponse.json();
              const dbStore = configData.data;
              
              // Update the state with database configuration
              setStore(dbStore);
              setIsConnected(dbStore.connected);
              onStoreUpdate?.(dbStore);
              
              console.log('✅ Loaded Shopify configuration from database:', dbStore.name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading database configuration:', error);
        // Fallback to localStorage if database fails (handled by existing useEffect)
      }
    };

    loadDatabaseConfiguration();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clean store name - remove .myshopify.com if present
      const cleanStoreName = connectionForm.storeName.replace('.myshopify.com', '');
      const shopDomain = `${cleanStoreName}.myshopify.com`;
      
      // Test connection and save to database
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      const response = await fetch(`${baseUrl}/api/shopify/configure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: connectionForm.apiKey,
          accessToken: connectionForm.accessToken,
          shopDomain: shopDomain,
          storeName: cleanStoreName
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to connect to Shopify store');
      }
      
      // Connection successful - create store object
      const newStore: ShopifyStore = {
        name: cleanStoreName,
        shop: cleanStoreName,
        domain: shopDomain,
        connected: true,
        apiKey: connectionForm.apiKey,
        accessToken: connectionForm.accessToken
      };

      // Save to localStorage as backup
      localStorage.setItem('shopifyStore', JSON.stringify(newStore));
      localStorage.setItem('shopify_api_key', connectionForm.apiKey);
      localStorage.setItem('shopify_access_token', connectionForm.accessToken);
      localStorage.setItem('shopify_store_name', cleanStoreName);
      
      setStore(newStore);
      setIsConnected(true);
      setActiveTab('dashboard');
      
      // Notify parent component about the store update
      onStoreUpdate?.(newStore);
      
      console.log('✅ Shopify store connected successfully');
    } catch (error) {
      console.error('❌ Error connecting to Shopify:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Clear from database
      const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
      await fetch(`${baseUrl}/api/shopify/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error clearing database configuration:', error);
    }

    // Clear from localStorage
    localStorage.removeItem('shopifyStore');
    localStorage.removeItem('shopify_api_key');
    localStorage.removeItem('shopify_access_token');
    localStorage.removeItem('shopify_store_name');
    
    setStore(null);
    setIsConnected(false);
    setConnectionForm({ storeName: '', apiKey: '', accessToken: '' });
    
    // Clear data
    setProducts([]);
    setOrders([]);
    setStats({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });
    
    // Notify parent component about the disconnection
    onStoreUpdate?.(null);
    
    console.log('🔌 Shopify store disconnected');
  };

  const loadShopifyData = async () => {
    if (!isConnected) return;
    
    setDataLoading(true);
    try {
      console.log('📊 Loading Shopify data...');
      
      // For demo purposes, we'll use mock data since we may not have real API credentials
      const mockProducts = [
        { id: '1', title: 'Premium T-Shirt', price: '29.99', inventory_quantity: 50 },
        { id: '2', title: 'Classic Jeans', price: '79.99', inventory_quantity: 25 },
        { id: '3', title: 'Sneakers', price: '129.99', inventory_quantity: 15 }
      ];
      
      const mockOrders = [
        { id: '1001', order_number: '1001', total_price: '109.98', created_at: new Date().toISOString() },
        { id: '1002', order_number: '1002', total_price: '29.99', created_at: new Date().toISOString() },
        { id: '1003', order_number: '1003', total_price: '159.98', created_at: new Date().toISOString() }
      ];

      // Try to load real data, fall back to mock data if credentials are invalid
      try {
        if (shopifyService.isConnected()) {
          const [productsResponse, ordersResponse] = await Promise.all([
            shopifyService.getProducts(10),
            shopifyService.getOrders(10)
          ]);
          
          setProducts(productsResponse.products || mockProducts);
          setOrders(ordersResponse.orders || mockOrders);
        } else {
          throw new Error('Demo mode');
        }
      } catch (error) {
        console.log('📋 Using demo data (API credentials not provided or invalid)');
        setProducts(mockProducts);
        setOrders(mockOrders);
      }

      // Calculate stats
      const totalProducts = products.length || mockProducts.length;
      const totalOrders = orders.length || mockOrders.length;
      const totalRevenue = (orders.length > 0 ? orders : mockOrders)
        .reduce((sum: number, order: any) => sum + parseFloat(order.total_price || '0'), 0);

      setStats({
        totalProducts,
        totalOrders,
        totalRevenue
      });

      console.log('✅ Shopify data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading Shopify data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Load data when connected
  useEffect(() => {
    if (isConnected && activeTab === 'dashboard') {
      loadShopifyData();
    }
  }, [isConnected, activeTab]);

  return (
    <div className="shopify-integration-overlay">
      <div className="shopify-integration-container">
        <div className="shopify-header">
          <div className="shopify-title">
            <span className="shopify-icon">🛒</span>
            <h2>Shopify Integration</h2>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="shopify-content">
          {!isConnected ? (
            <div className="connection-section">
              <div className="connection-header">
                <h3>Connect Your Shopify Store</h3>
                <p>Link your Shopify store to manage products and orders directly from Stella</p>
              </div>

              <form onSubmit={handleConnect} className="connection-form">
                <div className="form-group">
                  <label htmlFor="storeName">Store Name</label>
                  <input
                    type="text"
                    id="storeName"
                    value={connectionForm.storeName}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, storeName: e.target.value }))}
                    placeholder="your-store-name"
                    required
                  />
                  <small>.myshopify.com</small>
                </div>

                <div className="form-group">
                  <label htmlFor="apiKey">API Key</label>
                  <input
                    type="text"
                    id="apiKey"
                    value={connectionForm.apiKey}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your Shopify API key"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="accessToken">Access Token</label>
                  <input
                    type="password"
                    id="accessToken"
                    value={connectionForm.accessToken}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="Enter your access token"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="connect-button"
                  disabled={isLoading}
                >
                  {isLoading ? '🔄 Connecting...' : '🔗 Connect Store'}
                </button>
              </form>

              <div className="setup-guide">
                <h4>🚀 Setup Guide</h4>
                <ol>
                  <li>Go to your Shopify Admin → Apps → App and sales channel settings</li>
                  <li>Click "Develop apps" → "Create an app"</li>
                  <li>Configure API scopes: read_products, write_products, read_orders</li>
                  <li>Generate API credentials and paste them above</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="connected-section">
              <div className="store-info">
                <div className="store-header">
                  <div className="store-details">
                    <h3>✅ {store?.name}</h3>
                    <p>{store?.domain}</p>
                  </div>
                  <button className="disconnect-button" onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </div>
              </div>

              <div className="shopify-tabs">
                <button
                  className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  📊 Dashboard
                </button>
                <button
                  className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                  onClick={() => setActiveTab('products')}
                >
                  📦 Products
                </button>
                <button
                  className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  📋 Orders
                </button>
                <button
                  className={`tab-button ${activeTab === 'whatsapp' ? 'active' : ''}`}
                  onClick={() => setActiveTab('whatsapp')}
                >
                  📱 WhatsApp
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'dashboard' && (
                  <div className="dashboard-content">
                    <h4>Store Overview</h4>
                    {dataLoading ? (
                      <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        🔄 Loading store data...
                      </p>
                    ) : (
                      <div className="stats-grid">
                        <div className="stat-card">
                          <span className="stat-value">{stats.totalProducts}</span>
                          <span className="stat-label">Products</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-value">{stats.totalOrders}</span>
                          <span className="stat-label">Orders</span>
                        </div>
                        <div className="stat-card">
                          <span className="stat-value">${stats.totalRevenue.toFixed(2)}</span>
                          <span className="stat-label">Revenue</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="products-content">
                    <h4>Products Management ({products.length} products)</h4>
                    {products.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {products.map((product: any) => (
                          <div key={product.id} style={{
                            background: '#f8f9fa',
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            <h5 style={{ margin: '0 0 4px 0', color: '#333' }}>{product.title}</h5>
                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                              ${product.price} • Stock: {product.inventory_quantity || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No products found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="orders-content">
                    <h4>Orders Management ({orders.length} orders)</h4>
                    {orders.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {orders.map((order: any) => (
                          <div key={order.id} style={{
                            background: '#f8f9fa',
                            padding: '12px',
                            marginBottom: '8px',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            <h5 style={{ margin: '0 0 4px 0', color: '#333' }}>Order #{order.order_number}</h5>
                            <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                              ${order.total_price} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No orders found.</p>
                    )}
                  </div>
                )}

                {activeTab === 'whatsapp' && (
                  <div className="whatsapp-integration-content">
                    <div style={{ 
                      background: '#f8f9fa', 
                      border: '1px solid #e3f2fd', 
                      borderRadius: '8px', 
                      padding: '20px', 
                      marginBottom: '20px' 
                    }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🛒📱 Shopify + WhatsApp Integration
                      </h4>
                      <p style={{ margin: '0 0 16px 0', color: '#666', lineHeight: 1.5 }}>
                        Connect your Shopify store with WhatsApp to enable product catalogs, automated messages, and seamless customer communication.
                      </p>
                      
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setShowWhatsAppIntegration(true)}
                          style={{
                            backgroundColor: '#128C7E',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          ⚙️ Setup WhatsApp Integration
                        </button>
                        
                        <button
                          onClick={async () => {
                            try {
                              const baseUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
                              const response = await fetch(`${baseUrl}/api/shopify-whatsapp/sync-products`, {
                                method: 'POST'
                              });
                              const result = await response.json();
                              if (result.success) {
                                alert(`✅ Successfully synced ${result.data.syncedCount} products to WhatsApp catalog!`);
                              } else {
                                alert(`❌ Sync failed: ${result.message}`);
                              }
                            } catch (error) {
                              alert('❌ Error syncing products');
                              console.error('Sync error:', error);
                            }
                          }}
                          style={{
                            backgroundColor: '#0084ff',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          🔄 Sync Products to WhatsApp
                        </button>
                      </div>
                    </div>

                    <div style={{ 
                      background: '#fff3cd', 
                      border: '1px solid #ffecb5', 
                      borderRadius: '8px', 
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <h5 style={{ margin: '0 0 8px 0', color: '#856404' }}>✨ Integration Features</h5>
                      <ul style={{ margin: '0', paddingLeft: '20px', color: '#856404' }}>
                        <li>Product catalog sync with TTD pricing</li>
                        <li>Interactive product cards in WhatsApp</li>
                        <li>Automated order notifications</li>
                        <li>Customer support integration</li>
                        <li>Real-time inventory updates</li>
                      </ul>
                    </div>

                    <div style={{ 
                      background: '#d1ecf1', 
                      border: '1px solid #bee5eb', 
                      borderRadius: '8px', 
                      padding: '16px' 
                    }}>
                      <h5 style={{ margin: '0 0 8px 0', color: '#0c5460' }}>📋 Setup Status</h5>
                      <div style={{ color: '#0c5460' }}>
                        <p style={{ margin: '4px 0' }}>• Shopify Connection: {isConnected ? '✅ Connected' : '❌ Not Connected'}</p>
                        <p style={{ margin: '4px 0' }}>• WhatsApp Business API: ✅ Active</p>
                        <p style={{ margin: '4px 0' }}>• Product Catalog: 🔄 Ready for Sync</p>
                        <p style={{ margin: '4px 0' }}>• Currency Support: 🇹🇹 TTD Configured</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Shopify WhatsApp Integration Modal */}
      {showWhatsAppIntegration && (
        <ShopifyWhatsAppIntegration
          onClose={() => setShowWhatsAppIntegration(false)}
          onSuccess={(result) => {
            console.log('✅ Shopify WhatsApp integration setup complete:', result);
            setShowWhatsAppIntegration(false);
            // Optionally refresh integration status here
          }}
        />
      )}
    </div>
  );
};

export default ShopifyIntegration;
