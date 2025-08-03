// Shopify API Proxy - Handle CORS and API calls
const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// Proxy endpoint for Shopify API calls
router.post('/proxy', async (req, res) => {
  try {
    const { endpoint, shop, accessToken, method = 'GET' } = req.body;

    if (!endpoint || !shop || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing required parameters: endpoint, shop, accessToken' 
      });
    }

    // Clean shop name - remove .myshopify.com if present
    const cleanShop = shop.replace('.myshopify.com', '');
    
    // Build Shopify API URL
    const baseUrl = `https://${cleanShop}.myshopify.com/admin/api/2023-07`;
    const url = `${baseUrl}${endpoint}`;

    console.log(`🛍️ Shopify API Call: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
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
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Test Shopify connection
router.post('/test-connection', async (req, res) => {
  try {
    const { shop, accessToken } = req.body;

    if (!shop || !accessToken) {
      return res.status(400).json({ 
        error: 'Missing shop or accessToken' 
      });
    }

    // Clean shop name
    const cleanShop = shop.replace('.myshopify.com', '');
    const url = `https://${cleanShop}.myshopify.com/admin/api/2023-07/shop.json`;

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Connection failed: ${response.status} ${response.statusText}`,
        connected: false
      });
    }

    const data = await response.json();
    res.json({ 
      connected: true, 
      shop: data.shop 
    });
  } catch (error) {
    console.error('❌ Shopify Connection Test Error:', error);
    res.status(500).json({ 
      error: 'Connection test failed', 
      details: error.message,
      connected: false
    });
  }
});

module.exports = router;
