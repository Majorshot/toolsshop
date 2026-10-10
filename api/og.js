// Vercel Serverless Function: Dynamic Social Open Graph Link Preview for WhatsApp, Facebook, Twitter, iMessage
// When a crawler visits https://www.variathupowertools.in/product/:id, this endpoint generates the rich card with:
// 1. Cover image of the product (og:image)
// 2. Product Name and ₹Price as title (og:title)
// 3. Clear description with price, brand, and warranty (og:description)

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  const { id } = req.query || {};

  if (!id || id === 'undefined' || id === 'null') {
    return res.redirect(302, 'https://www.variathupowertools.in/shop');
  }

  const cleanId = String(id).trim();
  let product = null;

  // 1. Fetch live product from Backend API
  const API_BASE = process.env.VITE_API_URL || process.env.API_URL || 'https://variathu-power-tools-api.onrender.com/api';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);
    const apiRes = await fetch(`${API_BASE}/products/${encodeURIComponent(cleanId)}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      product = data?.data || data?.product || data;
    }
  } catch (err) {
    // API request timeout / network fallback
  }

  const productName = product?.name || cleanId.replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const rawPrice = product?.price ? Number(product.price) : null;
  const formattedPrice = rawPrice ? rawPrice.toLocaleString('en-IN') : null;
  const brand = product?.brand || 'Variathu Power Tools';
  const mrpText = product?.originalPrice && Number(product.originalPrice) > (rawPrice || 0)
    ? ` (MRP: ₹${Number(product.originalPrice).toLocaleString('en-IN')})`
    : '';

  // Determine Cover Image URL (must be absolute HTTPS for WhatsApp/Facebook scrapers)
  let coverImage = product?.image || (Array.isArray(product?.images) && product.images[0]) || 'https://www.variathupowertools.in/logo.jpg';
  if (coverImage.startsWith('/')) {
    coverImage = `https://www.variathupowertools.in${coverImage}`;
  }

  const ogTitle = formattedPrice ? `${productName} • ₹${formattedPrice}` : `${productName} | Variathu Power Tools`;
  const ogDesc = formattedPrice
    ? `₹${formattedPrice}${mrpText} • ${brand} - Genuine equipment with official warranty. Doorstep delivery across Kerala from Variathu Power Tools, Kozhencherry.`
    : `Authorized sales & service for ${brand} power equipment in Kozhencherry, Kerala. Order online with express delivery.`;

  const canonicalUrl = `https://www.variathupowertools.in/product/${encodeURIComponent(cleanId)}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200');

  return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>

  <!-- Open Graph / WhatsApp / Facebook / iMessage / LinkedIn / Telegram -->
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="Variathu Power Tools" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDesc)}" />
  <meta property="og:image" content="${escapeHtml(coverImage)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(coverImage)}" />
  <meta property="og:image:alt" content="${escapeHtml(productName)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="600" />
  <meta property="og:image:height" content="600" />
  <meta property="og:url" content="${canonicalUrl}" />
  ${rawPrice ? `<meta property="product:price:amount" content="${rawPrice}" />` : ''}
  <meta property="product:price:currency" content="INR" />

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />
  <meta name="twitter:image" content="${escapeHtml(coverImage)}" />

  <!-- Instant Browser Redirect for Human Visitors -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
  <script>window.location.replace("${canonicalUrl}");</script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 16px; text-align: center; color: #0f172a; background: #f8fafc;">
  <div style="max-width: 440px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <img src="${escapeHtml(coverImage)}" alt="${escapeHtml(productName)}" style="width: 100%; max-height: 260px; object-fit: contain; border-radius: 10px; margin-bottom: 16px;" />
    <h1 style="font-size: 1.15rem; font-weight: 800; margin: 0 0 6px;">${escapeHtml(productName)}</h1>
    ${formattedPrice ? `<p style="font-size: 1.4rem; font-weight: 900; color: #ea580c; margin: 0 0 12px;">₹${formattedPrice}</p>` : ''}
    <p style="font-size: 0.85rem; color: #64748b; margin: 0 0 18px; line-height: 1.5;">${escapeHtml(ogDesc)}</p>
    <a href="${canonicalUrl}" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 11px 24px; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
      Open in Store &rarr;
    </a>
  </div>
</body>
</html>`);
};
