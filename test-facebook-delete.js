// Test Facebook Comment Deletion API
// Usage: node test-facebook-delete.js <fb_comment_id>

const fetch = require('node-fetch');

async function testFacebookDeletion(fbCommentId) {
  try {
    console.log(`🧪 Testing Facebook comment deletion API...`);
    console.log(`📋 Comment ID: ${fbCommentId}`);
    
    const response = await fetch(`http://localhost:3000/api/social-commenter?action=delete-facebook-comment&fbCommentId=${fbCommentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ API Test Result:`, result);
    } else {
      console.log(`❌ API Test Failed:`, result);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Test Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test with comment 711's Facebook ID
async function main() {
  const fbCommentId = process.argv[2] || '4098004940516856'; // Default to comment 711's FB ID
  console.log(`🚀 Starting Facebook deletion test for comment: ${fbCommentId}`);
  
  const result = await testFacebookDeletion(fbCommentId);
  
  if (result.success) {
    console.log('🎉 Test completed successfully!');
  } else {
    console.log('⚠️ Test failed. Check the logs above.');
  }
}

main().catch(console.error);
