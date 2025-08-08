const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Memory storage for cart images with cleanup
const cartImages = new Map();
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const IMAGE_DIR = path.join(__dirname, '..', 'uploads', 'cart-images');

// Ensure upload directory exists
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Cleanup old images periodically
setInterval(() => {
  const now = Date.now();
  for (const [imageId, data] of cartImages.entries()) {
    if (now - data.timestamp > CLEANUP_INTERVAL) {
      // Remove from memory
      cartImages.delete(imageId);
      
      // Remove file if it exists
      const filePath = path.join(IMAGE_DIR, `${imageId}.jpg`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log(`🧹 Cleaned up cart image: ${imageId}`);
    }
  }
}, CLEANUP_INTERVAL);

// Convert base64 cart image to public URL
router.post('/upload', async (req, res) => {
  try {
    const { imageData, phoneNumber } = req.body;
    
    if (!imageData || !imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image data format'
      });
    }

    // Extract base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique image ID
    const imageId = crypto.createHash('md5').update(base64Data + phoneNumber + Date.now()).digest('hex');
    const fileName = `${imageId}.jpg`;
    const filePath = path.join(IMAGE_DIR, fileName);
    
    // Save image to disk
    fs.writeFileSync(filePath, imageBuffer);
    
    // Store in memory for quick access
    cartImages.set(imageId, {
      phoneNumber,
      timestamp: Date.now(),
      filePath,
      fileName
    });
    
    // Create public URL using ngrok domain
    const publicUrl = `${process.env.PUBLIC_URL}/api/cart-image-upload/serve/${imageId}`;
    
    console.log(`✅ Cart image uploaded with ID: ${imageId} for phone: ${phoneNumber}`);
    console.log(`📸 Public URL: ${publicUrl}`);
    
    res.json({
      success: true,
      imageId,
      imageUrl: publicUrl,
      fileSize: imageBuffer.length
    });

  } catch (error) {
    console.error('❌ Error uploading cart image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload cart image'
    });
  }
});

// Serve cart images
router.get('/serve/:imageId', (req, res) => {
  try {
    const { imageId } = req.params;
    
    const imageData = cartImages.get(imageId);
    if (!imageData) {
      return res.status(404).json({
        success: false,
        error: 'Cart image not found or expired'
      });
    }
    
    const filePath = imageData.filePath;
    if (!fs.existsSync(filePath)) {
      cartImages.delete(imageId);
      return res.status(404).json({
        success: false,
        error: 'Cart image file not found'
      });
    }
    
    // Serve the image
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 minutes cache
    
    const imageBuffer = fs.readFileSync(filePath);
    console.log(`📤 Serving cart image: ${imageId} (${imageBuffer.length} bytes)`);
    
    res.send(imageBuffer);

  } catch (error) {
    console.error('❌ Error serving cart image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve cart image'
    });
  }
});

// Debug endpoint - list cart images
router.get('/debug', (req, res) => {
  const images = Array.from(cartImages.entries()).map(([id, data]) => ({
    id,
    phoneNumber: data.phoneNumber,
    timestamp: new Date(data.timestamp).toISOString(),
    fileName: data.fileName,
    exists: fs.existsSync(data.filePath)
  }));
  
  res.json({
    success: true,
    totalImages: images.length,
    images,
    uploadDir: IMAGE_DIR
  });
});

module.exports = router;
