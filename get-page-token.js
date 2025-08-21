// Get Facebook Page Access Token from Permanent Access Token
// Usage: node get-page-token.js

require('dotenv').config();
const fetch = require('node-fetch');

async function getPageAccessToken() {
  try {
    const permanentToken = process.env.FACEBOOK_PERMANENT_ACCESS_TOKEN;
    
    if (!permanentToken) {
      console.log('❌ No permanent access token found in environment');
      return;
    }
    
    console.log('🔑 Using permanent token:', permanentToken.substring(0, 20) + '...');
    
    // Get user's pages
    console.log('🔄 Fetching user pages...');
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${permanentToken}`);
    const pagesData = await pagesResponse.json();
    
    if (!pagesResponse.ok) {
      console.log('❌ Error fetching pages:', pagesData);
      return;
    }
    
    console.log('📋 Pages found:', pagesData.data?.length || 0);
    
    if (pagesData.data && pagesData.data.length > 0) {
      // Find our page (SUSA Shapewear - page ID: 113981868340389)
      const susaPage = pagesData.data.find(page => page.id === '113981868340389');
      
      if (susaPage) {
        console.log('✅ Found SUSA Shapewear page!');
        console.log('📄 Page Name:', susaPage.name);
        console.log('🆔 Page ID:', susaPage.id);
        console.log('🔑 Page Access Token:', susaPage.access_token.substring(0, 30) + '...');
        
        console.log('\n📝 Add this to your .env file:');
        console.log(`FACEBOOK_PAGE_ACCESS_TOKEN=${susaPage.access_token}`);
        
        return susaPage.access_token;
      } else {
        console.log('⚠️ SUSA Shapewear page not found. Available pages:');
        pagesData.data.forEach(page => {
          console.log(`  - ${page.name} (ID: ${page.id})`);
        });
      }
    } else {
      console.log('⚠️ No pages found for this user');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getPageAccessToken();
