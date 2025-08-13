#!/usr/bin/env node

/**
 * Test Script: Comment Status Tracking
 * Tests the new comment deletion/editing tracking functionality
 */

const http = require('http');

// Test webhook payloads
const testPayloads = {
  // New comment
  newComment: {
    entry: [{
      id: "123456789",
      changes: [{
        field: "feed",
        value: {
          verb: "add",
          item: "comment",
          comment_id: "test_comment_123",
          post_id: "test_post_456",
          created_time: new Date().toISOString(),
          message: "This is a test comment for tracking",
          from: {
            id: "test_user_789",
            name: "Test User",
            username: "testuser"
          },
          parent_id: "test_post_456"
        }
      }]
    }]
  },

  // Comment edited
  editComment: {
    entry: [{
      id: "123456789", 
      changes: [{
        field: "feed",
        value: {
          verb: "edit",
          item: "comment",
          comment_id: "test_comment_123",
          post_id: "test_post_456",
          created_time: new Date().toISOString(),
          message: "This is an EDITED test comment for tracking",
          from: {
            id: "test_user_789",
            name: "Test User",
            username: "testuser"
          },
          parent_id: "test_post_456"
        }
      }]
    }]
  },

  // Comment deleted
  deleteComment: {
    entry: [{
      id: "123456789",
      changes: [{
        field: "feed",
        value: {
          verb: "remove",
          item: "comment", 
          comment_id: "test_comment_123",
          post_id: "test_post_456",
          created_time: new Date().toISOString(),
          from: {
            id: "test_user_789",
            name: "Test User",
            username: "testuser"
          },
          parent_id: "test_post_456"
        }
      }]
    }]
  }
};

// Function to send webhook
function sendWebhook(payload, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/social-commenter?action=webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Hub-Signature-256': 'sha256=test' // Mock signature for testing
      }
    };

    console.log(`\n🧪 Testing: ${description}`);
    console.log('📤 Sending webhook payload...');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✅ Response Status: ${res.statusCode}`);
        try {
          const response = JSON.parse(data);
          console.log('📥 Response:', response);
          resolve(response);
        } catch (e) {
          console.log('📥 Raw Response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Function to check comments in database
function checkComments() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/social-commenter?action=comments',
      method: 'GET'
    };

    console.log('\n🔍 Checking comments in database...');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.comments) {
            console.log(`📊 Found ${response.comments.length} comments:`);
            response.comments.forEach((comment, index) => {
              console.log(`  ${index + 1}. Comment ID: ${comment.id}`);
              console.log(`     Text: "${comment.comment_text}"`);
              console.log(`     Status: ${comment.status}`);
              console.log(`     Deleted: ${comment.is_deleted || false}`);
              console.log(`     Edited: ${comment.is_edited || false}`);
              if (comment.edit_count > 0) {
                console.log(`     Edit Count: ${comment.edit_count}`);
              }
              if (comment.original_text) {
                console.log(`     Original Text: "${comment.original_text}"`);
              }
            });
          } else {
            console.log('📊 No comments found or error:', response);
          }
          resolve(response);
        } catch (e) {
          console.log('📊 Raw Response:', data);
          resolve(data);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      reject(e);
    });

    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Comment Status Tracking Tests');
  console.log('==========================================');

  try {
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 1: Add new comment
    await sendWebhook(testPayloads.newComment, 'New Comment Creation');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkComments();

    // Test 2: Edit the comment
    await new Promise(resolve => setTimeout(resolve, 2000));
    await sendWebhook(testPayloads.editComment, 'Comment Edit');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkComments();

    // Test 3: Delete the comment
    await new Promise(resolve => setTimeout(resolve, 2000));
    await sendWebhook(testPayloads.deleteComment, 'Comment Deletion');
    await new Promise(resolve => setTimeout(resolve, 1000));
    await checkComments();

    console.log('\n🎉 All tests completed!');
    console.log('\nNext steps:');
    console.log('1. Check the frontend to see visual indicators');
    console.log('2. Open a social media conversation in the chat interface');
    console.log('3. Look for 🗑️ DELETED and ✏️ EDITED badges on comments');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
