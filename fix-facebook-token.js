const { pool } = require('./config/database');

async function fixFacebookToken() {
  try {
    console.log('🔧 Fixing Facebook Token Issue...\n');
    
    // Get current user token from database
    const result = await pool.query(`
      SELECT id, access_token 
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
    
    console.log('🔍 Current User Token:', userToken.substring(0, 50) + '...');
    console.log('🔍 Token Length:', userToken.length);
    
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
      console.log(`   Page Token Preview: ${page.access_token.substring(0, 50)}...`);
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
    console.log(`🔑 Page Access Token: ${susaPage.access_token.substring(0, 50)}...`);
    console.log(`📏 Page Token Length: ${susaPage.access_token.length}`);
    
    // Update database with page token
    console.log('\n💾 Updating database with Page Access Token...');
    
    await pool.query(`
      UPDATE social_platforms 
      SET access_token = $1,
          account_info = jsonb_set(
            account_info,
            '{page_id}',
            $2::jsonb
          ),
          account_info = jsonb_set(
            account_info,
            '{page_name}',
            $3::jsonb
          ),
          updated_at = NOW()
      WHERE id = $4
    `, [
      susaPage.access_token,
      JSON.stringify(susaPage.id),
      JSON.stringify(susaPage.name),
      platformId
    ]);
    
    console.log('✅ Database updated successfully!');
    
    // Test the new token
    console.log('\n🧪 Testing new Page Access Token...');
    
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${susaPage.access_token}`);
    const testData = await testResponse.json();
    
    if (testData.error) {
      console.log('❌ Page token test failed:', testData.error.message);
    } else {
      console.log('✅ Page token test successful!');
      console.log(`   Page Name: ${testData.name}`);
      console.log(`   Page ID: ${testData.id}`);
    }
    
    console.log('\n🎉 Fix Complete!');
    console.log('📝 Summary:');
    console.log(`   ✅ Replaced User Access Token with Page Access Token`);
    console.log(`   ✅ Token Length: ${userToken.length} → ${susaPage.access_token.length}`);
    console.log(`   ✅ Page: ${susaPage.name} (${susaPage.id})`);
    console.log('\n💬 You can now reply to Facebook comments!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixFacebookToken();
