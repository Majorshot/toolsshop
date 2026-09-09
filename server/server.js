const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./utils/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const storeRoutes = require('./routes/storeRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const couponRoutes = require('./routes/couponRoutes');
const repairRoutes = require('./routes/repairRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // In dev (no ALLOWED_ORIGINS set), allow everything
    if (allowedOrigins.length === 0) return callback(null, true);
    // Check exact match
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Check wildcard patterns (e.g. *.vercel.app)
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(1); // ".vercel.app"
        return origin.endsWith(domain);
      }
      return false;
    });
    if (isAllowed) return callback(null, true);
    console.log(`CORS blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true
}));
app.use(express.json());

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

// Real-time Database Status check & reconnect trigger
app.get('/api/db-status', (req, res) => {
  res.json(db.getStatus());
});

app.post('/api/db-reconnect', async (req, res) => {
  const connected = await db.forceReconnect();
  res.json({ success: connected, ...db.getStatus() });
});

// Mount Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/repairs', repairRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// Initialize DB and start server
async function startServer() {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  VARIATHU POWER TOOLS - BACKEND SERVER RUNNING`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

startServer();
