const express = require('express');
const path = require('path');
const whatsappMediaService = require('../services/whatsappMediaService');
const router = express.Router();

// Serve media files
router.get('/media/:mediaFileId', async (req, res) => {
  try {
    const { mediaFileId } = req.params;
    
    console.log(`📁 Serving media file: ${mediaFileId}`);
    
    const mediaInfo = await whatsappMediaService.getMediaFilePath(mediaFileId);
    
    // Set appropriate headers
    res.setHeader('Content-Type', mediaInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${mediaInfo.filename}"`);
    
    // Add caching headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('ETag', `"${mediaFileId}"`);
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === `"${mediaFileId}"`) {
      return res.status(304).end();
    }
    
    // Send the file
    res.sendFile(mediaInfo.filePath);
    
  } catch (error) {
    console.error('❌ Error serving media file:', error);
    
    if (error.message === 'Media file not found') {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    res.status(500).json({ error: 'Failed to serve media file' });
  }
});

// Serve thumbnail files with specific size
router.get('/thumbnail/:mediaFileId/:size', async (req, res) => {
  try {
    const { mediaFileId, size } = req.params;
    
    console.log(`🖼️ Serving thumbnail: ${mediaFileId} (${size})`);
    
    // Validate size parameter
    const validSizes = ['small', 'medium', 'large'];
    const sizeType = validSizes.includes(size) ? size : 'medium';
    
    const thumbnailInfo = await whatsappMediaService.getThumbnailPath(mediaFileId, sizeType);
    
    if (!thumbnailInfo) {
      return res.status(404).json({ error: 'Thumbnail not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', thumbnailInfo.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
    res.setHeader('ETag', `"${mediaFileId}-${sizeType}"`);
    
    // Check if client has cached version
    if (req.headers['if-none-match'] === `"${mediaFileId}-${sizeType}"`) {
      return res.status(304).end();
    }
    
    // Send the thumbnail
    res.sendFile(thumbnailInfo.filePath);
    
  } catch (error) {
    console.error('❌ Error serving thumbnail:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

// Serve thumbnail files with default size
router.get('/thumbnail/:mediaFileId', async (req, res) => {
  // Redirect to medium size by default
  res.redirect(`/api/media/thumbnail/${req.params.mediaFileId}/medium`);
});

// Get media file info (metadata only)
router.get('/info/:mediaFileId', async (req, res) => {
  try {
    const { mediaFileId } = req.params;
    
    const { pool } = require('../config/database');
    
    const result = await pool.query(`
      SELECT 
        id, whatsapp_media_id, original_filename, mime_type, 
        file_size, width, height, duration, status, created_at,
        thumbnail_path IS NOT NULL as has_thumbnail
      FROM media_files 
      WHERE id = $1
    `, [mediaFileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    const mediaFile = result.rows[0];
    
    // Get available thumbnail sizes
    const thumbnailResult = await pool.query(
      'SELECT size_type, width, height FROM media_thumbnails WHERE media_file_id = $1',
      [mediaFileId]
    );
    
    const thumbnails = thumbnailResult.rows.reduce((acc, thumb) => {
      acc[thumb.size_type] = {
        width: thumb.width,
        height: thumb.height,
        url: `/api/media/thumbnail/${mediaFileId}/${thumb.size_type}`
      };
      return acc;
    }, {});
    
    res.json({
      ...mediaFile,
      thumbnails,
      url: `/api/media/media/${mediaFileId}`
    });
    
  } catch (error) {
    console.error('❌ Error getting media info:', error);
    res.status(500).json({ error: 'Failed to get media info' });
  }
});

// Upload media file (for outgoing messages)
router.post('/upload', async (req, res) => {
  try {
    // This would typically use multer for file uploads
    // For now, this is a placeholder for the upload endpoint
    res.status(501).json({ 
      error: 'Upload endpoint not implemented yet',
      message: 'Use the whatsappMediaService.processOutgoingMedia() method directly'
    });
  } catch (error) {
    console.error('❌ Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Get media statistics
router.get('/stats', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as images,
        COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as videos,
        COUNT(CASE WHEN mime_type LIKE 'audio/%' THEN 1 END) as audio,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN thumbnail_path IS NOT NULL THEN 1 END) as with_thumbnails
      FROM media_files
    `);
    
    const thumbnailStats = await pool.query(`
      SELECT 
        COUNT(*) as total_thumbnails,
        SUM(file_size) as total_thumbnail_size
      FROM media_thumbnails
    `);
    
    res.json({
      media_files: stats.rows[0],
      thumbnails: thumbnailStats.rows[0],
      last_updated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error getting media stats:', error);
    res.status(500).json({ error: 'Failed to get media statistics' });
  }
});

module.exports = router;
