const dns = require('dns');
try {
  if (process.platform === 'win32' || (!process.env.RENDER && process.env.NODE_ENV !== 'production')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (e) {
  console.warn("DNS setup notice:", e.message);
}
require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const db = require('./utils/db');
const { requireStoreOwner } = require('./utils/auth');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeRoutes = require('./routes/storeRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const repairRoutes = require('./routes/repairRoutes');
const customerRoutes = require('./routes/customerRoutes');
const { startKeepAliveService, getKeepAliveStatus } = require('./utils/keepAlive');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middlewares: Secure CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5000',
      'https://variathupowertools.vercel.app',
      'https://toolsshop.vercel.app'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server, mobile app or curl with no origin
    if (!origin) return callback(null, true);
    // In local development with no ALLOWED_ORIGINS configured, allow local hosts
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);

    // Validate preview branch deployments of this repository specifically
    const isApprovedVercelApp = /^https:\/\/(variathupowertools|toolsshop|variathu)(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);
    if (isApprovedVercelApp) return callback(null, true);

    console.warn(`[CORS Blocked] Origin: ${origin}`);
    callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true
}));

app.use(compression({ threshold: 1024 }));
app.use(express.json({ limit: '5mb' }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Variathu Power Tools API',
    timestamp: new Date().toISOString()
  });
});

// Render 24/7 Keep-Alive Endpoint
app.get('/api/keep-alive', (req, res) => {
  res.json({
    status: 'alive',
    message: 'Variathu Power Tools server is active and warm',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    keepAlive: getKeepAliveStatus(),
    db: db.getStatus().isMongoConnected ? 'connected' : 'disconnected'
  });
});

// Real-time Database Status check & reconnect trigger
app.get('/api/db-status', (req, res) => {
  res.json(db.getStatus());
});

// Protected: Only store owner can trigger database reconnect
app.post('/api/db-reconnect', requireStoreOwner, async (req, res) => {
  const connected = await db.forceReconnect();
  res.json({ success: connected, ...db.getStatus() });
});

// Mount Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/repairs', repairRoutes);

// Meta WhatsApp Cloud API Webhook verification & handler
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'variathu_whatsapp_token_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] ✅ Verified successfully by Meta!');
      return res.status(200).send(challenge);
    } else {
      console.warn('[WhatsApp Webhook] ❌ Verify token mismatch');
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

app.post('/api/webhook', (req, res) => {
  // Acknowledge Meta webhook message receipts or incoming text events immediately
  res.status(200).send('EVENT_RECEIVED');
});

// Global Error Handler (Sanitizes stack traces in production)
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : "Internal server error"
  });
});

// Initialize DB and start server
async function startServer() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  VARIATHU POWER TOOLS - SECURED BACKEND SERVER`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Keep-Alive: http://localhost:${PORT}/api/keep-alive`);
    console.log(`====================================================`);

    // Start background keep-alive ping engine to prevent Render 15-min idle sleeps
    startKeepAliveService(PORT);
  });
}

startServer();
