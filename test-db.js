const whatsappMessageService = require('./services/whatsappMessageService');

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection and message saving...');
    
    // Test saving an outgoing message
    const testMessage = {
      whatsappMessageId: 'test_message_' + Date.now(),
      to: '+1234567890',
      messageType: 'text',
      content: 'Test message from database script'
    };
    
    console.log('Attempting to save test message:', testMessage);
    
    const result = await whatsappMessageService.saveOutgoingMessage(testMessage);
    console.log('✅ Message saved successfully:', result);
    
    // Test getting conversation history
    console.log('\n📋 Getting conversation history...');
    const messages = await whatsappMessageService.getConversationHistory('+1234567890');
    console.log('✅ Retrieved messages:', messages.length);
    
    if (messages.length > 0) {
      console.log('Latest message:', messages[0]);
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testDatabase();
