// Facebook/Meta API Integration for Stella
// Handles Facebook login, pages, and Instagram integration

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
      case 'GET':
        if (query.action === 'auth-url') {
          return handleGetAuthUrl(res);
        } else if (query.action === 'pages') {
          return handleGetPages(req, res);
        } else if (query.action === 'instagram') {
          return handleGetInstagram(req, res);
        } else if (query.action === 'user-info') {
          return handleGetUserInfo(req, res);
        } else if (query.action === 'page-media') {
          return handleGetPageMedia(req, res);
        } else if (query.action === 'instagram-media') {
          return handleGetInstagramMedia(req, res);
        } else if (query.action === 'instagram-reels') {
          return handleGetInstagramReels(req, res);
        }
        break;

      case 'POST':
        if (query.action === 'exchange-code') {
          return handleExchangeCode(req, res);
        } else if (query.action === 'toggle-page') {
          return handleTogglePage(req, res);
        } else if (query.action === 'toggle-instagram') {
          return handleToggleInstagram(req, res);
        }
        break;

      case 'DELETE':
        if (query.action === 'disconnect') {
          return handleDisconnect(req, res);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Facebook API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Generate Facebook OAuth URL
function handleGetAuthUrl(res) {
  const appId = process.env.VITE_FACEBOOK_APP_ID || 'your_app_id';
  const redirectUri = process.env.VITE_FACEBOOK_REDIRECT_URI || 'http://localhost:5173/auth/facebook/callback';
  
  // Check if we have a valid App ID
  if (!appId || appId === 'your_app_id' || appId === 'your_facebook_app_id_here') {
    return res.status(400).json({ 
      error: 'Facebook App ID not configured. Please set VITE_FACEBOOK_APP_ID in your environment variables.',
      setup_required: true
    });
  }
  
  const scopes = [
    'pages_read_engagement',
    'pages_manage_posts',
    'pages_show_list',
    'instagram_basic',
    'instagram_content_publish',
    'publish_video'
  ].join(',');

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `response_type=code&` +
    `state=stella_facebook_auth`;

  return res.status(200).json({ authUrl });
}

// Exchange authorization code for access token
async function handleExchangeCode(req, res) {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  const appId = process.env.VITE_FACEBOOK_APP_ID;
  const appSecret = process.env.VITE_FACEBOOK_APP_SECRET;
  const redirectUri = process.env.VITE_FACEBOOK_REDIRECT_URI;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`);

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    // Get user information
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?` +
      `fields=id,name,email,picture&` +
      `access_token=${tokenData.access_token}`);

    const userData = await userResponse.json();

    if (userData.error) {
      throw new Error(userData.error.message);
    }

    // Get user pages
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?` +
      `fields=id,name,picture,access_token&` +
      `access_token=${tokenData.access_token}`);

    const pagesData = await pagesResponse.json();

    return res.status(200).json({
      success: true,
      user: userData,
      accessToken: tokenData.access_token,
      pages: pagesData.data || []
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Get user pages
async function handleGetPages(req, res) {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?` +
      `fields=id,name,picture,access_token,instagram_business_account{id,name,profile_picture_url}&` +
      `access_token=${accessToken}`);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return res.status(200).json({ pages: data.data || [] });

  } catch (error) {
    console.error('Get pages error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Get Instagram accounts
async function handleGetInstagram(req, res) {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    // Get pages first
    const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?` +
      `fields=id,name,instagram_business_account{id,name,profile_picture_url}&` +
      `access_token=${accessToken}`);

    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    // Extract Instagram accounts
    const instagramAccounts = [];
    for (const page of pagesData.data || []) {
      if (page.instagram_business_account) {
        instagramAccounts.push({
          id: page.instagram_business_account.id,
          name: page.instagram_business_account.name,
          picture: page.instagram_business_account.profile_picture_url,
          pageId: page.id,
          pageName: page.name
        });
      }
    }

    return res.status(200).json({ instagram: instagramAccounts });

  } catch (error) {
    console.error('Get Instagram error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Get user info
async function handleGetUserInfo(req, res) {
  const { accessToken } = req.query;

  if (!accessToken) {
    return res.status(400).json({ error: 'Access token required' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/me?` +
      `fields=id,name,email,picture&` +
      `access_token=${accessToken}`);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return res.status(200).json({ user: data });

  } catch (error) {
    console.error('Get user info error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Toggle page integration
async function handleTogglePage(req, res) {
  const { pageId, enabled, accessToken } = req.body;

  // In a real implementation, you would save this to your database
  // For now, we'll just return success
  console.log(`Page ${pageId} integration ${enabled ? 'enabled' : 'disabled'}`);

  return res.status(200).json({ 
    success: true,
    message: `Page integration ${enabled ? 'enabled' : 'disabled'}` 
  });
}

// Toggle Instagram integration
async function handleToggleInstagram(req, res) {
  const { instagramId, enabled, accessToken } = req.body;

  // In a real implementation, you would save this to your database
  // For now, we'll just return success
  console.log(`Instagram ${instagramId} integration ${enabled ? 'enabled' : 'disabled'}`);

  return res.status(200).json({ 
    success: true,
    message: `Instagram integration ${enabled ? 'enabled' : 'disabled'}` 
  });
}

// Disconnect Facebook account
async function handleDisconnect(req, res) {
  // In a real implementation, you would remove tokens from your database
  console.log('Facebook account disconnected');

  return res.status(200).json({ 
    success: true,
    message: 'Facebook account disconnected successfully' 
  });
}

// Get Facebook page media/posts
async function handleGetPageMedia(req, res) {
  const { pageId, accessToken, limit = 20 } = req.query;

  if (!pageId || !accessToken) {
    return res.status(400).json({ error: 'Page ID and access token required' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/posts?` +
      `fields=id,message,created_time,attachments{type,media,url,title},likes.summary(true),comments.summary(true)&` +
      `limit=${limit}&` +
      `access_token=${accessToken}`);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Transform posts to media format
    const media = (data.data || []).map(post => ({
      id: post.id,
      type: post.attachments?.data?.[0]?.type === 'video_inline' ? 'video' : 'photo',
      media_url: post.attachments?.data?.[0]?.media?.source || post.attachments?.data?.[0]?.url,
      thumbnail_url: post.attachments?.data?.[0]?.media?.image?.src,
      permalink_url: `https://facebook.com/${post.id}`,
      caption: post.message,
      timestamp: post.created_time,
      like_count: post.likes?.summary?.total_count || 0,
      comments_count: post.comments?.summary?.total_count || 0
    })).filter(item => item.media_url); // Only include posts with media

    return res.status(200).json({ media });

  } catch (error) {
    console.error('Get page media error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Get Instagram media
async function handleGetInstagramMedia(req, res) {
  const { instagramId, accessToken, limit = 20 } = req.query;

  if (!instagramId || !accessToken) {
    return res.status(400).json({ error: 'Instagram ID and access token required' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${instagramId}/media?` +
      `fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&` +
      `limit=${limit}&` +
      `access_token=${accessToken}`);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return res.status(200).json({ media: data.data || [] });

  } catch (error) {
    console.error('Get Instagram media error:', error);
    return res.status(400).json({ error: error.message });
  }
}

// Get Instagram reels specifically
async function handleGetInstagramReels(req, res) {
  const { instagramId, accessToken, limit = 20 } = req.query;

  if (!instagramId || !accessToken) {
    return res.status(400).json({ error: 'Instagram ID and access token required' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${instagramId}/media?` +
      `fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&` +
      `limit=${limit}&` +
      `access_token=${accessToken}`);

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Filter for video content (reels)
    const reels = (data.data || []).filter(item => 
      item.media_type === 'VIDEO' || 
      item.media_type === 'CAROUSEL_ALBUM'
    );

    return res.status(200).json({ reels });

  } catch (error) {
    console.error('Get Instagram reels error:', error);
    return res.status(400).json({ error: error.message });
  }
}
