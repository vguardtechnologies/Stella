const express = require('express');
const router = express.Router();
const shopifyConfigService = require('../../services/shopifyConfigService');

// In-memory cache for quick access (refreshed from database)
let shopifyConfig = null;

// Initialize configuration from database
const initializeConfig = async () => {
  try {
    shopifyConfig = await shopifyConfigService.getConfig();
    console.log('Shopify configuration loaded:', {
      hasApiKey: !!shopifyConfig.apiKey,
      hasAccessToken: !!shopifyConfig.accessToken,
      shopDomain: shopifyConfig.shopDomain ? `***${shopifyConfig.shopDomain.slice(-10)}` : '',
      isConfigured: shopifyConfig.isConfigured,
      lastConfigured: shopifyConfig.lastConfigured
    });
  } catch (error) {
    console.error('Failed to initialize Shopify config:', error);
    // Fallback to environment variables
    shopifyConfig = {
      storeName: process.env.VITE_SHOPIFY_STORE_NAME || '',
      shopDomain: process.env.VITE_SHOPIFY_STORE_URL || '',
      apiKey: process.env.VITE_SHOPIFY_API_KEY || '',
      accessToken: process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN || '',
      storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
      webhookUrl: process.env.VITE_SHOPIFY_WEBHOOK_URL || '',
      isConfigured: !!(process.env.VITE_SHOPIFY_API_KEY && process.env.VITE_SHOPIFY_ADMIN_ACCESS_TOKEN),
      lastConfigured: null
    };
  }
};

// Initialize on module load
initializeConfig();

// Test Shopify connection
router.post('/test-connection', async (req, res) => {
  try {
    const { apiKey, accessToken, shopDomain } = req.body;

    if (!apiKey || !accessToken || !shopDomain) {
      return res.status(400).json({
        success: false,
        message: 'API key, access token, and shop domain are required'
      });
    }

    const testResult = await shopifyConfigService.testConnection({
      apiKey,
      accessToken,
      shopDomain
    });

    if (testResult.success) {
      res.json({
        success: true,
        message: 'Shopify connection successful!',
        shop: testResult.shop
      });
    } else {
      res.status(400).json({
        success: false,
        message: testResult.message
      });
    }
  } catch (error) {
    console.error('Shopify connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message
    });
  }
});

// Get current configuration status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    isConfigured: shopifyConfig.isConfigured,
    hasApiKey: !!shopifyConfig.apiKey,
    hasAccessToken: !!shopifyConfig.accessToken,
    shopDomain: shopifyConfig.shopDomain ? `***${shopifyConfig.shopDomain.slice(-10)}` : '',
    storeName: shopifyConfig.storeName,
    webhookUrl: shopifyConfig.webhookUrl,
    message: shopifyConfig.isConfigured ? 'Shopify is configured' : 'Shopify needs configuration',
    lastConfigured: shopifyConfig.lastConfigured || null
  });
});

// Save Shopify configuration
router.post('/configure', async (req, res) => {
  try {
    const { apiKey, accessToken, shopDomain, storeName, storefrontAccessToken, webhookUrl } = req.body;

    if (!apiKey || !accessToken || !shopDomain) {
      return res.status(400).json({
        success: false,
        message: 'API key, access token, and shop domain are required'
      });
    }

    // First test the connection
    const testResult = await shopifyConfigService.testConnection({
      apiKey,
      accessToken,
      shopDomain
    });

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `Invalid Shopify credentials: ${testResult.message}`
      });
    }

    // Extract store name from shop domain if not provided
    const finalStoreName = storeName || shopDomain.replace(/^https?:\/\//, '').replace('.myshopify.com', '').replace(/\/$/, '');

    // Save the configuration to database
    await shopifyConfigService.saveConfig({
      storeName: finalStoreName,
      shopDomain,
      apiKey,
      accessToken,
      storefrontAccessToken: storefrontAccessToken || '',
      webhookUrl: webhookUrl || ''
    });

    // Update in-memory cache
    shopifyConfig = {
      storeName: finalStoreName,
      shopDomain,
      apiKey,
      accessToken,
      storefrontAccessToken: storefrontAccessToken || '',
      webhookUrl: webhookUrl || '',
      isConfigured: true,
      lastConfigured: new Date().toISOString()
    };

    console.log('Shopify configuration saved:', {
      storeName: shopifyConfig.storeName,
      shopDomain: shopifyConfig.shopDomain,
      hasApiKey: !!shopifyConfig.apiKey,
      hasAccessToken: !!shopifyConfig.accessToken,
      lastConfigured: shopifyConfig.lastConfigured
    });

    res.json({
      success: true,
      message: 'Shopify configuration saved successfully!',
      data: {
        storeName: shopifyConfig.storeName,
        shopDomain: shopifyConfig.shopDomain,
        webhookUrl: shopifyConfig.webhookUrl,
        isConfigured: shopifyConfig.isConfigured
      }
    });

  } catch (error) {
    console.error('Shopify configuration save failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message
    });
  }
});

// Clear Shopify configuration
router.post('/clear', async (req, res) => {
  try {
    await shopifyConfigService.clearConfig();
    
    // Update in-memory cache
    shopifyConfig = {
      storeName: '',
      shopDomain: '',
      apiKey: '',
      accessToken: '',
      storefrontAccessToken: '',
      webhookUrl: '',
      isConfigured: false,
      lastConfigured: null
    };

    res.json({
      success: true,
      message: 'Shopify configuration cleared successfully'
    });
  } catch (error) {
    console.error('Failed to clear Shopify configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear configuration',
      error: error.message
    });
  }
});

// Get Shopify configuration for frontend (without sensitive data)
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      name: shopifyConfig.storeName,
      shop: shopifyConfig.storeName,
      domain: shopifyConfig.shopDomain,
      connected: shopifyConfig.isConfigured,
      // Don't send sensitive data to frontend
      apiKey: shopifyConfig.apiKey ? '***' + shopifyConfig.apiKey.slice(-4) : '',
      accessToken: shopifyConfig.accessToken ? '***' + shopifyConfig.accessToken.slice(-4) : ''
    }
  });
});

module.exports = router;
