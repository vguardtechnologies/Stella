const { pool } = require('./config/database');

async function quickFacebookTest() {
  try {
    console.log('⚡ Quick Facebook Comments Test');
    console.log('==============================\n');
    
    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook platform found');
      return;
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    
    // Get total comment count
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
    `);
    
    const total = parseInt(totalResult.rows[0].total);
    console.log(`📊 Total Facebook comments in database: ${total}`);
    
    if (total === 0) {
      console.log('ℹ️  No comments to test');
      return;
    }
    
    // Test a sample of recent comments
    const sampleSize = Math.min(20, total);
    console.log(`🔍 Testing ${sampleSize} most recent comments...\n`);
    
    const sampleResult = await pool.query(`
      SELECT 
        c.id,
        c.external_comment_id,
        c.author_name,
        c.comment_text
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
      ORDER BY c.created_at DESC
      LIMIT $1
    `, [sampleSize]);
    
    let exists = 0;
    let deleted = 0;
    let errors = 0;
    
    for (let i = 0; i < sampleResult.rows.length; i++) {
      const comment = sampleResult.rows[i];
      
      // Extract actual comment ID
      let actualCommentId = comment.external_comment_id;
      if (actualCommentId.includes('_')) {
        actualCommentId = actualCommentId.split('_')[1];
      }
      
      process.stdout.write(`Testing ${i + 1}/${sampleSize}... `);
      
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}`);
        const data = await response.json();
        
        if (data.error) {
          if (data.error.code === 100) {
            console.log('❌ DELETED');
            deleted++;
          } else {
            console.log(`⚠️  ERROR (${data.error.code})`);
            errors++;
          }
        } else {
          console.log('✅ EXISTS');
          exists++;
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`⚠️  NETWORK ERROR`);
        errors++;
      }
    }
    
    console.log('\n📊 QUICK TEST RESULTS:');
    console.log('======================');
    console.log(`✅ Still exist: ${exists}/${sampleSize} (${((exists/sampleSize)*100).toFixed(1)}%)`);
    console.log(`❌ Deleted: ${deleted}/${sampleSize} (${((deleted/sampleSize)*100).toFixed(1)}%)`);
    console.log(`⚠️  Errors: ${errors}/${sampleSize} (${((errors/sampleSize)*100).toFixed(1)}%)`);
    
    // Extrapolate to full database
    if (sampleSize < total) {
      const estimatedExists = Math.round((exists / sampleSize) * total);
      const estimatedDeleted = Math.round((deleted / sampleSize) * total);
      
      console.log('\n🔮 ESTIMATED FULL DATABASE:');
      console.log(`✅ Estimated existing: ~${estimatedExists}/${total}`);
      console.log(`❌ Estimated deleted: ~${estimatedDeleted}/${total}`);
    }
    
    console.log('\n💡 NEXT STEPS:');
    if (deleted > 0) {
      console.log(`🧹 Run full test: node test-facebook-comments-existence.js`);
      console.log(`🗑️  Clean database: node sync-facebook-comments.js`);
    }
    if (exists > 0) {
      console.log(`🎯 ${exists} comments ready for replies!`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickFacebookTest();
