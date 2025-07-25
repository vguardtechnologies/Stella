#!/usr/bin/env node

/**
 * Test Script for WhatsApp Contact Profile Extraction
 * 
 * This script tests the enhanced contact management system that can extract
 * WhatsApp profile names, display names, and other contact information
 * from webhook events and the WhatsApp Business API.
 */

const fetch = require('node-fetch');

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp';
const API_BASE = 'http://localhost:3000/api';

// Test scenarios for different WhatsApp contact name scenarios
const testScenarios = [
  {
    name: 'Contact with Profile Name',
    description: 'User has set a custom profile name in WhatsApp',
    webhookPayload: {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_entry_1',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              profile: {
                name: 'Sarah Johnson 🌟'  // This is the WhatsApp profile name
              },
              wa_id: '15551234568'
            }],
            messages: [{
              from: '15551234568',
              id: 'test_msg_1',
              timestamp: '1640995200',
              text: {
                body: 'Hello! I love your products 💖'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    }
  },
  {
    name: 'Contact with Business Name',
    description: 'User messaging from a WhatsApp Business account',
    webhookPayload: {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_entry_2',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              profile: {
                name: 'Miami Boutique Store'  // Business profile name
              },
              wa_id: '15551234569'
            }],
            messages: [{
              from: '15551234569',
              id: 'test_msg_2',
              timestamp: '1640995260',
              text: {
                body: 'Hi! Do you have this dress in size Medium?'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    }
  },
  {
    name: 'Contact with No Profile Name',
    description: 'User has not set a custom profile name - should fall back to phone number',
    webhookPayload: {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_entry_3',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              wa_id: '15551234570'
              // No profile name provided
            }],
            messages: [{
              from: '15551234570',
              id: 'test_msg_3',
              timestamp: '1640995320',
              text: {
                body: 'What are your shipping options?'
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    }
  },
  {
    name: 'Contact with Media Message and Profile',
    description: 'User sends image with caption and has profile name',
    webhookPayload: {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test_entry_4',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15551234567',
              phone_number_id: 'test_phone_id'
            },
            contacts: [{
              profile: {
                name: 'Emma Rodriguez ✨'
              },
              wa_id: '15551234571'
            }],
            messages: [{
              from: '15551234571',
              id: 'test_msg_4',
              timestamp: '1640995380',
              image: {
                caption: 'Does this color match the dress?',
                mime_type: 'image/jpeg',
                sha256: 'test_sha256_hash',
                id: 'test_media_id_4'
              },
              type: 'image'
            }]
          },
          field: 'messages'
        }]
      }]
    }
  }
];

async function runTest(scenario) {
  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📝 Description: ${scenario.description}`);
  
  try {
    // Send webhook payload
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scenario.webhookPayload)
    });

    if (response.ok) {
      console.log(`✅ Webhook processed successfully`);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check conversations to see if contact name was extracted
      const conversationsResponse = await fetch(`${API_BASE}/messages/conversations`);
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        
        const phoneNumber = scenario.webhookPayload.entry[0].changes[0].value.messages[0].from;
        const conversation = conversationsData.data?.find(conv => conv.phone_number === phoneNumber);
        
        if (conversation) {
          console.log(`📞 Phone: ${conversation.phone_number}`);
          console.log(`👤 Display Name: ${conversation.display_name || 'None'}`);
          console.log(`📝 Profile Name: ${conversation.profile_name || 'None'}`);
          console.log(`💬 Last Message: ${conversation.last_message_content || 'None'}`);
        } else {
          console.log(`❌ Conversation not found for ${phoneNumber}`);
        }
      }
    } else {
      console.log(`❌ Webhook failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

async function testContactApi() {
  console.log(`\n🧪 Testing Contact API`);
  
  try {
    // Test saving a contact with Susa suffix
    const contactData = {
      phone_number: '15551234568',
      saved_name: 'Sarah Johnson',
      has_susa_suffix: true,
      notes: 'VIP customer, loves floral dresses'
    };

    const saveResponse = await fetch(`${API_BASE}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (saveResponse.ok) {
      const savedContact = await saveResponse.json();
      console.log(`✅ Contact saved:`, savedContact);
      
      // Test retrieving all contacts
      const getResponse = await fetch(`${API_BASE}/contacts`);
      if (getResponse.ok) {
        const contacts = await getResponse.json();
        console.log(`📋 Total contacts: ${contacts.length}`);
        
        const ourContact = contacts.find(c => c.phone_number === contactData.phone_number);
        if (ourContact) {
          const displayName = ourContact.has_susa_suffix 
            ? `${ourContact.saved_name} 🦋Susa`
            : ourContact.saved_name;
          console.log(`👤 Retrieved contact: ${displayName}`);
        }
      }
    } else {
      console.log(`❌ Contact save failed: ${saveResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Contact API test failed: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting WhatsApp Contact Profile Extraction Tests');
  console.log('=' .repeat(60));
  
  // Test each scenario
  for (const scenario of testScenarios) {
    await runTest(scenario);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
  }
  
  // Test contact API
  await testContactApi();
  
  console.log('\n✨ All tests completed!');
  console.log('=' .repeat(60));
  console.log('🔍 Check the frontend at http://localhost:5173/ to see the results');
  console.log('📱 The contact names should now display WhatsApp profile names');
  console.log('💾 Saved contacts with Susa suffix should appear correctly');
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error);
