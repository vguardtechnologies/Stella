const fetch = require('node-fetch');

class WhatsAppContactService {
  constructor() {
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  // Get contact profile information from WhatsApp
  async getContactProfile(phoneNumber) {
    try {
      console.log(`👤 Fetching contact profile for: ${phoneNumber}`);

      // WhatsApp Business API endpoint for getting contact info
      const contactsUrl = `${this.whatsappApiUrl}/contacts`;
      
      const response = await fetch(contactsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          contacts: [phoneNumber]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`⚠️ Contact profile fetch failed: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Contact profile data:`, JSON.stringify(data, null, 2));

      // Extract profile information
      if (data.contacts && data.contacts.length > 0) {
        const contact = data.contacts[0];
        return {
          phoneNumber: phoneNumber,
          formattedPhone: contact.wa_id,
          profileName: contact.profile?.name || null,
          businessName: contact.profile?.business?.name || null,
          status: contact.status,
          lastSeen: contact.profile?.last_seen || null
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Error fetching contact profile for ${phoneNumber}:`, error);
      return null;
    }
  }

  // Alternative method: Get contact info from user profile API
  async getUserProfile(phoneNumber) {
    try {
      console.log(`🔍 Trying alternative user profile fetch for: ${phoneNumber}`);

      // Clean phone number (remove + and formatting)
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      
      const profileUrl = `${this.whatsappApiUrl}/${cleanPhone}`;
      
      const response = await fetch(profileUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ User profile fetch failed: ${response.status}`);
        return null;
      }

      const profileData = await response.json();
      console.log(`✅ User profile data:`, JSON.stringify(profileData, null, 2));

      return {
        phoneNumber: phoneNumber,
        name: profileData.name || null,
        profilePicture: profileData.profile_pic || null,
        status: profileData.status || null
      };
    } catch (error) {
      console.error(`❌ Error fetching user profile for ${phoneNumber}:`, error);
      return null;
    }
  }

  // Extract all available name information from WhatsApp data
  extractContactNames(messageData, webhookData = null) {
    const names = {
      phoneNumber: messageData.from,
      profileName: null,
      displayName: null,
      businessName: null,
      pushName: null,
      contactName: null
    };

    // Check message data for profile name
    if (messageData.profile && messageData.profile.name) {
      names.profileName = messageData.profile.name;
    }

    // Check for push name (name set by user in their WhatsApp)
    if (messageData.push_name) {
      names.pushName = messageData.push_name;
    }

    // Check webhook contacts array
    if (webhookData && webhookData.contacts) {
      webhookData.contacts.forEach(contact => {
        if (contact.wa_id === messageData.from) {
          names.contactName = contact.name;
          if (contact.profile) {
            names.profileName = contact.profile.name;
          }
        }
      });
    }

    // Check for any additional name fields
    if (messageData.name) {
      names.displayName = messageData.name;
    }

    console.log(`📇 Extracted names for ${names.phoneNumber}:`, names);
    return names;
  }

  // Get the best available display name
  getBestDisplayName(contactNames) {
    // Priority order: pushName > profileName > contactName > displayName > phone number
    return contactNames.pushName || 
           contactNames.profileName || 
           contactNames.contactName || 
           contactNames.displayName || 
           contactNames.phoneNumber;
  }
}

module.exports = new WhatsAppContactService();
