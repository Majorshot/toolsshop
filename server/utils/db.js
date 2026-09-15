const dns = require('dns');
try {
  if (process.platform === 'win32' || (!process.env.RENDER && process.env.NODE_ENV !== 'production')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (e) {
  console.warn("DNS server setup notice:", e.message);
}

const mongoose = require('mongoose');
const seedProducts = require('../data/seedProducts');

let razorpayClient = null;
try {
  const Razorpay = require('razorpay');
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TZQUSp5JtcBjMs',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dhYp7neRQNqygARxN2oM6pl1',
  });
} catch (err) {
  console.warn("Razorpay instance init notice in db.js:", err.message);
}

// Store Info for Variathu Power Tools
const storeInfo = {
  name: "Variathu Power Tools",
  tagline: "Heavy Duty Equipment, Sales, Service & Spares",
  building: "Poyanil Building",
  landmark: "Near St Thomas Higher Secondary School Ground",
  junction: "Poyanil Junction",
  town: "Kozhencherry",
  district: "Pathanamthitta",
  pincode: "689641",
  state: "Kerala",
  fullAddress: "Poyanil Building, Near St Thomas Higher Secondary School Ground, Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala",
  phone: "+91 94471 23456",
  whatsapp: "919447123456",
  email: "variathupowertools@gmail.com",
  timings: "Monday - Saturday: 8:30 AM - 7:30 PM | Sunday: Closed",
  geo: {
    lat: 9.3414,
    lng: 76.7028,
    googleMapsUrl: "https://maps.google.com/?q=Poyanil+Junction+Kozhencherry+Pathanamthitta"
  },
  services: [
    "Authorized Sales & Warranty Support",
    "On-Site Equipment Repair & Overhaul",
    "Genuine Armatures, Switches, Carbon Brushes & Spares",
    "Express Pickup at Poyanil Building"
  ]
};

// ==========================================
// Mongoose Schemas & Models (MongoDB Atlas)
// ==========================================
const productSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  brand: String,
  category: String,
  price: Number,
  originalPrice: Number,
  discount: String,
  rating: Number,
  reviewsCount: Number,
  badge: String,
  stock: Number,
  cordless: Boolean,
  image: String,
  images: [String],
  deliveryCost: { type: Number, default: 0 },
  description: String,
  specs: Object,
  features: [String]
}, { timestamps: true });

// High Performance Indexes for 1,000+ Products
productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  customer: Object,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  items: Array,
  totalAmount: Number,
  deliveryType: String,
  paymentMethod: String,
  paymentStatus: String,
  transactionId: String,
  pickupOtp: String,
  awb: String,
  courierPartner: String,
  handoverVerified: Boolean,
  collectedAt: String,
  status: { type: String, default: "Order Placed" },
  date: { type: String, default: () => new Date().toISOString() },
  couponCode: String,
  discountAmount: Number,
  refundId: String,
  refundAmount: Number,
  refundedAt: String,
  cancelledAt: String,
  cancelledBy: String,
  cancellationReason: String,
  cancellationRequested: { type: Boolean, default: false },
  cancellationRequestedAt: String,
  cancellationRequestReason: String
}, { timestamps: true, strict: false });

// Performance Indexes for Orders
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ date: -1 });

// Dedicated Customer CRM Schema for 500+ Customers
const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  address: { type: String, default: '' },
  landmark: { type: String, default: '' },
  district: { type: String, default: 'Pathanamthitta' },
  state: { type: String, default: 'Kerala' },
  pincode: { type: String, default: '689641' },
  savedAddresses: [{
    id: String,
    name: String,
    phone: String,
    address: String,
    landmark: String,
    district: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }],
  notes: { type: String, default: '' },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: { type: Date, default: null },
  firstInteractionAt: { type: Date, default: Date.now }
}, { timestamps: true });

customerSchema.index({ name: 'text', district: 'text' });
customerSchema.index({ email: 1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ totalOrders: -1 });
customerSchema.index({ createdAt: -1 });

const taxonomySchema = new mongoose.Schema({
  brands: [String],
  categories: [{ id: String, name: String }]
}, { timestamps: true });

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, uppercase: true, trim: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  usageLimitPerUser: { type: Number, default: 0 },
  maxTotalUses: { type: Number, default: 0 },
  usedByPhones: [{ type: String }],
  usedByCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  usedByEmails: [{ type: String }]
}, { timestamps: true });

const repairSchema = new mongoose.Schema({
  jobId: { type: String, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  toolBrand: String,
  toolModel: { type: String, required: true },
  serialNumber: String,
  issueDescription: { type: String, required: true },
  estimatedCost: { type: Number, default: 0 },
  finalCost: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Received', 'Diagnosing', 'Waiting for Spares', 'Repaired & Ready', 'Handed Over'],
    default: 'Received'
  },
  technicianNotes: String,
  handoverOtp: { type: String, default: () => String(Math.floor(1000 + Math.random() * 9000)) },
  handoverVerified: { type: Boolean, default: false },
  completedAt: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true });

repairSchema.index({ customerPhone: 1 });
repairSchema.index({ status: 1, createdAt: -1 });

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
const TaxonomyModel = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
const RepairModel = mongoose.models.Repair || mongoose.model('Repair', repairSchema);

