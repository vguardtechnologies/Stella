// Shopify API Service - Centralized access to Shopify functionality
import React from 'react';

export interface ShopifyStore {
  name: string;
  shop: string;
  domain: string;
  connected: boolean;
  apiKey?: string;
  accessToken?: string;
}

export class ShopifyService {
  private static instance: ShopifyService;
  
  static getInstance(): ShopifyService {
    if (!ShopifyService.instance) {
      ShopifyService.instance = new ShopifyService();
    }
    return ShopifyService.instance;
  }

  // Get the current Shopify store connection
  getStore(): ShopifyStore | null {
    try {
      const savedStore = localStorage.getItem('shopifyStore');
      if (savedStore) {
        return JSON.parse(savedStore);
      }
      return null;
    } catch (error) {
      console.error('Error loading Shopify store:', error);
      return null;
    }
  }

  // Check if Shopify is connected
  isConnected(): boolean {
    const store = this.getStore();
    return store?.connected || false;
  }

  // Get store credentials for API calls
  getCredentials(): { apiKey: string; accessToken: string; shop: string } | null {
    const store = this.getStore();
    if (store?.connected && store.apiKey && store.accessToken) {
      return {
        apiKey: store.apiKey,
        accessToken: store.accessToken,
        shop: store.shop
      };
    }
    return null;
  }

  // Make authenticated API calls to Shopify
  async makeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('Shopify not connected. Please connect your store first.');
    }

    const baseUrl = `https://${credentials.shop}.myshopify.com/admin/api/2023-07`;
    const url = `${baseUrl}${endpoint}`;

    const headers = {
      'X-Shopify-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get products from Shopify
  async getProducts(limit: number = 50): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall(`/products.json?limit=${limit}`);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get orders from Shopify
  async getOrders(limit: number = 50): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall(`/orders.json?limit=${limit}&status=any`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  // Get shop information
  async getShopInfo(): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall('/shop.json');
    } catch (error) {
      console.error('Error fetching shop info:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProduct(productId: string): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall(`/products/${productId}.json`);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(productId: string, productData: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall(`/products/${productId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: productData })
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Create product
  async createProduct(productData: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall('/products.json', {
        method: 'POST',
        body: JSON.stringify({ product: productData })
      });
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Get inventory levels
  async getInventoryLevels(): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Shopify not connected');
    }
    
    try {
      return await this.makeApiCall('/inventory_levels.json');
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  // Listen for store connection changes
  onStoreChange(callback: (store: ShopifyStore | null) => void): () => void {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shopifyStore') {
        try {
          const store = e.newValue ? JSON.parse(e.newValue) : null;
          callback(store);
        } catch (error) {
          console.error('Error parsing store data:', error);
          callback(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
}

// Export singleton instance
export const shopifyService = ShopifyService.getInstance();

// Helper hook for React components
export const useShopify = () => {
  const [store, setStore] = React.useState<ShopifyStore | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    // Initial load
    const currentStore = shopifyService.getStore();
    setStore(currentStore);
    setIsConnected(shopifyService.isConnected());

    // Listen for changes
    const cleanup = shopifyService.onStoreChange((newStore) => {
      setStore(newStore);
      setIsConnected(newStore?.connected || false);
    });

    return cleanup;
  }, []);

  return {
    store,
    isConnected,
    shopifyService
  };
};

export default shopifyService;
