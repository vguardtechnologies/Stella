// Test Facebook Comment Hide API
// Usage: node test-facebook-hide.js <comment_id>

const fetch = require('node-fetch');

async function testFacebookHide(commentId) {
  try {
    console.log(`🙈 Testing Facebook comment hide API...`);
    console.log(`📋 Comment ID: ${commentId}`);
    
    const response = await fetch(`http://localhost:3000/api/social-commenter?action=hide-comment&commentId=${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Hide API Test Result:`, result);
    } else {
      console.log(`❌ Hide API Test Failed:`, result);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Test Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test with a comment ID
async function main() {
  const commentId = process.argv[2] || '710'; // Default to comment 710
  console.log(`🚀 Starting Facebook hide test for comment: ${commentId}`);
  
  const result = await testFacebookHide(commentId);
  
  if (result.success) {
    console.log('🎉 Hide test completed successfully!');
    console.log('📋 Moderation Note:', result.moderationNote);
    console.log('📘 Facebook Hide Success:', result.facebookHideSuccess);
  } else {
    console.log('⚠️ Hide test failed. Check the logs above.');
  }
}

main().catch(console.error);
