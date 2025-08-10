// Simple Facebook API Integration without OAuth
// Uses App ID + Access Token directly (with permanent token)

const fetch = require('node-fetch');

// Permanent Facebook Access Token (never expires)
const PERMANENT_ACCESS_TOKEN = 'EAASxoOpodqYBPP9CiLOvsfBipThgT1ms9rqSiAfJa7YQXGOBZABaXgVkfofnFdkjogfFuZBZBU5bs22RaQJVZAZBbIU1IsxZBH2ZANLojf3IIhZAnBae2Fjw4cPP6Lbk6foM2YYfkRYvmAlSS4RsyIbPbgEvCEMG1dZC7ZAsQarFIf6rUe7penB1xAJs9H5ZBdCPQZDZD';
const FACEBOOK_APP_ID = '1321204592440998';

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
        if (query.action === 'user-info') {
          return handleUserInfo(req, res);
        }
        break;
    }

    return res.status(400).json({ 
      error: 'Invalid action specified',
      availableActions: ['test-connection', 'page-content', 'page-posts', 'instagram-content', 'user-info']
    });
  } catch (error) {
    console.error('Simple Facebook API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Test Facebook connection
async function handleTestConnection(req, res) {
  const { appId, accessToken } = req.body || {};

  // Use permanent token and app ID as fallback
  const finalAppId = appId || FACEBOOK_APP_ID;
  const finalAccessToken = accessToken || PERMANENT_ACCESS_TOKEN;

  try {
    // Test user info
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${finalAccessToken}`);
    const userData = await userResponse.json();

    if (userData.error) {
      throw new Error(userData.error.message || 'Invalid access token');
    }

    // Get user's pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,picture,access_token&access_token=${finalAccessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.warn('Pages fetch error:', pagesData.error.message);
      // Still return success but with empty pages
    }

    // Get basic app info (optional)
    let appInfo = null;
    if (finalAppId) {
      try {
        const appResponse = await fetch(`https://graph.facebook.com/v18.0/${finalAppId}?fields=name,category&access_token=${finalAccessToken}`);
        const appData = await appResponse.json();
        if (!appData.error) {
          appInfo = appData;
        }
      } catch (e) {
        // App info is optional, don't fail on this
        console.warn('Could not fetch app info:', e);
      }
    }

    const result = {
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        profilePicture: userData.picture?.data?.url
      },
      pages: pagesData.data?.map(page => ({
        id: page.id,
        name: page.name,
        picture: page.picture?.data?.url,
        hasAccessToken: !!page.access_token
      })) || [],
      app: appInfo,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Connection test failed'
    });
  }
}

// Get content from a specific Facebook page
async function handleGetPageContent(req, res) {
  const { pageId, accessToken, limit = 10 } = req.body || {};
  
  // Use permanent token as fallback
  const finalAccessToken = accessToken || PERMANENT_ACCESS_TOKEN;

  if (!pageId) {
    return res.status(400).json({ 
      error: 'Page ID is required',
      success: false 
    });
  }

  try {
    // Get the page access token for this specific page
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalAccessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    const targetPage = pagesData.data?.find(page => page.id === pageId);
    if (!targetPage) {
      throw new Error(`Page with ID ${pageId} not found or not accessible`);
    }

    const pageAccessToken = targetPage.access_token;

    // Get posts
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,story,picture,full_picture,attachments` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    const postsData = await postsResponse.json();

    // Get photos
    const photosResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/photos?fields=id,picture,source,created_time,name` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    const photosData = await photosResponse.json();

    // Get videos
    const videosResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/videos?fields=id,title,description,created_time,picture,source` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    const videosData = await videosResponse.json();

    const result = {
      success: true,
      pageId: pageId,
      pageName: targetPage.name,
      posts: postsData.data || [],
      photos: photosData.data || [],
      videos: videosData.data || [],
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch page content'
    });
  }
}

// Get posts from a specific Facebook page  
async function handleGetPagePosts(req, res) {
  const { pageId, accessToken, limit = 10 } = req.body || {};

  // Use permanent token as fallback
  const finalAccessToken = accessToken || PERMANENT_ACCESS_TOKEN;

  if (!pageId) {
    return res.status(400).json({ 
      error: 'Page ID is required',
      success: false 
    });
  }

  try {
    // First, get the page access token for this specific page
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${finalAccessToken}`);
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    const targetPage = pagesData.data?.find(page => page.id === pageId);
    const pageAccessToken = targetPage?.access_token || finalAccessToken;

    // Get posts with comprehensive fields
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,story,created_time,updated_time,picture,full_picture,attachments{media_type,type,target,media},likes.summary(true),comments.summary(true),shares` +
      `&limit=${limit}&access_token=${pageAccessToken}`);
    
    const postsData = await postsResponse.json();

    if (postsData.error) {
      throw new Error(postsData.error.message);
    }

    const result = {
      success: true,
      pageId: pageId,
      posts: postsData.data || [],
      paging: postsData.paging,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch page posts'
    });
  }
}

// Get Instagram content (placeholder - requires Instagram Business Account)
async function handleGetInstagramContent(req, res) {
  return res.status(501).json({
    success: false,
    error: 'Instagram content fetching not implemented yet',
    message: 'This requires Instagram Business Account integration'
  });
}

// Get user info
async function handleUserInfo(req, res) {
  const { access_token } = req.query;
  
  // Use permanent token as fallback
  const finalAccessToken = access_token || PERMANENT_ACCESS_TOKEN;

  try {
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${finalAccessToken}`);
    const userData = await userResponse.json();

    if (userData.error) {
      throw new Error(userData.error.message);
    }

    return res.status(200).json({
      success: true,
      user: userData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user info'
    });
  }
}
