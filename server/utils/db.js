const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const seedProducts = require('../data/seedProducts');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch (e) {}

const DATA_FILE = path.join(__dirname, '..', 'data', 'store.json');

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

function loadStoreData() {
const initStoreData = loadStoreData;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      let modified = false;
      if (!parsed.products || !Array.isArray(parsed.products) || parsed.products.length === 0) {
        parsed.products = [...seedProducts];
        modified = true;
      }
      if (!parsed.coupons || !Array.isArray(parsed.coupons)) {
        parsed.coupons = [];
        modified = true;
      }
      if (!parsed.repairs || !Array.isArray(parsed.repairs)) {
        parsed.repairs = [];
        modified = true;
      }
      if (modified) {
        saveStoreData(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error("Error reading store.json, re-initializing:", err);
  }

  const initial = {
    products: [...seedProducts],
    orders: [],
    coupons: [],
    repairs: []
  };

  saveStoreData(initial);
  return initial;
}

function saveStoreData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing store.json:", err);
  }
}



// Mongoose Schemas & Models
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

const orderSchema = new mongoose.Schema({
  id: String,
  customer: Object,
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
  status: { type: String, default: "Confirmed" },
  date: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true, strict: false });

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
  usageLimitPerUser: { type: Number, default: 0 }, // 0 = unlimited, 1 = once per customer phone
  maxTotalUses: { type: Number, default: 0 }, // 0 = unlimited, > 0 = global cap
  usedByPhones: [{ type: String }]
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

const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
const TaxonomyModel = mongoose.models.Taxonomy || mongoose.model('Taxonomy', taxonomySchema);
const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
const RepairModel = mongoose.models.Repair || mongoose.model('Repair', repairSchema);

let isMongoConnected = false;
let lastAtlasError = null;
let reconnectTimer = null;

async function tryConnectMongo() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) return false;

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    }
    if (mongoose.connection.readyState === 1) {
      isMongoConnected = true;
      lastAtlasError = null;
      console.log("====================================================");
      console.log("  >>> CONNECTED TO MONGODB ATLAS CLUSTER! <<<");
      console.log("  Database: variathupowertools (Atlas Mumbai Cloud)");
      console.log("  100% Live Mongoose MongoDB Collection Mode Active!");
      console.log("====================================================");

      // Seed if empty in MongoDB
      const count = await ProductModel.countDocuments();
      if (count === 0) {
        await ProductModel.insertMany(seedProducts);
        console.log("Seeded initial product catalog to MongoDB Atlas.");
      }



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
    return false;
  }
}

async function initDB() {
  const connected = await tryConnectMongo();
  if (!connected) {
    console.log("====================================================");
    console.log("  MONGODB ATLAS CONNECTION NOTICE:");
    console.log("  Error: " + lastAtlasError);
    console.log("  REQUIRED ACTION: Whitelist 0.0.0.0/0 in MongoDB Atlas -> Network Access.");
    console.log("  [AUTO-RECONNECT] Polling Atlas every 5 seconds until connected...");
    console.log("====================================================");

    if (!reconnectTimer) {
      reconnectTimer = setInterval(async () => {
        if (!isMongoConnected) {
          const success = await tryConnectMongo();
          if (success && reconnectTimer) {
            clearInterval(reconnectTimer);
            reconnectTimer = null;
            console.log("Auto-reconnect successful: MongoDB Atlas is now online!");
          }
        }
      }, 5000);
    }
  }
}

