const { pool } = require('../config/database');

// Create Shopify configuration table
const createShopifyConfigTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shopify_config (
        id SERIAL PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL,
        shop_domain VARCHAR(255) NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        access_token TEXT NOT NULL,
        storefront_access_token VARCHAR(255),
        webhook_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_shopify_config_active ON shopify_config(is_active);
      CREATE INDEX IF NOT EXISTS idx_shopify_config_shop_domain ON shopify_config(shop_domain);
    `);

    console.log('✅ Shopify configuration table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating Shopify configuration table:', error);
    throw error;
  }
};

module.exports = { createShopifyConfigTable };
