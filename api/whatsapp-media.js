const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get WhatsApp media by media ID
router.get('/media/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    // Get WhatsApp access token from environment
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'WhatsApp access token not configured' });
    }

    // First, get media URL from WhatsApp
    const mediaInfoResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const mediaUrl = mediaInfoResponse.data.url;
    
    // Then fetch the actual media file
    const mediaResponse = await axios.get(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      responseType: 'stream'
    });

    // Set appropriate headers
    res.set({
      'Content-Type': mediaResponse.headers['content-type'] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });

    // Stream the media file to the client
    mediaResponse.data.pipe(res);

  } catch (error) {
    console.error('Error fetching WhatsApp media:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch media',
      details: error.message 
    });
  }
});

// Get media info (metadata) without downloading
router.get('/info/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'WhatsApp access token not configured' });
    }

    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error fetching WhatsApp media info:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch media info',
      details: error.message 
    });
  }
});

module.exports = router;
