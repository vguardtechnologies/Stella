const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const shopifyConfigService = require('../services/shopifyConfigService');

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

// Legacy proxy endpoint for backward compatibility
router.post('/proxy', async (req, res) => {
  try {
    const { endpoint, shop, accessToken, method = 'GET' } = req.body;

    // Use stored config if no credentials provided
    const finalAccessToken = accessToken || shopifyConfig.accessToken;
    const finalShop = shop || shopifyConfig.storeName;

    if (!endpoint || !finalShop || !finalAccessToken) {
      return res.status(400).json({ 
        error: 'Missing required parameters: endpoint, shop, accessToken' 
      });
    }

    // Clean shop name - remove .myshopify.com if present
    const cleanShop = finalShop.replace('.myshopify.com', '');
    
    // Build Shopify API URL
    const baseUrl = `https://${cleanShop}.myshopify.com/admin/api/2023-10`;
    const url = `${baseUrl}${endpoint}`;

    console.log(`🛍️ Shopify API Call: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'X-Shopify-Access-Token': finalAccessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Shopify API Error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({ 
        error: `Shopify API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log(`✅ Shopify API Success: ${Object.keys(data).join(', ')}`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Shopify Proxy Error:', error);
    res.status(500).json({ 
      error: 'Shopify API proxy failed',
      details: error.message
    });
  }
});

// Create draft order for checkout
router.post('/draft-orders', async (req, res) => {
  try {
    if (!shopifyConfig || !shopifyConfig.isConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Shopify is not configured'
      });
    }

    const { draft_order } = req.body;

    if (!draft_order) {
      return res.status(400).json({
        success: false,
        message: 'Draft order data is required'
      });
    }

    const shopifyUrl = `https://${shopifyConfig.shopDomain}/admin/api/2023-10/draft_orders.json`;

    console.log('Creating draft order:', JSON.stringify(draft_order, null, 2));

    const response = await fetch(shopifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyConfig.accessToken
      },
      body: JSON.stringify({ draft_order })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Draft order created successfully:', data.draft_order.id);
      
      // Complete the draft order to convert it to a real order
      const completeUrl = `https://${shopifyConfig.shopDomain}/admin/api/2023-10/draft_orders/${data.draft_order.id}/complete.json`;
      
      const completeResponse = await fetch(completeUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyConfig.accessToken
        },
        body: JSON.stringify({
          payment_pending: true // Allow order completion without payment
        })
      });

      if (completeResponse.ok) {
        const completedOrder = await completeResponse.json();
        console.log('✅ Draft order completed as real order:', completedOrder.draft_order.order_id);
        
        res.json({
          success: true,
          draft_order: data.draft_order,
          completed_order: completedOrder.draft_order,
          message: 'Order created and completed successfully'
        });
      } else {
        console.log('⚠️ Draft order created but completion failed');
        res.json({
          success: true,
          draft_order: data.draft_order,
          message: 'Draft order created successfully (manual completion required)'
        });
      }
    } else {
      console.error('❌ Failed to create draft order:', data);
      res.status(400).json({
        success: false,
        message: data.errors || 'Failed to create draft order',
        details: data
      });
    }
  } catch (error) {
    console.error('❌ Draft order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during draft order creation',
      details: error.message
    });
  }
});

module.exports = router;
