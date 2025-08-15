#!/usr/bin/env node

/**
 * Facebook Access Token & Permissions Tester
 * Tests Facebook access token and checks required permissions for comment replies
 */

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'stella_whatsapp',
  user: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});

async function testFacebookPermissions() {
  try {
    console.log('🔍 Testing Facebook Access Token & Permissions...\n');

    // Get Facebook access token from database
    const query = `
      SELECT * FROM social_platforms 
      WHERE platform_type = 'facebook' 
      AND access_token IS NOT NULL
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ No Facebook access token found in database');
      return;
    }

    const platform = result.rows[0];
    const accessToken = platform.access_token;
    
    console.log('✅ Found Facebook access token');
    console.log(`📊 Token length: ${accessToken.length} characters`);
    console.log(`🆔 Platform ID: ${platform.id}`);
    console.log(`📅 Last updated: ${platform.updated_at}\n`);

    // Test 1: Get token info
    console.log('🔍 Test 1: Checking token info...');
    const tokenInfoResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
    const tokenInfo = await tokenInfoResponse.json();
    
    if (tokenInfo.error) {
      console.log('❌ Token validation failed:', tokenInfo.error.message);
      return;
    }
    
    console.log('✅ Token is valid');
    console.log(`📱 Connected to: ${tokenInfo.name} (ID: ${tokenInfo.id})\n`);

    // Test 2: Check permissions
    console.log('🔍 Test 2: Checking permissions...');
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${accessToken}`);
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsData.error) {
      console.log('❌ Could not fetch permissions:', permissionsData.error.message);
      return;
    }

    const permissions = permissionsData.data;
    const grantedPermissions = permissions.filter(p => p.status === 'granted').map(p => p.permission);
    
    console.log('✅ Current permissions:');
    grantedPermissions.forEach(perm => console.log(`  ✓ ${perm}`));
    
    // Check required permissions
    const requiredPermissions = [
      'pages_manage_posts',
      'pages_read_engagement', 
      'pages_show_list',
      'publish_to_groups'
    ];
    
    console.log('\n🔍 Checking required permissions for comment replies:');
    let hasAllPermissions = true;
    
    requiredPermissions.forEach(reqPerm => {
      const hasPermission = grantedPermissions.includes(reqPerm);
      console.log(`  ${hasPermission ? '✅' : '❌'} ${reqPerm}`);
      if (!hasPermission) hasAllPermissions = false;
    });

    // Test 3: Try to access the specific comment
    console.log('\n🔍 Test 3: Testing access to comment ID 2235330920251069...');
    const commentId = '2235330920251069';
    const commentResponse = await fetch(`https://graph.facebook.com/v18.0/${commentId}?access_token=${accessToken}`);
    const commentData = await commentResponse.json();
    
    if (commentData.error) {
      console.log('❌ Cannot access comment:', commentData.error.message);
      console.log(`   Error code: ${commentData.error.code}, subcode: ${commentData.error.error_subcode}`);
    } else {
      console.log('✅ Can access comment:', commentData.message || commentData.id);
    }

    // Test 4: Try a different approach - check if it's a page access token
    console.log('\n🔍 Test 4: Checking if token is a page access token...');
    const pageResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pageData = await pageResponse.json();
    
    if (!pageData.error && pageData.data && pageData.data.length > 0) {
      console.log('✅ Found pages managed by this token:');
      pageData.data.forEach(page => {
        console.log(`  📄 ${page.name} (ID: ${page.id})`);
        console.log(`     Category: ${page.category}`);
      });
    } else {
      console.log('ℹ️  This appears to be a page access token, not a user token');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Token is valid: ${tokenInfo.name}`);
    console.log(`${hasAllPermissions ? '✅' : '❌'} Has required permissions: ${hasAllPermissions ? 'YES' : 'NO'}`);
    
    if (!hasAllPermissions) {
      console.log('\n🔧 SOLUTION:');
      console.log('Your Facebook App needs additional permissions. Please:');
      console.log('1. Go to Facebook Developer Console');
      console.log('2. Add these permissions to your app:');
      requiredPermissions.forEach(perm => {
        if (!grantedPermissions.includes(perm)) {
          console.log(`   - ${perm}`);
        }
      });
      console.log('3. Generate a new access token with these permissions');
      console.log('4. Update the token in your database');
    }

  } catch (error) {
    console.error('❌ Error testing Facebook permissions:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testFacebookPermissions();
