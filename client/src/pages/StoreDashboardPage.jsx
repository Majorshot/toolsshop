import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, Edit3, Trash2, ShoppingBag, DollarSign, Package, RefreshCw, CheckCircle2, Phone, MessageCircle, AlertCircle, AlertTriangle, X, Search, Tag, Layers, ArrowRight, Truck, ExternalLink, Globe, Printer, Download, Percent, Wrench, FileText, Check, Calendar, ArrowUpRight, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const STATUS_OPTIONS = [
  'Confirmed',
  'Processing in Workshop',
  'Ready for Pickup at Poyanil Building',
  'Dispatched via Courier',
  'Completed'
];

export const StoreDashboardPage = ({ onProductUpdated }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'inventory'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Database Connection Status
  const [dbStatus, setDbStatus] = useState({ isMongoConnected: false, activeEngine: 'Checking...' });
  const [retryingDb, setRetryingDb] = useState(false);

  const loadDbStatus = async () => {
    try {
      const status = await api.getDbStatus();
      setDbStatus(status);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualDbReconnect = async () => {
    setRetryingDb(true);
    try {
      const res = await api.reconnectDb();
      setDbStatus(res);
      if (res.isMongoConnected) {
        showNotification('✅ Successfully connected to MongoDB Atlas!');
        loadProducts();
        loadOrders();
        loadTaxonomy();
        if (onProductUpdated) onProductUpdated();
      } else {
        showNotification('⚠️ Atlas still rejected connection. Ensure 0.0.0.0/0 is saved in Atlas Network Access.');
      }
    } catch (err) {
      showNotification(`❌ ${err.message}`);
    } finally {
      setRetryingDb(false);
    }
  };

  useEffect(() => {
    loadDbStatus();
    const interval = setInterval(loadDbStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Live Delhivery API & Tracking Tester State
  const [showDelhiveryModal, setShowDelhiveryModal] = useState(false);
  const [activeDelhiveryTab, setActiveDelhiveryTab] = useState('tracking'); // 'tracking' | 'pincode' | 'guide'
  const [testWaybill, setTestWaybill] = useState('');
  const [testPincode, setTestPincode] = useState('689641');
  const [trackingResult, setTrackingResult] = useState(null);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [loadingTrackingTest, setLoadingTrackingTest] = useState(false);
  const [loadingPincodeTest, setLoadingPincodeTest] = useState(false);

  const handleTestDelhiveryTracking = async (e) => {
    if (e) e.preventDefault();
    if (!testWaybill.trim()) return;
    setLoadingTrackingTest(true);
    setTrackingResult(null);
    try {
      const res = await api.trackDelhiveryShipment(testWaybill.trim());
      setTrackingResult(res.data || res);
    } catch (err) {
      setTrackingResult({ error: err.message, found: false });
    } finally {
      setLoadingTrackingTest(false);
    }
  };

  const handleTestDelhiveryPincode = async (e) => {
    if (e) e.preventDefault();
    if (!testPincode.trim()) return;
    setLoadingPincodeTest(true);
    setPincodeResult(null);
    try {
      const res = await api.checkShippingPincode(testPincode.trim());
      setPincodeResult(res);
    } catch (err) {
      setPincodeResult({ error: err.message, serviceable: false });
    } finally {
      setLoadingPincodeTest(false);
    }
  };

  // Search and Filters in inventory
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryBrandFilter, setInventoryBrandFilter] = useState('all');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('all');
  const [inventorySortFilter, setInventorySortFilter] = useState('default');

  // Modals for Product Add / Edit
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Dynamic Taxonomy State (Brands & Categories)
  const [taxonomy, setTaxonomy] = useState({
    brands: ['Bosch', 'Makita', 'DeWalt', 'Dongcheng', 'HiKOKI', 'Stanley'],
    categories: [
      { id: 'cordless', name: 'Cordless Tools' },
      { id: 'grinders-cutters', name: 'Grinders & Cutters' },
      { id: 'hammers', name: 'Hammer Drills' },
      { id: 'woodworking', name: 'Woodworking' },
      { id: 'washers-blowers', name: 'Washers & Blowers' },
      { id: 'accessories', name: 'Accessories & Bits' }
    ]
  });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  // Inline Quick Add inputs for Add/Edit Tool modal
  const [showAddBrandInline, setShowAddBrandInline] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  const [showAddCatInline, setShowAddCatInline] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Dedicated Taxonomy Tab Manager inputs
  const [managerNewBrand, setManagerNewBrand] = useState('');
  const [managerNewCatName, setManagerNewCatName] = useState('');

  // Delete Confirmation Modal state for Products
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Safety Warning Modals for Brands & Categories
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingTaxonomy, setIsDeletingTaxonomy] = useState(false);

  // Per-Order Counter Pickup OTP inputs
  const [orderOtpInputs, setOrderOtpInputs] = useState({});
  const [verifyingOrderId, setVerifyingOrderId] = useState(null);
  const [notification, setNotification] = useState('');

  // Product Form state
  const [productForm, setProductForm] = useState({
    name: '',
    brand: 'Bosch',
    category: 'cordless',
    price: '',
    originalPrice: '',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    description: '',
    cordless: false,
    badge: 'New Arrival',
  });

  const handleVerifySingleOrderOtp = async (e, orderId) => {
    if (e) e.preventDefault();
    const otp = (orderOtpInputs[orderId] || '').trim();
    if (!otp) {
      showNotification('Please enter the 4-digit pickup OTP');
      return;
    }

    setVerifyingOrderId(orderId);
    try {
      const res = await api.verifyPickupOtp(orderId, otp);
      showNotification(`✅ Handover verified! Order ${orderId} marked as Completed.`);
      setOrderOtpInputs(prev => ({ ...prev, [orderId]: '' }));
      loadOrders();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`❌ ${err.message}`);
    } finally {
      setVerifyingOrderId(null);
    }
  };

  // Dynamic Coupons State
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: 0,
    usageLimitPerUser: 1,
    maxTotalUses: '',
    active: true
  });
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);

  // Workshop Repairs State
  const [repairs, setRepairs] = useState([]);
  const [loadingRepairs, setLoadingRepairs] = useState(false);
  const [isAddRepairModalOpen, setIsAddRepairModalOpen] = useState(false);
  const [repairForm, setRepairForm] = useState({
    customerName: '',
    customerPhone: '',
    toolBrand: 'Bosch',
    toolModel: '',
    serialNumber: '',
    issueDescription: '',
    estimatedCost: '',
    advancePaid: '',
    technicianNotes: ''
  });
  const [isSubmittingRepair, setIsSubmittingRepair] = useState(false);
  const [repairOtpInputs, setRepairOtpInputs] = useState({});
  const [verifyingRepairId, setVerifyingRepairId] = useState(null);

  // Invoice & Shipping Label Printing State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState(null);

  // Inline Stock & Price Editing
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [savingPriceId, setSavingPriceId] = useState(null);
  const [steppingStockId, setSteppingStockId] = useState(null);

  // Low Stock Hub
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Revenue Analytics Period Filter
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all'); // 'all' | 'month' | 'week' | 'today'

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
    loadProducts();
    loadTaxonomy();
    loadCoupons();
    loadRepairs();
  }, [user]);

  const loadTaxonomy = async () => {
    setLoadingTaxonomy(true);
    try {
      const res = await api.getTaxonomy();
      if (res && res.brands && res.categories) {
        setTaxonomy({
          brands: res.brands,
          categories: res.categories
        });
      }
    } catch (err) {
      console.error("Failed to load taxonomy:", err);
    } finally {
      setLoadingTaxonomy(false);
    }
  };

  const handleAddBrandInline = async (e) => {
    if (e) e.preventDefault();
    const clean = newBrandInput.trim();
    if (!clean) return;
    setIsAddingBrand(true);
    try {
      await api.addBrand(clean);
      showNotification(`Brand "${clean}" added successfully!`);
      setNewBrandInput('');
      setShowAddBrandInline(false);
      setProductForm(prev => ({ ...prev, brand: clean }));
      await loadTaxonomy();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsAddingBrand(false);
    }
  };

  const handleAddCategoryInline = async (e) => {
    if (e) e.preventDefault();
    const clean = newCatNameInput.trim();
    if (!clean) return;
    setIsAddingCat(true);
    try {
      const res = await api.addCategory({ name: clean });
      showNotification(`Category "${clean}" added successfully!`);
      const createdId = res.category?.id || clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setNewCatNameInput('');
      setShowAddCatInline(false);
      setProductForm(prev => ({ ...prev, category: createdId }));
      await loadTaxonomy();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleAddBrandManager = async (e) => {
    if (e) e.preventDefault();
    const clean = managerNewBrand.trim();
    if (!clean) return;
    try {
      await api.addBrand(clean);
      showNotification(`Brand "${clean}" added to catalog!`);
      setManagerNewBrand('');
      await loadTaxonomy();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleAddCategoryManager = async (e) => {
    if (e) e.preventDefault();
    const clean = managerNewCatName.trim();
    if (!clean) return;
    try {
      await api.addCategory({ name: clean });
      showNotification(`Category "${clean}" added to catalog!`);
      setManagerNewCatName('');
      await loadTaxonomy();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  // SAFETY CHECK: Trigger delete brand with warning if products exist
  const triggerDeleteBrand = (brandName) => {
    const associated = products.filter(p => (p.brand || '').toLowerCase() === brandName.toLowerCase());
    setBrandToDelete({
      name: brandName,
      count: associated.length,
      products: associated
    });
  };

  const handleConfirmDeleteBrand = async () => {
    if (!brandToDelete) return;
    setIsDeletingTaxonomy(true);
    try {
      const deleteProducts = brandToDelete.count > 0;
      await api.deleteBrand(brandToDelete.name, deleteProducts);
      if (deleteProducts) {
        showNotification(`Brand "${brandToDelete.name}" and ${brandToDelete.count} product(s) permanently deleted!`);
      } else {
        showNotification(`Brand "${brandToDelete.name}" deleted from directory.`);
      }
      setBrandToDelete(null);
      await loadTaxonomy();
      await loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Delete error: ${err.message}`);
    } finally {
      setIsDeletingTaxonomy(false);
    }
  };

  // SAFETY CHECK: Trigger delete category with warning if products exist
  const triggerDeleteCategory = (catId, catName) => {
    const associated = products.filter(p => p.category === catId);
    setCategoryToDelete({
      id: catId,
      name: catName,
      count: associated.length,
      products: associated
    });
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingTaxonomy(true);
    try {
      const deleteProducts = categoryToDelete.count > 0;
      await api.deleteCategory(categoryToDelete.id, deleteProducts);
      if (deleteProducts) {
        showNotification(`Category "${categoryToDelete.name}" and ${categoryToDelete.count} product(s) permanently deleted!`);
      } else {
        showNotification(`Category "${categoryToDelete.name}" deleted.`);
      }
      setCategoryToDelete(null);
      await loadTaxonomy();
      await loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Delete error: ${err.message}`);
    } finally {
      setIsDeletingTaxonomy(false);
    }
  };

  const triggerDeleteProduct = (prod) => {
    setProductToDelete(prod);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = productToDelete.id || productToDelete._id;
      await api.deleteProduct(targetId);
      showNotification(`Deleted "${productToDelete.name}" from store catalog!`);
      setProductToDelete(null);
      await loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Delete failed: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getOrders();
      setOrders(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await api.getProducts();
      setProducts(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await api.getCoupons();
      setCoupons(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const loadRepairs = async () => {
    setLoadingRepairs(true);
    try {
      const res = await api.getRepairJobs();
      setRepairs(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error("Failed to load repairs:", err);
    } finally {
      setLoadingRepairs(false);
    }
  };

  // Feature 2: Inline Stock Stepper
  const handleQuickStockStep = async (product, delta) => {
    const currentStock = typeof product.stock === 'number' ? product.stock : 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    // Optimistic update
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
    setSteppingStockId(product.id);

    try {
      await api.updateProduct(product.id, { stock: newStock });
      showNotification(`Stock for "${product.name.slice(0, 20)}..." updated to ${newStock}`);
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      // Revert on error
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: currentStock } : p));
      showNotification(`Failed to update stock: ${err.message}`);
    } finally {
      setSteppingStockId(null);
    }
  };

  // Feature 2: Inline Price Edit
  const handleStartEditingPrice = (product) => {
    setEditingPriceId(product.id);
    setEditingPriceValue(String(product.price || ''));
  };

  const handleSaveInlinePrice = async (productId) => {
    const numericPrice = parseFloat(editingPriceValue);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showNotification('Please enter a valid price');
      return;
    }

    setSavingPriceId(productId);
    try {
      await api.updateProduct(productId, { price: numericPrice });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, price: numericPrice } : p));
      showNotification(`Price updated to ₹${numericPrice.toLocaleString('en-IN')}`);
      setEditingPriceId(null);
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Failed to update price: ${err.message}`);
    } finally {
      setSavingPriceId(null);
    }
  };

  // Feature 3: WhatsApp Reorder Generator
  const handleDistributorWhatsAppReorder = () => {
    const lowItems = products.filter(p => (p.stock ?? 0) <= 3);
    if (lowItems.length === 0) {
      showNotification('All catalog items currently have healthy stock (≥4 units).');
      return;
    }

    const grouped = {};
    lowItems.forEach(i => {
      const b = i.brand || 'Other Equipment';
      if (!grouped[b]) grouped[b] = [];
      grouped[b].push(i);
    });

    let msg = `*VARIATHU POWER TOOLS - DISTRIBUTOR RESTOCK ORDER*\n`;
    msg += `📍 Poyanil Junction, Kozhencherry, Pathanamthitta\n`;
    msg += `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    msg += `The following products are at low safety stock (≤3 units) and require urgent replenishment:\n\n`;

    Object.entries(grouped).forEach(([brand, items]) => {
      msg += `*${brand.toUpperCase()} (${items.length} items):*\n`;
      items.forEach(it => {
        const reorderUnits = Math.max(5, (10 - (it.stock || 0)));
        msg += `• ${it.name} (Current Stock: ${it.stock || 0}) ➔ Order: ${reorderUnits} units\n`;
      });
      msg += `\n`;
    });

    msg += `Please confirm earliest delivery to Variathu Power Tools counter. Thank you!`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Feature 4: Coupons Handlers
  const handleToggleCouponActive = async (coupon) => {
    try {
      const targetId = coupon.id || coupon._id;
      const newActive = !coupon.active;
      await api.updateCoupon(targetId, { active: newActive });
      showNotification(`Coupon "${coupon.code}" ${newActive ? 'activated' : 'deactivated'}!`);
      loadCoupons();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) return;
    try {
      const targetId = coupon.id || coupon._id;
      await api.deleteCoupon(targetId);
      showNotification(`Coupon "${coupon.code}" deleted.`);
      loadCoupons();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleSaveCoupon = async (e) => {
    if (e) e.preventDefault();
    const cleanCode = (couponForm.code || '').trim().toUpperCase();
    if (!cleanCode) {
      showNotification('Please enter a coupon code');
      return;
    }
    const val = Number(couponForm.discountValue);
    if (isNaN(val) || val <= 0) {
      showNotification('Please enter a valid discount value');
      return;
    }
    setIsSubmittingCoupon(true);
    try {
      await api.createCoupon({
        code: cleanCode,
        description: couponForm.description,
        discountType: couponForm.discountType,
        discountValue: val,
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        usageLimitPerUser: Number(couponForm.usageLimitPerUser) || 0,
        maxTotalUses: Number(couponForm.maxTotalUses) || 0,
        active: Boolean(couponForm.active)
      });
      showNotification(`🎉 Coupon "${cleanCode}" created successfully!`);
      setIsAddCouponModalOpen(false);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: 0,
        usageLimitPerUser: 1,
        maxTotalUses: '',
        active: true
      });
      loadCoupons();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  // Feature 5: Workshop & Repair Handlers
  const handleSaveRepairJob = async (e) => {
    if (e) e.preventDefault();
    if (!repairForm.customerName.trim() || !repairForm.customerPhone.trim() || !repairForm.toolModel.trim() || !repairForm.issueDescription.trim()) {
      showNotification('Please fill customer name, phone, tool model, and issue description.');
      return;
    }
    setIsSubmittingRepair(true);
    try {
      const res = await api.createRepairJob({
        customerName: repairForm.customerName.trim(),
        customerPhone: repairForm.customerPhone.trim(),
        toolBrand: repairForm.toolBrand || 'Bosch',
        toolModel: repairForm.toolModel.trim(),
        serialNumber: repairForm.serialNumber.trim(),
        issueDescription: repairForm.issueDescription.trim(),
        estimatedCost: Number(repairForm.estimatedCost) || 0,
        advancePaid: Number(repairForm.advancePaid) || 0,
        technicianNotes: repairForm.technicianNotes.trim()
      });
      showNotification(`🛠️ Repair Job #${res.job?.jobId || 'created'} logged successfully!`);
      setIsAddRepairModalOpen(false);
      setRepairForm({
        customerName: '',
        customerPhone: '',
        toolBrand: 'Bosch',
        toolModel: '',
        serialNumber: '',
        issueDescription: '',
        estimatedCost: '',
        advancePaid: '',
        technicianNotes: ''
      });
      loadRepairs();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsSubmittingRepair(false);
    }
  };

  const handleUpdateRepairStatus = async (job, newStatus) => {
    try {
      const targetId = job.id || job.jobId || job._id;
      await api.updateRepairJob(targetId, { status: newStatus });
      showNotification(`Repair #${job.jobId} updated to "${newStatus}"`);
      loadRepairs();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleVerifyRepairOtp = async (e, job) => {
    if (e) e.preventDefault();
    const targetId = job.id || job.jobId || job._id;
    const otp = (repairOtpInputs[targetId] || '').trim();
    if (!otp) {
      showNotification('Please enter the customer 4-digit handover OTP');
      return;
    }
    setVerifyingRepairId(targetId);
    try {
      const res = await api.verifyRepairOtp(targetId, otp);
      showNotification(`✅ Handover verified! Tool delivered to ${job.customerName}`);
      setRepairOtpInputs(prev => ({ ...prev, [targetId]: '' }));
      loadRepairs();
    } catch (err) {
      showNotification(`❌ ${err.message}`);
    } finally {
      setVerifyingRepairId(null);
    }
  };

  const handleDeleteRepair = async (job) => {
    if (!window.confirm(`Delete repair card #${job.jobId} for "${job.toolModel}"?`)) return;
    try {
      const targetId = job.id || job.jobId || job._id;
      await api.deleteRepairJob(targetId);
      showNotification(`Repair #${job.jobId} deleted.`);
      loadRepairs();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const getWhatsAppRepairText = (job) => {
    const cleanPhone = (job.customerPhone || '').replace(/[^0-9]/g, '');
    let text = `Hello ${job.customerName},\n`;
    text += `Update regarding your tool repair at *Variathu Power Tools Kozhencherry*:\n\n`;
    text += `🔧 *Tool:* ${job.toolBrand ? job.toolBrand + ' ' : ''}${job.toolModel}\n`;
    text += `📋 *Job Ticket:* ${job.jobId}\n`;
    text += `🚦 *Status:* ${job.status.toUpperCase()}\n`;
    if (job.status === 'Repaired & Ready') {
      text += `✅ *Diagnosis / Work Done:* ${job.technicianNotes || 'Servicing, parts fitting & safety testing completed'}\n`;
      text += `💰 *Bill Amount:* ₹${(job.finalCost || job.estimatedCost || 0).toLocaleString('en-IN')}`;
      if (job.advancePaid) text += ` (Advance Paid: ₹${job.advancePaid.toLocaleString('en-IN')})`;
      text += `\n🔑 *Counter Collection OTP:* ${job.handoverOtp || '4819'}\n\n`;
      text += `Please visit our counter at Poyanil Building, Poyanil Junction, Kozhencherry to collect your tested equipment.`;
    } else if (job.status === 'Waiting for Spares') {
      text += `⏳ Spares/parts ordered from distributor. We will notify you once received and fitted.\n`;
    } else {
      text += `Current estimate: ₹${(job.estimatedCost || 0).toLocaleString('en-IN')}. Our technician is currently working on it.\n`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Feature 6: Export Orders CSV
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      showNotification('No orders available to export');
      return;
    }

    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Phone',
      'District',
      'Pincode',
      'Address',
      'Delivery Type',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Items Summary',
      'Item Count',
      'Subtotal Excl Tax',
      'CGST 9% (INR)',
      'SGST 9% (INR)',
      'Total Amount (INR)',
      'AWB / Tracking'
    ];

    const rows = orders.map(o => {
      const total = Number(o.totalAmount || 0);
      const taxable = Math.round(total / 1.18);
      const cgst = Math.round((total - taxable) / 2);
      const sgst = total - taxable - cgst;
      const itemsStr = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join('; ');
      const itemCount = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

      return [
        o.id,
        new Date(o.date || o.createdAt || Date.now()).toLocaleDateString('en-IN'),
        `"${(o.customer?.name || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.phone || '').replace(/"/g, '""')}"`,
        `"${(o.customer?.district || 'Kerala').replace(/"/g, '""')}"`,
        o.customer?.pincode || '689641',
        `"${(o.customer?.address || '').replace(/"/g, '""')}"`,
        o.deliveryType === 'store-pickup' ? 'Counter Pickup' : 'Courier',
        o.paymentMethod || 'UPI',
        o.paymentStatus || 'PAID',
        o.status || 'Confirmed',
        `"${itemsStr.replace(/"/g, '""')}"`,
        itemCount,
        taxable,
        cgst,
        sgst,
        total,
        o.awb || o.pickupOtp || 'N/A'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Variathu_Power_Tools_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('✅ Exported orders CSV for accountant / Tally filing!');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showNotification(`Order ${orderId} updated to "${newStatus}"`);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const rawImgs = Array.isArray(productForm.images) ? productForm.images : [productForm.image];
      const cleanedImages = rawImgs.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean);
      const primaryImage = cleanedImages[0] || productForm.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';

      const payload = {
        ...productForm,
        image: primaryImage,
        images: cleanedImages.length > 0 ? cleanedImages : [primaryImage],
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        stock: Number(productForm.stock),
        deliveryCost: Number(productForm.deliveryCost || 0),
        rating: 5.0,
        reviewsCount: 1,
        specs: {
          power: productForm.cordless ? '20V XR Brushless' : '850 Watts',
          voltage: '230V / 50Hz',
          warranty: '1 Year Warranty'
        }
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showNotification(`Updated tool "${payload.name}" successfully!`);
      } else {
        await api.createProduct(payload);
        showNotification(`Added tool "${payload.name}" to inventory!`);
      }

      setIsAddModalOpen(false);
      setEditingProduct(null);
      loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    const existingImages = Array.isArray(prod.images) && prod.images.length > 0
      ? prod.images.filter(Boolean)
      : (prod.image ? [prod.image] : ['']);

    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category || 'cordless',
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stock: prod.stock || 10,
      deliveryCost: prod.deliveryCost !== undefined ? prod.deliveryCost : 120,
      image: prod.image || existingImages[0] || '',
      images: existingImages.length > 0 ? existingImages : [''],
      description: prod.description || '',
      cordless: !!prod.cordless,
      badge: prod.badge || '',
    });
    setShowAddBrandInline(false);
    setShowAddCatInline(false);
    setIsAddModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: taxonomy.brands[0] || 'Bosch',
      category: taxonomy.categories[0]?.id || 'cordless',
      price: '',
      originalPrice: '',
      stock: 12,
      deliveryCost: 120,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
      description: '',
      cordless: false,
      badge: 'New Arrival',
    });
    setShowAddBrandInline(false);
    setShowAddCatInline(false);
    setIsAddModalOpen(true);
  };

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Feature 6: Period Revenue & Order Analytics
  const now = new Date();
  const periodOrders = orders.filter(o => {
    if (analyticsPeriod === 'all') return true;
    const orderDate = new Date(o.date || o.createdAt || now);
    if (analyticsPeriod === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (analyticsPeriod === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= oneWeekAgo;
    }
    if (analyticsPeriod === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const periodRevenue = periodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const upiOrders = periodOrders.filter(o => ['UPI', 'RAZORPAY', 'CARD', 'NETBANKING'].includes((o.paymentMethod || '').toUpperCase()));
  const upiRevenue = upiOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashOrders = periodOrders.filter(o => !['UPI', 'RAZORPAY', 'CARD', 'NETBANKING'].includes((o.paymentMethod || '').toUpperCase()));
  const cashRevenue = cashOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pickupOrdersCount = periodOrders.filter(o => (o.deliveryType || '').includes('pickup')).length;
  const courierOrdersCount = periodOrders.filter(o => !(o.deliveryType || '').includes('pickup')).length;

  const lowStockItems = products.filter(p => (p.stock ?? 0) <= 3);
  const lowStockCount = lowStockItems.length;

  // Collect unique brands & categories for filters
  const uniqueBrands = Array.from(new Set([
    ...(taxonomy.brands || []),
    ...products.map(p => p.brand).filter(Boolean)
  ])).sort((a, b) => a.localeCompare(b));

  const categoryNameMap = {};
  (taxonomy.categories || []).forEach(c => {
    categoryNameMap[c.id] = c.name;
  });

  const uniqueCategoryIds = Array.from(new Set([
    ...(taxonomy.categories || []).map(c => c.id),
    ...products.map(p => p.category).filter(Boolean)
  ])).filter(Boolean);

  const getCategoryLabel = (catId) => {
    if (!catId) return 'General Equipment';
    if (categoryNameMap[catId]) return categoryNameMap[catId];
    return catId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Compute category count by selected company (or whole store count if 'all' is selected)
  const getCategoryCountForSelectedBrand = (catId) => {
    return products.filter(p => {
      const matchesCat = (p.category || '').toLowerCase() === catId.toLowerCase();
      if (inventoryBrandFilter === 'all') return matchesCat;
      return matchesCat && (p.brand || '').toLowerCase() === inventoryBrandFilter.toLowerCase();
    }).length;
  };

  // Sort categories: categories with items for this brand appear at the top, then alphabetically
  const sortedCategoryIds = [...uniqueCategoryIds].sort((a, b) => {
    const countA = getCategoryCountForSelectedBrand(a);
    const countB = getCategoryCountForSelectedBrand(b);
    if (countB !== countA) return countB - countA; // categories with items first
    return getCategoryLabel(a).localeCompare(getCategoryLabel(b));
  });

  // Total tools available for selected company (or all products if 'all' selected)
  const selectedBrandProductCount = inventoryBrandFilter === 'all'
    ? products.length
    : products.filter(p => (p.brand || '').toLowerCase() === inventoryBrandFilter.toLowerCase()).length;

  const handleBrandFilterChange = (newBrand) => {
    setInventoryBrandFilter(newBrand);
    if (inventoryCategoryFilter !== 'all' && newBrand !== 'all') {
      const countInSelectedCat = products.filter(
        p => (p.brand || '').toLowerCase() === newBrand.toLowerCase() &&
             (p.category || '').toLowerCase() === inventoryCategoryFilter.toLowerCase()
      ).length;
      if (countInSelectedCat === 0) {
        setInventoryCategoryFilter('all');
      }
    }
  };

  const filteredProducts = products.filter(p => {
    // 1. Search Query
    const q = (inventorySearch || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q);

    // 2. Company / Brand Filter
    const matchesBrand = inventoryBrandFilter === 'all' ||
      (p.brand || '').toLowerCase() === inventoryBrandFilter.toLowerCase();

    // 3. Category Filter
    const matchesCategory = inventoryCategoryFilter === 'all' ||
      (p.category || '').toLowerCase() === inventoryCategoryFilter.toLowerCase();

    // 4. Low Stock Filter
    const matchesLowStock = !showLowStockOnly || ((p.stock ?? 0) <= 3);

    return matchesSearch && matchesBrand && matchesCategory && matchesLowStock;
  }).sort((a, b) => {
    if (inventorySortFilter === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (inventorySortFilter === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (inventorySortFilter === 'stock-asc') return (a.stock ?? 0) - (b.stock ?? 0);
    if (inventorySortFilter === 'stock-desc') return (b.stock ?? 0) - (a.stock ?? 0);
    if (inventorySortFilter === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    return 0; // default
  });

  const hasActiveInventoryFilters = inventorySearch.trim() !== '' || inventoryBrandFilter !== 'all' || inventoryCategoryFilter !== 'all' || inventorySortFilter !== 'default' || showLowStockOnly;

  const handleResetInventoryFilters = () => {
    setInventorySearch('');
    setInventoryBrandFilter('all');
    setInventoryCategoryFilter('all');
    setInventorySortFilter('default');
    setShowLowStockOnly(false);
  };

  if (!user) return null;

  return (
    <div className="store-dashboard-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '84px',
            right: '24px',
            zIndex: 999,
            background: '#ffffff',
            border: '1px solid #16a34a',
            color: '#16a34a',
            boxShadow: 'var(--shadow-md)',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '0.86rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Store Header Banner */}
      <div className="store-portal-header-banner">
        <div className="store-portal-brand-wrap">
          <div className="store-portal-icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <div className="store-portal-title-row">
              <h1>Store Owner Portal</h1>
              <span className="store-admin-badge">ADMIN ACCESS</span>
            </div>
            <p className="store-portal-subtitle">
              Variathu Power Tools • Poyanil Building, Kozhencherry, Kerala
            </p>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="store-logout-btn"
          id="btn-store-logout"
        >
          Sign Out of Store
        </button>
      </div>

      {/* Feature 6: Revenue Analytics & CSV Export Toolbar */}
      <div className="store-analytics-card">
        <div className="store-analytics-header">
          <div className="store-analytics-title-wrap">
            <BarChart3 size={22} style={{ color: '#ea580c', flexShrink: 0 }} />
            <div>
              <h3>Store Analytics & Financial Reports</h3>
              <p>Period revenue, payment method breakdowns, and accounting exports</p>
            </div>
          </div>

          <div className="store-analytics-actions">
            {/* Period Selector Tabs */}
            <div className="store-period-selector">
              {[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ].map(period => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setAnalyticsPeriod(period.id)}
                  className={`store-period-btn ${analyticsPeriod === period.id ? 'active' : ''}`}
                  id={`btn-period-${period.id}`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* 1-Click CSV Export */}
            <button
              type="button"
              onClick={handleExportOrdersCSV}
              className="store-csv-export-btn"
              title="Export all orders as Excel-compatible CSV for GST & Tally accounting"
              id="btn-export-orders-csv"
            >
              <Download size={14} />
              <span>Export Orders (CSV)</span>
            </button>
          </div>
        </div>

        {/* 4 Analytics Metric Cards */}
        <div className="store-analytics-grid">
          <div className="store-analytics-metric-card">
            <span className="store-metric-label">
              Revenue ({analyticsPeriod === 'all' ? 'All Time' : analyticsPeriod === 'today' ? 'Today' : analyticsPeriod === 'week' ? 'Past 7 Days' : 'This Month'})
            </span>
            <div className="store-metric-value-huge">
              {formatPrice(periodRevenue)}
            </div>
            <span className="store-metric-subtext">
              {periodOrders.length} order{periodOrders.length === 1 ? '' : 's'} in selected period
            </span>
          </div>

          <div className="store-analytics-metric-card">
            <span className="store-metric-label">
              Payment Method Breakdown
            </span>
            <div className="store-metric-split-list">
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#16a34a' }}>● UPI / Digital</span>
                <span className="store-metric-item-value">{formatPrice(upiRevenue)} <small>({upiOrders.length})</small></span>
              </div>
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#ea580c' }}>● Cash at Counter</span>
                <span className="store-metric-item-value">{formatPrice(cashRevenue)} <small>({cashOrders.length})</small></span>
              </div>
            </div>
          </div>

          <div className="store-analytics-metric-card">
            <span className="store-metric-label">
              Order Fulfillment Split
            </span>
            <div className="store-metric-split-list">
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#0284c7' }}>● Store Pickup</span>
                <span className="store-metric-item-value">{pickupOrdersCount} <small>orders</small></span>
              </div>
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#7c3aed' }}>● Courier Express</span>
                <span className="store-metric-item-value">{courierOrdersCount} <small>parcels</small></span>
              </div>
            </div>
          </div>

          <div className="store-analytics-metric-card">
            <span className="store-metric-label">
              Workshop & Repairs Active
            </span>
            <div className="store-metric-split-list">
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#ea580c' }}>● In Workshop</span>
                <span className="store-metric-item-value">{repairs.filter(r => r.status !== 'Handed Over').length} <small>jobs</small></span>
              </div>
              <div className="store-metric-split-item">
                <span className="store-metric-item-label" style={{ color: '#16a34a' }}>● Ready for Pickup</span>
                <span className="store-metric-item-value" style={{ color: '#16a34a' }}>{repairs.filter(r => r.status === 'Repaired & Ready').length} <small>ready</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (5 Tabs) - Horizontal Scroll Strip on Mobile */}
      <div className="store-nav-tabs-bar" role="tablist">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`store-nav-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          id="store-tab-orders"
        >
          <ShoppingBag size={16} />
          <span>Customer Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`store-nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          id="store-tab-inventory"
        >
          <Package size={16} />
          <span>Inventory & Stock ({products.length})</span>
          {lowStockCount > 0 && (
            <span className="store-nav-badge-alert">
              {lowStockCount} low
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`store-nav-tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          id="store-tab-coupons"
        >
          <Percent size={16} />
          <span>Coupons & Discounts ({coupons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('repairs')}
          className={`store-nav-tab-btn ${activeTab === 'repairs' ? 'active' : ''}`}
          id="store-tab-repairs"
        >
          <Wrench size={16} />
          <span>Workshop & Repairs ({repairs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('taxonomy')}
          className={`store-nav-tab-btn ${activeTab === 'taxonomy' ? 'active' : ''}`}
          id="store-tab-taxonomy"
        >
          <Layers size={16} />
          <span>Categories & Brands ({taxonomy.categories.length + taxonomy.brands.length})</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMER ORDERS MANAGER */}
      {activeTab === 'orders' && (
        <div className="store-tab-content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Customer Orders Management
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Change delivery progress statuses in real time. Updates automatically reflect on customer order screens.
              </p>
            </div>

            <button
              onClick={loadOrders}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading customer orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <ShoppingBag size={32} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>No Customer Orders Yet</strong>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>When customers place equipment orders or counter pickups, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                  id={`store-order-row-${order.id}`}
                >
                  {/* OTP THING AT TOP OF PRODUCT ORDER (STORE PICKUP ORDERS ONLY) */}
                  {order.deliveryType === 'store-pickup' && (
                    <div
                      style={{
                        background: order.handoverVerified 
                          ? '#f0fdf4' 
                          : 'linear-gradient(135deg, rgba(234, 88, 12, 0.06) 0%, rgba(234, 88, 12, 0.12) 100%)',
                        border: order.handoverVerified ? '1.5px solid #86efac' : '1.5px dashed #ea580c',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                      id={`pickup-otp-bar-${order.id}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {order.handoverVerified ? (
                          <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
                        ) : (
                          <ShieldCheck size={20} style={{ color: '#ea580c' }} />
                        )}
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: order.handoverVerified ? '#166534' : '#0f172a' }}>
                            {order.handoverVerified ? '✅ Counter Handover Verified & Completed' : 'Store Counter Pickup • OTP Verification'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {order.handoverVerified 
                              ? `Equipment collected by customer${order.collectedAt ? ` on ${new Date(order.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}.`
                              : <>Ask customer for their 4-digit code: <strong style={{ color: '#ea580c', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{order.pickupOtp || '4819'}</strong></>}
                          </div>
                        </div>
                      </div>

                      {!order.handoverVerified && (
                        <form
                          onSubmit={(e) => handleVerifySingleOrderOtp(e, order.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="4-Digit OTP"
                            value={orderOtpInputs[order.id] || ''}
                            onChange={(e) => setOrderOtpInputs({ ...orderOtpInputs, [order.id]: e.target.value })}
                            style={{
                              width: '110px',
                              padding: '7px 10px',
                              textAlign: 'center',
                              fontSize: '0.92rem',
                              fontWeight: '800',
                              letterSpacing: '0.15em',
                              fontFamily: 'var(--font-mono)',
                              background: '#ffffff',
                              border: '2px solid #cbd5e1',
                              borderRadius: '6px',
                              color: '#0f172a',
                              outline: 'none'
                            }}
                            id={`input-order-otp-${order.id}`}
                          />
                          <button
                            type="submit"
                            disabled={verifyingOrderId === order.id}
                            className="btn-hero-clean"
                            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                            id={`btn-verify-otp-${order.id}`}
                          >
                            <span>{verifyingOrderId === order.id ? 'Verifying...' : 'Verify & Handover'}</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{order.id}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Automation: Payment Status Badge */}
                        <span
                          style={{
                            background: order.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                            color: order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                            border: `1px solid ${order.paymentStatus === 'PAID' ? '#86efac' : '#fde68a'}`,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}
                        >
                          {order.paymentStatus === 'PAID' ? `PAID (${order.transactionId || 'UPI'})` : 'PENDING PAYMENT'}
                        </span>

                        {/* Automation: Pickup OTP or Courier AWB */}
                        {order.deliveryType === 'store-pickup' ? (
                          <span
                            style={{
                              background: order.handoverVerified ? '#ecfdf5' : '#f1f5f9',
                              color: order.handoverVerified ? '#16a34a' : '#ea580c',
                              border: '1px solid #e2e8f0',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700'
                            }}
                          >
                            {order.handoverVerified ? `✅ Handover Verified` : `Pickup OTP: ${order.pickupOtp || '4819'}`}
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f0f9ff',
                              color: '#0284c7',
                              border: '1px solid #bae6fd',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '700'
                            }}
                          >
                            AWB: {order.awb || 'DLHVY-KL-8491'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#0f172a', fontWeight: '700', marginTop: '4px' }}>
                        Customer: {order.customer?.name} • <a href={`tel:${order.customer?.phone}`} style={{ color: '#ea580c', textDecoration: 'none' }}>{order.customer?.phone}</a>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Mode: <strong style={{ color: '#0284c7' }}>{order.deliveryType === 'store-pickup' ? 'Store Pickup at Poyanil Building' : 'Courier (' + (order.customer?.district || 'Kerala') + ')'}</strong>
                      </div>
                    </div>

                    {/* Status Controller */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        {formatPrice(order.totalAmount)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700' }}>
                          Update Status:
                        </label>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            background: '#ffffff',
                            border: '2px solid #ea580c',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            color: '#ea580c',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                          id={`select-status-${order.id}`}
                        >
                          {STATUS_OPTIONS.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '0.82rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Ordered Tools ({order.items?.length})
                    </span>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx < order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <span>• <strong>{item.name}</strong> (x{item.quantity})</span>
                        <span style={{ color: '#0f172a', fontWeight: '700' }}>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions: Invoices, Shipping Labels, Customer Contact */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForInvoice(order)}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Generate and print A4 GST Tax Invoice for customer"
                      id={`btn-print-invoice-${order.id}`}
                    >
                      <Printer size={13} style={{ color: '#0284c7' }} />
                      <span>Print GST Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderForLabel(order)}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Generate and print 4x6 Courier Shipping Label with barcode"
                      id={`btn-print-label-${order.id}`}
                    >
                      <Truck size={13} style={{ color: '#ea580c' }} />
                      <span>Print Courier Label</span>
                    </button>

                    <a
                      href={`tel:${order.customer?.phone}`}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        color: '#0f172a',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Phone size={13} style={{ color: '#ea580c' }} />
                      <span>Call Customer</span>
                    </a>

                    <a
                      href={`https://wa.me/${(order.customer?.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(order.customer?.name || '')},%20this%20is%20Variathu%20Power%20Tools%20Kozhencherry%20regarding%20your%20order%20${order.id}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: '#16a34a',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Customer</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & EQUIPMENT CONTROL */}
      {activeTab === 'inventory' && (
        <div className="store-tab-content-card">
          <div className="store-section-header">
            <div>
              <h2>Inventory & Product Control</h2>
              <p>Add, edit prices, update stock levels, or remove tools from the store catalog.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={openNewProduct}
                className="btn-hero-clean"
                style={{ padding: '9px 16px', fontSize: '0.84rem' }}
                id="btn-add-tool-modal"
              >
                <Plus size={16} />
                <span>Add New Equipment</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & Sort Bar */}
          <div className="store-inventory-toolbar">
            {/* 1. Search Box */}
            <div className="store-inv-search-wrap">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search tools by name, brand, SKU..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="store-inv-search-input"
                id="input-inventory-search"
              />
              {inventorySearch && (
                <button
                  type="button"
                  onClick={() => setInventorySearch('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 2. Filter by Company / Brand */}
            <div className="store-inv-filter-group">
              <label>Company:</label>
              <select
                value={inventoryBrandFilter}
                onChange={(e) => handleBrandFilterChange(e.target.value)}
                className="store-inv-select"
                style={{
                  background: inventoryBrandFilter !== 'all' ? '#eff6ff' : '#ffffff',
                  borderColor: inventoryBrandFilter !== 'all' ? '#0284c7' : '#cbd5e1',
                  color: inventoryBrandFilter !== 'all' ? '#0369a1' : '#0f172a'
                }}
                id="select-filter-brand"
              >
                <option value="all">All Companies / Brands ({products.length})</option>
                {uniqueBrands.map(b => {
                  const count = products.filter(p => (p.brand || '').toLowerCase() === b.toLowerCase()).length;
                  return (
                    <option key={b} value={b}>
                      {b} {count > 0 ? `(${count})` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Filter by Category */}
            <div className="store-inv-filter-group">
              <label>Category:</label>
              <select
                value={inventoryCategoryFilter}
                onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                className="store-inv-select"
                style={{
                  background: inventoryCategoryFilter !== 'all' ? '#eff6ff' : '#ffffff',
                  borderColor: inventoryCategoryFilter !== 'all' ? '#0284c7' : '#cbd5e1',
                  color: inventoryCategoryFilter !== 'all' ? '#0369a1' : '#0f172a'
                }}
                id="select-filter-category"
              >
                <option value="all">
                  All Categories ({selectedBrandProductCount})
                </option>
                {sortedCategoryIds.map(catId => {
                  const count = getCategoryCountForSelectedBrand(catId);
                  return (
                    <option key={catId} value={catId}>
                      {getCategoryLabel(catId)} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. Sort By */}
            <div className="store-inv-filter-group sort-group">
              <label>Sort:</label>
              <select
                value={inventorySortFilter}
                onChange={(e) => setInventorySortFilter(e.target.value)}
                className="store-inv-select"
                style={{
                  background: inventorySortFilter !== 'default' ? '#fff7ed' : '#ffffff',
                  borderColor: inventorySortFilter !== 'default' ? '#ea580c' : '#cbd5e1',
                  color: inventorySortFilter !== 'default' ? '#c2410c' : '#0f172a'
                }}
                id="select-sort-inventory"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock-asc">Stock: Low to High (Low Stock First)</option>
                <option value="stock-desc">Stock: High to Low</option>
                <option value="name-asc">Alphabetical: A to Z</option>
              </select>
            </div>

            {/* 5. Feature 3: Low Stock (<4) Filter Toggle Chip */}
            <button
              type="button"
              onClick={() => setShowLowStockOnly(prev => !prev)}
              className="store-inv-chip-btn"
              style={{
                background: showLowStockOnly ? '#dc2626' : '#fffbeb',
                border: showLowStockOnly ? '1.5px solid #b91c1c' : '1px solid #fde68a',
                color: showLowStockOnly ? '#ffffff' : '#b45309'
              }}
              title="Show tools with 3 or fewer units in inventory"
              id="btn-filter-low-stock"
            >
              <AlertTriangle size={14} />
              <span>Low Stock (≤3) {lowStockCount > 0 ? `(${lowStockCount})` : ''}</span>
            </button>

            {/* Feature 3: 1-Click WhatsApp Distributor Reorder PO */}
            <button
              type="button"
              onClick={handleDistributorWhatsAppReorder}
              className="store-inv-chip-btn"
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                color: '#16a34a'
              }}
              title="Generate a grouped purchase order text and send to distributor rep on WhatsApp"
              id="btn-reorder-whatsapp"
            >
              <MessageCircle size={14} />
              <span>Reorder via WhatsApp</span>
            </button>

            {/* 6. Clear / Reset Filters if active */}
            {hasActiveInventoryFilters && (
              <button
                type="button"
                onClick={handleResetInventoryFilters}
                className="store-inv-chip-btn store-inv-reset-btn"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626'
                }}
                id="btn-reset-inventory-filters"
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Catalog Count Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '0.82rem', color: '#64748b' }}>
            <span>
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> equipment models
              {inventoryBrandFilter !== 'all' && <span> for <strong>{inventoryBrandFilter}</strong></span>}
              {inventoryCategoryFilter !== 'all' && <span> in <strong>{getCategoryLabel(inventoryCategoryFilter)}</strong></span>}
              {showLowStockOnly && <span style={{ color: '#dc2626', fontWeight: '800' }}> (Low stock only)</span>}
            </span>

            {hasActiveInventoryFilters && (
              <button
                type="button"
                onClick={handleResetInventoryFilters}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Product Items Table */}
          {loadingProducts ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading inventory...</div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <Package size={36} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontWeight: '700', fontSize: '1rem', color: '#0f172a', margin: '0 0 6px' }}>No equipment matches your current filters</p>
              <p style={{ fontSize: '0.84rem', margin: '0 0 16px' }}>Try searching with a different brand, category, or keyword.</p>
              <button
                type="button"
                onClick={handleResetInventoryFilters}
                className="btn-hero-clean"
                style={{ display: 'inline-flex', padding: '8px 18px', fontSize: '0.82rem' }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="store-product-item-card"
                  id={`store-tool-row-${prod.id}`}
                >
                  <div className="store-product-main-info">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="store-product-thumbnail"
                    />
                    <div className="store-product-details">
                      <span className="store-product-meta-badge">
                        {prod.brand} • {prod.category}
                      </span>
                      <h4 className="store-product-name">
                        {prod.name}
                      </h4>
                      <div className="store-product-stock-wrap">
                        {/* Feature 2: Quick Inline Stock Stepper */}
                        <div className="store-stock-stepper">
                          <button
                            type="button"
                            onClick={() => handleQuickStockStep(prod, -1)}
                            disabled={steppingStockId === prod.id || (prod.stock || 0) <= 0}
                            style={{
                              cursor: (prod.stock || 0) <= 0 ? 'not-allowed' : 'pointer',
                            }}
                            title="Decrease stock by 1"
                            id={`btn-stock-dec-${prod.id}`}
                          >
                            −
                          </button>
                          <span style={{ color: prod.stock <= 3 ? '#dc2626' : '#0f172a' }}>
                            {prod.stock} units
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockStep(prod, 1)}
                            disabled={steppingStockId === prod.id}
                            title="Increase stock by 1"
                            id={`btn-stock-inc-${prod.id}`}
                          >
                            +
                          </button>
                        </div>

                        {prod.stock <= 3 && prod.stock > 0 && (
                          <span style={{ fontSize: '0.7rem', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            ⚠️ LOW STOCK: Reorder
                          </span>
                        )}
                        {prod.stock === 0 && (
                          <span style={{ fontSize: '0.7rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            🔴 OUT OF STOCK
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="store-product-actions-bar">
                    {/* Feature 2: Inline Quick Price Edit */}
                    {editingPriceId === prod.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', padding: '4px 6px', borderRadius: '8px', border: '2px solid #ea580c' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#ea580c' }}>₹</span>
                        <input
                          type="number"
                          value={editingPriceValue}
                          onChange={(e) => setEditingPriceValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlinePrice(prod.id);
                            if (e.key === 'Escape') setEditingPriceId(null);
                          }}
                          autoFocus
                          style={{ width: '85px', padding: '3px 6px', fontSize: '0.9rem', fontWeight: '800', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                          id={`input-inline-price-${prod.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveInlinePrice(prod.id)}
                          disabled={savingPriceId === prod.id}
                          style={{ padding: '4px 7px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '800' }}
                          title="Save price (Enter)"
                          id={`btn-save-price-${prod.id}`}
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPriceId(null)}
                          style={{ padding: '4px 6px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          title="Cancel (Esc)"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditingPrice(prod)}
                        title="Click to edit price directly"
                        className="store-product-price-section"
                        id={`display-price-${prod.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                            {formatPrice(prod.price)}
                          </span>
                          <Edit3 size={11} style={{ color: '#94a3b8' }} />
                        </div>
                        {prod.originalPrice && (
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            MRP {formatPrice(prod.originalPrice)}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="store-product-btn-group">
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="store-btn-edit"
                        title="Edit Product Details & Specs"
                        id={`btn-edit-${prod.id}`}
                      >
                        <Edit3 size={14} />
                        <span>Full Edit</span>
                      </button>

                      <button
                        onClick={() => triggerDeleteProduct(prod)}
                        className="store-btn-delete"
                        title="Delete Product from Catalog"
                        id={`btn-delete-${prod.id || prod._id}`}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROMOTIONS & COUPONS MANAGER (Feature 4) */}
      {activeTab === 'coupons' && (
        <div className="store-tab-content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={20} style={{ color: '#ea580c' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Promotional Coupons & Discount Manager
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0' }}>
                Create, activate, pause, and delete promotional discount codes validated live during cart & checkout.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={loadCoupons}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddCouponModalOpen(true)}
                className="btn-hero-clean"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                id="btn-new-coupon-modal"
              >
                <Plus size={16} />
                <span>Create New Coupon</span>
              </button>
            </div>
          </div>

          {loadingCoupons ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading promotional codes...</div>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Percent size={36} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>No Active Promo Codes</strong>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>Create custom promotional discount codes to offer customer savings during checkout.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {coupons.map(coupon => (
                <div
                  key={coupon.id || coupon._id || coupon.code}
                  style={{
                    background: '#f8fafc',
                    border: `1.5px solid ${coupon.active ? '#cbd5e1' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    padding: '18px',
                    opacity: coupon.active ? 1 : 0.7,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  id={`coupon-card-${coupon.code}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '1rem',
                          fontWeight: '800',
                          letterSpacing: '0.08em',
                          background: coupon.active ? '#eff6ff' : '#f1f5f9',
                          color: coupon.active ? '#0284c7' : '#64748b',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${coupon.active ? '#93c5fd' : '#cbd5e1'}`
                        }}
                      >
                        {coupon.code}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                        {coupon.description || 'Promotional Offer'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCouponActive(coupon)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        border: 'none',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        background: coupon.active ? '#ecfdf5' : '#f1f5f9',
                        color: coupon.active ? '#15803d' : '#64748b'
                      }}
                      id={`btn-toggle-coupon-${coupon.code}`}
                    >
                      {coupon.active ? '● ACTIVE' : '○ PAUSED'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', margin: '12px 0', fontSize: '0.74rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Discount</span>
                      <strong style={{ fontSize: '0.88rem', color: '#ea580c' }}>
                        {coupon.discountType === 'flat' ? `₹${coupon.discountValue} Flat` : `${coupon.discountValue}% OFF`}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Customer Limit</span>
                      <strong style={{ fontSize: '0.82rem', color: Number(coupon.usageLimitPerUser) === 1 ? '#ea580c' : '#0f172a' }}>
                        {Number(coupon.usageLimitPerUser) === 1 ? '1x per Phone' : 'Unlimited'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Min Cart</span>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                        {coupon.minOrderAmount ? `₹${coupon.minOrderAmount.toLocaleString('en-IN')}` : '₹0'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block' }}>Redemptions</span>
                      <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                        {coupon.usageCount || 0} {coupon.maxTotalUses > 0 ? `/ ${coupon.maxTotalUses}` : 'times'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(coupon)}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      id={`btn-delete-coupon-${coupon.code}`}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WORKSHOP SERVICE & REPAIRS TRACKER (Feature 5) */}
      {activeTab === 'repairs' && (
        <div className="store-tab-content-card">
          <div className="store-section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} style={{ color: '#ea580c' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Workshop Servicing & Tool Repair Tickets
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0' }}>
                Manage customer machine repairs (armature rewinding, carbon brushes, gearboxes), WhatsApp status updates, and OTP handovers.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={loadRepairs}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddRepairModalOpen(true)}
                className="btn-hero-clean"
                style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                id="btn-new-repair-modal"
              >
                <Plus size={16} />
                <span>Log Inward Tool</span>
              </button>
            </div>
          </div>

          {loadingRepairs ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading workshop jobs...</div>
          ) : repairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Wrench size={36} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>No Active Repair Jobs</strong>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>Click "Log Inward Tool" to create a new job ticket when a customer brings a broken machine to Poyanil Building.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {repairs.map(job => (
                <div
                  key={job.id || job.jobId || job._id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                  id={`repair-row-${job.jobId}`}
                >
                  {/* Ready for pickup OTP Banner */}
                  {job.status === 'Repaired & Ready' && !job.handoverVerified && (
                    <div
                      style={{
                        background: '#eff6ff',
                        border: '1.5px solid #93c5fd',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <CheckCircle2 size={20} style={{ color: '#0284c7' }} />
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#0369a1' }}>
                            Repaired & Tested! Counter Collection Code: <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#ea580c' }}>{job.handoverOtp || '4819'}</span>
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            Verify customer's 4-digit code before releasing the power tool.
                          </div>
                        </div>
                      </div>

                      <form onSubmit={(e) => handleVerifyRepairOtp(e, job)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="4-Digit OTP"
                          value={repairOtpInputs[job.id || job.jobId || job._id] || ''}
                          onChange={(e) => setRepairOtpInputs({ ...repairOtpInputs, [job.id || job.jobId || job._id]: e.target.value })}
                          style={{
                            width: '110px',
                            padding: '7px 10px',
                            textAlign: 'center',
                            fontSize: '0.92rem',
                            fontWeight: '800',
                            letterSpacing: '0.15em',
                            fontFamily: 'var(--font-mono)',
                            background: '#ffffff',
                            border: '2px solid #cbd5e1',
                            borderRadius: '6px'
                          }}
                        />
                        <button
                          type="submit"
                          disabled={verifyingRepairId === (job.id || job.jobId || job._id)}
                          className="btn-hero-clean"
                          style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                        >
                          {verifyingRepairId === (job.id || job.jobId || job._id) ? 'Verifying...' : 'Verify & Deliver'}
                        </button>
                      </form>
                    </div>
                  )}

                  {job.handoverVerified && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                      <span>✅ Machine collected by customer at Poyanil counter. Ticket closed.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', fontWeight: '800', background: '#0f172a', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                          {job.jobId}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                          {job.toolBrand ? `${job.toolBrand} ` : ''}{job.toolModel}
                        </h3>
                        {job.serialNumber && (
                          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                            S/N: {job.serialNumber}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
                        Customer: <strong>{job.customerName}</strong> ({job.customerPhone}) • Logged: {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                        Est: {formatPrice(job.estimatedCost || 0)}
                      </span>
                      {job.advancePaid > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700' }}>
                          Advance Paid: {formatPrice(job.advancePaid)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Problem & Diagnosis */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '0.82rem' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ color: '#dc2626' }}>Reported Problem:</strong> {job.issueDescription}
                    </div>
                    {job.technicianNotes && (
                      <div style={{ color: '#0369a1' }}>
                        <strong>Technician Work / Diagnosis:</strong> {job.technicianNotes}
                      </div>
                    )}
                  </div>

                  {/* Status Stepper */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Workshop Progress Stage (Click to update):
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['Received', 'Diagnosing', 'Waiting for Spares', 'Repaired & Ready', 'Handed Over'].map((st, sidx) => {
                        const isCurrent = job.status === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateRepairStatus(job, st)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: isCurrent ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                              background: isCurrent ? '#ea580c' : '#ffffff',
                              color: isCurrent ? '#ffffff' : '#475569',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>{sidx + 1}. {st}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <a
                      href={getWhatsAppRepairText(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: '#16a34a',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageCircle size={13} />
                      <span>WhatsApp Customer Status</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteRepair(job)}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'taxonomy' && (
        <div className="store-taxonomy-grid">
          {/* Brands Management Card */}
          <div className="store-tab-content-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Tag size={20} style={{ color: '#ea580c' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Brand Directory
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px' }}>
              Add and manage equipment manufacturers available in store and dropdown selections.
            </p>

            {/* Quick Add Brand Form */}
            <form onSubmit={handleAddBrandManager} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="New Brand Name (e.g. KPT, Taparia)"
                value={managerNewBrand}
                onChange={(e) => setManagerNewBrand(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  color: '#0f172a'
                }}
                id="input-manager-new-brand"
              />
              <button
                type="submit"
                className="btn-hero-clean"
                style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                id="btn-manager-add-brand"
              >
                <Plus size={14} />
                <span>Add Brand</span>
              </button>
            </form>

            {/* Brands List */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {taxonomy.brands.map((b) => (
                <div
                  key={b}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    color: '#0f172a'
                  }}
                  id={`brand-badge-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  <span>{b}</span>
                  <button
                    onClick={() => triggerDeleteBrand(b)}
                    title={`Delete brand ${b}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    id={`btn-delete-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories Management Card */}
          <div className="store-tab-content-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Layers size={20} style={{ color: '#ea580c' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Equipment Categories
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px' }}>
              Create categories so customers and counter staff can classify and filter products easily.
            </p>

            {/* Quick Add Category Form */}
            <form onSubmit={handleAddCategoryManager} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Category Name (e.g. Welding Machines)"
                value={managerNewCatName}
                onChange={(e) => setManagerNewCatName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  color: '#0f172a'
                }}
                id="input-manager-new-cat"
              />
              <button
                type="submit"
                className="btn-hero-clean"
                style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                id="btn-manager-add-category"
              >
                <Plus size={14} />
                <span>Add Category</span>
              </button>
            </form>

            {/* Categories List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {taxonomy.categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem'
                  }}
                  id={`cat-badge-${cat.id}`}
                >
                  <div>
                    <strong style={{ color: '#0f172a' }}>{cat.name}</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
                      slug: {cat.id}
                    </span>
                  </div>

                  <button
                    onClick={() => triggerDeleteCategory(cat.id, cat.name)}
                    title={`Delete category ${cat.name}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    id={`btn-delete-cat-${cat.id}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                {editingProduct ? 'Edit Tool Details & Price' : 'Add New Equipment to Catalog'}
              </h3>
              <button className="btn-close-modal" onClick={() => setIsAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Equipment Name & Model *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                  id="input-tool-name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* BRAND SELECTION & INLINE ADD */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>Brand *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandInline(!showAddBrandInline)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ea580c',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: 0
                      }}
                      id="btn-inline-brand-toggle"
                    >
                      <Plus size={12} />
                      <span>{showAddBrandInline ? 'Cancel' : '+ Add Brand'}</span>
                    </button>
                  </div>

                  {showAddBrandInline && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: '#fff7ed', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      <input
                        type="text"
                        placeholder="Brand name (e.g. KPT)"
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #ea580c', borderRadius: '4px' }}
                        id="input-inline-brand-name"
                      />
                      <button
                        type="button"
                        onClick={handleAddBrandInline}
                        disabled={isAddingBrand}
                        style={{ background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                        id="btn-save-inline-brand"
                      >
                        {isAddingBrand ? '...' : 'Save'}
                      </button>
                    </div>
                  )}

                  <select
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                    id="select-tool-brand"
                  >
                    {taxonomy.brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* CATEGORY SELECTION & INLINE ADD */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInline(!showAddCatInline)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ea580c',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: 0
                      }}
                      id="btn-inline-cat-toggle"
                    >
                      <Plus size={12} />
                      <span>{showAddCatInline ? 'Cancel' : '+ Add Category'}</span>
                    </button>
                  </div>

                  {showAddCatInline && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: '#fff7ed', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      <input
                        type="text"
                        placeholder="Category (e.g. Welding)"
                        value={newCatNameInput}
                        onChange={(e) => setNewCatNameInput(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #ea580c', borderRadius: '4px' }}
                        id="input-inline-cat-name"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategoryInline}
                        disabled={isAddingCat}
                        style={{ background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                        id="btn-save-inline-cat"
                      >
                        {isAddingCat ? '...' : 'Save'}
                      </button>
                    </div>
                  )}

                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                    id="select-tool-category"
                  >
                    {taxonomy.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                    id="input-tool-price"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Original MRP (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Stock Units *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                    id="input-tool-stock"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Delivery Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Free"
                    value={productForm.deliveryCost}
                    onChange={(e) => setProductForm({ ...productForm, deliveryCost: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                    id="input-tool-delivery-cost"
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '6px 0 12px' }}>
                💡 <em>Tip: Enter <strong>0</strong> for Free Courier Delivery, or set a custom rate based on equipment weight.</em>
              </p>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
                    Equipment Images (Multiple URLs)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(productForm.images) ? productForm.images : [productForm.image || ''];
                      setProductForm({ ...productForm, images: [...cur, ''] });
                    }}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    id="btn-add-image-link"
                  >
                    <Plus size={13} />
                    <span>+ Add Image Link</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Array.isArray(productForm.images) && productForm.images.length > 0 ? productForm.images : [productForm.image || '']).map((imgUrl, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: '800', 
                          color: idx === 0 ? '#dc2626' : '#64748b', 
                          width: '55px', 
                          flexShrink: 0 
                        }}
                      >
                        {idx === 0 ? 'Main *' : `Image ${idx + 1}`}
                      </span>

                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={imgUrl}
                        onChange={(e) => {
                          const cur = Array.isArray(productForm.images) ? [...productForm.images] : [productForm.image || ''];
                          cur[idx] = e.target.value;
                          setProductForm({ 
                            ...productForm, 
                            images: cur, 
                            image: cur[0] || '' 
                          });
                        }}
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                      />

                      {imgUrl && imgUrl.startsWith('http') && (
                        <img 
                          src={imgUrl} 
                          alt="preview" 
                          style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}

                      {(Array.isArray(productForm.images) ? productForm.images.length : 1) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Array.isArray(productForm.images) ? [...productForm.images] : [productForm.image || ''];
                            const next = cur.filter((_, i) => i !== idx);
                            setProductForm({ 
                              ...productForm, 
                              images: next.length > 0 ? next : [''],
                              image: next[0] || ''
                            });
                          }}
                          style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove image link"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Short Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.86rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="cordless-toggle"
                  checked={productForm.cordless}
                  onChange={(e) => setProductForm({ ...productForm, cordless: e.target.checked })}
                />
                <label htmlFor="cordless-toggle" style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                  Is this a Cordless (Battery Operated) Tool?
                </label>
              </div>

              <button
                type="submit"
                className="btn-hero-clean"
                style={{ justifyContent: 'center', marginTop: '10px' }}
                id="btn-save-tool-submit"
              >
                <span>{editingProduct ? 'Save Changes' : 'Add to Store Catalog'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP CONFIRMATION MODAL FOR DELETING A PRODUCT */}
      {productToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !isDeleting && setProductToDelete(null)}
          style={{ zIndex: 1100 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', padding: '28px 24px', textAlign: 'center' }}
            id="modal-delete-confirm"
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef2f2',
                border: '2px solid #fecaca',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Trash2 size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Delete Equipment?
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to delete this tool? It will be permanently removed from the live online catalog.
            </p>

            {/* Preview Box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                marginBottom: '24px'
              }}
            >
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', background: '#ffffff', border: '1px solid #cbd5e1' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase' }}>
                  {productToDelete.brand} • {productToDelete.category}
                </span>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {productToDelete.name}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(productToDelete.price)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: '700',
                  color: '#475569',
                  cursor: 'pointer'
                }}
                id="btn-cancel-delete"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                }}
                id="btn-confirm-delete"
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY WARNING MODAL FOR DELETING A BRAND */}
      {brandToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !isDeletingTaxonomy && setBrandToDelete(null)}
          style={{ zIndex: 1150 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '28px 24px', textAlign: 'center' }}
            id="modal-brand-safety-warning"
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: brandToDelete.count > 0 ? '#fef2f2' : '#f8fafc',
                border: `2px solid ${brandToDelete.count > 0 ? '#fecaca' : '#cbd5e1'}`,
                color: brandToDelete.count > 0 ? '#dc2626' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              {brandToDelete.count > 0 ? <AlertTriangle size={30} /> : <Tag size={26} />}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              {brandToDelete.count > 0 ? `Warning: Products Assigned to "${brandToDelete.name}"!` : `Delete Brand "${brandToDelete.name}"?`}
            </h3>

            {brandToDelete.count > 0 ? (
              <>
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'left',
                    marginBottom: '16px',
                    fontSize: '0.84rem',
                    color: '#9f1239',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} />
                    <span>PERMANENT PRODUCT DELETION WARNING</span>
                  </div>
                  There are currently <strong>{brandToDelete.count} product(s)</strong> assigned to brand <strong>"{brandToDelete.name}"</strong> in your catalog.
                  <div style={{ marginTop: '6px', fontWeight: '700', color: '#be123c' }}>
                    ⚠️ If you delete this brand, ALL {brandToDelete.count} product(s) assigned to it will be PERMANENTLY DELETED from your store catalog and MongoDB database!
                  </div>
                </div>

                <div style={{ textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Products that will be removed ({brandToDelete.count}):
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {brandToDelete.products.map((p) => (
                    <div
                      key={p.id || p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left'
                      }}
                    >
                      <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800' }}>
                          {formatPrice(p.price)} • Stock: {p.stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBrandToDelete(null)}
                    disabled={isDeletingTaxonomy}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                    id="btn-cancel-delete-brand"
                  >
                    Cancel (Keep Brand & Tools)
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDeleteBrand}
                    disabled={isDeletingTaxonomy}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      background: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                    }}
                    id="btn-confirm-delete-brand"
                  >
                    <Trash2 size={15} />
                    <span>{isDeletingTaxonomy ? 'Deleting...' : `Delete Brand & All ${brandToDelete.count} Products`}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                  No products are currently assigned to brand <strong>"{brandToDelete.name}"</strong>. Are you sure you want to remove it from the directory?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBrandToDelete(null)}
                    disabled={isDeletingTaxonomy}
                    style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                    id="btn-cancel-empty-brand"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteBrand}
                    disabled={isDeletingTaxonomy}
                    style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                    id="btn-confirm-empty-brand"
                  >
                    {isDeletingTaxonomy ? 'Deleting...' : 'Delete Brand'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SAFETY WARNING MODAL FOR DELETING A CATEGORY */}
      {categoryToDelete && (
        <div
          className="modal-overlay"
          onClick={() => !isDeletingTaxonomy && setCategoryToDelete(null)}
          style={{ zIndex: 1150 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '28px 24px', textAlign: 'center' }}
            id="modal-cat-safety-warning"
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: categoryToDelete.count > 0 ? '#fef2f2' : '#f8fafc',
                border: `2px solid ${categoryToDelete.count > 0 ? '#fecaca' : '#cbd5e1'}`,
                color: categoryToDelete.count > 0 ? '#dc2626' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              {categoryToDelete.count > 0 ? <AlertTriangle size={30} /> : <Layers size={26} />}
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              {categoryToDelete.count > 0 ? `Warning: Products in "${categoryToDelete.name}"!` : `Delete Category "${categoryToDelete.name}"?`}
            </h3>

            {categoryToDelete.count > 0 ? (
              <>
                <div
                  style={{
                    background: '#fff1f2',
                    border: '1.5px solid #fecdd3',
                    borderRadius: '10px',
                    padding: '14px',
                    textAlign: 'left',
                    marginBottom: '16px',
                    fontSize: '0.84rem',
                    color: '#9f1239',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={16} />
                    <span>PERMANENT PRODUCT DELETION WARNING</span>
                  </div>
                  There are currently <strong>{categoryToDelete.count} product(s)</strong> in category <strong>"{categoryToDelete.name}"</strong>.
                  <div style={{ marginTop: '6px', fontWeight: '700', color: '#be123c' }}>
                    ⚠️ If you delete this category, ALL {categoryToDelete.count} product(s) in it will be PERMANENTLY DELETED from your store catalog and MongoDB database!
                  </div>
                </div>

                <div style={{ textAlign: 'left', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Products that will be removed ({categoryToDelete.count}):
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {categoryToDelete.products.map((p) => (
                    <div
                      key={p.id || p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        textAlign: 'left'
                      }}
                    >
                      <img src={p.image} alt={p.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800' }}>
                          {formatPrice(p.price)} • Stock: {p.stock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    disabled={isDeletingTaxonomy}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                    id="btn-cancel-delete-cat"
                  >
                    Cancel (Keep Category & Tools)
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmDeleteCategory}
                    disabled={isDeletingTaxonomy}
                    style={{
                      flex: 1,
                      padding: '11px 14px',
                      background: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                    }}
                    id="btn-confirm-delete-cat"
                  >
                    <Trash2 size={15} />
                    <span>{isDeletingTaxonomy ? 'Deleting...' : `Delete Category & All ${categoryToDelete.count} Products`}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                  No products are currently assigned to category <strong>"{categoryToDelete.name}"</strong>. Are you sure you want to remove it?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCategoryToDelete(null)}
                    disabled={isDeletingTaxonomy}
                    style={{ flex: 1, padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                    id="btn-cancel-empty-cat"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteCategory}
                    disabled={isDeletingTaxonomy}
                    style={{ flex: 1, padding: '10px', background: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                    id="btn-confirm-empty-cat"
                  >
                    {isDeletingTaxonomy ? 'Deleting...' : 'Delete Category'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Modal: Live Delhivery API & Tracking Tester */}
      {showDelhiveryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDelhiveryModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '660px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '26px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Delhivery Logistics Live API & Tracking Console
                  </h3>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, fontFamily: 'var(--font-mono)' }}>
                  Production Host: <strong>track.delhivery.com</strong> • Token: <strong>943a9342...c388a</strong> (Active)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDelhiveryModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                id="btn-close-delhivery-test"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', background: '#f8fafc', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setActiveDelhiveryTab('tracking')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeDelhiveryTab === 'tracking' ? '#0284c7' : 'transparent',
                  color: activeDelhiveryTab === 'tracking' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                📦 Track AWB
              </button>
              <button
                type="button"
                onClick={() => setActiveDelhiveryTab('pincode')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeDelhiveryTab === 'pincode' ? '#0284c7' : 'transparent',
                  color: activeDelhiveryTab === 'pincode' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                📍 Pincode Check
              </button>
              <button
                type="button"
                onClick={() => setActiveDelhiveryTab('guide')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: activeDelhiveryTab === 'guide' ? '#0284c7' : 'transparent',
                  color: activeDelhiveryTab === 'guide' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease'
                }}
              >
                📖 Delhivery Site Guide
              </button>
            </div>

            {/* TAB 1: Live AWB Tracking */}
            {activeDelhiveryTab === 'tracking' && (
              <div>
                <form onSubmit={handleTestDelhiveryTracking} style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    Enter Delhivery Waybill / AWB Number:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. 148293847192 or DLHVY-KL-8491"
                      value={testWaybill}
                      onChange={(e) => setTestWaybill(e.target.value)}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.88rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                      id="input-test-waybill"
                    />
                    <button
                      type="submit"
                      disabled={loadingTrackingTest || !testWaybill.trim()}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 18px',
                        fontWeight: '800',
                        fontSize: '0.84rem',
                        cursor: loadingTrackingTest ? 'not-allowed' : 'pointer',
                        opacity: loadingTrackingTest ? 0.7 : 1
                      }}
                      id="btn-run-track-test"
                    >
                      {loadingTrackingTest ? 'Querying API...' : 'Track Live'}
                    </button>
                  </div>
                </form>

                {/* Quick Helper Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Quick Test AWBs:</span>
                  <button
                    type="button"
                    onClick={() => { setTestWaybill('1234567890'); }}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                  >
                    1234567890 (Sample)
                  </button>
                  {orders.find(o => o.awb) && (
                    <button
                      type="button"
                      onClick={() => { setTestWaybill(orders.find(o => o.awb).awb); }}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '6px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: '700' }}
                    >
                      Use Placed Order AWB ({orders.find(o => o.awb).awb})
                    </button>
                  )}
                </div>

                {/* Tracking Response Card */}
                {trackingResult && (
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: trackingResult.statusCode === 200 ? '#ecfdf5' : '#fef2f2', color: trackingResult.statusCode === 200 ? '#15803d' : '#b91c1c', padding: '2px 8px', borderRadius: '6px', border: trackingResult.statusCode === 200 ? '1px solid #86efac' : '1px solid #fecaca' }}>
                          HTTP {trackingResult.statusCode || 200} OK
                        </span>
                        <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>
                          Waybill: {trackingResult.waybill}
                        </span>
                      </div>
                      <a
                        href={`https://www.delhivery.com/track/package/${encodeURIComponent(trackingResult.waybill)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: '#0284c7', textDecoration: 'none', fontWeight: '700', background: '#ffffff', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '6px' }}
                      >
                        <span>Check on Delhivery.com</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>

                    {trackingResult.found ? (
                      <div>
                        <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
                            ● {trackingResult.status}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                            Origin: <strong>{trackingResult.origin}</strong> → Destination: <strong>{trackingResult.destination || 'In Transit'}</strong>
                          </div>
                          {trackingResult.expectedDeliveryDate && (
                            <div style={{ fontSize: '0.78rem', color: '#0284c7', marginTop: '4px', fontWeight: '700' }}>
                              Expected Delivery: {new Date(trackingResult.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>

                        {trackingResult.scans && trackingResult.scans.length > 0 && (
                          <div style={{ background: '#ffffff', borderRadius: '8px', padding: '12px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                              Live Scan History
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {trackingResult.scans.map((scan, sIdx) => (
                                <div key={sIdx} style={{ fontSize: '0.76rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{scan.scanDetail} ({scan.location})</span>
                                  <span style={{ color: '#64748b' }}>{scan.scanDateTime}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>
                          ℹ️ Live Delhivery API Response:
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.5, marginBottom: '8px' }}>
                          {trackingResult.delhiveryError || trackingResult.message}
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#64748b', margin: 0 }}>
                          💡 <strong>How Delhivery Tracking Works:</strong> The API accepted the token and responded with 200 OK. In Delhivery production, an AWB number only produces live scan history once a shipment order is booked/created in your Delhivery account.
                        </p>
                      </div>
                    )}

                    {/* Raw JSON Debug Box */}
                    {trackingResult.raw && (
                      <details style={{ marginTop: '12px' }}>
                        <summary style={{ fontSize: '0.72rem', color: '#64748b', cursor: 'pointer', fontWeight: '700' }}>
                          View Raw Delhivery JSON Response
                        </summary>
                        <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', overflowX: 'auto', marginTop: '6px' }}>
                          {JSON.stringify(trackingResult.raw, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Pincode Serviceability */}
            {activeDelhiveryTab === 'pincode' && (
              <div>
                <form onSubmit={handleTestDelhiveryPincode} style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                    Enter 6-Digit Delivery Pincode:
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength={6}
                      value={testPincode}
                      onChange={(e) => setTestPincode(e.target.value.replace(/\D/g, ''))}
                      style={{
                        flex: 1,
                        height: '42px',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        padding: '0 12px',
                        fontSize: '0.88rem',
                        fontFamily: 'var(--font-mono)',
                        outline: 'none'
                      }}
                      id="input-test-pincode"
                    />
                    <button
                      type="submit"
                      disabled={loadingPincodeTest || !testPincode.trim()}
                      style={{
                        background: '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 18px',
                        fontWeight: '800',
                        fontSize: '0.84rem',
                        cursor: loadingPincodeTest ? 'not-allowed' : 'pointer'
                      }}
                      id="btn-run-pincode-test"
                    >
                      {loadingPincodeTest ? 'Checking...' : 'Check Serviceability'}
                    </button>
                  </div>
                </form>

                {/* Quick Pincode Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>Kerala Hubs:</span>
                  {[
                    { pin: '689641', label: 'Kozhencherry (Hub Origin)' },
                    { pin: '682001', label: 'Ernakulam / Kochi' },
                    { pin: '695001', label: 'Trivandrum' },
                    { pin: '673001', label: 'Kozhikode' }
                  ].map(p => (
                    <button
                      key={p.pin}
                      type="button"
                      onClick={() => { setTestPincode(p.pin); }}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {pincodeResult && (
                  <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', background: pincodeResult.serviceable ? '#ecfdf5' : '#fef2f2', color: pincodeResult.serviceable ? '#15803d' : '#b91c1c', padding: '3px 10px', borderRadius: '6px', border: pincodeResult.serviceable ? '1px solid #86efac' : '1px solid #fecaca' }}>
                        {pincodeResult.serviceable ? '✅ DIRECT EXPRESS SERVICEABLE' : '❌ OUTSIDE DIRECT ZONE'}
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a' }}>
                        PIN: {pincodeResult.pincode}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '12px' }}>
                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>COD Available</span>
                        <strong style={{ fontSize: '0.86rem', color: pincodeResult.codAvailable ? '#16a34a' : '#dc2626' }}>
                          {pincodeResult.codAvailable ? 'YES (Active)' : 'NO'}
                        </strong>
                      </div>
                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>Prepaid Dispatch</span>
                        <strong style={{ fontSize: '0.86rem', color: pincodeResult.prepaidAvailable ? '#16a34a' : '#dc2626' }}>
                          {pincodeResult.prepaidAvailable ? 'YES (Active)' : 'NO'}
                        </strong>
                      </div>
                      <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>District / State</span>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                          {pincodeResult.district || 'Pathanamthitta'}, {pincodeResult.state || 'KL'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Delhivery Portal Testing Guide */}
            {activeDelhiveryTab === 'guide' && (
              <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  How to Test Delhivery API Directly on Delhivery's Site:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7' }}>Step 1: Open Delhivery One Portal</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Go to <a href="https://one.delhivery.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', fontWeight: '700' }}>one.delhivery.com</a> and sign in with your registered Delhivery credentials.
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7' }}>Step 2: Go to API Settings / Test our API</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      In Delhivery left sidebar, go to <strong>Settings → API & Webhooks</strong>. Click <strong>Test our API</strong> or open the Developer API Console.
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7' }}>Step 3: Test Pincode Serviceability API</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Select the <strong>Pincode Serviceability API</strong>. Enter <code>filter_codes: 689641</code>. Click <strong>Execute / Test</strong>. It will immediately return <code>200 OK</code> showing pickup and delivery capability.
                    </p>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#0284c7' }}>Step 4: Test Tracking API (Why you need an actual AWB)</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Select <strong>Track Package API</strong> (<code>/api/v1/packages/json/</code>). Delhivery requires an actual Waybill / AWB. If you enter random digits like <code>12345</code>, Delhivery responds <code>"Data does not exists for provided Waybill"</code>. To get tracking scans, book a forward order in Delhivery (under Orders → Create Order) or use an AWB from a live parcel.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowDelhiveryModal(false)}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Close Console
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW PROMOTIONAL COUPON (Feature 4)                        */}
      {/* ========================================================================= */}
      {isAddCouponModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Percent size={20} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Create Discount Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCouponModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ONAM2026, FESTIVE15"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    letterSpacing: '0.08em',
                    fontSize: '0.95rem'
                  }}
                  id="input-coupon-code"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Offer Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special Onam 10% Festival Discount on Pro Tools"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Discount Type
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700' }}
                  >
                    <option value="percentage">Percentage (% OFF)</option>
                    <option value="flat">Flat Amount (₹ OFF)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={couponForm.discountType === 'flat' ? '500' : '10'}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '800' }}
                    id="input-coupon-value"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Customer Usage Limit *
                  </label>
                  <select
                    value={couponForm.usageLimitPerUser}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimitPerUser: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700' }}
                    id="select-coupon-user-limit"
                  >
                    <option value="1">1x Per Customer (Phone Verified)</option>
                    <option value="0">Unlimited Reuses (Any customer)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Global Cap (Orders Budget)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for unlimited (or 50)"
                    value={couponForm.maxTotalUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxTotalUses: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                    id="input-coupon-global-cap"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Minimum Order Cart Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 for any cart value, or 3000"
                  value={couponForm.minOrderAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="coupon-active-checkbox"
                  checked={couponForm.active}
                  onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#ea580c' }}
                />
                <label htmlFor="coupon-active-checkbox" style={{ fontSize: '0.84rem', fontWeight: '700', color: '#334155', cursor: 'pointer' }}>
                  Activate coupon immediately for checkout
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddCouponModalOpen(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCoupon}
                  className="btn-hero-clean"
                  style={{ padding: '9px 20px', fontSize: '0.84rem' }}
                  id="btn-submit-coupon"
                >
                  {isSubmittingCoupon ? 'Creating...' : 'Save & Publish Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOG NEW WORKSHOP REPAIR JOB (Feature 5)                          */}
      {/* ========================================================================= */}
      {isAddRepairModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              boxShadow: 'var(--shadow-xl)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} style={{ color: '#ea580c' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Log Inward Machine for Repair
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRepairModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveRepairJob} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thomas Mathew"
                    value={repairForm.customerName}
                    onChange={(e) => setRepairForm({ ...repairForm, customerName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                    id="input-repair-customer"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Customer Phone (WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 94471 88990"
                    value={repairForm.customerPhone}
                    onChange={(e) => setRepairForm({ ...repairForm, customerPhone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                    id="input-repair-phone"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Tool Brand
                  </label>
                  <select
                    value={repairForm.toolBrand}
                    onChange={(e) => setRepairForm({ ...repairForm, toolBrand: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700' }}
                  >
                    {taxonomy.brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Other">Other Brand</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Tool Model Name & Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch GDC 120 Marble Cutter"
                    value={repairForm.toolModel}
                    onChange={(e) => setRepairForm({ ...repairForm, toolModel: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                    id="input-repair-model"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-849204"
                  value={repairForm.serialNumber}
                  onChange={(e) => setRepairForm({ ...repairForm, serialNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Reported Problem / Issue Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Armature heavy sparking, smoke smelling, motor won't turn smoothly"
                  value={repairForm.issueDescription}
                  onChange={(e) => setRepairForm({ ...repairForm, issueDescription: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', resize: 'vertical' }}
                  id="input-repair-issue"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Estimated Bill (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 750"
                    value={repairForm.estimatedCost}
                    onChange={(e) => setRepairForm({ ...repairForm, estimatedCost: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Advance Paid at Counter (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={repairForm.advancePaid}
                    onChange={(e) => setRepairForm({ ...repairForm, advancePaid: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Initial Technician Inspection Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Needs carbon brush replacement and armature commutator polish"
                  value={repairForm.technicianNotes}
                  onChange={(e) => setRepairForm({ ...repairForm, technicianNotes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddRepairModalOpen(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepair}
                  className="btn-hero-clean"
                  style={{ padding: '9px 20px', fontSize: '0.84rem' }}
                  id="btn-submit-repair"
                >
                  {isSubmittingRepair ? 'Logging...' : 'Log Inward Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PRINTABLE GST TAX INVOICE (Feature 1)                             */}
      {/* ========================================================================= */}
      {selectedOrderForInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-2xl)'
            }}
          >
            {/* Modal Actions Bar (hidden during actual print) */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#0f172a', color: '#ffffff', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: '#ea580c' }} />
                <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>
                  GST Tax Invoice • {selectedOrderForInvoice.id}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                  id="btn-print-trigger"
                >
                  <Printer size={15} />
                  <span>Print Invoice (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(null)}
                  style={{ background: '#334155', border: 'none', color: '#ffffff', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Printable A4 Content */}
            <div id="printable-invoice-modal-content" style={{ padding: '32px', color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
              {/* Invoice Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc2626', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                    VARIATHU POWER TOOLS
                  </h1>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                    Heavy Duty Equipment, Sales, Servicing & Genuine Spares
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '4px', maxWidth: '420px', lineHeight: 1.4 }}>
                    Poyanil Building, Near St Thomas Higher Secondary School Ground, Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '3px' }}>
                    <strong>GSTIN:</strong> 32AABCV4921E1Z8 &bull; <strong>State Code:</strong> 32 (Kerala) &bull; <strong>Ph:</strong> +91 94471 23456
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 12px', borderRadius: '4px', fontWeight: '900', fontSize: '0.85rem', display: 'inline-block', letterSpacing: '0.05em' }}>
                    TAX INVOICE
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '8px' }}>
                    <strong>Invoice No:</strong> INV-{selectedOrderForInvoice.id.replace(/[^0-9]/g, '') || '1001'}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                    <strong>Invoice Date:</strong> {new Date(selectedOrderForInvoice.date).toLocaleDateString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '2px' }}>
                    <strong>Payment Mode:</strong> {selectedOrderForInvoice.paymentMethod || 'UPI'} ({selectedOrderForInvoice.paymentStatus || 'PAID'})
                  </div>
                </div>
              </div>

              {/* Customer / Consignee Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Billed To (Customer Details):
                  </span>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>{selectedOrderForInvoice.customer?.name}</div>
                  <div>Phone: {selectedOrderForInvoice.customer?.phone}</div>
                  <div>{selectedOrderForInvoice.customer?.address || 'Poyanil Junction, Kozhencherry'}</div>
                  <div>District: {selectedOrderForInvoice.customer?.district || 'Pathanamthitta'}, Kerala - {selectedOrderForInvoice.customer?.pincode || '689641'}</div>
                  <div>State Code: 32 (Kerala)</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Shipping / Delivery Mode:
                  </span>
                  <div style={{ fontWeight: '800', color: '#0f172a' }}>
                    {selectedOrderForInvoice.deliveryType === 'store-pickup' 
                      ? '🏢 Counter Handover at Poyanil Building, Kozhencherry' 
                      : '🚚 Kerala Speed Express Doorstep Delivery (Delhivery Partner)'}
                  </div>
                  {selectedOrderForInvoice.pickupOtp && (
                    <div style={{ marginTop: '4px', color: '#ea580c' }}>
                      Counter Collection Code: <strong>{selectedOrderForInvoice.pickupOtp}</strong>
                    </div>
                  )}
                  {selectedOrderForInvoice.awb && (
                    <div style={{ marginTop: '4px', color: '#0284c7' }}>
                      Courier AWB Tracking: <strong>{selectedOrderForInvoice.awb}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Itemized Goods Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '36px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Item Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>HSN</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Taxable Val</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>CGST 9%</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>SGST 9%</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrderForInvoice.items?.map((it, idx) => {
                    const lineTotal = it.price * it.quantity;
                    const lineTaxable = Math.round(lineTotal / 1.18);
                    const lineCgst = Math.round((lineTotal - lineTaxable) / 2);
                    const lineSgst = lineTotal - lineTaxable - lineCgst;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px' }}>{idx + 1}</td>
                        <td style={{ padding: '10px' }}>
                          <strong>{it.name}</strong>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>8467</td>
                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700' }}>{it.quantity}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{lineTaxable.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{lineCgst.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹{lineSgst.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>₹{lineTotal.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderTop: '2px solid #0f172a', paddingTop: '16px' }}>
                <div style={{ maxWidth: '420px', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Terms & Warranty:</div>
                  <div>1. All machinery carries official manufacturer warranty serviced at our Kozhencherry workshop.</div>
                  <div>2. Certified genuine spares used for all warranty & repairs.</div>
                  <div>3. Subject to Pathanamthitta jurisdiction.</div>
                </div>

                <div style={{ width: '260px', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Taxable Subtotal:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Math.round(selectedOrderForInvoice.totalAmount / 1.18).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Total CGST (9%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Math.round((selectedOrderForInvoice.totalAmount - Math.round(selectedOrderForInvoice.totalAmount / 1.18)) / 2).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span>Total SGST (9%):</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      ₹{Math.round((selectedOrderForInvoice.totalAmount - Math.round(selectedOrderForInvoice.totalAmount / 1.18)) / 2).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #0f172a', marginTop: '6px', paddingTop: '6px', fontSize: '1.1rem' }}>
                    <strong>Grand Total:</strong>
                    <strong style={{ color: '#dc2626', fontFamily: 'var(--font-mono)' }}>
                      ₹{Number(selectedOrderForInvoice.totalAmount || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Authorized Signatory Stamp */}
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  This is a computer generated commercial invoice. Original copy for buyer.
                </div>
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', paddingBottom: '30px', fontWeight: '800', fontSize: '0.82rem' }}>
                    For VARIATHU POWER TOOLS
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                    Authorized Signatory / Seal
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRINTABLE 4X6 COURIER SHIPPING LABEL (Feature 1)                 */}
      {/* ========================================================================= */}
      {selectedOrderForLabel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-2xl)'
            }}
          >
            {/* Modal Top Actions */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#0f172a', color: '#ffffff', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} style={{ color: '#ea580c' }} />
                <span style={{ fontWeight: '800', fontSize: '0.92rem' }}>
                  4x6 Shipping Label Preview
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  id="btn-print-label-trigger"
                >
                  <Printer size={14} />
                  <span>Print Label (4x6)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForLabel(null)}
                  style={{ background: '#334155', border: 'none', color: '#ffffff', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* 4x6 Printable Package Label */}
            <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <div
                id="printable-label-modal-content"
                style={{
                  width: '380px',
                  border: '2.5px solid #000000',
                  padding: '16px',
                  background: '#ffffff',
                  color: '#000000',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                {/* Header Partner Bar */}
                <div style={{ borderBottom: '2px solid #000000', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1.05rem', fontWeight: '900', letterSpacing: '-0.02em' }}>
                      DELHIVERY EXPRESS
                    </strong>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700' }}>Kerala Speed Surface Logistics</div>
                  </div>
                  <div style={{ border: '2px solid #000000', padding: '4px 8px', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    {selectedOrderForLabel.paymentStatus === 'PAID' ? 'PREPAID' : 'COD - ₹' + selectedOrderForLabel.totalAmount}
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div style={{ textAlign: 'center', padding: '12px 0 8px', borderBottom: '2px solid #000000' }}>
                  <div style={{ height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: '2px' }}>
                    {[3,1,2,4,1,3,2,1,4,2,3,1,2,3,1,4,2,1,3,2,4,1,2,3,1,3,2,1,4,2,1,3,2,1,4,2,3,1].map((w, i) => (
                      <div key={i} style={{ width: `${w * 2}px`, background: '#000000' }} />
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '0.15em', marginTop: '4px' }}>
                    {selectedOrderForLabel.awb || 'DLHVY-KL-689641'}
                  </div>
                </div>

                {/* Destination Address (Giant PIN) */}
                <div style={{ borderBottom: '2px solid #000000', padding: '12px 0' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#333333' }}>
                    SHIP TO (CONSIGNEE):
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', marginTop: '2px' }}>
                    {selectedOrderForLabel.customer?.name}
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: '700', marginTop: '2px' }}>
                    Ph: {selectedOrderForLabel.customer?.phone}
                  </div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px', lineHeight: 1.3 }}>
                    {selectedOrderForLabel.customer?.address || 'Poyanil Junction, Kozhencherry'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '2px' }}>
                    District: {selectedOrderForLabel.customer?.district || 'Pathanamthitta'}, KERALA
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', marginTop: '6px', background: '#000000', color: '#ffffff', padding: '4px 8px', display: 'inline-block', letterSpacing: '0.05em' }}>
                    PIN: {selectedOrderForLabel.customer?.pincode || '689641'}
                  </div>
                </div>

                {/* Origin Hub */}
                <div style={{ borderBottom: '1px solid #000000', padding: '10px 0', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: '800', textTransform: 'uppercase', color: '#333333' }}>
                    SHIPPED BY / ORIGIN HUB:
                  </div>
                  <div style={{ fontWeight: '900', fontSize: '0.82rem', marginTop: '2px' }}>
                    VARIATHU POWER TOOLS
                  </div>
                  <div>Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala</div>
                  <div>Helpline: +91 94471 23456</div>
                </div>

                {/* Parcel Contents & Heavy Warning */}
                <div style={{ paddingTop: '8px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Items:</strong> {selectedOrderForLabel.items?.length} Tool(s) &bull; <strong>Wt:</strong> ~2.8 kg
                  </div>
                  <div style={{ fontWeight: '900', color: '#dc2626', fontSize: '0.76rem' }}>
                    ⚠️ HEAVY / FRAGILE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Clean A4 / 4x6 Label Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice-modal-content, #printable-invoice-modal-content * {
            visibility: visible !important;
          }
          #printable-label-modal-content, #printable-label-modal-content * {
            visibility: visible !important;
          }
          #printable-invoice-modal-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-label-modal-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 380px !important;
            margin: 0 !important;
            padding: 16px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
