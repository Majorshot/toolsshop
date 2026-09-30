const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '356354551497522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'aNXDq-MlE_vuhQbkqqZF0vTxjz8'
});

/**
 * POST /api/upload
 * Body: { image?: string, images?: string[], folder?: string }
 * Uploads one or more base64 or URL images to Cloudinary and returns secure CDN URLs
 */
router.post('/', async (req, res) => {
  try {
    const { image, images, folder = 'toolsshop/products' } = req.body;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      return res.status(400).json({
        success: false,
        error: 'Cloudinary Cloud Name is not configured yet. Please provide CLOUDINARY_CLOUD_NAME in server environment.'
      });
    }

    const itemsToUpload = Array.isArray(images) && images.length > 0
      ? images
      : (image ? [image] : []);

    if (!itemsToUpload.length) {
      return res.status(400).json({
        success: false,
        error: 'No image data provided for upload'
      });
    }

    // Upload helper with automatic quality & format optimization
    const uploadSingle = async (dataUri) => {
      // If it's already an external hosted URL that is not a data URI and not empty, skip or upload remote
      if (typeof dataUri === 'string' && dataUri.startsWith('http') && dataUri.includes('cloudinary.com')) {
        return dataUri;
      }

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return result.secure_url;
    };

    const uploadedUrls = await Promise.all(itemsToUpload.map(img => uploadSingle(img)));

    return res.json({
      success: true,
      url: uploadedUrls[0] || '',
      urls: uploadedUrls
    });
  } catch (err) {
    console.error('[Cloudinary Upload Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to upload image to Cloudinary'
    });
  }
});

module.exports = router;
