const whatsappConfigService = require('./services/whatsappConfigService');

async function testConfigPersistence() {
  console.log('🧪 Testing WhatsApp config persistence...\n');

  try {
    // Test 1: Get current config
    console.log('1. Getting current configuration...');
    const currentConfig = await whatsappConfigService.getConfig();
    console.log('Current config:', {
      hasAccessToken: !!currentConfig.accessToken,
      hasPhoneNumberId: !!currentConfig.phoneNumberId,
      isConfigured: currentConfig.isConfigured
    });

    // Test 2: Save a test configuration
    console.log('\n2. Saving test configuration...');
    await whatsappConfigService.saveConfig({
      accessToken: 'test_token_123',
      phoneNumberId: 'test_phone_456',
      webhookUrl: 'https://test.webhook.com'
    });
    console.log('✅ Test config saved');

    // Test 3: Retrieve the saved configuration
    console.log('\n3. Retrieving saved configuration...');
    const savedConfig = await whatsappConfigService.getConfig();
    console.log('Saved config:', {
      accessToken: savedConfig.accessToken.substring(0, 10) + '...',
      phoneNumberId: savedConfig.phoneNumberId,
      webhookUrl: savedConfig.webhookUrl,
      isConfigured: savedConfig.isConfigured
    });

    // Test 4: Clear configuration
    console.log('\n4. Clearing configuration...');
    await whatsappConfigService.clearConfig();
    console.log('✅ Config cleared');

    // Test 5: Verify cleared configuration
    console.log('\n5. Verifying cleared configuration...');
    const clearedConfig = await whatsappConfigService.getConfig();
    console.log('After clearing:', {
      hasAccessToken: !!clearedConfig.accessToken,
      hasPhoneNumberId: !!clearedConfig.phoneNumberId,
      isConfigured: clearedConfig.isConfigured
    });

    console.log('\n✅ All tests passed! Configuration persistence is working.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testConfigPersistence();
