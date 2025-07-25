const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const mediaProcessingService = require('./mediaProcessingService');
const { pool } = require('../config/database');

class WhatsAppMediaService {
  constructor() {
    this.whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  // Download media from WhatsApp
  async downloadMediaFromWhatsApp(mediaId) {
    try {
      console.log(`📥 Downloading media from WhatsApp: ${mediaId}`);

      // Get media URL from WhatsApp
      const mediaInfoResponse = await fetch(
        `${this.whatsappApiUrl}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (!mediaInfoResponse.ok) {
        throw new Error(`Failed to get media info: ${mediaInfoResponse.statusText}`);
      }

      const mediaInfo = await mediaInfoResponse.json();
      console.log('📋 Media info:', mediaInfo);

      // Download the actual media file
      const mediaResponse = await fetch(mediaInfo.url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!mediaResponse.ok) {
        throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
      }

      const mediaBuffer = await mediaResponse.buffer();
      
      return {
        buffer: mediaBuffer,
        mimeType: mediaInfo.mime_type,
        filename: mediaInfo.filename || `media_${mediaId}`,
        fileSize: mediaBuffer.length
      };

    } catch (error) {
      console.error(`❌ Error downloading media ${mediaId}:`, error);
      throw error;
    }
  }

  // Process incoming WhatsApp media
  async processIncomingMedia(messageData) {
    try {
      const { id: messageId, from, timestamp } = messageData;
      
      // Extract media info based on message type
      let mediaInfo = null;
      let mediaType = null;

      if (messageData.image) {
        mediaInfo = messageData.image;
        mediaType = 'image';
      } else if (messageData.video) {
        mediaInfo = messageData.video;
        mediaType = 'video';
      } else if (messageData.audio) {
        mediaInfo = messageData.audio;
        mediaType = 'audio';
      } else if (messageData.document) {
        mediaInfo = messageData.document;
        mediaType = 'document';
      } else {
        console.log('📝 No media found in message');
        return null;
      }

      console.log(`🎯 Processing ${mediaType} media:`, mediaInfo);

      // Download media from WhatsApp
      const downloadedMedia = await this.downloadMediaFromWhatsApp(mediaInfo.id);

      // Process and store media
      const processedMedia = await mediaProcessingService.processMediaFile(
        downloadedMedia.buffer,
        mediaInfo.id,
        downloadedMedia.filename,
        downloadedMedia.mimeType
      );

      // Update the message record with media file reference
      await pool.query(
        'UPDATE messages SET media_file_id = $1 WHERE whatsapp_message_id = $2',
        [processedMedia.id, messageId]
      );

      console.log(`✅ Media processed and linked to message: ${messageId}`);

      return {
        mediaFileId: processedMedia.id,
        filePath: processedMedia.file_path,
        thumbnailPath: processedMedia.thumbnail_path,
        mimeType: processedMedia.mime_type,
        mediaType,
        originalInfo: mediaInfo
      };

    } catch (error) {
      console.error('❌ Error processing incoming media:', error);
      throw error;
    }
  }

  // Process outgoing media (for messages sent from our system)
  async processOutgoingMedia(filePath, whatsappMediaId = null) {
    try {
      console.log(`📤 Processing outgoing media: ${filePath}`);

      // Read file
      const buffer = await fs.readFile(filePath);
      const stats = await fs.stat(filePath);
      
      // Determine mime type (you may want to use a library like 'mime-types')
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.mov': 'video/quicktime',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.pdf': 'application/pdf'
      };
      
      const mimeType = mimeTypeMap[ext] || 'application/octet-stream';
      const originalFilename = path.basename(filePath);

      // Process and store media
      const processedMedia = await mediaProcessingService.processMediaFile(
        buffer,
        whatsappMediaId,
        originalFilename,
        mimeType
      );

      console.log(`✅ Outgoing media processed: ${filePath}`);
      
      return processedMedia;

    } catch (error) {
      console.error('❌ Error processing outgoing media:', error);
      throw error;
    }
  }

  // Get media file path for serving
  async getMediaFilePath(mediaFileId) {
    try {
      const mediaFile = await mediaProcessingService.getMediaFile(mediaFileId);
      if (!mediaFile) {
        throw new Error('Media file not found');
      }

      return {
        filePath: path.join(process.cwd(), 'uploads', mediaFile.file_path),
        mimeType: mediaFile.mime_type,
        filename: mediaFile.original_filename
      };
    } catch (error) {
      console.error('Error getting media file path:', error);
      throw error;
    }
  }

  // Get thumbnail path for serving
  async getThumbnailPath(mediaFileId, sizeType = 'medium') {
    try {
      const thumbnail = await mediaProcessingService.getThumbnail(mediaFileId, sizeType);
      if (!thumbnail) {
        // If no thumbnail exists, return null
        return null;
      }

      return {
        filePath: path.join(process.cwd(), 'uploads', thumbnail.file_path),
        mimeType: 'image/jpeg',
        width: thumbnail.width,
        height: thumbnail.height
      };
    } catch (error) {
      console.error('Error getting thumbnail path:', error);
      throw error;
    }
  }

  // Clean up old media files (for maintenance)
  async cleanupOldMedia(daysOld = 30) {
    try {
      console.log(`🧹 Cleaning up media files older than ${daysOld} days...`);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Get old media files
      const result = await pool.query(`
        SELECT id, file_path, thumbnail_path 
        FROM media_files 
        WHERE created_at < $1
      `, [cutoffDate]);

      let deletedCount = 0;

      for (const mediaFile of result.rows) {
        try {
          // Delete physical files
          const fullPath = path.join(process.cwd(), 'uploads', mediaFile.file_path);
          await fs.unlink(fullPath);

          if (mediaFile.thumbnail_path) {
            const thumbnailPath = path.join(process.cwd(), 'uploads', mediaFile.thumbnail_path);
            await fs.unlink(thumbnailPath);
          }

          // Delete thumbnails from database
          await pool.query('DELETE FROM media_thumbnails WHERE media_file_id = $1', [mediaFile.id]);

          // Delete media file from database
          await pool.query('DELETE FROM media_files WHERE id = $1', [mediaFile.id]);

          deletedCount++;
        } catch (error) {
          console.error(`Error deleting media file ${mediaFile.id}:`, error);
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old media files`);
      return deletedCount;

    } catch (error) {
      console.error('Error during media cleanup:', error);
      throw error;
    }
  }
}

module.exports = new WhatsAppMediaService();
