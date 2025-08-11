// Facebook Webhook Setup Script
// Configures Facebook webhooks for real-time comments and messages

const fetch = require('node-fetch');

// Configuration - Update these values
const FACEBOOK_APP_ID = '1321204592440998';
const FACEBOOK_ACCESS_TOKEN = 'EAASxoOpodqYBPP9CiLOvsfBipThgT1ms9rqSiAfJa7YQXGOBZABaXgVkfofnFdkjogfFuZBZBU5bs22RaQJVZAZBbIU1IsxZBH2ZANLojf3IIhZAnBae2Fjw4cPP6Lbk6foM2YYfkRYvmAlSS4RsyIbPbgEvCEMG1dZC7ZAsQarFIf6rUe7penB1xAJs9H5ZBdCPQZDZD';
const WEBHOOK_VERIFY_TOKEN = 'stella_webhook_2025';

// Your deployed app URL (update when deployed to Railway)
const APP_URL = process.env.NODE_ENV === 'production' 
  ? 'https://stella-api.up.railway.app' 
  : 'http://localhost:3000';
const WEBHOOK_URL = `${APP_URL}/api/webhook/facebook`;

async function setupFacebookWebhooks() {
  console.log('🚀 Setting up Facebook Webhooks for Real-time Comments & Messages\n');

  try {
    // Step 1: Get Facebook Pages
    console.log('1️⃣ Getting Facebook Pages...');
    const pages = await getFacebookPages();
    
    if (pages.length === 0) {
      console.log('❌ No pages found. Make sure your access token has page permissions.');
      return;
    }

    console.log(`✅ Found ${pages.length} pages:`);
    pages.forEach(page => {
      console.log(`   📘 ${page.name} (ID: ${page.id})`);
    });

    // Step 2: Set up webhooks for each page
    console.log('\n2️⃣ Setting up page webhooks...');
    for (const page of pages) {
      await setupPageWebhook(page);
    }

    // Step 3: Set up app-level webhooks
    console.log('\n3️⃣ Setting up app-level webhooks...');
    await setupAppWebhook();

    // Step 4: Subscribe to webhook fields
    console.log('\n4️⃣ Subscribing to webhook fields...');
    await subscribeWebhookFields();

    console.log('\n🎉 Facebook Webhook Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log(`   1. Webhook URL: ${WEBHOOK_URL}`);
    console.log(`   2. Verify Token: ${WEBHOOK_VERIFY_TOKEN}`);
    console.log('   3. Test by posting a comment on your Facebook page');
    console.log('   4. Check server logs for incoming webhook notifications');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

async function getFacebookPages() {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${FACEBOOK_ACCESS_TOKEN}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get pages');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error getting pages:', error);
    return [];
  }
}

async function setupPageWebhook(page) {
  try {
    console.log(`   🔧 Setting up webhook for: ${page.name}`);

    // Subscribe to page webhook
    const response = await fetch(`https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscribed_fields: [
          'feed',           // Post comments
          'conversations',  // Page messages
          'messages',       // Direct messages
          'messaging_postbacks',
          'messaging_optins',
          'message_deliveries',
          'message_reads'
        ].join(','),
        access_token: page.access_token
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`   ✅ ${page.name}: Webhook configured`);
    } else {
      console.log(`   ❌ ${page.name}: ${data.error?.message || 'Setup failed'}`);
    }

  } catch (error) {
    console.log(`   ❌ ${page.name}: ${error.message}`);
  }
}

async function setupAppWebhook() {
  try {
    console.log('   🔧 Configuring app webhook...');

    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_APP_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'page',
        callback_url: WEBHOOK_URL,
        verify_token: WEBHOOK_VERIFY_TOKEN,
        fields: [
          'feed',
          'conversations', 
          'messages',
          'messaging_postbacks',
          'messaging_optins',
          'message_deliveries',
          'message_reads'
        ].join(','),
        access_token: `${FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET || 'your_app_secret'}`
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ App webhook configured successfully');
    } else {
      console.log('   ❌ App webhook setup failed:', data.error?.message || 'Unknown error');
    }

  } catch (error) {
    console.log('   ❌ App webhook error:', error.message);
  }
}

async function subscribeWebhookFields() {
  try {
    console.log('   🔧 Subscribing to webhook fields...');

    // Subscribe to page feed and conversations
    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_APP_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'page',
        callback_url: WEBHOOK_URL,
        fields: 'feed,conversations,messages',
        verify_token: WEBHOOK_VERIFY_TOKEN,
        access_token: FACEBOOK_ACCESS_TOKEN
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Webhook fields subscribed');
    } else {
      console.log('   ❌ Field subscription failed:', data.error?.message || 'Unknown error');
    }

    // Also subscribe to Instagram if available
    await subscribeInstagramWebhook();

  } catch (error) {
    console.log('   ❌ Field subscription error:', error.message);
  }
}

async function subscribeInstagramWebhook() {
  try {
    console.log('   🔧 Setting up Instagram webhooks...');

    const response = await fetch(`https://graph.facebook.com/v18.0/${FACEBOOK_APP_ID}/subscriptions`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'instagram',
        callback_url: WEBHOOK_URL,
        fields: 'comments,mentions',
        verify_token: WEBHOOK_VERIFY_TOKEN,
        access_token: FACEBOOK_ACCESS_TOKEN
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Instagram webhook configured');
    } else {
      console.log('   ⚠️ Instagram webhook setup (may require Instagram Business account):', data.error?.message || 'Unknown error');
    }

  } catch (error) {
    console.log('   ⚠️ Instagram webhook warning:', error.message);
  }
}

// Test webhook endpoint
async function testWebhook() {
  console.log('\n🧪 Testing webhook endpoint...');

  try {
    const response = await fetch(`${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${WEBHOOK_VERIFY_TOKEN}&hub.challenge=test_challenge`, {
      method: 'GET'
    });

    if (response.ok) {
      const challenge = await response.text();
      console.log('✅ Webhook endpoint is working');
      console.log(`   Challenge response: ${challenge}`);
    } else {
      console.log('❌ Webhook endpoint test failed');
    }

  } catch (error) {
    console.log('❌ Webhook test error:', error.message);
    console.log('   Make sure your server is running and accessible');
  }
}

// Manual webhook verification for development
async function manualWebhookSetup() {
  console.log('\n🛠️ Manual Webhook Configuration Instructions:\n');
  console.log('1. Go to Facebook Developers: https://developers.facebook.com');
  console.log(`2. Select your app (ID: ${FACEBOOK_APP_ID})`);
  console.log('3. Go to Webhooks in the left sidebar');
  console.log('4. Click "Edit Subscription" for the Page object');
  console.log(`5. Set Callback URL: ${WEBHOOK_URL}`);
  console.log(`6. Set Verify Token: ${WEBHOOK_VERIFY_TOKEN}`);
  console.log('7. Subscribe to these fields:');
  console.log('   - feed (for comments)');
  console.log('   - conversations (for messages)');
  console.log('   - messages (for direct messages)');
  console.log('8. Save and verify the webhook');
  console.log('\nFor Instagram:');
  console.log('1. Add Instagram object in webhooks');
  console.log('2. Subscribe to: comments, mentions');
  console.log(`3. Use same callback URL: ${WEBHOOK_URL}`);
  console.log(`4. Use same verify token: ${WEBHOOK_VERIFY_TOKEN}`);
}

// Run setup
if (require.main === module) {
  console.log('Facebook Webhook Setup\n');
  console.log('Choose an option:');
  console.log('1. Automatic setup (recommended)');
  console.log('2. Manual setup instructions');
  console.log('3. Test webhook endpoint');

  const option = process.argv[2] || '1';

  switch (option) {
    case '1':
    case 'auto':
      setupFacebookWebhooks();
      break;
    case '2':
    case 'manual':
      manualWebhookSetup();
      break;
    case '3':
    case 'test':
      testWebhook();
      break;
    default:
      setupFacebookWebhooks();
  }
}

module.exports = {
  setupFacebookWebhooks,
  testWebhook,
  manualWebhookSetup
};
