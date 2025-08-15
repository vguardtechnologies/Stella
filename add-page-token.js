const { pool } = require('./config/database');

async function addPageTokenForComments() {
  try {
    console.log('🔧 Adding Page Access Token for Comments (Keeping User Token)...\n');
    
    // Get current user token from database
    const result = await pool.query(`
      SELECT id, access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No Facebook platform found in database');
      process.exit(1);
    }
    
    const userToken = result.rows[0].access_token;
    const platformId = result.rows[0].id;
    const currentAccountInfo = result.rows[0].account_info || {};
    
    console.log('🔍 Current User Token:', userToken.substring(0, 50) + '...');
    console.log('🔍 Current Account Info:', JSON.stringify(currentAccountInfo, null, 2));
    
    // Get user's pages using the user token
    console.log('\n📋 Fetching user pages...');
    
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}`);
    const pagesData = await pagesResponse.json();
    
    if (pagesData.error) {
      console.log('❌ Error fetching pages:', pagesData.error.message);
      process.exit(1);
    }
    
    console.log(`✅ Found ${pagesData.data.length} page(s):\n`);
    
    pagesData.data.forEach((page, index) => {
      console.log(`${index + 1}. Page: ${page.name}`);
      console.log(`   Page ID: ${page.id}`);
      console.log(`   Page Token Length: ${page.access_token.length}`);
      console.log(`   Permissions: ${page.perms?.join(', ') || 'Not specified'}`);
      console.log('');
    });
    
    // Find SUSA page or use first page
    const susaPage = pagesData.data.find(page => 
      page.name.includes('SUSA') || 
      page.name.includes('Shapewear') ||
      page.id === '113981868340389'
    ) || pagesData.data[0];
    
    if (!susaPage) {
      console.log('❌ No suitable page found');
      process.exit(1);
    }
    
    console.log(`🎯 Selected page: ${susaPage.name} (ID: ${susaPage.id})`);
    
    // Create enhanced account info with BOTH tokens
    const enhancedAccountInfo = {
      ...currentAccountInfo,
      // Keep existing user-level info
      user_token: userToken,  // Preserve user access token
      // Add page-specific info
      page_id: susaPage.id,
      page_name: susaPage.name,
      page_token: susaPage.access_token,  // Add page access token
      // Track which token to use for what
      tokens: {
        user: {
          token: userToken,
          use_for: ['browsing', 'reading_pages', 'user_info'],
          length: userToken.length
        },
        page: {
          token: susaPage.access_token,
          use_for: ['commenting', 'page_management', 'posting'],
          length: susaPage.access_token.length,
          page_id: susaPage.id,
          page_name: susaPage.name
        }
      }
    };
    
    console.log('\n💾 Updating database with BOTH tokens...');
    console.log('📋 New structure:');
    console.log('   ✅ User Token (for browsing): PRESERVED');
    console.log('   ✅ Page Token (for comments): ADDED');
    console.log('   ✅ Primary access_token field: Will use PAGE token (for comments)');
    
    // Update database - use PAGE token as primary (for comments), but preserve user token
    await pool.query(`
      UPDATE social_platforms 
      SET access_token = $1,  -- Primary token = page token (for comments)
          account_info = $2::jsonb,
          updated_at = NOW()
      WHERE id = $3
    `, [
      susaPage.access_token,  // Primary token for comments
      JSON.stringify(enhancedAccountInfo),
      platformId
    ]);
    
    console.log('✅ Database updated successfully!');
    
    // Test both tokens
    console.log('\n🧪 Testing tokens...');
    
    // Test user token (from account_info)
    console.log('1. Testing User Token (for browsing):');
    const userTestResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${userToken}`);
    const userTestData = await userTestResponse.json();
    
    if (userTestData.error) {
      console.log('   ❌ User token test failed:', userTestData.error.message);
    } else {
      console.log('   ✅ User token works!');
      console.log(`   📋 User: ${userTestData.name} (${userTestData.id})`);
    }
    
    // Test page token (primary access_token)
    console.log('\n2. Testing Page Token (for commenting):');
    const pageTestResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${susaPage.access_token}`);
    const pageTestData = await pageTestResponse.json();
    
    if (pageTestData.error) {
      console.log('   ❌ Page token test failed:', pageTestData.error.message);
    } else {
      console.log('   ✅ Page token works!');
      console.log(`   📋 Page: ${pageTestData.name} (${pageTestData.id})`);
    }
    
    console.log('\n🎉 Enhancement Complete!');
    console.log('📝 Summary:');
    console.log(`   ✅ User Access Token: PRESERVED (for browsing)`);
    console.log(`   ✅ Page Access Token: ADDED (for commenting)`);
    console.log(`   ✅ Both tokens stored in account_info`);
    console.log(`   ✅ Primary access_token = Page Token (fixes comment replies)`);
    console.log('\n💬 You can now reply to Facebook comments AND keep all existing functionality!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

addPageTokenForComments();
