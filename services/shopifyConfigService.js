const { pool } = require('../config/database');

class ShopifyConfigService {
  // Get current configuration from database
  async getConfig() {
    try {
      const result = await pool.query(
        'SELECT * FROM shopify_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
      );
      
      if (result.rows.length > 0) {
        const config = result.rows[0];
        return {
          storeName: config.store_name,
          shopDomain: config.shop_domain,
          apiKey: config.api_key,
          accessToken: config.access_token,
          storefrontAccessToken: config.storefront_access_token,
          webhookUrl: config.webhook_url,
          isConfigured: true,
          lastConfigured: config.updated_at
        };
      }
      
      // Fallback to environment variables if no database config
      return {
        storeName: process.env.VITE_SHOPIFY_STORE_NAME || process.env.SHOPIFY_STORE_NAME || '',
        shopDomain: process.env.VITE_SHOPIFY_STORE_URL || process.env.SHOPIFY_STORE_URL || '',
        apiKey: process.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || '',
        accessToken: process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
        storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
        webhookUrl: process.env.VITE_SHOPIFY_WEBHOOK_URL || process.env.SHOPIFY_WEBHOOK_URL || '',
        isConfigured: !!(
          (process.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY) && 
          (process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN)
        ),
        lastConfigured: null
      };
    } catch (error) {
      console.error('Error getting Shopify config:', error);
      // Return environment variables as fallback
      return {
        storeName: process.env.VITE_SHOPIFY_STORE_NAME || process.env.SHOPIFY_STORE_NAME || '',
        shopDomain: process.env.VITE_SHOPIFY_STORE_URL || process.env.SHOPIFY_STORE_URL || '',
        apiKey: process.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY || '',
        accessToken: process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
        storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
        webhookUrl: process.env.VITE_SHOPIFY_WEBHOOK_URL || process.env.SHOPIFY_WEBHOOK_URL || '',
        isConfigured: !!(
          (process.env.VITE_SHOPIFY_API_KEY || process.env.SHOPIFY_API_KEY) && 
          (process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN)
        ),
        lastConfigured: null
      };
    }
  }

  // Save configuration to database
  async saveConfig(config) {
    try {
      // Deactivate old configurations
      await pool.query('UPDATE shopify_config SET is_active = false');
      
      // Insert new configuration
      const result = await pool.query(
        `INSERT INTO shopify_config (store_name, shop_domain, api_key, access_token, storefront_access_token, webhook_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          config.storeName,
          config.shopDomain,
          config.apiKey,
          config.accessToken,
          config.storefrontAccessToken || '',
          config.webhookUrl || '',
          true
        ]
      );
      
      console.log('✅ Shopify configuration saved to database');
      return result.rows[0];
    } catch (error) {
      console.error('Error saving Shopify config:', error);
      throw error;
    }
  }

  // Clear configuration from database
  async clearConfig() {
    try {
      await pool.query('UPDATE shopify_config SET is_active = false');
      console.log('✅ Shopify configuration cleared from database');
      return true;
    } catch (error) {
      console.error('Error clearing Shopify config:', error);
      throw error;
    }
  }

  // Check if configuration exists and is valid
  async isConfigured() {
    try {
      const config = await this.getConfig();
      return !!(config.apiKey && config.accessToken && config.shopDomain);
    } catch (error) {
      console.error('Error checking Shopify config status:', error);
      return false;
    }
  }

  // Test Shopify connection
  async testConnection(config) {
    try {
      const { shopDomain, accessToken } = config;
      const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      // Test connection by fetching shop info
      const response = await fetch(`https://${cleanDomain}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        shop: data.shop,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Connection failed'
      };
    }
  }
}

module.exports = new ShopifyConfigService();
