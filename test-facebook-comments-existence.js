const { pool } = require('./config/database');

async function testFacebookCommentsExistence() {
  try {
    console.log('🧪 Facebook Comments Existence Tester');
    console.log('=====================================\n');
    
    // Get Facebook access token
    const tokenResult = await pool.query(`
      SELECT access_token, account_info 
      FROM social_platforms 
      WHERE platform_type = 'facebook' 
      LIMIT 1
    `);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ No Facebook platform found in database');
      return;
    }
    
    const accessToken = tokenResult.rows[0].access_token;
    const accountInfo = tokenResult.rows[0].account_info;
    
    console.log('✅ Facebook access token found');
    console.log(`📄 Page: ${accountInfo?.name || 'Unknown'} (ID: ${accountInfo?.id || 'Unknown'})\n`);
    
    // Get all Facebook comments from database
    const allCommentsResult = await pool.query(`
      SELECT 
        c.id,
        c.external_comment_id,
        c.external_post_id, 
        c.author_name,
        c.comment_text,
        c.created_at,
        c.is_deleted,
        c.status,
        p.platform_type
      FROM social_comments c
      JOIN social_platforms p ON c.platform_id = p.id
      WHERE p.platform_type = 'facebook'
      ORDER BY c.created_at DESC
    `);
    
    const totalComments = allCommentsResult.rows.length;
    console.log(`📊 Found ${totalComments} Facebook comments in database\n`);
    
    if (totalComments === 0) {
      console.log('ℹ️  No Facebook comments found in database to test');
      return;
    }
    
    const testResults = {
      total: totalComments,
      exists: 0,
      deleted: 0,
      errors: 0,
      rateLimited: 0,
      permissionErrors: 0,
      existingComments: [],
      deletedComments: [],
      errorComments: []
    };
    
    console.log('🔍 Testing each comment against Facebook API...\n');
    console.log('Legend:');
    console.log('  ✅ = Comment exists on Facebook');
    console.log('  ❌ = Comment deleted from Facebook');
    console.log('  ⚠️  = API error or permission issue');
    console.log('  🕒 = Rate limited\n');
    
    let batchCount = 0;
    const batchSize = 10; // Process in batches to avoid overwhelming output
    
    for (let i = 0; i < allCommentsResult.rows.length; i++) {
      const comment = allCommentsResult.rows[i];
      const progress = `[${i + 1}/${totalComments}]`;
      
      // Extract actual comment ID for Facebook API
      let actualCommentId = comment.external_comment_id;
      
      // Handle different ID formats
      if (actualCommentId.includes('_')) {
        // Format: post_id_comment_id
        actualCommentId = actualCommentId.split('_')[1];
      }
      
      console.log(`${progress} Testing: ${comment.id} (${actualCommentId})`);
      
      try {
        // Check if comment exists on Facebook
        const response = await fetch(`https://graph.facebook.com/v18.0/${actualCommentId}?access_token=${accessToken}&fields=id,message,from,created_time,post`);
        const data = await response.json();
        
        if (data.error) {
          console.log(`   ❌ Error: ${data.error.message} (Code: ${data.error.code})`);
          
          if (data.error.code === 100) {
            // Comment deleted
            testResults.deleted++;
            testResults.deletedComments.push({
              dbId: comment.id,
              externalId: comment.external_comment_id,
              author: comment.author_name,
              text: comment.comment_text?.substring(0, 50),
              reason: 'Deleted on Facebook'
            });
          } else if (data.error.code === 190 || data.error.code === 3) {
            // Permission/token errors
            testResults.permissionErrors++;
            testResults.errorComments.push({
              dbId: comment.id,
              externalId: comment.external_comment_id,
              author: comment.author_name,
              error: `Permission Error (${data.error.code}): ${data.error.message}`
            });
          } else if (data.error.code === 4 || data.error.code === 17) {
            // Rate limiting
            testResults.rateLimited++;
            console.log(`   🕒 Rate limited - waiting 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            i--; // Retry this comment
            continue;
          } else {
            // Other errors
            testResults.errors++;
            testResults.errorComments.push({
              dbId: comment.id,
              externalId: comment.external_comment_id,
              author: comment.author_name,
              error: `Error ${data.error.code}: ${data.error.message}`
            });
          }
        } else {
          // Comment exists
          console.log(`   ✅ Exists - Author: ${data.from?.name}, Message: "${data.message?.substring(0, 30)}..."`);
          testResults.exists++;
          testResults.existingComments.push({
            dbId: comment.id,
            externalId: comment.external_comment_id,
            dbAuthor: comment.author_name,
            fbAuthor: data.from?.name,
            dbText: comment.comment_text?.substring(0, 50),
            fbText: data.message?.substring(0, 50),
            createdTime: data.created_time,
            matches: {
              author: comment.author_name === data.from?.name,
              text: comment.comment_text === data.message
            }
          });
        }
        
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`   ⚠️  Network error: ${error.message}`);
        testResults.errors++;
        testResults.errorComments.push({
          dbId: comment.id,
          externalId: comment.external_comment_id,
          author: comment.author_name,
          error: `Network Error: ${error.message}`
        });
      }
      
      // Show batch summary every 10 comments
      batchCount++;
      if (batchCount === batchSize || i === allCommentsResult.rows.length - 1) {
        console.log(`\n📊 Progress: ${i + 1}/${totalComments} comments tested`);
        console.log(`   ✅ Existing: ${testResults.exists}, ❌ Deleted: ${testResults.deleted}, ⚠️ Errors: ${testResults.errors + testResults.permissionErrors}\n`);
        batchCount = 0;
      }
    }
    
    // Final comprehensive report
    console.log('\n🎯 FINAL TEST RESULTS');
    console.log('====================');
    console.log(`📊 Total Comments Tested: ${testResults.total}`);
    console.log(`✅ Still Exist on Facebook: ${testResults.exists} (${((testResults.exists / testResults.total) * 100).toFixed(1)}%)`);
    console.log(`❌ Deleted from Facebook: ${testResults.deleted} (${((testResults.deleted / testResults.total) * 100).toFixed(1)}%)`);
    console.log(`⚠️  Permission Errors: ${testResults.permissionErrors}`);
    console.log(`🔥 Other Errors: ${testResults.errors}`);
    console.log(`🕒 Rate Limited: ${testResults.rateLimited}\n`);
    
    // Detailed breakdown
    if (testResults.existingComments.length > 0) {
      console.log('✅ COMMENTS THAT STILL EXIST ON FACEBOOK:');
      console.log('==========================================');
      testResults.existingComments.slice(0, 10).forEach((comment, index) => {
        console.log(`${index + 1}. DB ID: ${comment.dbId}`);
        console.log(`   External ID: ${comment.externalId}`);
        console.log(`   DB Author: ${comment.dbAuthor}`);
        console.log(`   FB Author: ${comment.fbAuthor}`);
        console.log(`   Author Match: ${comment.matches.author ? '✅' : '❌'}`);
        console.log(`   DB Text: "${comment.dbText}..."`);
        console.log(`   FB Text: "${comment.fbText}..."`);
        console.log(`   Text Match: ${comment.matches.text ? '✅' : '❌'}`);
        console.log('');
      });
      
      if (testResults.existingComments.length > 10) {
        console.log(`... and ${testResults.existingComments.length - 10} more existing comments\n`);
      }
    }
    
    if (testResults.deletedComments.length > 0) {
      console.log('❌ COMMENTS DELETED FROM FACEBOOK:');
      console.log('==================================');
      testResults.deletedComments.forEach((comment, index) => {
        console.log(`${index + 1}. DB ID: ${comment.dbId} - ${comment.author}`);
        console.log(`   External ID: ${comment.externalId}`);
        console.log(`   Text: "${comment.text}..."`);
        console.log(`   Reason: ${comment.reason}`);
        console.log('');
      });
    }
    
    if (testResults.errorComments.length > 0) {
      console.log('⚠️  COMMENTS WITH ERRORS:');
      console.log('=========================');
      testResults.errorComments.forEach((comment, index) => {
        console.log(`${index + 1}. DB ID: ${comment.dbId} - ${comment.author}`);
        console.log(`   External ID: ${comment.externalId}`);
        console.log(`   Error: ${comment.error}`);
        console.log('');
      });
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (testResults.deleted > 0) {
      console.log(`🧹 Consider running cleanup to remove ${testResults.deleted} deleted comments from your database`);
      console.log(`   Command: node sync-facebook-comments.js`);
    }
    
    if (testResults.exists > 0) {
      console.log(`✅ ${testResults.exists} comments are ready for AI replies!`);
    }
    
    if (testResults.permissionErrors > 0) {
      console.log(`🔑 ${testResults.permissionErrors} comments have permission errors - check your access token`);
    }
    
    if (testResults.errors > 0) {
      console.log(`🔧 ${testResults.errors} comments had API errors - may need investigation`);
    }
    
    // Data integrity check
    const mismatchedAuthors = testResults.existingComments.filter(c => !c.matches.author);
    const mismatchedTexts = testResults.existingComments.filter(c => !c.matches.text);
    
    if (mismatchedAuthors.length > 0) {
      console.log(`\n⚠️  DATA INTEGRITY: ${mismatchedAuthors.length} comments have mismatched author names`);
    }
    
    if (mismatchedTexts.length > 0) {
      console.log(`⚠️  DATA INTEGRITY: ${mismatchedTexts.length} comments have mismatched text content`);
    }
    
    console.log('\n🎉 Facebook comment existence test completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testFacebookCommentsExistence();
