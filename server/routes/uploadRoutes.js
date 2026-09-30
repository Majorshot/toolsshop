const express = require('express');
const router = express.Router();
const { cloudinary, deleteManyFromCloudinary } = require('../utils/cloudinary');

/**
 * POST /api/upload
 * Body: { image?: string, images?: string[], folder?: string }
 * Uploads one or more base64 or URL images to Cloudinary and returns secure CDN URLs
 */
router.post('/', async (req, res) => {
  try {
    const { image, images, folder = 'toolsshop/products' } = req.body;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'lyr1439h';
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

/**
 * POST /api/upload/delete
 * Body: { url?: string, urls?: string[], public_id?: string, public_ids?: string[] }
 * Immediately removes images from Cloudinary CDN storage
 */
router.post('/delete', async (req, res) => {
  try {
    const { url, urls, public_id, public_ids } = req.body;
    const toDelete = [
      ...(Array.isArray(urls) ? urls : (url ? [url] : [])),
      ...(Array.isArray(public_ids) ? public_ids : (public_id ? [public_id] : []))
    ].filter(Boolean);

    if (!toDelete.length) {
      return res.status(400).json({
        success: false,
        error: 'No image URLs or public IDs provided for deletion'
      });
    }

    const results = await deleteManyFromCloudinary(toDelete);
    return res.json({
      success: true,
      message: `Deleted ${results.filter(r => r.success).length} of ${toDelete.length} image(s) from Cloudinary`,
      results
    });
  } catch (err) {
    console.error('[Cloudinary Delete Route Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete image from Cloudinary'
    });
  }
});

/**
 * DELETE /api/upload
 * Deletes images via standard DELETE verb
 */
router.delete('/', async (req, res) => {
  try {
    const url = req.body?.url || req.query?.url;
    const urls = req.body?.urls || (req.query?.urls ? req.query.urls.split(',') : null);
    const public_id = req.body?.public_id || req.query?.public_id;
    const toDelete = [
      ...(Array.isArray(urls) ? urls : (url ? [url] : [])),
      public_id
    ].filter(Boolean);

    if (!toDelete.length) {
      return res.status(400).json({
        success: false,
        error: 'No image URLs provided for deletion'
      });
    }

    const results = await deleteManyFromCloudinary(toDelete);
    return res.json({
      success: true,
      results
    });
  } catch (err) {
    console.error('[Cloudinary Delete Route Error]', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to delete image'
    });
  }
});

module.exports = router;
