/**
 * Lightweight, zero-dependency sliding-window IP rate limiter
 * Protects endpoints against Denial of Service (DoS), bot scraping, and credential stuffing
 */
function createRateLimiter({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Too many requests from this IP. Please try again in a few moments.'
} = {}) {
  const ipHits = new Map();

  // Cleanup expired timestamps every interval
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipHits.entries()) {
      const valid = timestamps.filter(t => t > now - windowMs);
      if (valid.length === 0) {
        ipHits.delete(ip);
      } else {
        ipHits.set(ip, valid);
      }
    }
  }, Math.max(15000, windowMs));
  if (timer.unref) timer.unref();

  return function rateLimiterMiddleware(req, res, next) {
    // Extract real client IP (supports proxies such as Render / Cloudflare / Vercel)
    const rawForwarded = req.headers['x-forwarded-for'];
    const ip = rawForwarded
      ? String(rawForwarded).split(',')[0].trim()
      : (req.ip || req.socket?.remoteAddress || '127.0.0.1');

    const now = Date.now();
    const currentHits = (ipHits.get(ip) || []).filter(t => t > now - windowMs);

    if (currentHits.length >= max) {
      const earliest = currentHits[0];
      const retryAfterSec = Math.max(1, Math.ceil((earliest + windowMs - now) / 1000));
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfterSec
      });
    }

    currentHits.push(now);
    ipHits.set(ip, currentHits);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentHits.length));
    next();
  };
}

module.exports = {
  createRateLimiter
};
