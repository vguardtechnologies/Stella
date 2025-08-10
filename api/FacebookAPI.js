// Simple Facebook API Integration without OAuth
// Uses App ID + Access Token directly

const fetch = require('node-fetch');

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
        if (query.action === 'test-connection') {
          return handleTestConnection(req, res);
        } else if (query.action === 'page-content') {
          return handleGetPageContent(req, res);
        } else if (query.action === 'page-posts') {
          return handleGetPagePosts(req, res);
        } else if (query.action === 'instagram-content') {
          return handleGetInstagramContent(req, res);
        }
        break;

      case 'GET':
        // Handle GET requests if needed
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Simple Facebook API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Test Facebook connection
async function handleTestConnection(req, res) {
  const { appId, accessToken } = req.body;

  if (!appId || !accessToken) {
    return res.status(400).json({ 
      error: 'App ID and Access Token are required',
      success: false 
    });
  }

  try {
    // Test user info
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`);
    const userData = await userResponse.json();

    if (userData.error) {
      throw new Error(userData.error.message || 'Invalid access token');
    }

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.warn('Pages fetch error:', pagesData.error.message);
      // Still return success but with empty pages
    }

    // Get basic app info (optional)
    let appInfo = null;
    if (appId) {
      try {
        const appResponse = await fetch(`https://graph.facebook.com/v18.0/${appId}?fields=name,category&access_token=${accessToken}`);
        const appData = await appResponse.json();
        if (!appData.error) {
          appInfo = appData;
        }
      } catch (e) {
        // App info is optional, don't fail on this
        console.warn('Could not fetch app info:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Facebook!',
      user: {
        id: userData.id,
        name: userData.name,
        picture: userData.picture?.data?.url || 'https://via.placeholder.com/100'
      },
      app: appInfo,
      pages: (pagesData.data || []).map(page => ({
        id: page.id,
        name: page.name,
        picture: page.picture?.data?.url || 'https://via.placeholder.com/100',
        hasAccessToken: !!page.access_token
      }))
    });

  } catch (error) {
    console.error('Facebook connection test failed:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message || 'Connection test failed'
    });
  }
}

// Get content from a specific Facebook page
async function handleGetPageContent(req, res) {
  const { pageId, accessToken, limit = 10 } = req.body;

  if (!pageId || !accessToken) {
    return res.status(400).json({ 
      error: 'Page ID and Access Token are required',
      success: false 
    });
  }

  try {
    // Get the page access token for this specific page
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    // Find the specific page and get its access token
    const targetPage = pagesData.data?.find(page => page.id === pageId);
    
    if (!targetPage) {
      throw new Error(`Page with ID ${pageId} not found in your account`);
    }

    const pageAccessToken = targetPage.access_token;

    // Get page posts using page access token
    const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/posts?` +
      `fields=id,message,created_time,picture,full_picture,attachments{media,type,url}` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    
    const postsData = await postsResponse.json();

    if (postsData.error) {
      throw new Error(postsData.error.message);
    }

    // Get page photos using page access token
    const photosResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos?` +
      `fields=id,picture,source,created_time,name` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    
    const photosData = await photosResponse.json();

    // Get page videos using page access token
    const videosResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos?` +
      `fields=id,source,picture,created_time,title,description` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    
    const videosData = await videosResponse.json();

    return res.status(200).json({
      success: true,
      content: {
        posts: postsData.data || [],
        photos: photosData.data || [],
        videos: videosData.data || []
      },
      metadata: {
        pageId: pageId,
        pageName: targetPage.name,
        usingPageToken: true,
        counts: {
          posts: postsData.data ? postsData.data.length : 0,
          photos: photosData.data ? photosData.data.length : 0,
          videos: videosData.data ? videosData.data.length : 0
        }
      },
      pagination: {
        posts_next: postsData.paging?.next || null,
        photos_next: photosData.paging?.next || null,
        videos_next: videosData.paging?.next || null
      }
    });

  } catch (error) {
    console.error('Error in handleGetPageContent:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message
    });
  }
}

// Get posts from a specific Facebook page
async function handleGetPagePosts(req, res) {
  const { pageId, accessToken, limit = 10 } = req.body;

  if (!pageId || !accessToken) {
    return res.status(400).json({ 
      error: 'Page ID and Access Token are required',
      success: false 
    });
  }

  try {
    // First, get the page access token for this specific page
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    // Find the specific page and get its access token
    const targetPage = pagesData.data?.find(page => page.id === pageId);
    const pageAccessToken = targetPage?.access_token || accessToken;

    // Get page posts using page access token
    const postsResponse = await fetch(`https://graph.facebook.com/v18.0/${pageId}/posts?` +
      `fields=id,message,created_time,picture,full_picture,attachments{media,type,url},reactions.summary(true),comments.summary(true),shares` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    
    const postsData = await postsResponse.json();

    if (postsData.error) {
      throw new Error(postsData.error.message);
    }

    return res.status(200).json({
      success: true,
      posts: postsData.data || [],
      pagination: {
        next: postsData.paging?.next || null,
        previous: postsData.paging?.previous || null
      }
    });

  } catch (error) {
    console.error('Error in handleGetPagePosts:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Get Instagram content (placeholder for future implementation)
async function handleGetInstagramContent(req, res) {
  return res.status(501).json({
    success: false,
    error: 'Instagram content integration coming soon!'
  });
}
