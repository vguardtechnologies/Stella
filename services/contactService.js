const { pool } = require('../config/database');

class ContactService {
  // Check if a phone number exists in contacts
  async isContactSaved(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT id, saved_name, has_susa_suffix FROM contacts WHERE phone_number = $1',
        [phoneNumber]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error checking if contact exists:', error);
      throw error;
    }
  }

  // Save a new contact
  async saveContact(contactData) {
    try {
      const {
        phoneNumber,
        displayName,
        whatsappProfileName,
        savedName,
        hasSusaSuffix = false,
        notes = ''
      } = contactData;

      const result = await pool.query(`
        INSERT INTO contacts (
          phone_number, display_name, whatsapp_profile_name, 
          saved_name, has_susa_suffix, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (phone_number) 
        DO UPDATE SET
          display_name = EXCLUDED.display_name,
          whatsapp_profile_name = EXCLUDED.whatsapp_profile_name,
          saved_name = EXCLUDED.saved_name,
          has_susa_suffix = EXCLUDED.has_susa_suffix,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, saved_name, has_susa_suffix
      `, [phoneNumber, displayName, whatsappProfileName, savedName, hasSusaSuffix, notes]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  }

  // Get contact details
  async getContact(phoneNumber) {
    try {
      const result = await pool.query(
        'SELECT * FROM contacts WHERE phone_number = $1',
        [phoneNumber]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting contact:', error);
      throw error;
    }
  }

  // Update contact
  async updateContact(phoneNumber, updates) {
    try {
      const setClause = Object.keys(updates)
        .map((key, index) => `${this.camelToSnakeCase(key)} = $${index + 2}`)
        .join(', ');
      
      const values = [phoneNumber, ...Object.values(updates)];
      
      const result = await pool.query(`
        UPDATE contacts 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE phone_number = $1
        RETURNING *
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(phoneNumber) {
    try {
      const result = await pool.query(
        'DELETE FROM contacts WHERE phone_number = $1 RETURNING *',
        [phoneNumber]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Get all contacts
  async getAllContacts() {
    try {
      const result = await pool.query(
        'SELECT * FROM contacts ORDER BY saved_name ASC, created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting all contacts:', error);
      throw error;
    }
  }

  // Search contacts
  async searchContacts(searchTerm) {
    try {
      const result = await pool.query(`
        SELECT * FROM contacts 
        WHERE 
          saved_name ILIKE $1 OR 
          display_name ILIKE $1 OR 
          whatsapp_profile_name ILIKE $1 OR 
          phone_number ILIKE $1
        ORDER BY saved_name ASC
      `, [`%${searchTerm}%`]);
      
      return result.rows;
    } catch (error) {
      console.error('Error searching contacts:', error);
      throw error;
    }
  }

  // Helper function to convert camelCase to snake_case
  camelToSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  // Get contact display name (with Susa suffix if enabled)
  getDisplayName(contact) {
    if (!contact || !contact.saved_name) return null;
    
    return contact.has_susa_suffix 
      ? `${contact.saved_name} 🦋Susa`
      : contact.saved_name;
  }
}

module.exports = new ContactService();