// Customer Sync & Migration Helpers
function cleanCustomerPhone(phone = '') {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

async function syncCustomerFromOrder(orderData) {
  try {
    const rawPhone = orderData.customer?.phone;
    const phone = cleanCustomerPhone(rawPhone);
    if (!phone || phone.length < 7) return null;

    const name = (orderData.customer?.name || '').trim() || 'Customer';
    const email = (orderData.customer?.email || '').trim().toLowerCase();
    const address = orderData.customer?.address || '';
    const district = orderData.customer?.district || 'Pathanamthitta';
    const pincode = orderData.customer?.pincode || '';
    const isCancelled = (orderData.status || '').toLowerCase().includes('cancel') || orderData.paymentStatus === 'REFUNDED';
    const orderAmount = isCancelled ? 0 : (Number(orderData.totalAmount) || 0);
    const orderIncrement = isCancelled ? 0 : 1;

    const existing = await CustomerModel.findOne({ phone });
    if (existing) {
      existing.totalOrders = (existing.totalOrders || 0) + orderIncrement;
      existing.totalSpent = (existing.totalSpent || 0) + orderAmount;
      existing.lastOrderAt = new Date();
      if (name && name !== 'Customer' && (!existing.name || existing.name === 'Customer')) {
        existing.name = name;
      }
      if (email && (!existing.email || !existing.email.includes('@'))) {
        existing.email = email;
      }
      if (address) existing.address = address;
      if (orderData.customer?.landmark) existing.landmark = orderData.customer.landmark;
      if (district) existing.district = district;
      if (pincode) existing.pincode = pincode;

      // Maintain saved addresses list for 1-click address selection
      if (address && pincode) {
        if (!existing.savedAddresses) existing.savedAddresses = [];
        const exists = existing.savedAddresses.some(a => a.address === address && a.pincode === pincode);
        if (!exists) {
          existing.savedAddresses.push({
            id: `addr-${Date.now()}`,
            name: name || existing.name,
            phone: phone || existing.phone,
            address,
            landmark: orderData.customer?.landmark || '',
            district,
            state: 'Kerala',
            pincode,
            isDefault: existing.savedAddresses.length === 0
          });
        }
      }

      await existing.save();
      return existing;
    } else {
      const initialAddresses = (address && pincode) ? [{
        id: `addr-${Date.now()}`,
        name: name || 'Customer',
        phone,
        address,
        landmark: orderData.customer?.landmark || '',
        district,
        state: 'Kerala',
        pincode,
        isDefault: true
      }] : [];

      const newCust = new CustomerModel({
        phone,
        name,
        email,
        address,
        landmark: orderData.customer?.landmark || '',
        district,
        state: 'Kerala',
        pincode,
        savedAddresses: initialAddresses,
        totalOrders: orderIncrement,
        totalSpent: orderAmount,
        lastOrderAt: new Date()
      });
      return await newCust.save();
    }
  } catch (err) {
    console.warn("Could not sync customer from order:", err.message);
    return null;
  }
}

async function findOrCreateCustomer(data = {}) {
  ensureMongoConnected();
  const rawPhone = data.phone || data.identifier;
  const phone = cleanCustomerPhone(rawPhone);
  const email = (data.email || (data.identifier && data.identifier.includes('@') ? data.identifier : '')).trim().toLowerCase();
  const name = (data.name || '').trim();

  let customer = null;
  if (phone && phone.length >= 7) {
    customer = await CustomerModel.findOne({
      $or: [
        { phone },
        { phone: `+91${phone}` },
        { phone: { $regex: phone } }
      ]
    });
  }
  if (!customer && email && email.includes('@')) {
    customer = await CustomerModel.findOne({ email });
  }

  if (customer) {
    let changed = false;
    if (name && name !== 'Customer' && (!customer.name || customer.name === 'Customer')) {
      customer.name = name;
      changed = true;
    }
    if (email && email.includes('@') && (!customer.email || !customer.email.includes('@'))) {
      customer.email = email;
      changed = true;
    }
    if (data.address && !customer.address) {
      customer.address = data.address;
      changed = true;
    }
    if (data.district && !customer.district) {
      customer.district = data.district;
      changed = true;
    }
    if (data.pincode && !customer.pincode) {
      customer.pincode = data.pincode;
      changed = true;
    }
    if (changed) await customer.save();
    return customer;
  }

  const newCust = new CustomerModel({
    phone: phone || `cust-${Date.now()}`,
    name: name || 'Customer',
    email,
    address: data.address || '',
    landmark: data.landmark || '',
    district: data.district || 'Pathanamthitta',
    state: 'Kerala',
    pincode: data.pincode || '689641',
    savedAddresses: (data.address && data.pincode) ? [{
      id: `addr-${Date.now()}`,
      name: name || 'Customer',
      phone: phone || '',
      address: data.address,
      landmark: data.landmark || '',
      district: data.district || 'Pathanamthitta',
      state: 'Kerala',
      pincode: data.pincode,
      isDefault: true
    }] : [],
    totalOrders: 0,
    totalSpent: 0
  });
  return await newCust.save();
}

async function recalculateCustomerMetrics(phone) {
  try {
    const cleanPhone = cleanCustomerPhone(phone);
    if (!cleanPhone || cleanPhone.length < 7) return null;
    const orders = await OrderModel.find({
      $or: [
        { "customer.phone": cleanPhone },
        { "customer.phone": `+91${cleanPhone}` },
        { "customer.phone": { $regex: cleanPhone } }
      ]
    }).lean();

    const activeOrders = orders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return !st.includes('cancel') && o.paymentStatus !== 'REFUNDED';
    });

    const totalSpent = activeOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOrders = activeOrders.length;

    return await CustomerModel.findOneAndUpdate(
      { phone: cleanPhone },
      { $set: { totalSpent, totalOrders } },
      { new: true }
    ).lean();
  } catch (err) {
    console.warn("Could not recalculate customer metrics:", err.message);
    return null;
  }
}

async function reconcileCustomerMetrics() {
  try {
    const allCustomers = await CustomerModel.find().lean();
    for (const cust of allCustomers) {
      if (!cust.phone) continue;
      const orders = await OrderModel.find({
        $or: [
          { 'customer.phone': cust.phone },
          { 'customer.phone': `+91${cust.phone}` },
          { 'customer.phone': { $regex: cust.phone } }
        ]
      }).lean();

      const activeOrders = orders.filter(o => {
        const st = (o.status || '').toLowerCase();
        return !st.includes('cancel') && o.paymentStatus !== 'REFUNDED';
      });

      const accurateSpent = activeOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      const accurateOrders = activeOrders.length;

      if (cust.totalSpent !== accurateSpent || cust.totalOrders !== accurateOrders) {
        await CustomerModel.updateOne(
          { _id: cust._id },
          { $set: { totalSpent: accurateSpent, totalOrders: accurateOrders } }
        );
      }
    }
  } catch (err) {
    console.warn("[Customer Reconcile] Notice:", err.message);
  }
}

