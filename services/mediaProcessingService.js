const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp'); // For image processing
const ffmpeg = require('fluent-ffmpeg'); // For video/audio processing
const { pool } = require('../config/database');

class MediaProcessingService {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.thumbnailSizes = {
      small: { width: 150, height: 150 },
      medium: { width: 320, height: 240 },
      large: { width: 640, height: 480 }
    };
  }

  // Generate file hash for deduplication
  generateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Get appropriate subdirectory based on mime type
  getSubDirectory(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  // Generate unique filename
  generateFilename(originalName, mimeType) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = this.getFileExtension(mimeType, originalName);
    return `${timestamp}_${random}${extension}`;
  }

  // Get file extension from mime type or filename
  getFileExtension(mimeType, filename = '') {
    // First try to get from filename
    if (filename && path.extname(filename)) {
      return path.extname(filename);
    }
    
    // Fallback to mime type mapping
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'application/pdf': '.pdf',
      'text/plain': '.txt'
    };
    
    return mimeToExt[mimeType] || '.bin';
  }

  // Store media file to filesystem
  async storeMediaFile(buffer, filename, subDir) {
    const targetDir = path.join(this.uploadDir, subDir);
    const filePath = path.join(targetDir, filename);
    
    await fs.writeFile(filePath, buffer);
    return path.join(subDir, filename); // Return relative path
  }

  // Generate image thumbnail
  async generateImageThumbnail(inputPath, outputPath, size) {
    try {
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      
      const stats = await fs.stat(outputPath);
      return {
        width: size.width,
        height: size.height,
        fileSize: stats.size
      };
    } catch (error) {
      console.error('Error generating image thumbnail:', error);
      throw error;
    }
  }

  // Generate video thumbnail
  async generateVideoThumbnail(inputPath, outputPath, size) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          timemarks: ['1'], // Capture at 1 second
          size: `${size.width}x${size.height}`,
          filename: path.basename(outputPath)
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(outputPath);
            resolve({
              width: size.width,
              height: size.height,
              fileSize: stats.size
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject)
        .save(path.dirname(outputPath));
    });
  }

  // Get video metadata
  async getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        resolve({
          duration: Math.round(metadata.format.duration || 0),
          width: videoStream?.width || null,
          height: videoStream?.height || null
        });
      });
    });
  }

  // Get image metadata
  async getImageMetadata(filePath) {
    try {
      const metadata = await sharp(filePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        duration: null
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      return { width: null, height: null, duration: null };
    }
  }

  // Generate thumbnails for media file
  async generateThumbnails(filePath, mimeType, mediaFileId) {
    const thumbnails = [];

    try {
      for (const [sizeType, size] of Object.entries(this.thumbnailSizes)) {
        const thumbnailFilename = `${mediaFileId}_${sizeType}.jpg`;
        const thumbnailPath = path.join(this.uploadDir, 'thumbnails', sizeType, thumbnailFilename);
        
        let result;
        if (mimeType.startsWith('image/')) {
          result = await this.generateImageThumbnail(
            path.join(this.uploadDir, filePath),
            thumbnailPath,
            size
          );
        } else if (mimeType.startsWith('video/')) {
          result = await this.generateVideoThumbnail(
            path.join(this.uploadDir, filePath),
            thumbnailPath,
            size
          );
        } else {
          continue; // Skip thumbnail generation for non-visual media
        }

        // Store thumbnail info in database
        const thumbnailResult = await pool.query(`
          INSERT INTO media_thumbnails (media_file_id, size_type, width, height, file_path, file_size)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          mediaFileId,
          sizeType,
          result.width,
          result.height,
          path.join('thumbnails', sizeType, thumbnailFilename),
          result.fileSize
        ]);

        thumbnails.push({
          id: thumbnailResult.rows[0].id,
          sizeType,
          ...result,
          path: path.join('thumbnails', sizeType, thumbnailFilename)
        });
      }

      console.log(`✅ Generated ${thumbnails.length} thumbnails for media file ${mediaFileId}`);
      return thumbnails;
    } catch (error) {
      console.error(`❌ Error generating thumbnails for media file ${mediaFileId}:`, error);
      throw error;
    }
  }

  // Process and store complete media file
  async processMediaFile(buffer, whatsappMediaId, originalFilename, mimeType) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(buffer);
      
      // Check if file already exists
      const existingFile = await client.query(
        'SELECT id, file_path, thumbnail_path FROM media_files WHERE file_hash = $1',
        [fileHash]
      );

      if (existingFile.rows.length > 0) {
        console.log(`📁 File already exists with hash ${fileHash}, reusing...`);
        await client.query('COMMIT');
        return existingFile.rows[0];
      }

      // Generate filename and store file
      const filename = this.generateFilename(originalFilename, mimeType);
      const subDir = this.getSubDirectory(mimeType);
      const relativePath = await this.storeMediaFile(buffer, filename, subDir);
      const fullPath = path.join(this.uploadDir, relativePath);

      // Get metadata
      let metadata = { width: null, height: null, duration: null };
      if (mimeType.startsWith('image/')) {
        metadata = await this.getImageMetadata(fullPath);
      } else if (mimeType.startsWith('video/')) {
        metadata = await this.getVideoMetadata(fullPath);
      }

      // Insert media record
      const mediaResult = await client.query(`
        INSERT INTO media_files (
          whatsapp_media_id, original_filename, file_path, mime_type, 
          file_size, width, height, duration, file_hash, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        whatsappMediaId,
        originalFilename,
        relativePath,
        mimeType,
        buffer.length,
        metadata.width,
        metadata.height,
        metadata.duration,
        fileHash,
        'processing'
      ]);

      const mediaFileId = mediaResult.rows[0].id;

      // Generate thumbnails (if applicable)
      let thumbnailPath = null;
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        try {
          const thumbnails = await this.generateThumbnails(relativePath, mimeType, mediaFileId);
          // Use medium size as primary thumbnail
          const primaryThumbnail = thumbnails.find(t => t.sizeType === 'medium');
          thumbnailPath = primaryThumbnail?.path || null;
        } catch (error) {
          console.error('Thumbnail generation failed, continuing without thumbnails:', error);
        }
      }

      // Update media record with thumbnail path and completed status
      await client.query(
        'UPDATE media_files SET thumbnail_path = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [thumbnailPath, 'completed', mediaFileId]
      );

      await client.query('COMMIT');

      console.log(`✅ Media file processed successfully: ${relativePath}`);
      
      return {
        id: mediaFileId,
        file_path: relativePath,
        thumbnail_path: thumbnailPath,
        mime_type: mimeType,
        file_size: buffer.length,
        ...metadata
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error processing media file:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get media file by ID
  async getMediaFile(mediaFileId) {
    try {
      const result = await pool.query(
        'SELECT * FROM media_files WHERE id = $1',
        [mediaFileId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting media file:', error);
      throw error;
    }
  }

  // Get thumbnail by media file ID and size
  async getThumbnail(mediaFileId, sizeType = 'medium') {
    try {
      const result = await pool.query(
        'SELECT * FROM media_thumbnails WHERE media_file_id = $1 AND size_type = $2',
        [mediaFileId, sizeType]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting thumbnail:', error);
      throw error;
    }
  }
}

module.exports = new MediaProcessingService();
