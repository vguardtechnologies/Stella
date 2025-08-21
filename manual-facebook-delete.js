// Manual Facebook Comment Deletion Script
// Run this with: node manual-facebook-delete.js

const fetch = require('node-fetch');
require('dotenv').config();

async function deleteCommentFromFacebook(commentId) {
  try {
    console.log(`🔄 Attempting to delete Facebook comment: ${commentId}`);
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.FACEBOOK_ACCESS_TOKEN}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Successfully deleted comment from Facebook:`, result);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Failed to delete comment from Facebook:`, errorText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error deleting comment from Facebook:`, error.message);
    return false;
  }
}

// Delete comment 711 (FB ID: 4098004940516856)
async function main() {
  console.log('🚀 Starting manual Facebook comment deletion...');
  
  const commentId = '4098004940516856'; // Facebook ID for comment 711
  const success = await deleteCommentFromFacebook(commentId);
  
  if (success) {
    console.log('🎉 Manual deletion completed successfully!');
  } else {
    console.log('⚠️ Manual deletion failed. Check the logs above.');
  }
}

main().catch(console.error);