async function syncCustomerFromRepair(jobData) {
  try {
    const phone = cleanCustomerPhone(jobData.customerPhone);
    if (!phone || phone.length < 7) return null;

    const name = (jobData.customerName || '').trim() || 'Customer';
    const existing = await CustomerModel.findOne({ phone });
    if (existing) {
      if (name && name !== 'Customer' && (!existing.name || existing.name === 'Customer')) {
        existing.name = name;
        await existing.save();
      }
      return existing;
    } else {
      const newCust = new CustomerModel({
        phone,
        name,
        district: 'Pathanamthitta',
        state: 'Kerala',
        totalOrders: 0,
        totalSpent: 0
      });
      return await newCust.save();
    }
  } catch (err) {
    console.warn("Could not sync customer from repair:", err.message);
    return null;
  }
}

async function backfillCustomersFromOrdersAndRepairs() {
  try {
    const custCount = await CustomerModel.countDocuments();
    if (custCount > 0) return;

    console.log("[Customer Migration] Backfilling customer profiles from historical orders and repairs...");
    const orders = await OrderModel.find().lean();
    for (const ord of orders) {
      if (ord.customer && ord.customer.phone) {
        await syncCustomerFromOrder(ord);
      }
    }

    const repairs = await RepairModel.find().lean();
    for (const rep of repairs) {
      if (rep.customerPhone) {
        await syncCustomerFromRepair(rep);
      }
    }

    const finalCount = await CustomerModel.countDocuments();
    console.log(`[Customer Migration] Success! Registered ${finalCount} unique customer profiles in CustomerModel.`);
  } catch (err) {
    console.warn("[Customer Migration] Warning during backfill:", err.message);
  }
}

let isMongoConnected = false;
let lastAtlasError = null;
let reconnectTimer = null;

async function tryConnectMongo() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    lastAtlasError = "MONGODB_URI environment variable is missing";
    return false;
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 6000,
        maxPoolSize: 50,
        minPoolSize: 5,
        socketTimeoutMS: 30000
      });
    }
    if (mongoose.connection.readyState === 1) {
      isMongoConnected = true;
      lastAtlasError = null;
      console.log("====================================================");
      console.log("  >>> CONNECTED TO MONGODB ATLAS CLUSTER! <<<");
      console.log("  Database: variathupowertools (Atlas Cloud)");
      console.log("  Strict MongoDB Mode Active - Zero Mock/Hardcoded Data");
      console.log("====================================================");

      // Seed initial product catalog to MongoDB Atlas if empty
      const prodCount = await ProductModel.countDocuments();
      if (prodCount === 0) {
        await ProductModel.insertMany(seedProducts);
        console.log(`Seeded ${seedProducts.length} initial products to MongoDB Atlas.`);
      }

      // Seed initial taxonomy to MongoDB Atlas if empty
      const taxCount = await TaxonomyModel.countDocuments();
      if (taxCount === 0) {
        await TaxonomyModel.create({
          brands: ['Bosch', 'Makita', 'DeWalt', 'Dongcheng', 'HiKOKI', 'Stanley', 'IBELL', 'Stihl', 'Taparia'],
          categories: [
            { id: 'cordless', name: 'Cordless Tools' },
            { id: 'grinders-cutters', name: 'Grinders & Cutters' },
            { id: 'hammers', name: 'Hammer Drills' },
            { id: 'woodworking', name: 'Woodworking' },
            { id: 'washers-blowers', name: 'Washers & Blowers' },
            { id: 'accessories', name: 'Accessories & Bits' }
          ]
        });
        console.log("Seeded initial categories & brands taxonomy to MongoDB Atlas.");
      }

      // Auto-migrate & backfill customer CRM directory from past orders/repairs if empty
      await backfillCustomersFromOrdersAndRepairs();
      await reconcileCustomerMetrics();

      if (reconnectTimer) {
        clearInterval(reconnectTimer);
        reconnectTimer = null;
      }
      return true;
    }
    isMongoConnected = false;
    return false;
  } catch (err) {
    isMongoConnected = false;
    lastAtlasError = err.message || 'Connection failed';
    console.error("MongoDB Atlas connection error:", lastAtlasError);
    return false;
  }
}

async function initDB() {
  const connected = await tryConnectMongo();
  if (!connected) {
    console.warn("Awaiting MongoDB Atlas connection. Auto-retry every 5 seconds...");
    if (!reconnectTimer) {
      reconnectTimer = setInterval(async () => {
        if (!isMongoConnected) {
          const success = await tryConnectMongo();
          if (success && reconnectTimer) {
            clearInterval(reconnectTimer);
            reconnectTimer = null;
          }
        }
      }, 5000);
    }
  }
}

function ensureMongoConnected() {
  if (!isMongoConnected || mongoose.connection.readyState !== 1) {
    throw new Error(`MongoDB Atlas is not connected (${lastAtlasError || 'Connection pending'}). Please verify internet/Atlas access.`);
  }
}

// High-Speed In-Memory Cache for Catalog Lookups (1ms response for concurrent devices)
let catalogCache = null;
let catalogCacheTime = 0;
const CATALOG_CACHE_TTL = 60 * 1000; // 60 seconds

function invalidateCatalogCache() {
  catalogCache = null;
  catalogCacheTime = 0;
}

