/**
 * High Performance Image Optimizer
 * 
 * Automatically applies on-the-fly transformations for Cloudinary & Unsplash:
 * - Cloudinary: Injects f_auto,q_auto,w_<width>,c_limit for WebP/AVIF compression & dynamic resizing
 * - Unsplash: Ensures w=<width>&auto=format&fit=crop&q=80
 * Drastically reduces mobile data usage and accelerates Largest Contentful Paint (LCP).
 */
export function getOptimizedImageUrl(url, width = 500) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Cloudinary image transformation
  if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/')) {
    if (!trimmed.includes('/f_auto') && !trimmed.includes('/q_auto')) {
      return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
    }
  }

  // Unsplash image transformation
  if (trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=format')) {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}w=${width}&auto=format&fit=crop&q=80`;
    }
  }

  return trimmed;
}
