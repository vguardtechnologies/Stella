#!/usr/bin/env node

/**
 * Test script for page replies endpoint
 * Tests the /api/comment-replies endpoint we implemented
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testPageRepliesEndpoint() {
  console.log('🧪 Testing page replies endpoint...');
  
  try {
    // First, let's get some actual comment IDs from our database
    console.log('📝 Getting comment IDs from the database...');
    
    const response = await axios.get(`${API_BASE}/api/social-comments`);
    const comments = response.data;
    
    if (!comments || comments.length === 0) {
      console.log('⚠️ No comments found in database');
      return;
    }
    
    console.log(`✅ Found ${comments.length} comments in database`);
    
    // Get a few comment IDs for testing
    const commentIds = comments.slice(0, 5).map(comment => comment.id);
    console.log('🔍 Testing with comment IDs:', commentIds);
    
    // Test the page replies endpoint
    const pageRepliesResponse = await axios.get(`${API_BASE}/api/comment-replies`, {
      params: { commentIds: commentIds.join(',') }
    });
    
    console.log('📱 Page replies response:');
    console.log(JSON.stringify(pageRepliesResponse.data, null, 2));
    
    // Check if we got any replies
    const totalReplies = Object.values(pageRepliesResponse.data).reduce((sum, replies) => sum + replies.length, 0);
    console.log(`✅ Successfully fetched page replies for ${commentIds.length} comments (${totalReplies} total replies found)`);
    
  } catch (error) {
    console.error('❌ Error testing page replies endpoint:', error.response?.data || error.message);
  }
}

async function testSpecificComment() {
  console.log('\n🎯 Testing with a specific comment that might have replies...');
  
  try {
    // Test with a known comment ID that might have replies
    const testCommentId = '114100718404127_1215089659915965';
    const response = await axios.get(`${API_BASE}/api/comment-replies`, {
      params: { commentIds: testCommentId }
    });
    
    console.log('📱 Specific comment test result:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing specific comment:', error.response?.data || error.message);
  }
}

// Run the tests
async function main() {
  console.log('🚀 Starting page replies endpoint tests\n');
  
  await testPageRepliesEndpoint();
  await testSpecificComment();
  
  console.log('\n✅ Tests completed!');
}

main().catch(console.error);
