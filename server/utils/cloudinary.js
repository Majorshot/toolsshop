const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'lyr1439h',
  api_key: process.env.CLOUDINARY_API_KEY || '356354551497522',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'aNXDq-MlE_vuhQbkqqZF0vTxjz8'
});

/**
 * Extracts the Cloudinary public_id from a URL or raw public_id string.
 * Supports versioned URLs, transformed URLs, and raw paths.
 */
function extractCloudinaryPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const str = urlOrId.trim();
  if (!str) return null;

  // If it's already a raw public_id (doesn't start with http/https)
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return str.replace(/\.[^/.]+$/, '');
  }

  // Must be a Cloudinary URL
  if (!str.includes('cloudinary.com')) return null;

  try {
    const uploadIdx = str.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let afterUpload = str.substring(uploadIdx + 8); // Skip '/upload/'

    // Match and remove version segment /v<digits>/ (and optional transformations before it)
    const vMatch = afterUpload.match(/^(?:.*\/)?v\d+\/(.+)$/);
    if (vMatch && vMatch[1]) {
      afterUpload = vMatch[1];
    }

    // Strip extension (.jpg, .png, .webp, .jpeg, etc.)
    afterUpload = afterUpload.replace(/\.[^/.]+$/, '');
    return afterUpload;
  } catch (e) {
    return null;
  }
}

/**
 * Delete a single image from Cloudinary by URL or public_id
 */
async function deleteFromCloudinary(urlOrId) {
  const publicId = extractCloudinaryPublicId(urlOrId);
  if (!publicId) {
    return { success: false, reason: 'Not a recognized Cloudinary image URL or public_id' };
  }

  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });
    console.log(`[Cloudinary Auto-Delete] Purged ${publicId}:`, res.result);
    return { success: true, publicId, result: res.result };
  } catch (err) {
    console.error(`[Cloudinary Destroy Error for ${publicId}]:`, err.message);
    return { success: false, publicId, error: err.message };
  }
}

/**
 * Delete multiple images from Cloudinary
 */
async function deleteManyFromCloudinary(urlsOrIds) {
  if (!Array.isArray(urlsOrIds) || !urlsOrIds.length) return [];
  const uniqueUrls = [...new Set(urlsOrIds.filter(Boolean))];
  const results = await Promise.all(uniqueUrls.map(item => deleteFromCloudinary(item)));
  return results;
}

module.exports = {
  cloudinary,
  extractCloudinaryPublicId,
  deleteFromCloudinary,
  deleteManyFromCloudinary
};
