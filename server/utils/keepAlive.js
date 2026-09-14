/**
 * Render.com Keep-Alive Engine for Variathu Power Tools
 * 
 * Free instances on Render spin down into sleep mode after 15 minutes of inactivity.
 * Cold-starts can take 30-50+ seconds.
 * 
 * This background service performs automated self-pings every 12 minutes (720,000 ms)
 * to keep the Node.js server permanently warm and responsive 24/7.
 */

const https = require('https');
const http = require('http');

let timer = null;
let lastPingTime = null;
let lastPingStatus = 'Not started';
let pingCount = 0;

function resolveTargetUrl(port = 5000) {
  // Render automatically sets RENDER_EXTERNAL_URL (e.g., https://variathu-backend.onrender.com)
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '')}/api/keep-alive`;
  }
  if (process.env.SERVER_URL) {
    return `${process.env.SERVER_URL.replace(/\/+$/, '')}/api/keep-alive`;
  }
  if (process.env.APP_URL) {
    return `${process.env.APP_URL.replace(/\/+$/, '')}/api/keep-alive`;
  }
  return `http://localhost:${port}/api/keep-alive`;
}

async function pingEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    try {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;

      const req = client.get(url, { timeout: 10000 }, (res) => {
        const elapsed = Date.now() - startTime;
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          lastPingTime = new Date().toISOString();
          lastPingStatus = `HTTP ${res.statusCode} (${elapsed}ms)`;
          pingCount++;
          console.log(`[Keep-Alive] Ping #${pingCount} to ${url} -> Status: ${res.statusCode} in ${elapsed}ms`);
          resolve({ success: res.statusCode === 200, status: res.statusCode, elapsed });
        });
      });

      req.on('error', (err) => {
        lastPingTime = new Date().toISOString();
        lastPingStatus = `Error: ${err.message}`;
        console.warn(`[Keep-Alive] Notice on pinging ${url}:`, err.message);
        resolve({ success: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        lastPingTime = new Date().toISOString();
        lastPingStatus = 'Timeout (10s)';
        console.warn(`[Keep-Alive] Ping to ${url} timed out`);
        resolve({ success: false, error: 'Timeout' });
      });
    } catch (e) {
      console.warn(`[Keep-Alive] Exception:`, e.message);
      resolve({ success: false, error: e.message });
    }
  });
}

function startKeepAliveService(port = 5000, intervalMs = 12 * 60 * 1000) {
  const targetUrl = resolveTargetUrl(port);
  console.log(`[Keep-Alive] Engine initialized. Target: ${targetUrl}`);
  console.log(`[Keep-Alive] Interval: Every ${Math.round(intervalMs / 60000)} minutes`);

  // Initial warm-up ping after 30 seconds of booting
  setTimeout(() => {
    pingEndpoint(targetUrl);
  }, 30000);

  // Recurring self-ping
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    pingEndpoint(targetUrl);
  }, intervalMs);

  return { targetUrl, intervalMs };
}

function getKeepAliveStatus() {
  return {
    targetUrl: resolveTargetUrl(process.env.PORT || 5000),
    lastPingTime,
    lastPingStatus,
    pingCount,
    uptimeSeconds: Math.floor(process.uptime())
  };
}

module.exports = {
  startKeepAliveService,
  pingEndpoint,
  getKeepAliveStatus
};
