const { pool } = require('../config/database');

class WhatsAppConfigService {
  // Get current configuration from database
  async getConfig() {
    try {
      const result = await pool.query(
        'SELECT * FROM whatsapp_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1'
      );
      
      if (result.rows.length > 0) {
        const config = result.rows[0];
        return {
          accessToken: config.access_token,
          phoneNumberId: config.phone_number_id,
          webhookUrl: config.webhook_url,
          verifyToken: config.verify_token,
          isConfigured: true,
          lastConfigured: config.updated_at
        };
      }
      
      // Fallback to environment variables if no database config
      return {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
        isConfigured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        lastConfigured: null
      };
    } catch (error) {
      console.error('Error getting WhatsApp config:', error);
      // Return environment variables as fallback
      return {
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        webhookUrl: process.env.WHATSAPP_WEBHOOK_URL || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
        isConfigured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        lastConfigured: null
      };
    }
  }

  // Save configuration to database
  async saveConfig(config) {
    try {
      // Deactivate old configurations
      await pool.query('UPDATE whatsapp_config SET is_active = false');
      
      // Insert new configuration
      const result = await pool.query(
        `INSERT INTO whatsapp_config (access_token, phone_number_id, webhook_url, verify_token, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          config.accessToken,
          config.phoneNumberId,
          config.webhookUrl || '',
          config.verifyToken || 'stella_webhook_verify_token',
          true
        ]
      );
      
      console.log('✅ WhatsApp configuration saved to database');
      return result.rows[0];
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      throw error;
    }
  }

  // Clear configuration from database
  async clearConfig() {
    try {
      await pool.query('UPDATE whatsapp_config SET is_active = false');
      console.log('✅ WhatsApp configuration cleared from database');
      return true;
    } catch (error) {
      console.error('Error clearing WhatsApp config:', error);
      throw error;
    }
  }

  // Check if configuration exists and is valid
  async isConfigured() {
    try {
      const config = await this.getConfig();
      return !!(config.accessToken && config.phoneNumberId);
    } catch (error) {
      console.error('Error checking WhatsApp config status:', error);
      return false;
    }
  }
}

module.exports = new WhatsAppConfigService();
