const { pool } = require('./config/database');

async function analyzeAuthorNames() {
  try {
    console.log('🔍 Analyzing Comment Author Names...\n');
    
    // Get all Facebook comments with author analysis
    const commentsResult = await pool.query(`
      SELECT id, external_comment_id, author_name, author_handle, author_id, 
             comment_text, created_at, external_post_id
      FROM social_comments 
      WHERE platform_id = (SELECT id FROM social_platforms WHERE platform_type = 'facebook')
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total Facebook comments: ${commentsResult.rows.length}\n`);
    
    // Group by author name
    const authorCounts = {};
    const susaComments = [];
    const otherComments = [];
    
    commentsResult.rows.forEach(comment => {
      const author = comment.author_name || 'Unknown';
      authorCounts[author] = (authorCounts[author] || 0) + 1;
      
      if (author === 'SUSA') {
        susaComments.push(comment);
      } else {
        otherComments.push(comment);
      }
    });
    
    console.log('👥 Author Name Distribution:');
    Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([author, count]) => {
        const indicator = author === 'SUSA' ? '⚠️ ' : '✅ ';
        console.log(`   ${indicator}${author}: ${count} comment${count > 1 ? 's' : ''}`);
      });
    
    console.log(`\n🔍 Detailed Analysis of SUSA Comments (${susaComments.length} total):`);
    susaComments.forEach((comment, index) => {
      console.log(`${index + 1}. Comment ID ${comment.id}:`);
      console.log(`   External ID: ${comment.external_comment_id}`);
      console.log(`   Author ID: ${comment.author_id || 'Not captured'}`);
      console.log(`   Author Handle: ${comment.author_handle || 'Not captured'}`);
      console.log(`   Content: ${comment.comment_text?.substring(0, 80)}...`);
      console.log(`   Post ID: ${comment.external_post_id}`);
      console.log(`   Created: ${comment.created_at}`);
      console.log('');
    });
    
    // Let's check what Facebook says about these comments
    console.log('🔍 Cross-checking with Facebook API...\n');
    
    // Get access token
    const tokenResult = await pool.query(`
      SELECT access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    const accessToken = tokenResult.rows[0].access_token;
    const accountInfo = tokenResult.rows[0].account_info;
    
    console.log(`📋 Your Page Info from Database:`);
    console.log(`   Page Name: ${accountInfo.page_name}`);
    console.log(`   Page ID: ${accountInfo.page_id}`);
    
    // Check a few SUSA comments against Facebook
    console.log('\n🧪 Checking SUSA comments against Facebook API:');
    
    for (let i = 0; i < Math.min(3, susaComments.length); i++) {
      const comment = susaComments[i];
      const actualCommentId = comment.external_comment_id.includes('_') ? 
        comment.external_comment_id.split('_')[1] : 
        comment.external_comment_id;
      
      console.log(`\nChecking comment ${comment.id} (${actualCommentId}):`);
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}`);
        const fbData = await response.json();
        
        if (fbData.error) {
          console.log(`   ❌ Error: ${fbData.error.message}`);
        } else {
          console.log(`   ✅ Facebook Data:`);
          console.log(`      FB Author: ${fbData.from?.name || 'Unknown'}`);
          console.log(`      FB Author ID: ${fbData.from?.id || 'Unknown'}`);
          console.log(`      DB Author: ${comment.author_name}`);
          console.log(`      DB Author ID: ${comment.author_id}`);
          
          // Check if this is actually your page commenting
          if (fbData.from?.id === accountInfo.page_id) {
            console.log(`   🎯 ANALYSIS: This is YOUR page commenting (page replies)`);
          } else if (fbData.from?.name !== comment.author_name) {
            console.log(`   ⚠️  ANALYSIS: Author name mismatch - DB may need update`);
          } else {
            console.log(`   ✅ ANALYSIS: Author name matches Facebook`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
        
      } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total comments: ${commentsResult.rows.length}`);
    console.log(`   SUSA comments: ${susaComments.length}`);
    console.log(`   Other authors: ${otherComments.length}`);
    console.log(`   Unique authors: ${Object.keys(authorCounts).length}`);
    
    if (susaComments.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. If SUSA comments are your page replies → This is normal');
      console.log('2. If SUSA comments should be customer comments → Data needs correction');
      console.log('3. Consider filtering out page replies from customer comment display');
      console.log('4. You may want to exclude SUSA comments from reply workflows');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeAuthorNames();