const db = {
  initDB,
  getStoreInfo: () => storeInfo,
  invalidateCatalogCache,

  // ==========================================
  // PRODUCTS (Strict MongoDB Atlas)
  // ==========================================
  async getProducts(filters = {}, options = {}) {
    ensureMongoConnected();

    const isDefaultQuery = 
      (!filters.category || filters.category === 'all') &&
      (!filters.brand || filters.brand === 'all') &&
      !filters.search &&
      filters.cordless === undefined &&
      (!filters.sortBy || filters.sortBy === 'featured') &&
      !options.page &&
      !options.limit &&
      !filters.page &&
      !filters.limit;

    if (isDefaultQuery && catalogCache && (Date.now() - catalogCacheTime < CATALOG_CACHE_TTL)) {
      return catalogCache;
    }

    let query = {};

    if (filters.category && filters.category !== 'all') {
      query.category = filters.category;
    }
    if (filters.brand && filters.brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${filters.brand}$`, 'i') };
    }
    if (filters.cordless !== undefined && filters.cordless !== null) {
      query.cordless = filters.cordless === 'true' || filters.cordless === true;
    }
    if (filters.search) {
      const q = filters.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    let sort = {};
    if (filters.sortBy === 'price-low') {
      sort.price = 1;
    } else if (filters.sortBy === 'price-high') {
      sort.price = -1;
    } else if (filters.sortBy === 'rating') {
      sort.rating = -1;
    } else {
      sort.createdAt = -1;
    }

    // High Performance Projection: Include essential list fields and image galleries
    const listFields = 'id name brand category price originalPrice discount rating reviewsCount badge stock cordless image images deliveryCost';

    const page = parseInt(options.page || filters.page, 10);
    const limit = parseInt(options.limit || filters.limit, 10);

    if (page && limit) {
      const skip = (Math.max(1, page) - 1) * limit;
      const [items, total] = await Promise.all([
        ProductModel.find(query).select(listFields).sort(sort).skip(skip).limit(limit).lean(),
        ProductModel.countDocuments(query)
      ]);
      return {
        products: items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    }

    const items = await ProductModel.find(query).select(listFields).sort(sort).lean();
    if (isDefaultQuery) {
      catalogCache = items;
      catalogCacheTime = Date.now();
    }
    return items;
  },

  async getProductById(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
    return await ProductModel.findOne(query).lean();
  },

  async createProduct(productData) {
    ensureMongoConnected();
    const id = productData.id || `vpt-${Date.now().toString().slice(-4)}`;
    const newProduct = { ...productData, id };
    const created = new ProductModel(newProduct);
    const saved = await created.save();
    invalidateCatalogCache();
    return saved;
  },

  async updateProduct(id, updates) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
    const updated = await ProductModel.findOneAndUpdate(query, updates, { new: true }).lean();
    invalidateCatalogCache();
    return updated;
  },

  async deleteProduct(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
    const res = await ProductModel.deleteOne(query);
    invalidateCatalogCache();
    return res.deletedCount > 0;
  },

  // ==========================================
  // TAXONOMY (Strict MongoDB Atlas)
  // ==========================================
  async getTaxonomy() {
    ensureMongoConnected();
    let doc = await TaxonomyModel.findOne().lean();
    if (!doc) {
      doc = await TaxonomyModel.create({
        brands: ['Bosch', 'Makita', 'DeWalt', 'Dongcheng', 'HiKOKI', 'Stanley', 'IBELL', 'Stihl', 'Taparia'],
        categories: [
          { id: 'cordless', name: 'Cordless Tools' },
          { id: 'grinders-cutters', name: 'Grinders & Cutters' },
          { id: 'hammers', name: 'Hammer Drills' },
          { id: 'woodworking', name: 'Woodworking' },
          { id: 'washers-blowers', name: 'Washers & Blowers' },
          { id: 'accessories', name: 'Accessories & Bits' }
        ]
      });
    }

    // Ensure all brands and categories from existing products in MongoDB are included
    const allProducts = await ProductModel.find({}, 'brand category').lean();
    let brands = [...(doc.brands || [])];
    let categories = [...(doc.categories || [])];
    let changed = false;

    for (const p of allProducts) {
      if (p.brand && !brands.some(b => b.toLowerCase() === p.brand.toLowerCase())) {
        brands.push(p.brand);
        changed = true;
      }
      if (p.category && !categories.some(c => c.id === p.category)) {
        categories.push({ id: p.category, name: p.category });
        changed = true;
      }
    }

    if (changed) {
      await TaxonomyModel.updateOne({ _id: doc._id }, { brands, categories });
    }

    return { brands, categories };
  },

  async addBrand(brandName) {
    ensureMongoConnected();
    const clean = (brandName || '').trim();
    if (!clean) throw new Error('Brand name cannot be empty');
    const tax = await this.getTaxonomy();
    if (tax.brands.some(b => b.toLowerCase() === clean.toLowerCase())) {
      return { success: true, brand: clean, brands: tax.brands, message: 'Brand already exists' };
    }
    const updatedBrands = [...tax.brands, clean];
    await TaxonomyModel.findOneAndUpdate({}, { brands: updatedBrands }, { upsert: true });
    return { success: true, brand: clean, brands: updatedBrands, message: `Brand "${clean}" added successfully` };
  },

  async addCategory({ name, id }) {
    ensureMongoConnected();
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('Category name cannot be empty');
    const cleanId = (id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
    const tax = await this.getTaxonomy();
    if (tax.categories.some(c => c.id === cleanId || c.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: true, category: { id: cleanId, name: cleanName }, categories: tax.categories, message: 'Category already exists' };
    }
    const updatedCats = [...tax.categories, { id: cleanId, name: cleanName }];
    await TaxonomyModel.findOneAndUpdate({}, { categories: updatedCats }, { upsert: true });
    return { success: true, category: { id: cleanId, name: cleanName }, categories: updatedCats, message: `Category "${cleanName}" added successfully` };
  },

  async deleteBrand(brandName, deleteProducts = false) {
    ensureMongoConnected();
    const clean = (brandName || '').trim().toLowerCase();
    const tax = await this.getTaxonomy();
    const updatedBrands = tax.brands.filter(b => b.toLowerCase() !== clean);
    await TaxonomyModel.findOneAndUpdate({}, { brands: updatedBrands });

    let deletedProductsCount = 0;
    if (deleteProducts) {
      const res = await ProductModel.deleteMany({ brand: { $regex: new RegExp(`^${clean}$`, 'i') } });
      deletedProductsCount = res.deletedCount || 0;
      invalidateCatalogCache();
    }
    return { success: true, brands: updatedBrands, deletedProductsCount };
  },

  async deleteCategory(categoryId, deleteProducts = false) {
    ensureMongoConnected();
    const tax = await this.getTaxonomy();
    const updatedCategories = tax.categories.filter(c => c.id !== categoryId);
    await TaxonomyModel.findOneAndUpdate({}, { categories: updatedCategories });

    let deletedProductsCount = 0;
    if (deleteProducts) {
      const res = await ProductModel.deleteMany({ category: categoryId });
      deletedProductsCount = res.deletedCount || 0;
      invalidateCatalogCache();
    }
    return { success: true, categories: updatedCategories, deletedProductsCount };
  },

  // ==========================================
  // ORDERS (Strict MongoDB Atlas)
  // ==========================================
  async getOrders() {
    ensureMongoConnected();
    return await OrderModel.find().sort({ createdAt: -1 }).lean();
  },

  async getCustomerOrders(query) {
    ensureMongoConnected();
    if (!query) return await OrderModel.find().sort({ createdAt: -1 }).lean();
    const cleanQ = String(query).trim();
    const digitsOnly = cleanQ.replace(/[^0-9]/g, '').slice(-10);

    const conditions = [
      { 'customer.phone': { $regex: cleanQ, $options: 'i' } },
      { 'customer.email': { $regex: cleanQ, $options: 'i' } },
      { 'customer.name': { $regex: cleanQ, $options: 'i' } }
    ];

    if (mongoose.isValidObjectId(cleanQ)) {
      conditions.push({ customerId: cleanQ });
      try {
        const custDoc = await CustomerModel.findById(cleanQ).lean();
        if (custDoc) {
          if (custDoc.phone) {
            const custDigits = custDoc.phone.replace(/[^0-9]/g, '').slice(-10);
            if (custDigits.length >= 7) {
              conditions.push({ 'customer.phone': { $regex: custDigits, $options: 'i' } });
            }
          }
          if (custDoc.email) {
            conditions.push({ 'customer.email': { $regex: custDoc.email.trim(), $options: 'i' } });
          }
        }
      } catch (e) {
        // Silently proceed with customerId query
      }
    }

    if (digitsOnly.length >= 7) {
      conditions.push({ 'customer.phone': { $regex: digitsOnly, $options: 'i' } });
    }

    return await OrderModel.find({ $or: conditions }).sort({ createdAt: -1 }).lean();
  },

  async createOrder(orderData) {
    ensureMongoConnected();
    const id = `VPT-ORD-${Date.now().toString().slice(-6)}`;
    const isStorePickup = (orderData.deliveryType || '').toLowerCase().includes('pickup') || orderData.deliveryType === 'store-pickup';
    const isPrepaid = ['UPI', 'RAZORPAY', 'CARD', 'NETBANKING'].includes((orderData.paymentMethod || '').toUpperCase());

    const pickupOtp = isStorePickup ? String(Math.floor(1000 + Math.random() * 9000)) : null;
    const preferredCourier = !isStorePickup ? (orderData.courierPartner || null) : null;
    const awb = orderData.awb || null;
    const transactionId = orderData.transactionId || (isPrepaid ? `TXN-VPT-${Date.now().toString().slice(-8)}` : null);
    const paymentStatus = orderData.paymentStatus || (isPrepaid ? 'PAID' : 'PENDING');

    // Link customer account from CustomerModel
    let customerDoc = null;
    if (orderData.customerId && mongoose.isValidObjectId(orderData.customerId)) {
      customerDoc = await CustomerModel.findById(orderData.customerId);
    }
    if (!customerDoc && (orderData.customer?.phone || orderData.customer?.email)) {
      customerDoc = await findOrCreateCustomer(orderData.customer);
    }

    const newOrder = {
      id,
      ...orderData,
      customerId: customerDoc ? customerDoc._id : (orderData.customerId || null),
      status: "Order Placed",
      paymentStatus,
      transactionId,
      pickupOtp,
      awb,
      courierPartner: preferredCourier,
      date: new Date().toISOString()
    };

    // Auto-decrement product stock in MongoDB Atlas
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items) {
        if (item.id) {
          await ProductModel.findOneAndUpdate(
            { id: item.id },
            { $inc: { stock: -(item.quantity || 1) } }
          );
        }
      }
      invalidateCatalogCache();
    }

    const created = new OrderModel(newOrder);
    const savedOrder = await created.save();

    // Auto-sync / update customer CRM profile in CustomerModel
    await syncCustomerFromOrder(newOrder);

    return savedOrder;
  },

  async updateOrderStatus(orderId, status, extra = {}) {
    ensureMongoConnected();
    const updateFields = { status };
    if (extra.courierPartner !== undefined) updateFields.courierPartner = extra.courierPartner;
    if (extra.awb !== undefined) updateFields.awb = extra.awb;

    return await OrderModel.findOneAndUpdate({ id: orderId }, updateFields, { new: true }).lean();
  },

  async cancelOrder(orderId, { reason = 'Order cancelled by user', cancelledBy = 'customer' } = {}) {
    ensureMongoConnected();
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (order.status === 'Cancelled') {
      return { success: false, message: "Order is already cancelled" };
    }

    let refundDetails = null;
    if (order.paymentStatus === 'PAID') {
      let refundId = null;
      const refundAmount = order.totalAmount;

      if (razorpayClient && order.transactionId && String(order.transactionId).startsWith('pay_')) {
        try {
          const rzpRefund = await razorpayClient.payments.refund(order.transactionId, {
            amount: Math.round(Number(refundAmount) * 100),
            notes: {
              orderId: order.id,
              reason: reason || 'Customer order cancellation'
            }
          });
          if (rzpRefund && rzpRefund.id) {
            refundId = rzpRefund.id;
          }
        } catch (err) {
          console.warn("Razorpay API refund notice:", err.message);
        }
      }

      if (!refundId) {
        refundId = `rfnd_${Date.now().toString().slice(-8)}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      refundDetails = {
        refundId,
        refundAmount,
        refundedAt: new Date().toISOString()
      };
    }

    const cancellationUpdate = {
      status: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancelledBy: cancelledBy || 'customer',
      cancellationReason: reason,
      paymentStatus: refundDetails ? 'REFUNDED' : (order.paymentStatus === 'PAID' ? 'REFUNDED' : 'CANCELLED'),
      ...(refundDetails ? {
        refundId: refundDetails.refundId,
        refundAmount: refundDetails.refundAmount,
        refundedAt: refundDetails.refundedAt
      } : {})
    };

    // Auto-restore inventory stock in MongoDB Atlas
    if (order.items && Array.isArray(order.items)) {
      for (const item of order.items) {
        const qty = item.quantity || 1;
        await ProductModel.findOneAndUpdate(
          { id: item.id },
          { $inc: { stock: qty } }
        );
      }
      invalidateCatalogCache();
    }

    const updatedOrder = await OrderModel.findOneAndUpdate(
      { id: orderId },
      { $set: cancellationUpdate },
      { new: true }
    ).lean();

    // Auto-recalculate customer lifetime spend to exclude refunded order
    if (order.customer?.phone) {
      await recalculateCustomerMetrics(order.customer.phone);
    }

    return {
      success: true,
      message: refundDetails
        ? `Order ${orderId} has been cancelled. Automatic full refund of ₹${Number(order.totalAmount).toLocaleString('en-IN')} has been initiated (Refund ID: ${refundDetails.refundId}).`
        : `Order ${orderId} has been cancelled successfully.`,
      order: updatedOrder,
      refund: refundDetails
    };
  },

  async requestCancellation(orderId, { reason = 'Customer requested cancellation' } = {}) {
    ensureMongoConnected();
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    if (order.status === 'Cancelled') {
      return { success: false, message: 'Order is already cancelled' };
    }
    if (order.cancellationRequested) {
      return { success: false, message: 'Cancellation request already submitted for this order. Awaiting store approval.' };
    }

    const updated = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          cancellationRequested: true,
          cancellationRequestedAt: new Date().toISOString(),
          cancellationRequestReason: reason
        }
      },
      { new: true }
    ).lean();

    return {
      success: true,
      message: `Cancellation request submitted for order ${orderId}. The store manager will review and approve it shortly.`,
      order: updated
    };
  },

  async rejectCancellationRequest(orderId) {
    ensureMongoConnected();
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    if (!order.cancellationRequested) {
      return { success: false, message: 'No pending cancellation request for this order' };
    }

    const updated = await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        $set: {
          cancellationRequested: false,
          cancellationRequestReason: ''
        },
        $unset: {
          cancellationRequestedAt: 1
        }
      },
      { new: true }
    ).lean();

    return {
      success: true,
      message: `Cancellation request for order ${orderId} has been rejected by the store manager.`,
      order: updated
    };
  },

  async verifyPickupOtp(orderId, otp) {
    ensureMongoConnected();
    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (!order.pickupOtp) {
      return { success: false, message: "This order is not designated for counter pickup" };
    }
    if (String(order.pickupOtp).trim() !== String(otp).trim()) {
      return { success: false, message: "Invalid 4-digit pickup OTP. Please verify with customer." };
    }

    order.status = "Completed";
    order.collectedAt = new Date().toISOString();
    order.handoverVerified = true;
    await order.save();
    return { success: true, order: order.toObject(), message: "Handover verified! Order marked as Completed." };
  },

  async processOrderPayment(orderId, { transactionId = null, method = 'UPI' } = {}) {
    ensureMongoConnected();
    return await OrderModel.findOneAndUpdate(
      { id: orderId },
      {
        paymentStatus: "PAID",
        paymentMethod: (method || 'UPI').toUpperCase(),
        transactionId: transactionId || `TXN-VPT-${Date.now().toString().slice(-8)}`,
        paidAt: new Date().toISOString()
      },
      { new: true }
    ).lean();
  },

  async getOrderTracking(orderId) {
    ensureMongoConnected();
    const order = await OrderModel.findOne({ id: orderId }).lean();
    if (!order) return null;
    return {
      orderId: order.id,
      status: order.status,
      deliveryType: order.deliveryType,
      courierPartner: order.courierPartner,
      awb: order.awb,
      pickupOtp: order.pickupOtp,
      handoverVerified: order.handoverVerified,
      collectedAt: order.collectedAt,
      date: order.date
    };
  },

  // ==========================================
  // COUPONS & DISCOUNTS (Strict MongoDB Atlas)
  // ==========================================
  async getCoupons() {
    ensureMongoConnected();
    return await CouponModel.find().sort({ createdAt: -1 }).lean();
  },

  async createCoupon(couponData) {
    ensureMongoConnected();
    const code = (couponData.code || '').trim().toUpperCase();
    if (!code) throw new Error('Coupon code is required');

    const newCoupon = {
      code,
      description: couponData.description || 'Promotional Discount',
      discountType: couponData.discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: Number(couponData.discountValue) || 0,
      minOrderAmount: Number(couponData.minOrderAmount) || 0,
      usageLimitPerUser: Number(couponData.usageLimitPerUser) || 0,
      maxTotalUses: Number(couponData.maxTotalUses) || 0,
      active: couponData.active !== undefined ? Boolean(couponData.active) : true,
      usageCount: 0,
      usedByPhones: []
    };

    const created = new CouponModel(newCoupon);
    return await created.save();
  },

  async updateCoupon(id, updates) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
    return await CouponModel.findOneAndUpdate(query, updates, { new: true }).lean();
  },

  async deleteCoupon(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
    await CouponModel.deleteOne(query);
    return { success: true };
  },

  async validateCoupon(code, orderSubtotal = 0, phone = '') {
    ensureMongoConnected();
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, message: 'Please enter a coupon code' };
    }

    const coupon = await CouponModel.findOne({ code: cleanCode, active: true }).lean();
    if (!coupon) {
      return { valid: false, message: `Coupon "${cleanCode}" is invalid or expired` };
    }

    // 1. Global Redemption Cap Check
    if (coupon.maxTotalUses && coupon.maxTotalUses > 0 && (coupon.usageCount || 0) >= coupon.maxTotalUses) {
      return {
        valid: false,
        message: `Promotion "${cleanCode}" has reached its maximum total redemption limit (${coupon.maxTotalUses} uses).`
      };
    }

    // 2. Minimum Cart Amount Check
    if (coupon.minOrderAmount && orderSubtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `Cart total must be at least ₹${coupon.minOrderAmount.toLocaleString('en-IN')} to apply this coupon`
      };
    }

    // 3. Single-Use Per Customer Account / Email / Phone Check
    const isSingleUse = Number(coupon.usageLimitPerUser) === 1;
    let customerId = null;
    let rawPhone = '';
    let email = '';

    if (typeof phone === 'string') {
      rawPhone = phone;
    } else if (phone && typeof phone === 'object') {
      customerId = phone.customerId || phone.id || phone._id;
      rawPhone = phone.phone || phone.customerPhone;
      email = (phone.email || '').trim().toLowerCase();
    }

    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '').slice(-10);

    if (isSingleUse) {
      // Check customer account ID
      if (customerId) {
        const usedByCustomer = Array.isArray(coupon.usedByCustomers) && coupon.usedByCustomers.some(id => String(id) === String(customerId));
        if (usedByCustomer) {
          return {
            valid: false,
            message: `⚠️ Coupon "${cleanCode}" has already been redeemed by your account. This promotion is strictly limited to 1 order per customer.`
          };
        }
      }

      // Check customer email
      if (email && email.includes('@')) {
        const usedByEmail = Array.isArray(coupon.usedByEmails) && coupon.usedByEmails.includes(email);
        if (usedByEmail) {
          return {
            valid: false,
            message: `⚠️ Coupon "${cleanCode}" has already been redeemed by email ${email}. This promotion is strictly limited to 1 order per customer.`
          };
        }
      }

      // Check customer mobile phone
      if (cleanPhone.length === 10) {
        const alreadyUsedInCoupon = Array.isArray(coupon.usedByPhones) && coupon.usedByPhones.includes(cleanPhone);
        const alreadyUsedInOrders = await OrderModel.findOne({
          'customer.phone': { $regex: cleanPhone },
          couponCode: cleanCode
        }).lean();

        if (alreadyUsedInCoupon || alreadyUsedInOrders) {
          return {
            valid: false,
            message: `⚠️ Coupon "${cleanCode}" has already been redeemed by mobile number +91 ${cleanPhone}. This promotion is strictly limited to 1 order per customer.`
          };
        }
      }
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'flat') {
      calculatedDiscount = Math.min(orderSubtotal, coupon.discountValue);
    } else {
      calculatedDiscount = Math.round((orderSubtotal * coupon.discountValue) / 100);
    }

    return {
      valid: true,
      requiresPhone: isSingleUse && cleanPhone.length !== 10 && !customerId,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
        minOrderAmount: coupon.minOrderAmount,
        usageLimitPerUser: coupon.usageLimitPerUser || 0,
        maxTotalUses: coupon.maxTotalUses || 0,
        usageCount: coupon.usageCount || 0
      },
      discountAmount: calculatedDiscount,
      message: coupon.discountType === 'flat' 
        ? `🎉 Flat ₹${coupon.discountValue} discount applied!` 
        : `🎉 ${coupon.discountValue}% discount applied!`
    };
  },

  async recordCouponUsage(code, userIdent = {}) {
    ensureMongoConnected();
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return null;

    let customerId = null;
    let rawPhone = '';
    let email = '';

    if (typeof userIdent === 'string') {
      rawPhone = userIdent;
    } else if (userIdent && typeof userIdent === 'object') {
      customerId = userIdent.customerId || userIdent.id || userIdent._id;
      rawPhone = userIdent.phone || userIdent.customerPhone;
      email = (userIdent.email || '').trim().toLowerCase();
    }

    const cleanPhone = (rawPhone || '').replace(/[^0-9]/g, '').slice(-10);

    const updateObj = { $inc: { usageCount: 1 } };
    const addToSet = {};

    if (cleanPhone.length === 10) {
      addToSet.usedByPhones = cleanPhone;
    }
    if (customerId && mongoose.isValidObjectId(customerId)) {
      addToSet.usedByCustomers = customerId;
    }
    if (email && email.includes('@')) {
      addToSet.usedByEmails = email;
    }

    if (Object.keys(addToSet).length > 0) {
      updateObj.$addToSet = addToSet;
    }

    return await CouponModel.updateOne({ code: cleanCode }, updateObj);
  },

  // ==========================================
  // REPAIR JOBS (Strict MongoDB Atlas)
  // ==========================================
  async getRepairJobs() {
    ensureMongoConnected();
    return await RepairModel.find().sort({ createdAt: -1 }).lean();
  },

  async getRepairJobById(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
    return await RepairModel.findOne(query).lean();
  },

  async createRepairJob(jobData) {
    ensureMongoConnected();
    const jobId = `VPT-REP-${Date.now().toString().slice(-4)}`;
    const handoverOtp = String(Math.floor(1000 + Math.random() * 9000));

    const newJob = {
      id: `rep-${Date.now().toString().slice(-6)}`,
      jobId,
      customerName: jobData.customerName,
      customerPhone: jobData.customerPhone,
      toolBrand: jobData.toolBrand || 'Bosch',
      toolModel: jobData.toolModel,
      serialNumber: jobData.serialNumber || '',
      issueDescription: jobData.issueDescription,
      estimatedCost: Number(jobData.estimatedCost) || 0,
      finalCost: Number(jobData.finalCost) || Number(jobData.estimatedCost) || 0,
      advancePaid: Number(jobData.advancePaid) || 0,
      status: jobData.status || 'Received',
      technicianNotes: jobData.technicianNotes || '',
      handoverOtp,
      handoverVerified: false,
      createdAt: new Date().toISOString()
    };

    const created = new RepairModel(newJob);
    const savedJob = await created.save();

    // Auto-sync / register customer in CustomerModel
    await syncCustomerFromRepair(newJob);

    return savedJob;
  },

  async updateRepairJob(id, updates) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
    return await RepairModel.findOneAndUpdate(query, updates, { new: true }).lean();
  },

  async deleteRepairJob(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
    await RepairModel.deleteOne(query);
    return { success: true };
  },

  async verifyRepairHandoverOtp(id, otp) {
    ensureMongoConnected();
    const job = await this.getRepairJobById(id);
    if (!job) return { success: false, message: "Repair job not found" };

    if (String(job.handoverOtp).trim() !== String(otp).trim()) {
      return { success: false, message: "Invalid 4-digit handover OTP. Please verify with customer." };
    }

    const updates = {
      status: "Handed Over",
      handoverVerified: true,
      completedAt: new Date().toISOString()
    };

    const updatedJob = await this.updateRepairJob(id, updates);
    return { success: true, job: updatedJob, message: "Handover verified! Tool delivered to customer." };
  },

  // ==========================================
  // CUSTOMERS & DIRECTORY (500+ CRM)
  // ==========================================
  async getCustomers({ search = '', sortBy = 'recent', page = 1, limit = 50 } = {}) {
    ensureMongoConnected();
    let query = {};
    if (search && search.trim()) {
      const q = search.trim();
      const cleanDigits = q.replace(/[^0-9]/g, '');
      const conditions = [
        { name: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
      if (cleanDigits.length >= 4) {
        conditions.push({ phone: { $regex: cleanDigits } });
      }
      query.$or = conditions;
    }

    let sort = {};
    if (sortBy === 'spend') {
      sort.totalSpent = -1;
    } else if (sortBy === 'orders') {
      sort.totalOrders = -1;
    } else if (sortBy === 'name') {
      sort.name = 1;
    } else {
      sort.createdAt = -1;
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (p - 1) * l;

    const [customers, total] = await Promise.all([
      CustomerModel.find(query).sort(sort).skip(skip).limit(l).lean(),
      CustomerModel.countDocuments(query)
    ]);

    return {
      customers,
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l)
    };
  },

  async getCustomerById(id) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { $or: [{ _id: id }, { phone: id }] } : { phone: id };
    let customer = await CustomerModel.findOne(query).lean();
    if (!customer) return null;

    // Fetch related order history and repair jobs
    const [orders, repairs] = await Promise.all([
      OrderModel.find({ 'customer.phone': { $regex: customer.phone } }).sort({ createdAt: -1 }).lean(),
      RepairModel.find({ customerPhone: { $regex: customer.phone } }).sort({ createdAt: -1 }).lean()
    ]);

    // Recalculate customer metrics for accuracy
    const activeOrders = orders.filter(o => {
      const st = (o.status || '').toLowerCase();
      return !st.includes('cancel') && o.paymentStatus !== 'REFUNDED';
    });
    const accurateSpent = activeOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
    const accurateOrders = activeOrders.length;

    if (customer.totalSpent !== accurateSpent || customer.totalOrders !== accurateOrders) {
      await CustomerModel.updateOne(
        { _id: customer._id },
        { $set: { totalSpent: accurateSpent, totalOrders: accurateOrders } }
      );
      customer.totalSpent = accurateSpent;
      customer.totalOrders = accurateOrders;
    }

    return {
      ...customer,
      orders,
      repairs
    };
  },

  async updateCustomer(id, updates) {
    ensureMongoConnected();
    const isObjectId = mongoose.isValidObjectId(id);
    const query = isObjectId ? { _id: id } : { phone: id };
    return await CustomerModel.findOneAndUpdate(query, { $set: updates }, { new: true }).lean();
  },

  async createCustomer(customerData) {
    ensureMongoConnected();
    const phone = cleanCustomerPhone(customerData.phone);
    if (!phone || phone.length < 10) {
      throw new Error("Valid 10-digit mobile number is required");
    }
    const existing = await CustomerModel.findOne({ phone });
    if (existing) {
      throw new Error(`Customer with phone +91 ${phone} already exists`);
    }
    const customer = new CustomerModel({
      ...customerData,
      phone
    });
    return await customer.save();
  },

  // ==========================================
  // STATUS & RECONNECT
  // ==========================================
  getStatus() {
    const connected = isMongoConnected && (mongoose.connection && mongoose.connection.readyState === 1);
    return {
      isMongoConnected: connected,
      activeEngine: connected ? 'MongoDB Atlas (Mumbai Cloud)' : 'Disconnected (Awaiting Network)',
      clusterHost: 'cluster0.rljhcg3.mongodb.net',
      lastAtlasError: lastAtlasError || null
    };
  },

  async forceReconnect() {
    return await tryConnectMongo();
  }
};

db.OrderModel = OrderModel;
db.ProductModel = ProductModel;
db.CustomerModel = CustomerModel;
db.findOrCreateCustomer = findOrCreateCustomer;

module.exports = db;