const db = {
  initDB,
  getStoreInfo: () => storeInfo,

  async getProducts(filters = {}) {
    const data = loadStoreData();
    let products = isMongoConnected && ProductModel ? await ProductModel.find().lean() : data.products;

    if (filters.category && filters.category !== 'all') {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.brand && filters.brand !== 'all') {
      products = products.filter(p => p.brand.toLowerCase() === filters.brand.toLowerCase());
    }
    if (filters.cordless !== undefined) {
      const isCordless = filters.cordless === 'true' || filters.cordless === true;
      products = products.filter(p => p.cordless === isCordless);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (filters.sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    }

    return products;
  },

  async getProductById(id) {
    if (isMongoConnected && ProductModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
      return await ProductModel.findOne(query).lean();
    }
    const data = loadStoreData();
    return data.products.find(p => p.id === id || String(p._id) === String(id));
  },

  async createProduct(productData) {
    const id = productData.id || `vpt-${Date.now().toString().slice(-4)}`;
    const newProduct = { ...productData, id };

    if (isMongoConnected && ProductModel) {
      const created = new ProductModel(newProduct);
      return await created.save();
    }

    const data = loadStoreData();
    data.products.unshift(newProduct);
    saveStoreData(data);
    return newProduct;
  },

  async updateProduct(id, updates) {
    if (isMongoConnected && ProductModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
      return await ProductModel.findOneAndUpdate(query, updates, { new: true });
    }
    const data = loadStoreData();
    const index = data.products.findIndex(p => p.id === id || String(p._id) === String(id));
    if (index === -1) return null;
    data.products[index] = { ...data.products[index], ...updates };
    saveStoreData(data);
    return data.products[index];
  },

  async deleteProduct(id) {
    console.log(`[DELETE PRODUCT] Attempting to delete product with ID: ${id}`);
    let deletedMongo = false;
    let deletedLocal = false;

    if (isMongoConnected && ProductModel) {
      try {
        const isObjectId = mongoose.isValidObjectId(id);
        const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
        const res = await ProductModel.deleteOne(query);
        console.log(`[DELETE PRODUCT] MongoDB deleteOne result:`, res);
        deletedMongo = res.deletedCount > 0;
      } catch (err) {
        console.error(`[DELETE PRODUCT] MongoDB delete error:`, err);
      }
    }

    try {
      const data = loadStoreData();
      const initLen = data.products.length;
      data.products = data.products.filter(p => p.id !== id && String(p.id) !== String(id) && String(p._id) !== String(id));
      if (data.products.length !== initLen) {
        saveStoreData(data);
        deletedLocal = true;
      }
    } catch (err) {
      console.error(`[DELETE PRODUCT] Local store delete error:`, err);
    }

    return deletedMongo || deletedLocal;
  },

  async getTaxonomy() {
    const defaultBrands = ['Bosch', 'Makita', 'DeWalt', 'Dongcheng', 'HiKOKI', 'Stanley'];
    const defaultCategories = [
      { id: 'cordless', name: 'Cordless Tools' },
      { id: 'grinders-cutters', name: 'Grinders & Cutters' },
      { id: 'hammers', name: 'Hammer Drills' },
      { id: 'woodworking', name: 'Woodworking' },
      { id: 'washers-blowers', name: 'Washers & Blowers' },
      { id: 'accessories', name: 'Accessories & Bits' }
    ];

    let brands = [...defaultBrands];
    let categories = [...defaultCategories];

    if (isMongoConnected && TaxonomyModel) {
      try {
        let doc = await TaxonomyModel.findOne().lean();
        if (!doc) {
          const createdDoc = new TaxonomyModel({ brands: defaultBrands, categories: defaultCategories });
          await createdDoc.save();
        } else {
          brands = doc.brands && doc.brands.length > 0 ? doc.brands : defaultBrands;
          categories = doc.categories && doc.categories.length > 0 ? doc.categories : defaultCategories;
        }
      } catch (err) {
        console.error("MongoDB taxonomy fetch error:", err);
      }
    } else {
      const data = loadStoreData();
      if (!data.brands) data.brands = defaultBrands;
      if (!data.categories) data.categories = defaultCategories;
      brands = data.brands;
      categories = data.categories;
    }

    // Collect any other brands/categories present on existing products
    const allProducts = await this.getProducts();
    let updated = false;
    allProducts.forEach(p => {
      if (p.brand && !brands.some(b => b.toLowerCase() === p.brand.toLowerCase())) {
        brands.push(p.brand);
        updated = true;
      }
      if (p.category && !categories.some(c => c.id === p.category)) {
        categories.push({ id: p.category, name: p.category });
        updated = true;
      }
    });

    if (updated) {
      if (isMongoConnected && TaxonomyModel) {
        await TaxonomyModel.findOneAndUpdate({}, { brands, categories }, { upsert: true });
      }
      const data = loadStoreData();
      data.brands = brands;
      data.categories = categories;
      saveStoreData(data);
    }

    return { brands, categories };
  },

  async addBrand(brandName) {
    const clean = (brandName || '').trim();
    if (!clean) throw new Error('Brand name cannot be empty');
    const tax = await this.getTaxonomy();
    if (tax.brands.some(b => b.toLowerCase() === clean.toLowerCase())) {
      return { success: true, brand: clean, brands: tax.brands, message: 'Brand already exists' };
    }
    const updatedBrands = [...tax.brands, clean];
    if (isMongoConnected && TaxonomyModel) {
      await TaxonomyModel.findOneAndUpdate({}, { brands: updatedBrands }, { upsert: true });
    }
    const data = loadStoreData();
    data.brands = updatedBrands;
    saveStoreData(data);
    return { success: true, brand: clean, brands: updatedBrands, message: `Brand "${clean}" added successfully` };
  },

  async addCategory({ name, id }) {
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('Category name cannot be empty');
    const cleanId = (id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
    const tax = await this.getTaxonomy();
    if (tax.categories.some(c => c.id === cleanId || c.name.toLowerCase() === cleanName.toLowerCase())) {
      return { success: true, category: { id: cleanId, name: cleanName }, categories: tax.categories, message: 'Category already exists' };
    }
    const updatedCategories = [...tax.categories, { id: cleanId, name: cleanName }];
    if (isMongoConnected && TaxonomyModel) {
      await TaxonomyModel.findOneAndUpdate({}, { categories: updatedCategories }, { upsert: true });
    }
    const data = loadStoreData();
    data.categories = updatedCategories;
    saveStoreData(data);
    return { success: true, category: { id: cleanId, name: cleanName }, categories: updatedCategories, message: `Category "${cleanName}" added successfully` };
  },

  async deleteBrand(brandName, deleteProducts = false) {
    const tax = await this.getTaxonomy();
    const updatedBrands = tax.brands.filter(b => b.toLowerCase() !== (brandName || '').toLowerCase());
    if (isMongoConnected && TaxonomyModel) {
      await TaxonomyModel.findOneAndUpdate({}, { brands: updatedBrands }, { upsert: true });
    }
    const data = loadStoreData();
    data.brands = updatedBrands;

    let deletedProductsCount = 0;
    if (deleteProducts) {
      if (isMongoConnected && ProductModel) {
        const delRes = await ProductModel.deleteMany({ brand: { $regex: new RegExp(`^${brandName}$`, 'i') } });
        deletedProductsCount += delRes.deletedCount || 0;
      }
      const initialProductsCount = data.products.length;
      data.products = data.products.filter(p => (p.brand || '').toLowerCase() !== (brandName || '').toLowerCase());
      deletedProductsCount = Math.max(deletedProductsCount, initialProductsCount - data.products.length);
    }

    saveStoreData(data);
    return { success: true, brands: updatedBrands, deletedProductsCount };
  },

  async deleteCategory(categoryId, deleteProducts = false) {
    const tax = await this.getTaxonomy();
    const updatedCategories = tax.categories.filter(c => c.id !== categoryId);
    if (isMongoConnected && TaxonomyModel) {
      await TaxonomyModel.findOneAndUpdate({}, { categories: updatedCategories }, { upsert: true });
    }
    const data = loadStoreData();
    data.categories = updatedCategories;

    let deletedProductsCount = 0;
    if (deleteProducts) {
      if (isMongoConnected && ProductModel) {
        const delRes = await ProductModel.deleteMany({ category: categoryId });
        deletedProductsCount += delRes.deletedCount || 0;
      }
      const initialProductsCount = data.products.length;
      data.products = data.products.filter(p => p.category !== categoryId);
      deletedProductsCount = Math.max(deletedProductsCount, initialProductsCount - data.products.length);
    }

    saveStoreData(data);
    return { success: true, categories: updatedCategories, deletedProductsCount };
  },

  async getOrders() {
    if (isMongoConnected && OrderModel) {
      return await OrderModel.find().sort({ createdAt: -1 }).lean();
    }
    const data = loadStoreData();
    return data.orders || [];
  },

  async createOrder(orderData) {
    const id = `VPT-ORD-${Date.now().toString().slice(-6)}`;
    const isStorePickup = (orderData.deliveryType || '').toLowerCase().includes('pickup') || orderData.deliveryType === 'store-pickup';
    const isPrepaid = ['UPI', 'RAZORPAY', 'CARD', 'NETBANKING'].includes((orderData.paymentMethod || '').toUpperCase());

    const pickupOtp = isStorePickup ? String(Math.floor(1000 + Math.random() * 9000)) : null;
    const awb = !isStorePickup ? `DLHVY-KL-${Math.floor(100000 + Math.random() * 900000)}` : null;
    const transactionId = orderData.transactionId || (isPrepaid ? `TXN-VPT-${Date.now().toString().slice(-8)}` : null);
    const paymentStatus = orderData.paymentStatus || (isPrepaid ? 'PAID' : 'PENDING');

    const newOrder = {
      id,
      ...orderData,
      status: "Confirmed",
      paymentStatus,
      transactionId,
      pickupOtp,
      awb,
      courierPartner: !isStorePickup ? "Kerala Speed Express (Delhivery Partner)" : null,
      date: new Date().toISOString()
    };

    if (isMongoConnected && OrderModel) {
      const created = new OrderModel(newOrder);
      return await created.save();
    }

    const data = loadStoreData();
    if (!data.orders) data.orders = [];

    // AUTOMATION: Auto-decrement product stock in inventory
    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach(item => {
        const prod = (data.products || []).find(p => p.id === item.id);
        if (prod && typeof prod.stock === 'number') {
          prod.stock = Math.max(0, prod.stock - (item.quantity || 1));
        }
      });
    }

    data.orders.unshift(newOrder);
    saveStoreData(data);
    return newOrder;
  },

  async updateOrderStatus(orderId, status) {
    if (isMongoConnected && OrderModel) {
      return await OrderModel.findOneAndUpdate({ id: orderId }, { status }, { new: true });
    }
    const data = loadStoreData();
    const order = (data.orders || []).find(o => o.id === orderId);
    if (!order) return null;
    order.status = status;
    saveStoreData(data);
    return order;
  },

  async verifyPickupOtp(orderId, otp) {
    if (isMongoConnected && OrderModel) {
      const order = await OrderModel.findOne({ id: orderId });
      if (!order) {
        return { success: false, message: "Order not found" };
      }
      if (!order.pickupOtp) {
        return { success: false, message: "This order is not designated for counter pickup" };
      }
      if (String(order.pickupOtp).trim() !== String(otp).trim()) {
        return { success: false, message: `Invalid 4-digit pickup OTP. Please verify with customer.` };
      }
      order.status = "Completed";
      order.collectedAt = new Date().toISOString();
      order.handoverVerified = true;
      await order.save();
      return { success: true, order, message: "Handover verified! Order marked as Completed." };
    }

    const data = loadStoreData();
    const order = (data.orders || []).find(o => o.id === orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (!order.pickupOtp) {
      return { success: false, message: "This order is not designated for counter pickup" };
    }
    if (String(order.pickupOtp).trim() !== String(otp).trim()) {
      return { success: false, message: `Invalid 4-digit pickup OTP. Please verify with customer.` };
    }

    order.status = "Completed";
    order.collectedAt = new Date().toISOString();
    order.handoverVerified = true;
    saveStoreData(data);
    return { success: true, order, message: "Handover verified! Order marked as Completed." };
  },

  async processOrderPayment(orderId, { transactionId, method }) {
    const data = loadStoreData();
    const order = (data.orders || []).find(o => o.id === orderId);
    if (!order) return null;

    order.paymentStatus = "PAID";
    order.paymentMethod = (method || order.paymentMethod || 'UPI').toUpperCase();
    order.transactionId = transactionId || `TXN-VPT-${Date.now().toString().slice(-8)}`;
    order.paidAt = new Date().toISOString();
    saveStoreData(data);
    return order;
  },

  async getOrderTracking(orderId) {
    const data = loadStoreData();
    const order = (data.orders || []).find(o => o.id === orderId);
    if (!order) return null;

    const isStorePickup = (order.deliveryType || '').includes('pickup');
    const orderTime = new Date(order.date || Date.now());

    if (isStorePickup) {
      return {
        type: 'store-pickup',
        orderId: order.id,
        store: {
          name: "Variathu Power Tools",
          location: "Poyanil Building, Poyanil Junction, Kozhencherry, Kerala",
          landmark: "Near St Thomas HSS Ground",
          phone: "+91 94471 23456",
          hours: "Mon - Sat: 8:30 AM - 7:30 PM"
        },
        pickupOtp: order.pickupOtp || "4819",
        status: order.status,
        handoverVerified: !!order.handoverVerified,
        collectedAt: order.collectedAt || null
      };
    }

    // Home Courier Delivery Tracking
    const awb = order.awb || `DLHVY-KL-${Math.floor(100000 + Math.random() * 900000)}`;
    const destination = `${order.customer?.district || 'Kerala'}, PIN: ${order.customer?.pincode || '689641'}`;

    return {
      type: 'courier',
      orderId: order.id,
      awb,
      courierPartner: order.courierPartner || "Kerala Speed Express (Delhivery Partner)",
      estimatedDelivery: "Tomorrow by 5:00 PM",
      origin: "Variathu Power Tools, Poyanil Building, Kozhencherry, Pathanamthitta",
      destination,
      status: order.status,
      currentStepIndex: order.status === 'Completed' ? 3 : (order.status.includes('Dispatched') ? 2 : 1),
      checkpoints: [
        {
          title: "Order Picked & Tested at Kozhencherry Workshop",
          location: "Variathu Power Tools, Poyanil Building, Kozhencherry",
          time: orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          completed: true
        },
        {
          title: "In Transit to Sorting Hub",
          location: "Pathanamthitta Central Courier Hub",
          time: "Dispatched",
          completed: order.status.includes('Dispatched') || order.status === 'Completed'
        },
        {
          title: "Out for Doorstep Delivery",
          location: destination,
          time: "Estimated Delivery Executive on Route",
          completed: order.status === 'Completed'
        }
      ]
    };
  },

  async getCustomerOrders(query) {
    const all = await this.getOrders();
    if (!query) return all;
    const cleanQ = query.trim().toLowerCase();
    return all.filter(o => {
      const phone = (o.customer?.phone || '').toLowerCase();
      const email = (o.customer?.email || '').toLowerCase();
      const name = (o.customer?.name || '').toLowerCase();
      return phone.includes(cleanQ) || email.includes(cleanQ) || name.includes(cleanQ);
    });
  },

  // ==========================================
  // FEATURE 4: DYNAMIC COUPON & PROMO MANAGER
  // ==========================================
  async getCoupons() {
    if (isMongoConnected && CouponModel) {
      return await CouponModel.find().sort({ createdAt: -1 }).lean();
    }
    const data = loadStoreData();
    return data.coupons || [];
  },

  async createCoupon(couponData) {
    const code = (couponData.code || '').trim().toUpperCase();
    if (!code) throw new Error('Coupon code is required');

    const newCoupon = {
      id: `c-${Date.now().toString().slice(-6)}`,
      code,
      description: couponData.description || 'Promotional Discount',
      discountType: couponData.discountType === 'flat' ? 'flat' : 'percentage',
      discountValue: Number(couponData.discountValue) || 0,
      minOrderAmount: Number(couponData.minOrderAmount) || 0,
      usageLimitPerUser: Number(couponData.usageLimitPerUser) || 0,
      maxTotalUses: Number(couponData.maxTotalUses) || 0,
      active: couponData.active !== undefined ? Boolean(couponData.active) : true,
      usageCount: 0,
      usedByPhones: [],
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected && CouponModel) {
      const created = new CouponModel(newCoupon);
      return await created.save();
    }

    const data = loadStoreData();
    if (!data.coupons) data.coupons = [];
    if (data.coupons.some(c => c.code === code)) {
      throw new Error(`Coupon "${code}" already exists`);
    }
    data.coupons.unshift(newCoupon);
    saveStoreData(data);
    return newCoupon;
  },

  async updateCoupon(id, updates) {
    if (isMongoConnected && CouponModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
      return await CouponModel.findOneAndUpdate(query, updates, { new: true });
    }
    const data = loadStoreData();
    const index = (data.coupons || []).findIndex(c => c.id === id || String(c._id) === String(id));
    if (index === -1) return null;
    data.coupons[index] = { ...data.coupons[index], ...updates };
    saveStoreData(data);
    return data.coupons[index];
  },

  async deleteCoupon(id) {
    if (isMongoConnected && CouponModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { _id: id }] } : { id: String(id) };
      await CouponModel.deleteOne(query);
    }
    const data = loadStoreData();
    data.coupons = (data.coupons || []).filter(c => c.id !== id && String(c._id) !== String(id));
    saveStoreData(data);
    return { success: true };
  },

  async validateCoupon(code, orderSubtotal = 0, phone = '') {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, message: 'Please enter a coupon code' };
    }

    let coupon = null;
    if (isMongoConnected && CouponModel) {
      coupon = await CouponModel.findOne({ code: cleanCode, active: true }).lean();
    }
    if (!coupon) {
      const data = loadStoreData();
      coupon = (data.coupons || []).find(c => c.code === cleanCode && c.active);
    }

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

    // 3. Single-Use Per Customer Phone Check
    const isSingleUse = Number(coupon.usageLimitPerUser) === 1;
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (isSingleUse) {
      if (cleanPhone.length === 10) {
        // Check in coupon's usedByPhones record
        const alreadyUsedInCoupon = Array.isArray(coupon.usedByPhones) && coupon.usedByPhones.includes(cleanPhone);
        
        // Also check completed orders history
        let alreadyUsedInOrders = false;
        if (isMongoConnected && OrderModel) {
          const orderMatch = await OrderModel.findOne({
            'customer.phone': { $regex: cleanPhone },
            couponCode: cleanCode
          }).lean();
          if (orderMatch) alreadyUsedInOrders = true;
        }
        if (!alreadyUsedInOrders) {
          const data = loadStoreData();
          alreadyUsedInOrders = (data.orders || []).some(o => 
            ((o.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10) === cleanPhone) &&
            o.couponCode === cleanCode
          );
        }

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
      requiresPhone: isSingleUse && cleanPhone.length !== 10,
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

  async recordCouponUsage(code, phone = '') {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) return null;
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);

    if (isMongoConnected && CouponModel) {
      const updateObj = { $inc: { usageCount: 1 } };
      if (cleanPhone.length === 10) {
        updateObj.$addToSet = { usedByPhones: cleanPhone };
      }
      await CouponModel.updateOne({ code: cleanCode }, updateObj);
    }

    const data = loadStoreData();
    if (data.coupons) {
      const c = data.coupons.find(cp => cp.code === cleanCode);
      if (c) {
        c.usageCount = (c.usageCount || 0) + 1;
        if (!c.usedByPhones) c.usedByPhones = [];
        if (cleanPhone.length === 10 && !c.usedByPhones.includes(cleanPhone)) {
          c.usedByPhones.push(cleanPhone);
        }
        saveStoreData(data);
      }
    }
  },

  // ==========================================
  // FEATURE 5: WORKSHOP SERVICE & REPAIR TICKETS
  // ==========================================
  async getRepairJobs() {
    if (isMongoConnected && RepairModel) {
      return await RepairModel.find().sort({ createdAt: -1 }).lean();
    }
    const data = loadStoreData();
    return data.repairs || [];
  },

  async getRepairJobById(id) {
    if (isMongoConnected && RepairModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
      return await RepairModel.findOne(query).lean();
    }
    const data = loadStoreData();
    return (data.repairs || []).find(r => r.id === id || r.jobId === id || String(r._id) === String(id));
  },

  async createRepairJob(jobData) {
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

    if (isMongoConnected && RepairModel) {
      const created = new RepairModel(newJob);
      return await created.save();
    }

    const data = loadStoreData();
    if (!data.repairs) data.repairs = [];
    data.repairs.unshift(newJob);
    saveStoreData(data);
    return newJob;
  },

  async updateRepairJob(id, updates) {
    if (isMongoConnected && RepairModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
      return await RepairModel.findOneAndUpdate(query, updates, { new: true });
    }
    const data = loadStoreData();
    const index = (data.repairs || []).findIndex(r => r.id === id || r.jobId === id || String(r._id) === String(id));
    if (index === -1) return null;
    data.repairs[index] = { ...data.repairs[index], ...updates };
    saveStoreData(data);
    return data.repairs[index];
  },

  async deleteRepairJob(id) {
    if (isMongoConnected && RepairModel) {
      const isObjectId = mongoose.isValidObjectId(id);
      const query = isObjectId ? { $or: [{ id: String(id) }, { jobId: id }, { _id: id }] } : { $or: [{ id: String(id) }, { jobId: id }] };
      await RepairModel.deleteOne(query);
    }
    const data = loadStoreData();
    data.repairs = (data.repairs || []).filter(r => r.id !== id && r.jobId !== id && String(r._id) !== String(id));
    saveStoreData(data);
    return { success: true };
  },

  async verifyRepairHandoverOtp(id, otp) {
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

  getStatus() {
    const connected = isMongoConnected && (mongoose.connection && mongoose.connection.readyState === 1);
    return {
      isMongoConnected: connected,
      activeEngine: connected ? 'MongoDB Atlas (Mumbai Cloud)' : 'Awaiting Atlas Network Access (Fallback Active)',
      clusterHost: 'cluster0.rljhcg3.mongodb.net',
      lastAtlasError: lastAtlasError || null
    };
  },

  async forceReconnect() {
    return await tryConnectMongo();
  }
};

module.exports = db;
