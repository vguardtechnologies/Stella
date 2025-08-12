// Historical Comment Importer for Facebook & Instagram
// Fetches all posts, reels, and comments from connected pages

const fetch = require('node-fetch');
const Database = require('../config/database');
const { pool } = require('../config/database');

// Facebook API Configuration
const FACEBOOK_ACCESS_TOKEN = 'EAASxoOpodqYBPP9CiLOvsfBipThgT1ms9rqSiAfJa7YQXGOBZABaXgVkfofnFdkjogfFuZBZBU5bs22RaQJVZAZBbIU1IsxZBH2ZANLojf3IIhZAnBae2Fjw4cPP6Lbk6foM2YYfkRYvmAlSS4RsyIbPbgEvCEMG1dZC7ZAsQarFIf6rUe7penB1xAJs9H5ZBdCPQZDZD';

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, query, body } = req;

  try {
    switch (method) {
      case 'POST':
        if (query.action === 'import-all') {
          return handleImportAllContent(req, res);
        } else if (query.action === 'import-facebook') {
          return handleImportFacebook(req, res);
        } else if (query.action === 'import-instagram') {
          return handleImportInstagram(req, res);
        } else if (query.action === 'sync-comments') {
          return handleSyncComments(req, res);
        }
        break;

      case 'GET':
        if (query.action === 'content-overview') {
          return handleGetContentOverview(req, res);
        } else if (query.action === 'post-comments') {
          return handleGetPostComments(req, res);
        } else if (query.action === 'import-status') {
          return handleGetImportStatus(req, res);
        }
        break;
    }

    return res.status(400).json({ 
      error: 'Invalid action',
      availableActions: ['import-all', 'import-facebook', 'import-instagram', 'sync-comments', 'content-overview', 'post-comments', 'import-status']
    });
  } catch (error) {
    console.error('Historical Comment Importer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Import all content from Facebook and Instagram
async function handleImportAllContent(req, res) {
  console.log('🚀 Starting complete historical import...');
  
  const startTime = Date.now();
  const importResults = {
    facebook: { posts: 0, reels: 0, comments: 0, errors: [] },
    instagram: { posts: 0, reels: 0, comments: 0, errors: [] },
    totalTime: 0
  };

  try {
    // Update import status
    await updateImportStatus('running', 'Starting complete import...');

    // Import Facebook content
    console.log('📘 Importing Facebook content...');
    await updateImportStatus('running', 'Importing Facebook posts and reels...');
    const facebookResults = await importFacebookContent();
    importResults.facebook = facebookResults;

    // Import Instagram content
    console.log('📷 Importing Instagram content...');
    await updateImportStatus('running', 'Importing Instagram posts and reels...');
    const instagramResults = await importInstagramContent();
    importResults.instagram = instagramResults;

    importResults.totalTime = Math.round((Date.now() - startTime) / 1000);

    await updateImportStatus('completed', `Import completed in ${importResults.totalTime}s`);

    console.log('✅ Historical import completed:', importResults);

    return res.status(200).json({
      success: true,
      message: 'Historical import completed successfully',
      results: importResults
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
    await updateImportStatus('failed', `Import failed: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      partialResults: importResults
    });
  }
}

// Import Facebook Posts and Reels
async function importFacebookContent() {
  console.log('📘 Fetching Facebook pages...');
  
  const results = { posts: 0, reels: 0, comments: 0, errors: [] };

  try {
    // Get Facebook Pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,access_token`);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found');
    }

    console.log(`📋 Found ${pagesData.data.length} Facebook pages`);

    for (const page of pagesData.data) {
      console.log(`📘 Processing page: ${page.name}`);

      try {
        // Import Facebook Posts
        const postsResults = await importFacebookPosts(page);
        results.posts += postsResults.posts;
        results.comments += postsResults.comments;

        // Import Facebook Reels
        const reelsResults = await importFacebookReels(page);
        results.reels += reelsResults.reels;
        results.comments += reelsResults.comments;

      } catch (pageError) {
        console.error(`❌ Error processing page ${page.name}:`, pageError);
        results.errors.push(`Page ${page.name}: ${pageError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Facebook import error:', error);
    results.errors.push(`Facebook import: ${error.message}`);
  }

  return results;
}

// Import Facebook Posts
async function importFacebookPosts(page) {
  console.log(`   📝 Importing Facebook posts for ${page.name}...`);
  
  const results = { posts: 0, comments: 0 };

  try {
    // Fetch posts from the last 30 days
    const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}/posts?access_token=${page.access_token}&fields=id,message,created_time,permalink_url,full_picture&limit=50`);
    const postsData = await postsResponse.json();

    if (!postsData.data) {
      return results;
    }

    console.log(`   📝 Found ${postsData.data.length} posts`);

    for (const post of postsData.data) {
      try {
        // Store post in database
        const storedPost = await storePostInDatabase({
          external_id: post.id,
          platform: 'facebook',
          type: 'post',
          content: post.message || 'Photo/Video Post',
          created_time: new Date(post.created_time),
          permalink_url: post.permalink_url,
          media_url: post.full_picture,
          page_id: page.id,
          page_name: page.name
        });

        results.posts++;

        // Import comments for this post
        const commentResults = await importPostComments(post.id, page.access_token, storedPost.id, 'facebook');
        results.comments += commentResults.comments;

      } catch (postError) {
        console.error(`   ❌ Error processing post ${post.id}:`, postError);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error fetching posts for ${page.name}:`, error);
  }

  return results;
}

// Import Facebook Reels
async function importFacebookReels(page) {
  console.log(`   🎬 Importing Facebook reels for ${page.name}...`);
  
  const results = { reels: 0, comments: 0 };

  try {
    // Fetch reels (video posts with reels format)
    const reelsResponse = await fetch(`https://graph.facebook.com/v18.0/${page.id}/video_reels?access_token=${page.access_token}&fields=id,description,created_time,permalink_url,source&limit=25`);
    const reelsData = await reelsResponse.json();

    if (!reelsData.data) {
      return results;
    }

    console.log(`   🎬 Found ${reelsData.data.length} reels`);

    for (const reel of reelsData.data) {
      try {
        // Store reel in database
        const storedPost = await storePostInDatabase({
          external_id: reel.id,
          platform: 'facebook',
          type: 'reel',
          content: reel.description || 'Facebook Reel',
          created_time: new Date(reel.created_time),
          permalink_url: reel.permalink_url,
          media_url: reel.source,
          page_id: page.id,
          page_name: page.name
        });

        results.reels++;

        // Import comments for this reel
        const commentResults = await importPostComments(reel.id, page.access_token, storedPost.id, 'facebook');
        results.comments += commentResults.comments;

      } catch (reelError) {
        console.error(`   ❌ Error processing reel ${reel.id}:`, reelError);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error fetching reels for ${page.name}:`, error);
  }

  return results;
}

// Import Instagram Posts and Reels
async function importInstagramContent() {
  console.log('📷 Fetching Instagram accounts...');
  
  const results = { posts: 0, reels: 0, comments: 0, errors: [] };

  try {
    // Get Instagram Business Accounts
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${FACEBOOK_ACCESS_TOKEN}&fields=id,name,instagram_business_account`);
    const pagesData = await pagesResponse.json();

    const instagramAccounts = pagesData.data?.filter(page => page.instagram_business_account) || [];

    if (instagramAccounts.length === 0) {
      console.log('⚠️ No Instagram Business accounts found');
      return results;
    }

    console.log(`📋 Found ${instagramAccounts.length} Instagram accounts`);

    for (const page of instagramAccounts) {
      const igAccount = page.instagram_business_account;
      console.log(`📷 Processing Instagram account: ${page.name}`);

      try {
        // Import Instagram Posts
        const postsResults = await importInstagramPosts(igAccount.id, page.access_token);
        results.posts += postsResults.posts;
        results.comments += postsResults.comments;

        // Import Instagram Reels
        const reelsResults = await importInstagramReels(igAccount.id, page.access_token);
        results.reels += reelsResults.reels;
        results.comments += reelsResults.comments;

      } catch (accountError) {
        console.error(`❌ Error processing Instagram account ${page.name}:`, accountError);
        results.errors.push(`Instagram ${page.name}: ${accountError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Instagram import error:', error);
    results.errors.push(`Instagram import: ${error.message}`);
  }

  return results;
}

// Import Instagram Posts
async function importInstagramPosts(instagramId, accessToken) {
  console.log(`   📸 Importing Instagram posts...`);
  
  const results = { posts: 0, comments: 0 };

  try {
    // Fetch Instagram posts
    const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramId}/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,permalink,timestamp&limit=50`);
    const postsData = await postsResponse.json();

    if (!postsData.data) {
      return results;
    }

    // Filter for posts (not reels)
    const posts = postsData.data.filter(item => 
      item.media_type === 'IMAGE' || 
      item.media_type === 'CAROUSEL_ALBUM' || 
      (item.media_type === 'VIDEO' && !item.id.includes('reel'))
    );

    console.log(`   📸 Found ${posts.length} posts`);

    for (const post of posts) {
      try {
        // Store post in database
        const storedPost = await storePostInDatabase({
          external_id: post.id,
          platform: 'instagram',
          type: 'post',
          content: post.caption || 'Instagram Post',
          created_time: new Date(post.timestamp),
          permalink_url: post.permalink,
          media_url: post.media_url,
          page_id: instagramId,
          page_name: 'Instagram Business'
        });

        results.posts++;

        // Import comments for this post
        const commentResults = await importPostComments(post.id, accessToken, storedPost.id, 'instagram');
        results.comments += commentResults.comments;

      } catch (postError) {
        console.error(`   ❌ Error processing Instagram post ${post.id}:`, postError);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error fetching Instagram posts:`, error);
  }

  return results;
}

// Import Instagram Reels
async function importInstagramReels(instagramId, accessToken) {
  console.log(`   🎥 Importing Instagram reels...`);
  
  const results = { reels: 0, comments: 0 };

  try {
    // Fetch Instagram reels
    const reelsResponse = await fetch(`https://graph.facebook.com/v18.0/${instagramId}/media?access_token=${accessToken}&fields=id,caption,media_type,media_url,permalink,timestamp&limit=25`);
    const reelsData = await reelsResponse.json();

    if (!reelsData.data) {
      return results;
    }

    // Filter for reels (video content that's likely a reel)
    const reels = reelsData.data.filter(item => 
      item.media_type === 'VIDEO'
    );

    console.log(`   🎥 Found ${reels.length} video items (potential reels)`);

    for (const reel of reels) {
      try {
        // Store reel in database
        const storedPost = await storePostInDatabase({
          external_id: reel.id,
          platform: 'instagram',
          type: 'reel',
          content: reel.caption || 'Instagram Reel',
          created_time: new Date(reel.timestamp),
          permalink_url: reel.permalink,
          media_url: reel.media_url,
          page_id: instagramId,
          page_name: 'Instagram Business'
        });

        results.reels++;

        // Import comments for this reel
        const commentResults = await importPostComments(reel.id, accessToken, storedPost.id, 'instagram');
        results.comments += commentResults.comments;

      } catch (reelError) {
        console.error(`   ❌ Error processing Instagram reel ${reel.id}:`, reelError);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error fetching Instagram reels:`, error);
  }

  return results;
}

// Import comments for a specific post
async function importPostComments(postId, accessToken, storedPostId, platform) {
  const results = { comments: 0 };

  try {
    let commentsUrl;
    if (platform === 'facebook') {
      commentsUrl = `https://graph.facebook.com/v18.0/${postId}/comments?access_token=${accessToken}&fields=id,message,from,created_time,parent&limit=100`;
    } else {
      commentsUrl = `https://graph.facebook.com/v18.0/${postId}/comments?access_token=${accessToken}&fields=id,text,from,timestamp&limit=100`;
    }

    const commentsResponse = await fetch(commentsUrl);
    const commentsData = await commentsResponse.json();

    if (!commentsData.data || commentsData.data.length === 0) {
      return results;
    }

    console.log(`     💬 Found ${commentsData.data.length} comments`);

    for (const comment of commentsData.data) {
      try {
        // Check if comment already exists
        const existingComment = await pool.query(
          'SELECT id FROM social_comments WHERE external_id = $1',
          [comment.id]
        );

        if (existingComment.rows.length > 0) {
          continue; // Skip if already exists
        }

        // Get platform record
        const platformRecord = await pool.query(
          'SELECT id FROM social_platforms WHERE platform_type = $1 AND connected = true LIMIT 1',
          [platform]
        );

        if (platformRecord.rows.length === 0) {
          continue;
        }

        // Store comment in database
        const insertQuery = `
          INSERT INTO social_comments (
            platform_id,
            external_id,
            post_id,
            author_name,
            author_id,
            message,
            status,
            created_at,
            platform_created_at,
            imported_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW())
        `;

        await pool.query(insertQuery, [
          platformRecord.rows[0].id,
          comment.id,
          postId,
          comment.from?.name || comment.from?.username || 'Unknown',
          comment.from?.id || null,
          comment.message || comment.text || '',
          'imported',
          platform === 'facebook' 
            ? new Date(comment.created_time) 
            : new Date(comment.timestamp),
        ]);

        results.comments++;

      } catch (commentError) {
        console.error(`     ❌ Error storing comment ${comment.id}:`, commentError);
      }
    }

  } catch (error) {
    console.error(`   ❌ Error fetching comments for post ${postId}:`, error);
  }

  return results;
}

// Store post in database
async function storePostInDatabase(postData) {
  try {
    // Check if post already exists
    const existingPost = await pool.query(
      'SELECT id FROM social_posts WHERE external_post_id = $1',
      [postData.external_id]
    );

    if (existingPost.rows.length > 0) {
      return existingPost.rows[0];
    }

    // Use fixed platform ID for Facebook (we verified it exists as ID 1)
    let platformId;
    
    if (postData.platform === 'facebook') {
      platformId = 1; // Facebook platform ID confirmed in database
      console.log(`✅ Using existing Facebook platform with ID: ${platformId}`);
    } else {
      // For other platforms, look up existing platform
      console.log(`🔍 Looking for platform: user_id='default_user', platform_type='${postData.platform}'`);
      
      const platformQuery = await pool.query(
        'SELECT id FROM social_platforms WHERE user_id = $1 AND platform_type = $2',
        ['default_user', postData.platform]
      );

      if (platformQuery.rows.length > 0) {
        platformId = platformQuery.rows[0].id;
        console.log(`✅ Found existing platform with ID: ${platformId}`);
      } else {
        throw new Error(`Platform '${postData.platform}' not found. Please create it first.`);
      }
    }

    // Insert new post using existing table structure
    const insertQuery = `
      INSERT INTO social_posts (
        platform_id, external_post_id, post_type, caption, 
        post_url, media_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      platformId,
      postData.external_id,
      postData.type,
      postData.content,
      postData.permalink_url,
      postData.media_url,
      postData.created_time
    ]);

    return result.rows[0];

  } catch (error) {
    console.error('Error storing post:', error);
    throw error;
  }
}

// Update import status
async function updateImportStatus(status, message) {
  try {
    const upsertQuery = `
      INSERT INTO import_status (user_id, status, message, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        status = $2,
        message = $3,
        updated_at = NOW()
    `;

    await pool.query(upsertQuery, ['default_user', status, message]);

  } catch (error) {
    console.error('Error updating import status:', error);
  }
}

// Get content overview
async function handleGetContentOverview(req, res) {
  try {
    const overviewQuery = `
      SELECT 
        platform,
        type,
        COUNT(*) as count,
        MAX(created_at) as latest_post
      FROM social_posts 
      GROUP BY platform, type
      ORDER BY platform, type
    `;

    const result = await pool.query(overviewQuery);

    const overview = {
      facebook: { posts: 0, reels: 0 },
      instagram: { posts: 0, reels: 0 },
      totalPosts: 0,
      lastImport: null
    };

    result.rows.forEach(row => {
      overview[row.platform] = overview[row.platform] || {};
      overview[row.platform][row.type] = parseInt(row.count);
      overview.totalPosts += parseInt(row.count);
      
      if (!overview.lastImport || new Date(row.latest_post) > overview.lastImport) {
        overview.lastImport = row.latest_post;
      }
    });

    return res.status(200).json({
      success: true,
      overview
    });

  } catch (error) {
    console.error('Error getting content overview:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get import status
async function handleGetImportStatus(req, res) {
  try {
    const statusQuery = `
      SELECT status, message, updated_at 
      FROM import_status 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;

    const result = await pool.query(statusQuery, ['default_user']);

    const status = result.rows.length > 0 ? result.rows[0] : {
      status: 'idle',
      message: 'No imports have been run yet',
      updated_at: null
    };

    return res.status(200).json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error getting import status:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Handle other functions (placeholder for now)
async function handleImportFacebook(req, res) {
  // Facebook-only import
  const results = await importFacebookContent();
  return res.status(200).json({ success: true, results });
}

async function handleImportInstagram(req, res) {
  // Instagram-only import  
  const results = await importInstagramContent();
  return res.status(200).json({ success: true, results });
}

async function handleSyncComments(req, res) {
  // Sync new comments for existing posts
  return res.status(200).json({ success: true, message: 'Comment sync feature coming soon' });
}

async function handleGetPostComments(req, res) {
  // Get comments for a specific post
  const { postId } = req.query;
  // Implementation for fetching specific post comments
  return res.status(200).json({ success: true, comments: [] });
}
