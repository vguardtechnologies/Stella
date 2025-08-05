const express = require('express');
const router = express.Router();
const shopifyWhatsappSyncService = require('../../services/shopifyWhatsappSyncService');

// Setup official Shopify WhatsApp Sales Channel integration
router.post('/setup-official-integration', async (req, res) => {
  try {
    console.log('🚀 Starting Official Shopify WhatsApp Sales Channel setup...');
    
    const result = await shopifyWhatsappSyncService.setupOfficialIntegration();
    
    res.json({
      success: true,
      message: 'Official Shopify WhatsApp integration setup successfully!',
      data: result
    });

  } catch (error) {
    console.error('❌ Official integration setup failed:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to setup official integration',
      error: error.message
    });
  }
});

// Get integration status
router.get('/integration-status', (req, res) => {
  try {
    const status = shopifyWhatsappSyncService.getSyncStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error getting integration status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integration status',
      error: error.message
    });
  }
});

// Trigger manual product sync
router.post('/sync-products', async (req, res) => {
  try {
    console.log('🔄 Manual product sync triggered...');
    
    const result = await shopifyWhatsappSyncService.triggerSync();
    
    res.json({
      success: true,
      message: 'Product sync completed successfully!',
      data: result
    });

  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to sync products',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shopify WhatsApp integration service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
