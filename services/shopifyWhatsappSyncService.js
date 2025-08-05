const axios = require('axios');
const shopifyConfigService = require('./shopifyConfigService');
const whatsappConfigService = require('./whatsappConfigService');

class ShopifyWhatsappSyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = null;
    this.catalogId = null;
  }

  /**
   * Official Shopify WhatsApp Integration
   * Creates a Facebook Business Manager catalog and syncs Shopify products
   */
  async setupOfficialIntegration() {
    try {
      console.log('🚀 Setting up Official Shopify WhatsApp Sales Channel...');
      
      // 1. Verify both services are configured
      const shopifyConfig = await shopifyConfigService.getConfig();
      const whatsappConfig = await whatsappConfigService.getConfig();

      if (!shopifyConfig.isConfigured) {
        throw new Error('Shopify not configured. Please connect your Shopify store first.');
      }

      if (!whatsappConfig.isConfigured) {
        throw new Error('WhatsApp Business API not configured. Please connect WhatsApp first.');
      }

      // 2. Get WhatsApp Business Account ID
      const businessAccountId = await this.getWhatsAppBusinessAccountId(whatsappConfig);
      console.log('📱 WhatsApp Business Account ID:', businessAccountId);

      // 3. Create or get Facebook Business Manager Catalog
      this.catalogId = await this.createOrGetCatalog(businessAccountId, whatsappConfig);
      console.log('📋 Product Catalog ID:', this.catalogId);

      // 4. Sync Shopify products to catalog
      const syncResult = await this.syncShopifyProductsToCatalog(shopifyConfig, whatsappConfig);
      console.log('✅ Product sync completed:', syncResult);

      // 5. Configure WhatsApp Commerce Settings
      await this.configureWhatsAppCommerce(businessAccountId, whatsappConfig);

      this.lastSyncTime = new Date();
      
      return {
        success: true,
        catalogId: this.catalogId,
        productsSync: syncResult.productCount,
        message: 'Official Shopify WhatsApp integration setup complete!',
        nextSyncRecommended: '24 hours'
      };

    } catch (error) {
      console.error('❌ Official integration setup failed:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp Business Account ID from phone number or environment
   */
  async getWhatsAppBusinessAccountId(whatsappConfig) {
    try {
      // First, try to use the business account ID from environment if available
      const envBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      if (envBusinessAccountId) {
        console.log('Using business account ID from environment:', envBusinessAccountId);
        return envBusinessAccountId;
      }

      // Fallback to API call
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${whatsappConfig.phoneNumberId}?fields=account_id`,
        {
          headers: {
            'Authorization': `Bearer ${whatsappConfig.accessToken}`
          }
        }
      );

      return response.data.account_id;
    } catch (error) {
      console.error('Error getting business account ID:', error.response?.data || error.message);
      
      // Last resort: try the hardcoded business account ID from the environment
      const fallbackBusinessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '542736432255157';
      console.log('Using fallback business account ID:', fallbackBusinessAccountId);
      return fallbackBusinessAccountId;
    }
  }

  /**
   * Create or get existing product catalog for WhatsApp Commerce
   */
  async createOrGetCatalog(businessAccountId, whatsappConfig) {
    try {
      console.log(`🔍 Looking for existing catalogs for business account: ${businessAccountId}`);
      
      // First, check if catalog already exists
      const existingCatalogs = await axios.get(
        `https://graph.facebook.com/v18.0/${businessAccountId}/product_catalogs?fields=id,name`,
        {
          headers: {
            'Authorization': `Bearer ${whatsappConfig.accessToken}`
          }
        }
      );

      console.log('📋 Found existing catalogs:', existingCatalogs.data.data);

      // Look for existing Shopify catalog
      const shopifyCatalog = existingCatalogs.data.data.find(catalog => 
        catalog.name.toLowerCase().includes('shopify') || 
        catalog.name.toLowerCase().includes('stella')
      );

      if (shopifyCatalog) {
        console.log('📋 Using existing catalog:', shopifyCatalog.name, shopifyCatalog.id);
        return shopifyCatalog.id;
      }

      // If we have any catalog, use the first one
      if (existingCatalogs.data.data.length > 0) {
        const firstCatalog = existingCatalogs.data.data[0];
        console.log('📋 Using first available catalog:', firstCatalog.name, firstCatalog.id);
        return firstCatalog.id;
      }

      // Create new catalog if none exists
      console.log('📋 No existing catalogs found, creating new catalog...');
      const catalogResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${businessAccountId}/product_catalogs`,
        {
          name: 'Stella Shopify Catalog',
          vertical: 'commerce'
        },
        {
          headers: {
            'Authorization': `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Created new catalog:', catalogResponse.data.id);
      return catalogResponse.data.id;
    } catch (error) {
      console.error('❌ Error creating/getting catalog:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // If we can't create/access catalogs, we might need different permissions
      // Let's provide a more helpful error message
      if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to access Facebook Business Manager catalogs. Please ensure your WhatsApp Business API has catalog management permissions.');
      } else if (error.response?.status === 400) {
        throw new Error(`Facebook API error: ${error.response?.data?.error?.message || 'Invalid request to catalog API'}`);
      } else {
        throw new Error(`Failed to setup product catalog: ${error.message}`);
      }
    }
  }

  /**
   * Sync all Shopify products to WhatsApp catalog
   */
  async syncShopifyProductsToCatalog(shopifyConfig, whatsappConfig) {
    try {
      console.log('🔄 Starting Shopify to WhatsApp product sync...');
      this.syncInProgress = true;

      // Get all products from Shopify
      const shopifyProducts = await this.getAllShopifyProducts(shopifyConfig);
      console.log(`📦 Found ${shopifyProducts.length} Shopify products`);

      let syncedCount = 0;
      let errorCount = 0;
      const batchSize = 50; // Facebook API batch limit

      // Process products in batches
      for (let i = 0; i < shopifyProducts.length; i += batchSize) {
        const batch = shopifyProducts.slice(i, i + batchSize);
        
        try {
          const batchResult = await this.syncProductBatch(batch, whatsappConfig);
          syncedCount += batchResult.success;
          errorCount += batchResult.errors;
          
          console.log(`📊 Batch ${Math.floor(i/batchSize) + 1}: ${batchResult.success} synced, ${batchResult.errors} errors`);
          
        } catch (batchError) {
          console.error(`Batch ${Math.floor(i/batchSize) + 1} failed:`, batchError.message);
          errorCount += batch.length;
        }

        // Rate limiting - pause between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.syncInProgress = false;
      
      return {
        productCount: syncedCount,
        errorCount: errorCount,
        totalProcessed: shopifyProducts.length,
        catalogId: this.catalogId
      };

    } catch (error) {
      this.syncInProgress = false;
      console.error('Product sync failed:', error);
      throw error;
    }
  }

  /**
   * Get all products from Shopify with pagination
   */
  async getAllShopifyProducts(shopifyConfig) {
    try {
      let allProducts = [];
      let hasMore = true;
      let sinceId = null;
      const limit = 250;

      while (hasMore) {
        const endpoint = sinceId 
          ? `/admin/api/2023-10/products.json?limit=${limit}&since_id=${sinceId}`
          : `/admin/api/2023-10/products.json?limit=${limit}`;

        const url = `https://${shopifyConfig.shopDomain}/admin/api/2023-10/products.json?limit=${limit}${sinceId ? `&since_id=${sinceId}` : ''}`;
        
        const response = await axios.get(url, {
          headers: {
            'X-Shopify-Access-Token': shopifyConfig.accessToken,
            'Content-Type': 'application/json'
          }
        });

        const products = response.data.products;
        allProducts = allProducts.concat(products);

        if (products.length < limit) {
          hasMore = false;
        } else {
          sinceId = products[products.length - 1].id;
        }

        console.log(`📦 Fetched ${products.length} products (total: ${allProducts.length})`);
      }

      return allProducts;
    } catch (error) {
      console.error('Error fetching Shopify products:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Sync a batch of products to Facebook catalog
   */
  async syncProductBatch(products, whatsappConfig) {
    try {
      let success = 0;
      let errors = 0;

      // Process products individually (works better than batch for currency handling)
      for (const product of products) {
        try {
          const catalogItem = this.convertShopifyToFacebookProduct(product);

          const response = await axios.post(
            `https://graph.facebook.com/v18.0/${this.catalogId}/products`,
            catalogItem,
            {
              headers: {
                'Authorization': `Bearer ${whatsappConfig.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          success++;
        } catch (error) {
          console.error('❌ Product sync error:', error.response?.data?.error?.message || error.message);
          errors++;
        }
      }

      return { success, errors };
    } catch (error) {
      console.error('❌ Sync batch error:', error);
      throw error;
    }
  }

  /**
   * Convert Shopify product format to Facebook catalog format
   */
  convertShopifyToFacebookProduct(shopifyProduct) {
    const variant = shopifyProduct.variants?.[0] || {};
    const image = shopifyProduct.images?.[0];

    return {
      retailer_id: shopifyProduct.id.toString(),
      name: shopifyProduct.title,
      description: shopifyProduct.body_html?.replace(/<[^>]*>/g, '') || shopifyProduct.title,
      price: Math.floor(parseFloat(variant.price || '0') * 100), // Price in cents without currency
      currency: 'TTD', // Separate currency parameter as required by Facebook API
      url: `https://86e53e-a6.myshopify.com/products/${shopifyProduct.handle}`,
      image_url: image?.src || '',
      brand: shopifyProduct.vendor || 'SUSA SHAPEWEAR',
      category: shopifyProduct.product_type || 'General',
      availability: variant.inventory_quantity > 0 ? 'in stock' : 'out of stock',
      condition: 'new',
      inventory: variant.inventory_quantity || 0,
      additional_image_urls: shopifyProduct.images?.slice(1, 4).map(img => img.src) || []
    };
  }

  /**
   * Configure WhatsApp Commerce settings
   */
  async configureWhatsAppCommerce(businessAccountId, whatsappConfig) {
    try {
      console.log('⚙️ Configuring WhatsApp Commerce settings...');

      // Enable commerce on WhatsApp Business Account
      await axios.post(
        `https://graph.facebook.com/v18.0/${businessAccountId}`,
        {
          commerce_settings: {
            is_catalog_visible: true,
            is_cart_enabled: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${whatsappConfig.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ WhatsApp Commerce settings configured');
    } catch (error) {
      console.warn('⚠️ Commerce settings may already be configured:', error.response?.data?.error?.message || error.message);
      // Don't fail the entire setup if commerce settings fail
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      inProgress: this.syncInProgress,
      lastSync: this.lastSyncTime,
      catalogId: this.catalogId,
      isSetup: !!this.catalogId
    };
  }

  /**
   * Manual trigger for product sync (for scheduled updates)
   */
  async triggerSync() {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    return await this.setupOfficialIntegration();
  }
}

module.exports = new ShopifyWhatsappSyncService();
