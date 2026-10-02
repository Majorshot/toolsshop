import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Plus, Edit3, Trash2, ShoppingBag, DollarSign, Package, RefreshCw, RotateCcw, CheckCircle2, Phone, MessageCircle, AlertCircle, AlertTriangle, X, Search, Tag, Layers, ArrowRight, Truck, ExternalLink, Globe, Printer, Download, Percent, Wrench, FileText, Check, Calendar, ArrowUpRight, BarChart3, Clock, Copy, XCircle, Ban, Users, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Volume2, VolumeX, MapPin, LogOut, LayoutDashboard, ArrowLeft, Menu, Compass, Zap, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Barcode from '../components/Barcode';
import GstInvoiceModal from '../components/GstInvoiceModal';
import DashboardSidebar from '../components/DashboardSidebar';
import { useConfirm, SpringModal } from '../components/SpringModal';
import HoverDevCard from '../components/HoverDevCard';
import GlideSelect from '../components/GlideSelect';
import RubberSegment from '../components/RubberSegment';
import AddEquipmentModal from '../components/AddEquipmentModal';
import CourierLogo from '../components/CourierLogo';
import { getBadgeConfig } from '../components/ProductCard';
import { COURIER_PARTNERS, resolveCourierConfig, resolveCourierPartner } from '../utils/courierPartners';
import { startOverviewTour, startOrdersTour, startInventoryTour, startRepairsTour, startCancellationsTour, startCustomersTour, startCouponsTour } from '../services/tourService';

const ORDER_DATE_OPTIONS = [
  { value: 'all', label: 'All Time', tag: 'All' },
  { value: 'today', label: 'Today', tag: 'Today' },
  { value: 'yesterday', label: 'Yesterday', tag: 'Yday' },
  { value: 'week', label: 'Last 7 Days', tag: '7D' },
  { value: 'month', label: 'This Month', tag: '30D' }
];

const ORDER_DELIVERY_OPTIONS = [
  { value: 'all', label: 'All Delivery Types', tag: 'All' },
  { value: 'courier', label: 'Courier Express (Home)', tag: 'Courier' },
  { value: 'pickup', label: 'Store Counter Pickup', tag: 'Pickup' }
];

const ORDER_PAYMENT_OPTIONS = [
  { value: 'all', label: 'All Payments', tag: 'All' },
  { value: 'paid', label: 'Paid Online (UPI/Card)', tag: 'Paid' },
  { value: 'cod', label: 'Cash at Counter / COD', tag: 'COD' },
  { value: 'refunded', label: 'Refunded', tag: 'Reversed' }
];

const ORDER_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', tag: 'Recent' },
  { value: 'oldest', label: 'Oldest First', tag: 'Earliest' },
  { value: 'amount-high', label: 'Amount: High to Low', tag: 'Highest' },
  { value: 'amount-low', label: 'Amount: Low to High', tag: 'Lowest' }
];

const INVENTORY_SORT_OPTIONS = [
  { value: 'default', label: 'Default Order', tag: 'Standard' },
  { value: 'price-asc', label: 'Price: Low to High', tag: '₹ Min' },
  { value: 'price-desc', label: 'Price: High to Low', tag: '₹ Max' },
  { value: 'stock-asc', label: 'Stock: Low to High', tag: 'Low Stock' },
  { value: 'stock-desc', label: 'Stock: High to Low', tag: 'High Stock' },
  { value: 'name-asc', label: 'Alphabetical: A to Z', tag: 'A-Z' }
];

const CUSTOMER_SORT_OPTIONS = [
  { value: 'spend', label: 'Highest Lifetime Spend (₹)', tag: 'VIP' },
  { value: 'orders', label: 'Most Orders Placed', tag: 'Frequent' },
  { value: 'recent', label: 'Recently Active', tag: 'Recent' },
  { value: 'name', label: 'Alphabetical (Name)', tag: 'A-Z' }
];

const STATUS_OPTIONS = [
  'Order Placed',
  'Dispatched via Courier',
  'Ready for Pickup at Poyanil Building',
  'Completed'
];

export { COURIER_PARTNERS, resolveCourierConfig, resolveCourierPartner };

export const StoreDashboardPage = ({ onProductUpdated }) => {
  const { user, logout } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const handleStoreLogout = () => {
    confirm({
      title: "Sign Out of Store?",
      description: "Are you sure you want to sign out? You will need your store master PIN to log back in to the portal.",
      confirmText: "Sign Out",
      cancelText: "Stay Signed In",
      variant: "danger",
      iconType: "logout",
      onConfirm: () => {
        logout();
        navigate('/');
      }
    });
  };

  // Drag-to-scroll for tabs bar
  const tabsBarRef = useRef(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const dragMovedRef = useRef(false);

  const handleTabsDragStart = useCallback((e) => {
    if (!tabsBarRef.current) return;
    setIsDraggingTabs(true);
    dragMovedRef.current = false;
    dragStartRef.current = {
      x: e.pageX - tabsBarRef.current.offsetLeft,
      scrollLeft: tabsBarRef.current.scrollLeft
    };
  }, []);

  const handleTabsDragMove = useCallback((e) => {
    if (!isDraggingTabs || !tabsBarRef.current) return;
    e.preventDefault();
    const x = e.pageX - tabsBarRef.current.offsetLeft;
    const walk = (x - dragStartRef.current.x) * 1.5;
    if (Math.abs(walk) > 3) dragMovedRef.current = true;
    tabsBarRef.current.scrollLeft = dragStartRef.current.scrollLeft - walk;
  }, [isDraggingTabs]);

  const handleTabsDragEnd = useCallback(() => {
    setIsDraggingTabs(false);
  }, []);

  const statusChipsBarRef = useRef(null);
  const [isDraggingChips, setIsDraggingChips] = useState(false);
  const chipsDragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const chipsDragMovedRef = useRef(false);

  const handleChipsDragStart = useCallback((e) => {
    if (!statusChipsBarRef.current) return;
    setIsDraggingChips(true);
    chipsDragMovedRef.current = false;
    chipsDragStartRef.current = {
      x: e.pageX - statusChipsBarRef.current.offsetLeft,
      scrollLeft: statusChipsBarRef.current.scrollLeft
    };
  }, []);

  const handleChipsDragMove = useCallback((e) => {
    if (!isDraggingChips || !statusChipsBarRef.current) return;
    e.preventDefault();
    const x = e.pageX - statusChipsBarRef.current.offsetLeft;
    const walk = (x - chipsDragStartRef.current.x) * 1.5;
    if (Math.abs(walk) > 3) chipsDragMovedRef.current = true;
    statusChipsBarRef.current.scrollLeft = chipsDragStartRef.current.scrollLeft - walk;
  }, [isDraggingChips]);

  const handleChipsDragEnd = useCallback(() => {
    setIsDraggingChips(false);
  }, []);

  const scrollStatusChips = useCallback((direction) => {
    if (statusChipsBarRef.current) {
      statusChipsBarRef.current.scrollBy({
        left: direction === 'left' ? -240 : 240,
        behavior: 'smooth'
      });
    }
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTabState] = useState(() => urlTab || 'overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Keep activeTab in sync with URL query param (?tab=overview, etc.)
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
    } else if (!urlTab && activeTab !== 'overview') {
      setActiveTabState('overview');
    }
  }, [urlTab, activeTab]);

  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    setSearchParams({ tab: tabId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Customer Directory (500+ CRM) State
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customersSearch, setCustomersSearch] = useState('');
  const [customersSort, setCustomersSort] = useState('spend');
  const [selectedCustomerForModal, setSelectedCustomerForModal] = useState(null);
  const [customerOrderHistory, setCustomerOrderHistory] = useState([]);
  const [customerRepairHistory, setCustomerRepairHistory] = useState([]);
  const [loadingCustomerHistory, setLoadingCustomerHistory] = useState(false);

  // Inventory segment-based pagination for high-performance loading
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(8);

  const changeInvPage = (newPage) => {
    setInvPage(newPage);
    try {
      const el = document.getElementById('store-inventory-top');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {}
  };

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
        loadCustomers();
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

  // Trigger Driver.js Overview Tour on first visit
  useEffect(() => {
    if (activeTab === 'overview') {
      const timer = setTimeout(() => {
        startOverviewTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'orders') {
      const timer = setTimeout(() => {
        startOrdersTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'inventory') {
      const timer = setTimeout(() => {
        startInventoryTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'repairs') {
      const timer = setTimeout(() => {
        startRepairsTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'cancellations') {
      const timer = setTimeout(() => {
        startCancellationsTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'customers') {
      const timer = setTimeout(() => {
        startCustomersTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTab === 'coupons') {
      const timer = setTimeout(() => {
        startCouponsTour(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Dispatch Order Modal state
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    courierPartner: 'DTDC Express',
    awb: ''
  });

  // Store Cancel Order & Auto-Refund Modal State
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('Customer requested cancellation');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Cancellation Requests Tab State
  const [approvingCancelId, setApprovingCancelId] = useState(null);
  const [rejectingCancelId, setRejectingCancelId] = useState(null);

  // Customer Orders Smart Filtering & Sorting State
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all', 'today', 'undispatched', 'dispatched', 'pickup-pending', 'completed', 'cancel-pending', 'cancelled'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week', 'month'
  const [orderDeliveryFilter, setOrderDeliveryFilter] = useState('all'); // 'all', 'courier', 'pickup'
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all'); // 'all', 'paid', 'cod', 'refunded'
  const [orderSortFilter, setOrderSortFilter] = useState('newest'); // 'newest', 'oldest', 'amount-high', 'amount-low'

  const isOrderDateToday = (dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isOrderDateYesterday = (dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.getDate() === y.getDate() &&
           d.getMonth() === y.getMonth() &&
           d.getFullYear() === y.getFullYear();
  };

  const isOrderDateThisWeek = (dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const isOrderDateThisMonth = (dateVal) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  const isOrderCompleted = (order) => {
    if (!order) return false;
    const s = (order.status || '').toLowerCase();
    if (s === 'cancelled') return false;
    if (['delivered', 'completed'].some(w => s.includes(w))) return true;
    if (order.deliveryType === 'store-pickup' && order.handoverVerified) return true;
    return false;
  };

  const isOrderDispatched = (order) => {
    if (!order) return false;
    if (order.deliveryType === 'store-pickup') return false;
    if (isOrderCompleted(order)) return false;
    if ((order.status || '').toLowerCase() === 'cancelled') return false;
    const hasAwb = Boolean(order.awb && order.awb.trim());
    const isDisp = ['dispatched', 'shipped', 'in transit', 'out for delivery'].some(w => (order.status || '').toLowerCase().includes(w));
    return hasAwb || isDisp;
  };

  const isOrderUndispatched = (order) => {
    if (!order) return false;
    if (order.deliveryType === 'store-pickup') return false;
    if ((order.status || '').toLowerCase() === 'cancelled') return false;
    if (isOrderCompleted(order)) return false;
    return !isOrderDispatched(order);
  };

  const isOrderPickupPending = (order) => {
    if (!order) return false;
    if (isOrderCompleted(order)) return false;
    return order.deliveryType === 'store-pickup' && !order.handoverVerified && (order.status || '').toLowerCase() !== 'cancelled';
  };

  const isOrderUnattended = (order) => {
    if (!order) return false;
    const s = (order.status || '').toLowerCase();
    if (s === 'cancelled') return false;
    if (isOrderCompleted(order)) return false;
    return true;
  };

  const orderCounts = useMemo(() => {
    const list = Array.isArray(orders) ? orders.filter(Boolean) : [];
    // Only unattended orders (not completed and not cancelled) require store action or attention
    const unattendedList = list.filter(isOrderUnattended);
    const todayUnattendedList = unattendedList.filter(o => isOrderDateToday(o.createdAt || o.date));
    return {
      total: list.length,
      all: unattendedList.length,
      unattended: unattendedList.length,
      today: todayUnattendedList.length,
      undispatched: list.filter(isOrderUndispatched).length,
      dispatched: list.filter(isOrderDispatched).length,
      pickupPending: list.filter(isOrderPickupPending).length,
      completed: list.filter(isOrderCompleted).length,
      cancelPending: list.filter(o => o.cancellationRequested && (o.status || '').toLowerCase() !== 'cancelled').length,
      cancelled: list.filter(o => (o.status || '').toLowerCase() === 'cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const list = Array.isArray(orders) ? orders.filter(Boolean) : [];
    return list.filter(order => {
      // 1. Status Filter Chip
      if (orderStatusFilter === 'today') {
        if (!isOrderDateToday(order.createdAt || order.date)) return false;
        if ((order.status || '').toLowerCase() === 'cancelled') return false;
      } else if (orderStatusFilter === 'undispatched') {
        if (!isOrderUndispatched(order)) return false;
      } else if (orderStatusFilter === 'dispatched') {
        if (!isOrderDispatched(order)) return false;
      } else if (orderStatusFilter === 'pickup-pending') {
        if (!isOrderPickupPending(order)) return false;
      } else if (orderStatusFilter === 'completed') {
        if (!isOrderCompleted(order)) return false;
      } else if (orderStatusFilter === 'cancel-pending') {
        if (!order.cancellationRequested || (order.status || '').toLowerCase() === 'cancelled') return false;
      } else if (orderStatusFilter === 'cancelled') {
        if ((order.status || '').toLowerCase() !== 'cancelled') return false;
      }

      // 2. Date Filter Dropdown
      if (orderDateFilter === 'today') {
        if (!isOrderDateToday(order.createdAt || order.date)) return false;
      } else if (orderDateFilter === 'yesterday') {
        if (!isOrderDateYesterday(order.createdAt || order.date)) return false;
      } else if (orderDateFilter === 'week') {
        if (!isOrderDateThisWeek(order.createdAt || order.date)) return false;
      } else if (orderDateFilter === 'month') {
        if (!isOrderDateThisMonth(order.createdAt || order.date)) return false;
      }

      // 3. Delivery Method Filter
      if (orderDeliveryFilter === 'courier') {
        if (order.deliveryType === 'store-pickup') return false;
      } else if (orderDeliveryFilter === 'pickup') {
        if (order.deliveryType !== 'store-pickup') return false;
      }

      // 4. Payment Filter
      if (orderPaymentFilter === 'paid') {
        if (order.paymentStatus !== 'PAID') return false;
      } else if (orderPaymentFilter === 'cod') {
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') return false;
      } else if (orderPaymentFilter === 'refunded') {
        if (order.paymentStatus !== 'REFUNDED') return false;
      }

      // 5. Search Query Filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchesId = (order.id || '').toLowerCase().includes(q);
        const matchesName = (order.customer?.name || '').toLowerCase().includes(q);
        const cleanPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
        const cleanQ = q.replace(/[^0-9]/g, '');
        const matchesPhone = (cleanQ && cleanPhone.includes(cleanQ)) || (order.customer?.phone || '').toLowerCase().includes(q);
        const matchesEmail = (order.customer?.email || '').toLowerCase().includes(q);
        const matchesCity = (order.customer?.city || '').toLowerCase().includes(q);
        const matchesDistrict = (order.customer?.district || '').toLowerCase().includes(q);
        const matchesAwb = (order.awb || '').toLowerCase().includes(q);
        const matchesCourier = (order.courierPartner || '').toLowerCase().includes(q);
        const matchesItem = (order.items || []).some(item => 
          (item.name || '').toLowerCase().includes(q) || 
          (item.model || '').toLowerCase().includes(q)
        );
        if (!matchesId && !matchesName && !matchesPhone && !matchesEmail && !matchesCity && !matchesDistrict && !matchesAwb && !matchesCourier && !matchesItem) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (orderSortFilter === 'oldest') {
        return new Date(a.createdAt || a.date || 0) - new Date(b.createdAt || b.date || 0);
      }
      if (orderSortFilter === 'amount-high') {
        return (Number(b.total) || 0) - (Number(a.total) || 0);
      }
      if (orderSortFilter === 'amount-low') {
        return (Number(a.total) || 0) - (Number(b.total) || 0);
      }
      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
    });
  }, [orders, orderStatusFilter, orderSearchQuery, orderDateFilter, orderDeliveryFilter, orderPaymentFilter, orderSortFilter]);

  const handleResetOrderFilters = () => {
    setOrderStatusFilter('all');
    setOrderSearchQuery('');
    setOrderDateFilter('all');
    setOrderDeliveryFilter('all');
    setOrderPaymentFilter('all');
    setOrderSortFilter('newest');
  };

  const hasActiveOrderFilters = 
    orderStatusFilter !== 'all' ||
    orderSearchQuery.trim() !== '' ||
    orderDateFilter !== 'all' ||
    orderDeliveryFilter !== 'all' ||
    orderPaymentFilter !== 'all' ||
    orderSortFilter !== 'newest';

  const pendingCancellationRequests = orders.filter(
    o => o.cancellationRequested && (o.status || '').toLowerCase() !== 'cancelled'
  );

  const handleApproveCancellationRequest = async (order) => {
    setApprovingCancelId(order.id);
    try {
      const res = await api.cancelOrder(order.id, {
        reason: order.cancellationRequestReason || 'Customer cancellation request approved by store',
        cancelledBy: 'store'
      });
      showNotification(res.message || `Order ${order.id} cancelled & refund processed!`);
      try {
        const bc = new BroadcastChannel('vpt_orders_channel');
        bc.postMessage({ type: 'ORDER_UPDATED', orderId: order.id });
        bc.close();
      } catch (e) {}
      loadOrders();
      loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Failed: ${err.message}`);
    } finally {
      setApprovingCancelId(null);
    }
  };

  const handleRejectCancellationRequest = async (order) => {
    setRejectingCancelId(order.id);
    try {
      const res = await api.rejectCancellation(order.id);
      showNotification(res.message || `Cancellation request for ${order.id} rejected.`);
      try {
        const bc = new BroadcastChannel('vpt_orders_channel');
        bc.postMessage({ type: 'ORDER_UPDATED', orderId: order.id });
        bc.close();
      } catch (e) {}
      loadOrders();
    } catch (err) {
      showNotification(`Failed: ${err.message}`);
    } finally {
      setRejectingCancelId(null);
    }
  };

  const handleConfirmStoreCancel = async () => {
    if (!orderToCancel) return;
    setIsCancellingOrder(true);
    try {
      const res = await api.cancelOrder(orderToCancel.id, {
        reason: cancelReasonInput || 'Cancelled by store manager',
        cancelledBy: 'store'
      });
      showNotification(res.message || `Order ${orderToCancel.id} cancelled successfully!`);
      setOrderToCancel(null);
      loadOrders();
      loadProducts();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      alert(`Failed to cancel order: ${err.message}`);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const handleConfirmDispatch = async (e) => {
    if (e) e.preventDefault();
    if (!dispatchModalOrder) return;
    const partner = dispatchForm.courierPartner || 'DTDC Express';
    const cfg = resolveCourierConfig(partner);
    const finalAwb = dispatchForm.awb.trim() || cfg.generateAwb();

    try {
      await api.updateOrderStatus(dispatchModalOrder.id, 'Dispatched via Courier', {
        courierPartner: partner,
        awb: finalAwb
      });
      showNotification(`Order ${dispatchModalOrder.id} dispatched via ${partner}! (AWB: ${finalAwb})`);
      setDispatchModalOrder(null);
      loadOrders();
    } catch (err) {
      alert(err.message);
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

  // Dynamic Taxonomy State (Brands & Categories from MongoDB Atlas)
  const [taxonomy, setTaxonomy] = useState({
    brands: [],
    categories: []
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

  // Brand & Category Inline Editing state
  const [editingBrandName, setEditingBrandName] = useState(null);
  const [editBrandInput, setEditBrandInput] = useState('');
  const [isUpdatingBrand, setIsUpdatingBrand] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCatNameInput, setEditCatNameInput] = useState('');
  const [editCatSlugInput, setEditCatSlugInput] = useState('');
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

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
  const [repairsSearch, setRepairsSearch] = useState('');
  const [isAddRepairModalOpen, setIsAddRepairModalOpen] = useState(false);
  const [repairForm, setRepairForm] = useState({
    customerName: '',
    customerPhone: '',
    toolBrand: 'Bosch',
    customBrand: '',
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
  const [editingRepairJob, setEditingRepairJob] = useState(null);
  const [editRepairForm, setEditRepairForm] = useState({
    estimatedCost: '',
    advancePaid: '',
    technicianNotes: '',
    sendWhatsApp: true
  });
  const [isSubmittingEditRepair, setIsSubmittingEditRepair] = useState(false);

  // Invoice & Shipping Label Printing State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [selectedOrderForLabel, setSelectedOrderForLabel] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Inline Stock & Price Editing
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [savingPriceId, setSavingPriceId] = useState(null);
  const [steppingStockId, setSteppingStockId] = useState(null);

  // Low Stock Hub
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Revenue Analytics Period Filter
  const [analyticsPeriod, setAnalyticsPeriod] = useState('all'); // 'all' | 'month' | 'week' | 'today'

  // Space Optimizer: Collapsible Analytics Mode
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(() => {
    const saved = localStorage.getItem('vpt_analytics_collapsed');
    return saved !== null ? saved === 'true' : false;
  });

  // Orders Display Mode: 'cards' or 'table'
  const [ordersViewMode, setOrdersViewMode] = useState(() => {
    return localStorage.getItem('vpt_orders_view_mode') || 'cards';
  });

  // Live Auto-Refresh & Audio Notification
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrdersCountRef = useRef(null);
  const prevCancelRequestsCountRef = useRef(null);
  const [revealedOtps, setRevealedOtps] = useState({});

  const toggleRevealOtp = (orderId) => {
    setRevealedOtps(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  // Quick Counter Pickup OTP Lookup
  const [quickOtpInput, setQuickOtpInput] = useState('');
  const [quickOtpMatchedOrder, setQuickOtpMatchedOrder] = useState(null);

  const playOrderChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  }, []);

  const playCancelChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(493.88, now); // B4
      osc.frequency.setValueAtTime(369.99, now + 0.14); // F#4
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Cancel chime notice:', e);
    }
  }, []);

  const handleQuickOtpChange = (val) => {
    setQuickOtpInput(val);
    const clean = val.trim();
    if (clean.length >= 3) {
      const matched = orders.find(o => 
        o.deliveryType === 'store-pickup' && 
        (o.status || '').toLowerCase() !== 'cancelled' &&
        String(o.pickupOtp || '').trim() === clean
      );
      setQuickOtpMatchedOrder(matched || null);
    } else {
      setQuickOtpMatchedOrder(null);
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadOrders({ silent: true });
      loadProducts({ silent: true });
      loadRepairs({ silent: true });
    }, 10000); // Live sync: polling orders, inventory stock & repairs every 10s

    let ordersBc = null;
    let invBc = null;
    try {
      ordersBc = new BroadcastChannel('vpt_orders_channel');
      ordersBc.onmessage = (event) => {
        if (event.data?.type === 'CANCEL_REQUESTED' || event.data?.type === 'ORDER_UPDATED' || event.data?.type === 'ORDER_PLACED') {
          loadOrders({ silent: true });
          loadProducts({ silent: true });
        }
      };

      invBc = new BroadcastChannel('vpt_inventory_channel');
      invBc.onmessage = (event) => {
        const data = event.data;
        if (!data) return;
        if (data.type === 'PRODUCT_ADDED' && data.product) {
          setProducts(prev => [data.product, ...prev.filter(p => (p.id || p._id) !== (data.product.id || data.product._id))]);
        } else if (data.type === 'PRODUCT_UPDATED' && data.product) {
          const updId = data.product.id || data.product._id;
          setProducts(prev => prev.map(p => (p.id === updId || p._id === updId) ? { ...p, ...data.product } : p));
        } else if (data.type === 'PRODUCT_DELETED') {
          const delId = data.productId;
          const customId = data.customId;
          const mongoId = data.mongoId;
          setProducts(prev => prev.filter(p => {
            if (delId && (p.id === delId || p._id === delId)) return false;
            if (customId && (p.id === customId || p._id === customId)) return false;
            if (mongoId && (p.id === mongoId || p._id === mongoId)) return false;
            return true;
          }));
        } else {
          loadProducts({ silent: true });
        }
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (ordersBc) ordersBc.close();
      if (invBc) invBc.close();
    };
  }, [autoRefresh, soundEnabled]);

  useEffect(() => {
    if (!user || user.role !== 'store') {
      navigate('/login');
      return;
    }
    loadOrders();
    loadProducts();
    loadTaxonomy();
    loadCoupons();
    loadRepairs();
    loadCustomers();
  }, [user]);

  // Keep selectedOrderForDetails in sync whenever orders list updates
  useEffect(() => {
    if (selectedOrderForDetails) {
      const updated = orders.find(o => o.id === selectedOrderForDetails.id);
      if (updated) {
        setSelectedOrderForDetails(updated);
      }
    }
  }, [orders]);

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
      const res = await api.addBrand(clean);
      const brandName = res.brand || clean;

      // Immediately update taxonomy in state so it shows in the dropdown right away!
      setTaxonomy(prev => {
        const existing = prev.brands || [];
        if (existing.some(b => b.toLowerCase() === brandName.toLowerCase())) {
          return res.brands ? { ...prev, brands: res.brands } : prev;
        }
        return {
          ...prev,
          brands: res.brands || [...existing, brandName]
        };
      });

      // Instantly select the newly added brand in the form
      setProductForm(prev => ({ ...prev, brand: brandName }));
      setNewBrandInput('');
      setShowAddBrandInline(false);
      showNotification(`Brand "${brandName}" added successfully!`);

      // Refresh taxonomy from server with cache-busting
      await loadTaxonomy();
      if (onProductUpdated) onProductUpdated();
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
      const createdCat = res.category || { id: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: clean };
      const createdId = createdCat.id;

      // Immediately update taxonomy in state so it shows in the dropdown right away!
      setTaxonomy(prev => {
        const existing = prev.categories || [];
        if (existing.some(c => c.id === createdId || c.name.toLowerCase() === clean.toLowerCase())) {
          return res.categories ? { ...prev, categories: res.categories } : prev;
        }
        return {
          ...prev,
          categories: res.categories || [...existing, createdCat]
        };
      });

      // Instantly select the newly added category in the form
      setProductForm(prev => ({ ...prev, category: createdId }));
      setNewCatNameInput('');
      setShowAddCatInline(false);
      showNotification(`Category "${clean}" added successfully!`);

      // Refresh taxonomy from server with cache-busting
      await loadTaxonomy();
      if (onProductUpdated) onProductUpdated();
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
      const res = await api.addBrand(clean);
      const brandName = res.brand || clean;
      setTaxonomy(prev => ({
        ...prev,
        brands: res.brands || [...(prev.brands || []).filter(b => b.toLowerCase() !== brandName.toLowerCase()), brandName]
      }));
      showNotification(`Brand "${brandName}" added to catalog!`);
      setManagerNewBrand('');
      await loadTaxonomy();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  const handleAddCategoryManager = async (e) => {
    if (e) e.preventDefault();
    const clean = managerNewCatName.trim();
    if (!clean) return;
    try {
      const res = await api.addCategory({ name: clean });
      const createdCat = res.category || { id: clean.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: clean };
      setTaxonomy(prev => ({
        ...prev,
        categories: res.categories || [...(prev.categories || []).filter(c => c.id !== createdCat.id), createdCat]
      }));
      showNotification(`Category "${clean}" added to catalog!`);
      setManagerNewCatName('');
      await loadTaxonomy();
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    }
  };

  // Inline Brand Editing Handlers
  const handleStartEditBrand = (brandName) => {
    setEditingBrandName(brandName);
    setEditBrandInput(brandName);
  };

  const handleCancelEditBrand = () => {
    setEditingBrandName(null);
    setEditBrandInput('');
  };

  const handleSaveEditBrand = async (oldName) => {
    const cleanNew = editBrandInput.trim();
    if (!cleanNew) {
      showNotification('Brand name cannot be empty');
      return;
    }
    if (cleanNew.toLowerCase() === oldName.toLowerCase()) {
      handleCancelEditBrand();
      return;
    }
    setIsUpdatingBrand(true);
    try {
      const res = await api.updateBrand(oldName, cleanNew);
      const newBrands = res.brands || (taxonomy.brands || []).map(b => b.toLowerCase() === oldName.toLowerCase() ? cleanNew : b);
      setTaxonomy(prev => ({ ...prev, brands: newBrands }));
      setProducts(prev => prev.map(p => (p.brand || '').toLowerCase() === oldName.toLowerCase() ? { ...p, brand: cleanNew } : p));
      showNotification(`Brand "${oldName}" updated to "${cleanNew}"!`);
      handleCancelEditBrand();
      await loadTaxonomy();
      await loadProducts({ silent: true });
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Update error: ${err.message}`);
    } finally {
      setIsUpdatingBrand(false);
    }
  };

  // Inline Category Editing Handlers
  const handleStartEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditCatNameInput(cat.name);
    setEditCatSlugInput(cat.id);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCatNameInput('');
    setEditCatSlugInput('');
  };

  const handleSaveEditCategory = async (oldId) => {
    const cleanName = editCatNameInput.trim();
    const cleanSlug = (editCatSlugInput.trim() || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')).trim();
    if (!cleanName) {
      showNotification('Category name cannot be empty');
      return;
    }
    setIsUpdatingCat(true);
    try {
      const res = await api.updateCategory(oldId, { name: cleanName, newId: cleanSlug });
      const updatedCat = res.category || { id: cleanSlug, name: cleanName };
      setTaxonomy(prev => ({
        ...prev,
        categories: res.categories || (prev.categories || []).map(c => c.id === oldId ? updatedCat : c)
      }));
      if (oldId !== cleanSlug) {
        setProducts(prev => prev.map(p => p.category === oldId ? { ...p, category: cleanSlug } : p));
      }
      showNotification(`Category "${cleanName}" updated successfully!`);
      handleCancelEditCategory();
      await loadTaxonomy();
      await loadProducts({ silent: true });
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Update error: ${err.message}`);
    } finally {
      setIsUpdatingCat(false);
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
      const res = await api.deleteBrand(brandToDelete.name, deleteProducts);
      if (res && res.brands) {
        setTaxonomy(prev => ({ ...prev, brands: res.brands }));
      } else {
        setTaxonomy(prev => ({
          ...prev,
          brands: (prev.brands || []).filter(b => b.toLowerCase() !== brandToDelete.name.toLowerCase())
        }));
      }
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
      const res = await api.deleteCategory(categoryToDelete.id, deleteProducts);
      if (res && res.categories) {
        setTaxonomy(prev => ({ ...prev, categories: res.categories }));
      } else {
        setTaxonomy(prev => ({
          ...prev,
          categories: (prev.categories || []).filter(c => c.id !== categoryToDelete.id)
        }));
      }
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
    const targetId = productToDelete.id || productToDelete._id;
    const customId = productToDelete.id;
    const mongoId = productToDelete._id;
    const deletedName = productToDelete.name;

    // Instant optimistic removal from UI: disappears immediately with zero lag or page reload
    setProducts(prev => prev.filter(p => {
      const matchCustom = customId && (p.id === customId || p._id === customId);
      const matchMongo = mongoId && (p.id === mongoId || p._id === mongoId);
      const matchTarget = targetId && (p.id === targetId || p._id === targetId);
      return !matchCustom && !matchMongo && !matchTarget;
    }));
    setProductToDelete(null);

    try {
      await api.deleteProduct(targetId);
      showNotification(`Deleted "${deletedName}" from store catalog!`);

      // Broadcast real-time deletion to all other browser tabs and storefront
      try {
        const bc = new BroadcastChannel('vpt_inventory_channel');
        bc.postMessage({ type: 'PRODUCT_DELETED', productId: targetId, customId, mongoId });
        bc.close();
      } catch (e) {}

      loadProducts({ silent: true });
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      showNotification(`Delete failed: ${err.message}`);
      loadProducts({ silent: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const loadOrders = async (options = {}) => {
    const isSilent = Boolean(options && options.silent);
    if (!isSilent) setLoadingOrders(true);
    try {
      const res = await api.getOrders();
      const list = Array.isArray(res) ? res : (res.data || []);
      
      // Check for incoming new orders
      if (prevOrdersCountRef.current !== null && list.length > prevOrdersCountRef.current && soundEnabled) {
        playOrderChime();
        showNotification('🔔 New customer order received!');
      }
      prevOrdersCountRef.current = list.length;

      // Check for incoming cancellation requests live
      const currentCancelReqs = list.filter(o => o.cancellationRequested && (o.status || '').toLowerCase() !== 'cancelled');
      if (prevCancelRequestsCountRef.current !== null && currentCancelReqs.length > prevCancelRequestsCountRef.current && soundEnabled) {
        playCancelChime();
        showNotification(`⚠️ New cancellation request for order ${currentCancelReqs[0]?.id || ''}!`);
      }
      prevCancelRequestsCountRef.current = currentCancelReqs.length;

      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingOrders(false);
    }
  };

  const loadProducts = async (options = {}) => {
    const isSilent = Boolean(options && options.silent);
    if (!isSilent) setLoadingProducts(true);
    try {
      const res = await api.getProducts();
      setProducts(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingProducts(false);
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

  const loadRepairs = async (options = {}) => {
    const isSilent = Boolean(options && options.silent);
    if (!isSilent) setLoadingRepairs(true);
    try {
      const res = await api.getRepairJobs();
      const raw = Array.isArray(res) ? res : (res.data || []);
      // Client-side auto-heal: if a job was handed over / handoverVerified, ensure status is "Handed Over"
      const cleaned = raw.map(j => {
        if (j.handoverVerified && j.status !== 'Handed Over') {
          api.updateRepairJob(j.id || j.jobId || j._id, { status: 'Handed Over' }).catch(() => {});
          return { ...j, status: 'Handed Over' };
        }
        return j;
      });
      setRepairs(cleaned);
    } catch (err) {
      console.error("Failed to load repairs:", err);
    } finally {
      if (!isSilent) setLoadingRepairs(false);
    }
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.getCustomers({ limit: 200 });
      setCustomers(res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleOpenCustomerHistoryModal = async (cust) => {
    setSelectedCustomerForModal(cust);
    setLoadingCustomerHistory(true);
    try {
      const res = await api.getCustomer(cust._id || cust.phone);
      if (res && res.data) {
        setCustomerOrderHistory(res.data.orders || []);
        setCustomerRepairHistory(res.data.repairs || []);
      } else {
        const ords = orders.filter(o => {
          const ph = (o.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return ph === (cust.phone || '').slice(-10);
        });
        const reps = repairs.filter(r => {
          const ph = (r.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
          return ph === (cust.phone || '').slice(-10);
        });
        setCustomerOrderHistory(ords);
        setCustomerRepairHistory(reps);
      }
    } catch (err) {
      console.warn("Could not load full customer profile from API, using cached:", err.message);
      const ords = orders.filter(o => {
        const ph = (o.customer?.phone || '').replace(/[^0-9]/g, '').slice(-10);
        return ph === (cust.phone || '').slice(-10);
      });
      const reps = repairs.filter(r => {
        const ph = (r.customerPhone || '').replace(/[^0-9]/g, '').slice(-10);
        return ph === (cust.phone || '').slice(-10);
      });
      setCustomerOrderHistory(ords);
      setCustomerRepairHistory(reps);
    } finally {
      setLoadingCustomerHistory(false);
    }
  };

  // Feature 2: Inline Stock Stepper
  const handleQuickStockStep = async (product, delta) => {
    const currentStock = typeof product.stock === 'number' ? product.stock : 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    const prodId = product.id || product._id;

    // Optimistic instant state update
    setProducts(prev => prev.map(p => (p.id === prodId || p._id === prodId) ? { ...p, stock: newStock } : p));
    setSteppingStockId(prodId);

    try {
      await api.updateProduct(prodId, { stock: newStock });
      showNotification(`Stock for "${product.name.slice(0, 20)}..." updated to ${newStock}`);

      // Broadcast stock update
      try {
        const bc = new BroadcastChannel('vpt_inventory_channel');
        bc.postMessage({ type: 'PRODUCT_UPDATED', product: { ...product, stock: newStock } });
        bc.close();
      } catch (e) {}

      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      // Revert on error
      setProducts(prev => prev.map(p => (p.id === prodId || p._id === prodId) ? { ...p, stock: currentStock } : p));
      showNotification(`Failed to update stock: ${err.message}`);
    } finally {
      setSteppingStockId(null);
    }
  };

  // Feature 2: Inline Price Edit
  const handleStartEditingPrice = (product) => {
    setEditingPriceId(product.id || product._id);
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
      setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, price: numericPrice } : p));
      showNotification(`Price updated to ₹${numericPrice.toLocaleString('en-IN')}`);
      setEditingPriceId(null);

      // Broadcast price update
      try {
        const bc = new BroadcastChannel('vpt_inventory_channel');
        bc.postMessage({ type: 'PRODUCT_UPDATED', product: { id: productId, price: numericPrice } });
        bc.close();
      } catch (e) {}

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

  const handleDeleteCoupon = (coupon) => {
    confirm({
      title: `Delete Coupon "${coupon.code}"?`,
      description: "Customers will no longer be able to use this promotional discount code at checkout. This cannot be undone.",
      confirmText: "Delete Coupon",
      cancelText: "Keep Coupon",
      variant: "danger",
      iconType: "trash",
      onConfirm: async () => {
        try {
          const targetId = coupon.id || coupon._id;
          await api.deleteCoupon(targetId);
          showNotification(`Coupon "${coupon.code}" deleted.`);
          loadCoupons();
        } catch (err) {
          showNotification(`Error: ${err.message}`);
        }
      }
    });
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
    const finalBrand = repairForm.toolBrand === 'Other'
      ? (repairForm.customBrand?.trim() || 'Other Brand')
      : (repairForm.toolBrand || 'Bosch');

    setIsSubmittingRepair(true);
    try {
      const res = await api.createRepairJob({
        customerName: repairForm.customerName.trim(),
        customerPhone: repairForm.customerPhone.trim(),
        toolBrand: finalBrand,
        toolModel: repairForm.toolModel.trim(),
        serialNumber: repairForm.serialNumber.trim(),
        issueDescription: repairForm.issueDescription.trim(),
        estimatedCost: Number(repairForm.estimatedCost) || 0,
        advancePaid: Number(repairForm.advancePaid) || 0,
        technicianNotes: repairForm.technicianNotes.trim()
      });
      showNotification(`🛠️ Repair Job #${res.job?.jobId || 'created'} logged! WhatsApp confirmation sent to customer.`);
      setIsAddRepairModalOpen(false);
      setRepairForm({
        customerName: '',
        customerPhone: '',
        toolBrand: 'Bosch',
        customBrand: '',
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
    // Prevent accidental status changes on tickets already handed over to the customer
    if (job.handoverVerified || job.status === 'Handed Over') {
      showNotification('ℹ️ This repair ticket has already been handed over to the customer.');
      return;
    }

    try {
      const targetId = job.id || job.jobId || job._id;
      await api.updateRepairJob(targetId, { status: newStatus });
      if (newStatus === 'Repaired & Ready') {
        showNotification(`✅ Marked as "Repaired & Ready"! Collection OTP automatically dispatched to customer via WhatsApp.`);
      } else {
        showNotification(`Repair #${job.jobId} updated to "${newStatus}"`);
      }
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
      showNotification(`✅ Handover verified! Digital delivery receipt & service warranty sent to ${job.customerName} via WhatsApp.`);
      setRepairOtpInputs(prev => ({ ...prev, [targetId]: '' }));
      loadRepairs();
    } catch (err) {
      showNotification(`❌ ${err.message}`);
    } finally {
      setVerifyingRepairId(null);
    }
  };

  const handleDeleteRepair = (job) => {
    confirm({
      title: `Delete Repair #${job.jobId}?`,
      description: `Are you sure you want to permanently delete service job #${job.jobId} for "${job.toolModel}"?`,
      confirmText: "Delete Record",
      cancelText: "Cancel",
      variant: "danger",
      iconType: "trash",
      onConfirm: async () => {
        try {
          const targetId = job.id || job.jobId || job._id;
          await api.deleteRepairJob(targetId);
          showNotification(`Repair #${job.jobId} deleted.`);
          loadRepairs();
        } catch (err) {
          showNotification(`Error: ${err.message}`);
        }
      }
    });
  };

  const handleOpenEditRepair = (job) => {
    setEditingRepairJob(job);
    setEditRepairForm({
      estimatedCost: job.finalCost || job.estimatedCost || '',
      advancePaid: job.advancePaid || '',
      technicianNotes: job.technicianNotes || '',
      sendWhatsApp: true
    });
  };

  const handleSaveEditRepair = async (e) => {
    if (e) e.preventDefault();
    if (!editingRepairJob) return;
    const targetId = editingRepairJob.id || editingRepairJob.jobId || editingRepairJob._id;
    setIsSubmittingEditRepair(true);
    try {
      const costNum = Number(editRepairForm.estimatedCost) || 0;
      const advNum = Number(editRepairForm.advancePaid) || 0;
      await api.updateRepairJob(targetId, {
        estimatedCost: costNum,
        finalCost: costNum,
        advancePaid: advNum,
        technicianNotes: editRepairForm.technicianNotes.trim(),
        sendWhatsAppUpdate: Boolean(editRepairForm.sendWhatsApp)
      });
      showNotification(`✅ Repair bill & parts updated! ${editRepairForm.sendWhatsApp ? 'WhatsApp notification sent to customer.' : ''}`);
      setEditingRepairJob(null);
      loadRepairs();
    } catch (err) {
      showNotification(`Error: ${err.message}`);
    } finally {
      setIsSubmittingEditRepair(false);
    }
  };

  const getWhatsAppRepairText = (job) => {
    const isJobHandedOver = Boolean(job.handoverVerified) || job.status === 'Handed Over';
    const cleanPhone = (job.customerPhone || '').replace(/[^0-9]/g, '');
    let text = `Hello ${job.customerName},\n`;
    text += `Update regarding your tool repair at *Variathu Power Tools Kozhencherry*:\n\n`;
    text += `🔧 *Tool:* ${job.toolBrand ? job.toolBrand + ' ' : ''}${job.toolModel}\n`;
    text += `📋 *Job Ticket:* ${job.jobId}\n`;
    text += `🚦 *Status:* ${isJobHandedOver ? 'HANDED OVER & CLOSED' : (job.status || '').toUpperCase()}\n`;
    if (isJobHandedOver) {
      const finalBill = Number(job.finalCost || job.estimatedCost || 0);
      const advance = Number(job.advancePaid || 0);
      const balance = Math.max(0, finalBill - advance);
      text += `✅ *Machine Delivered & Collected!* 🛠️\n`;
      text += `💰 *Total Bill:* ₹${finalBill.toLocaleString('en-IN')}\n`;
      if (advance > 0) text += `💵 *Advance Paid:* ₹${advance.toLocaleString('en-IN')}\n`;
      if (balance > 0) text += `💵 *Balance Settled:* ₹${balance.toLocaleString('en-IN')}\n`;
      text += `🛡️ *Service Guarantee:* Covered under workshop warranty on replaced parts.\n\n`;
      text += `Thank you for trusting Variathu Power Tools, Poyanil Building, Kozhencherry!`;
    } else if (job.status === 'Repaired & Ready') {
      text += `✅ *Diagnosis / Work Done:* ${job.technicianNotes || 'Servicing, parts fitting & safety testing completed'}\n`;
      text += `💰 *Bill Amount:* ₹${(job.finalCost || job.estimatedCost || 0).toLocaleString('en-IN')}`;
      if (job.advancePaid) text += ` (Advance Paid: ₹${job.advancePaid.toLocaleString('en-IN')})`;
      text += `\n🔐 *Counter Collection OTP:* ${job.handoverOtp || '4819'}\n\n`;
      text += `Please visit our counter at Poyanil Building, Poyanil Junction, Kozhencherry to collect your tested equipment.`;
    } else {
      text += `We have received your machinery at our workshop. Our technician is inspecting the equipment.\n`;
      if (job.technicianNotes) text += `📝 *Diagnosis / Spare Parts:* ${job.technicianNotes}\n`;
      if (job.finalCost || job.estimatedCost) {
        text += `💰 *Current Estimate:* ₹${(job.finalCost || job.estimatedCost).toLocaleString('en-IN')}`;
        if (job.advancePaid) text += ` (Advance Paid: ₹${job.advancePaid.toLocaleString('en-IN')})`;
        text += `\n`;
      }
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const filteredRepairs = useMemo(() => {
    if (!repairsSearch.trim()) return repairs;
    const q = repairsSearch.trim().toLowerCase();
    const digits = q.replace(/[^0-9]/g, '');
    return repairs.filter(job => {
      const nameMatch = (job.customerName || '').toLowerCase().includes(q);
      const phoneMatch = digits && (job.customerPhone || '').replace(/[^0-9]/g, '').includes(digits);
      const modelMatch = (job.toolModel || '').toLowerCase().includes(q);
      const brandMatch = (job.toolBrand || '').toLowerCase().includes(q);
      const idMatch = (job.jobId || '').toLowerCase().includes(q);
      return nameMatch || phoneMatch || modelMatch || brandMatch || idMatch;
    });
  }, [repairs, repairsSearch]);

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
      'AWB / Tracking',
      'Cancellation Reason'
    ];

    const rows = orders.map(o => {
      const total = Number(o.totalAmount || 0);
      const delivery = Number(o.deliveryFee !== undefined ? o.deliveryFee : (o.deliveryType && o.deliveryType !== 'store-pickup' ? 120 : 0));
      const productTotal = Math.max(0, total - delivery);
      const taxable = Math.round(productTotal / 1.18);
      const cgst = Math.round((productTotal - taxable) / 2);
      const sgst = productTotal - taxable - cgst;
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
        o.awb || o.pickupOtp || 'N/A',
        `"${(o.cancellationReason || o.cancellationRequestReason || '').replace(/"/g, '""')}"`
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
    const targetOrder = orders.find(o => o.id === orderId);
    if (newStatus.toLowerCase().includes('dispatch') && targetOrder && targetOrder.deliveryType !== 'store-pickup') {
      const cfg = resolveCourierConfig(targetOrder.courierPartner);
      setDispatchForm({
        courierPartner: cfg.name,
        awb: targetOrder.awb || ''
      });
      setDispatchModalOrder(targetOrder);
      return;
    }

    try {
      await api.updateOrderStatus(orderId, newStatus);
      showNotification(`Order ${orderId} updated to "${newStatus}"`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setSelectedOrderForDetails(prev => prev && prev.id === orderId ? { ...prev, status: newStatus } : prev);
      loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = handleUpdateOrderStatus;

  const handleSaveProduct = async (payloadOrEvent, productBeingEdited = null, shouldAddAnother = false) => {
    try {
      let payload;
      let targetEditingProduct = productBeingEdited !== null ? productBeingEdited : editingProduct;

      if (payloadOrEvent && typeof payloadOrEvent === 'object' && !payloadOrEvent.preventDefault && payloadOrEvent.name) {
        payload = payloadOrEvent;
      } else {
        if (payloadOrEvent && payloadOrEvent.preventDefault) payloadOrEvent.preventDefault();
        const rawImgs = Array.isArray(productForm.images) ? productForm.images : [productForm.image];
        const cleanedImages = rawImgs.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean);
        const primaryImage = cleanedImages[0] || productForm.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';

        payload = {
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
      }

      let savedProduct = null;
      if (targetEditingProduct) {
        const editId = targetEditingProduct.id || targetEditingProduct._id;
        const res = await api.updateProduct(editId, payload);
        savedProduct = (res && res.data) ? res.data : { ...targetEditingProduct, ...payload };
        // Immediate in-place state update: no reload needed
        setProducts(prev => prev.map(p => (p.id === editId || p._id === editId) ? { ...p, ...savedProduct } : p));
        showNotification(`Updated tool "${payload.name}" successfully!`);
      } else {
        const res = await api.createProduct(payload);
        savedProduct = (res && res.data) ? res.data : { ...payload, id: `vpt-${Date.now()}` };
        // Immediate prepend to the inventory list so it appears right at the top
        setProducts(prev => [savedProduct, ...prev.filter(p => (p.id || p._id) !== (savedProduct.id || savedProduct._id))]);
        setInvPage(1); // Jump to page 1 to see the new equipment
        showNotification(`Added tool "${payload.name}" to inventory!`);
      }

      if (!shouldAddAnother) {
        setIsAddModalOpen(false);
        setEditingProduct(null);
      }

      // Broadcast live addition/edit to other open tabs and shop storefront
      try {
        const bc = new BroadcastChannel('vpt_inventory_channel');
        bc.postMessage({ type: targetEditingProduct ? 'PRODUCT_UPDATED' : 'PRODUCT_ADDED', product: savedProduct });
        bc.close();
      } catch (e) {}

      // Silent background sync
      loadProducts({ silent: true });
      if (onProductUpdated) onProductUpdated();
      return savedProduct;
    } catch (err) {
      alert(err.message);
      throw err;
    }
  };

  const openEditProduct = async (prod) => {
    setEditingProduct(prod);
    setShowAddBrandInline(false);
    setShowAddCatInline(false);
    setIsAddModalOpen(true);

    // Asynchronously fetch complete product document from API to ensure all image URLs are loaded
    try {
      const res = await api.getProduct(prod.id);
      const fullProd = res?.data || res;
      if (fullProd) {
        setEditingProduct(prev => prev && (prev.id === prod.id || prev._id === prod.id) ? { ...prev, ...fullProd } : prev);
      }
    } catch (err) {
      console.warn("Could not fetch full product details for edit:", err.message);
    }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setShowAddBrandInline(false);
    setShowAddCatInline(false);
    setIsAddModalOpen(true);
  };

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  // Helper to determine if an order was cancelled or refunded
  const isCancelledOrder = (o) => {
    if (!o) return false;
    const st = (o.status || '').toLowerCase();
    const ps = (o.paymentStatus || '').toUpperCase();
    return st.includes('cancel') || st.includes('refund') || ps === 'REFUNDED' || ps === 'CANCELLED' || o.isCancelled === true;
  };

  // Helper to determine if order was paid online / digital (UPI, Razorpay, Netbanking, Cards)
  const isOnlinePayment = (o) => {
    if (!o) return false;
    const pm = (o.paymentMethod || '').toUpperCase();
    if (['UPI', 'RAZORPAY', 'CARD', 'NETBANKING', 'ONLINE', 'PREPAID', 'WALLET'].some(k => pm.includes(k))) return true;
    if (o.transactionId && !String(o.transactionId).startsWith('COD')) return true;
    if (o.razorpayPaymentId || o.razorpayOrderId || o.refundId) return true;
    if ((o.paymentStatus === 'PAID' || o.paymentStatus === 'REFUNDED') && !['COD', 'CASH', 'PAY_AT_STORE', 'COUNTER'].some(k => pm.includes(k))) {
      return true;
    }
    return false;
  };

  const totalRevenue = orders.filter(o => !isCancelledOrder(o)).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

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

  // Split into active and cancelled/refunded
  const activePeriodOrders = periodOrders.filter(o => !isCancelledOrder(o));
  const cancelledPeriodOrders = periodOrders.filter(o => isCancelledOrder(o));

  // Net active store revenue (excluding refunded/cancelled amounts)
  const periodRevenue = activePeriodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Digital vs Cash breakdowns for ACTIVE orders
  const upiOrders = activePeriodOrders.filter(o => isOnlinePayment(o));
  const upiRevenue = upiOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashOrders = activePeriodOrders.filter(o => !isOnlinePayment(o));
  const cashRevenue = cashOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Total refunded amount in selected period
  const periodRefundedAmount = cancelledPeriodOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const pickupOrdersCount = activePeriodOrders.filter(o => (o.deliveryType || '').includes('pickup')).length;
  const courierOrdersCount = activePeriodOrders.filter(o => !(o.deliveryType || '').includes('pickup')).length;

  const lowStockItems = products.filter(p => (p.stock ?? 0) <= 3);
  const lowStockCount = lowStockItems.length;

  // Filtered & Sorted Customers for Tab 7 (CRM)
  const filteredCustomers = customers
    .filter(c => {
      if (!customersSearch.trim()) return true;
      const q = customersSearch.toLowerCase().trim();
      const phoneDigits = q.replace(/[^0-9]/g, '');
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchDistrict = (c.district || '').toLowerCase().includes(q);
      const matchPincode = (c.pincode || '').includes(q);
      const matchPhone = phoneDigits.length >= 4 && (c.phone || '').includes(phoneDigits);
      return matchName || matchEmail || matchDistrict || matchPincode || matchPhone;
    })
    .sort((a, b) => {
      if (customersSort === 'spend') return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (customersSort === 'orders') return (b.totalOrders || 0) - (a.totalOrders || 0);
      if (customersSort === 'name') return (a.name || '').localeCompare(b.name || '');
      return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
    });

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
      (p.badge || '').toLowerCase().includes(q) ||
      (p.specs?.warranty || '').toLowerCase().includes(q) ||
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
    setInvPage(1);
  };

  // Reset to first segment whenever filter criteria or segment size changes
  useEffect(() => {
    setInvPage(1);
  }, [inventorySearch, inventoryBrandFilter, inventoryCategoryFilter, inventorySortFilter, showLowStockOnly, invPageSize]);

  // Inventory segmentation math
  const totalInvPages = Math.max(1, Math.ceil(filteredProducts.length / invPageSize));
  const currentInvPage = Math.min(invPage, totalInvPages);
  const invStartIdx = (currentInvPage - 1) * invPageSize;
  const invEndIdx = Math.min(currentInvPage * invPageSize, filteredProducts.length);
  const pagedProducts = filteredProducts.slice(invStartIdx, invEndIdx);

  if (!user || user.role !== 'store') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '60px 20px', gap: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#dc2626',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }}
        />
        <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Verifying store portal access...</span>
      </div>
    );
  }

  const sidebarNavItems = [
    {
      id: 'overview',
      title: 'Overview',
      icon: LayoutDashboard,
      selected: activeTab === 'overview',
      onClick: () => setActiveTab('overview')
    },
    {
      id: 'orders',
      title: `Customer Orders${orderCounts.all > 0 ? ` (${orderCounts.all})` : ''}`,
      icon: ShoppingBag,
      notifs: orderCounts.all > 0 ? orderCounts.all : undefined,
      notifsColor: '#ea580c',
      selected: activeTab === 'orders',
      onClick: () => setActiveTab('orders')
    },
    {
      id: 'cancellations',
      title: 'Cancel Requests',
      icon: Ban,
      notifs: pendingCancellationRequests.length > 0 ? pendingCancellationRequests.length : undefined,
      notifsColor: '#dc2626',
      selected: activeTab === 'cancellations',
      onClick: () => setActiveTab('cancellations')
    },
    {
      id: 'customers',
      title: `Customers (${customers.length})`,
      icon: Users,
      selected: activeTab === 'customers',
      onClick: () => setActiveTab('customers')
    },
    {
      id: 'inventory',
      title: `Inventory (${products.length})`,
      icon: Package,
      notifs: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      notifsColor: '#ea580c',
      selected: activeTab === 'inventory',
      onClick: () => setActiveTab('inventory')
    },
    {
      id: 'coupons',
      title: `Coupons (${coupons.length})`,
      icon: Tag,
      selected: activeTab === 'coupons',
      onClick: () => setActiveTab('coupons')
    },
    {
      id: 'repairs',
      title: `Repairs (${repairs.length})`,
      icon: Wrench,
      selected: activeTab === 'repairs',
      onClick: () => setActiveTab('repairs')
    },
    {
      id: 'taxonomy',
      title: 'Categories & Brands',
      icon: Layers,
      selected: activeTab === 'taxonomy',
      onClick: () => setActiveTab('taxonomy')
    }
  ];

  const sidebarBottomNavItems = [
    {
      id: 'view-site',
      title: 'View Storefront',
      icon: Globe,
      onClick: () => navigate('/')
    },
    {
      id: 'sign-out',
      title: 'Sign Out',
      icon: LogOut,
      variant: 'danger',
      onClick: handleStoreLogout
    }
  ];

  return (
    <div className="store-dashboard-shell">
      <DashboardSidebar
        open={mobileSidebarOpen}
        setOpen={setMobileSidebarOpen}
        title="Variathu Store"
        subtitle="Store Owner Portal"
        items={sidebarNavItems}
        bottomItems={sidebarBottomNavItems}
        onTitleClick={() => navigate('/')}
      />

      <div className="store-dashboard-main-area">
        {/* Mobile Top Navigation Header */}
        <div className="dashboard-mobile-top-bar">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="dashboard-mobile-hamburger-btn"
            id="btn-store-mobile-menu"
          >
            <Menu size={18} />
            <span>Menu</span>
            {(orderCounts.undispatched > 0 || pendingCancellationRequests.length > 0) && (
              <span className="dashboard-mobile-badge">
                {orderCounts.undispatched + pendingCancellationRequests.length}
              </span>
            )}
          </button>

          <div className="dashboard-mobile-brand">
            <img
              src="/Logo.jpeg"
              alt="Variathu"
              style={{ height: '20px', width: 'auto', objectFit: 'contain' }}
            />
            <span>Store Portal</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="dashboard-mobile-hamburger-btn"
            title="View Storefront"
            style={{ padding: '6px 8px' }}
          >
            <Globe size={16} />
          </button>
        </div>

        {/* Mobile 1-Tap Horizontal Tabs Scroll */}
        <div className="dashboard-mobile-tabs-scroll">
          {sidebarNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`dashboard-mobile-tab-pill ${item.selected ? 'active' : ''}`}
            >
              <item.icon size={14} />
              <span>{item.title.split(' (')[0]}</span>
              {item.notifs ? <span className="tab-pill-notif">{item.notifs}</span> : null}
            </button>
          ))}
        </div>

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

      {/* OVERVIEW TAB: Main Dashboard View */}
      {activeTab === 'overview' && (
        <>
          {/* Store Header Banner */}
          <div className="store-portal-header-banner" id="store-portal-header">
            <div className="store-portal-brand-wrap">
              <div className="store-portal-icon">
                <ShieldCheck size={26} />
              </div>

              <div>
                <div className="store-portal-title-row">
                  <h1>Store Owner Portal</h1>
                  <span className="store-admin-badge">ADMIN ACCESS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <img
                    src="/Logo.jpeg"
                    alt="Variathu Power Tools"
                    style={{ height: '22px', width: 'auto', objectFit: 'contain' }}
                  />
                  <span className="store-portal-subtitle" style={{ margin: 0 }}>
                    • Poyanil Building, Kozhencherry, Kerala
                  </span>
                </div>
              </div>
            </div>

            <div className="store-portal-actions">
              <button
                type="button"
                onClick={() => startOverviewTour(true)}
                className="store-action-btn-tour"
                id="btn-start-overview-tour"
                title="Start Guided Interactive Tour of Overview Dashboard"
              >
                <Compass size={15} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="store-action-btn-secondary"
                id="btn-store-view-front"
                title="Open Public Customer Storefront"
              >
                <Globe size={15} />
                <span>View Storefront</span>
              </button>

              <button
                onClick={handleStoreLogout}
                className="store-logout-btn"
                id="btn-store-logout"
              >
                <LogOut size={15} />
                <span>Sign Out of Store</span>
              </button>
            </div>
          </div>

      {/* Daily Action Center Banner */}
      {(() => {
        const readyRepairsCount = repairs.filter(r => r.status === 'Repaired & Ready').length;
        const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= 3).length;
        const hasUrgentActions = orderCounts.undispatched > 0 || orderCounts.pickupPending > 0 || orderCounts.cancelPending > 0 || readyRepairsCount > 0 || lowStockCount > 0;

        return (
          <div
            style={{
              marginBottom: '18px',
              padding: '12px 16px',
              background: hasUrgentActions ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : '#f0fdf4',
              border: hasUrgentActions ? '1.5px solid #fed7aa' : '1.5px solid #bbf7d0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
            id="store-daily-action-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⚡ Daily Action Center:
              </span>

              {orderCounts.undispatched > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('orders'); setOrderStatusFilter('undispatched'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#ea580c', color: '#fff', borderRadius: '20px', border: 'none', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(234,88,12,0.3)' }}
                >
                  📦 {orderCounts.undispatched} to Dispatch
                </button>
              )}

              {orderCounts.pickupPending > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('orders'); setOrderStatusFilter('pickup-pending'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#0284c7', color: '#fff', borderRadius: '20px', border: 'none', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(2,132,199,0.3)' }}
                >
                  🏬 {orderCounts.pickupPending} Waiting Pickup
                </button>
              )}

              {orderCounts.cancelPending > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('cancellations'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#dc2626', color: '#fff', borderRadius: '20px', border: 'none', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(220,38,38,0.3)' }}
                >
                  ⚠️ {orderCounts.cancelPending} Cancel Request{orderCounts.cancelPending > 1 ? 's' : ''}
                </button>
              )}

              {readyRepairsCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('repairs'); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#16a34a', color: '#fff', borderRadius: '20px', border: 'none', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(22,163,74,0.3)' }}
                >
                  🔧 {readyRepairsCount} Tool{readyRepairsCount > 1 ? 's' : ''} Repaired & Ready
                </button>
              )}

              {lowStockCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setActiveTab('inventory'); setShowLowStockOnly(true); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#b45309', color: '#fff', borderRadius: '20px', border: 'none', fontSize: '0.76rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(180,83,9,0.3)' }}
                >
                  📉 {lowStockCount} Items Low Stock
                </button>
              )}

              {!hasUrgentActions && (
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700' }}>
                  ✅ All caught up! No urgent store dispatches or handovers pending.
                </span>
              )}
            </div>

            {/* Sound Mute/Unmute & Auto-Refresh State */}
            <div id="store-audio-sync-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  color: soundEnabled ? '#15803d' : '#94a3b8',
                  fontWeight: '700'
                }}
                title={soundEnabled ? 'Order sound alert enabled' : 'Order sound alert muted'}
                id="btn-toggle-sound"
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                <span>{soundEnabled ? 'Chime: ON' : 'Chime: Muted'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRefresh(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.74rem',
                  color: autoRefresh ? '#0284c7' : '#94a3b8',
                  fontWeight: '700'
                }}
                title={autoRefresh ? 'Auto-refreshing every 30s' : 'Auto-refresh paused'}
                id="btn-toggle-auto-refresh"
              >
                <RefreshCw size={13} className={autoRefresh ? 'spin-slow' : ''} />
                <span>{autoRefresh ? 'Live Sync (30s)' : 'Sync Paused'}</span>
              </button>
            </div>
          </div>
        );
      })()}

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
            {/* Period Selector Tabs using RubberSegment */}
            <RubberSegment
              items={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'all', label: 'All Time' }
              ]}
              value={analyticsPeriod}
              onChange={(val) => setAnalyticsPeriod(val)}
              trackColor="#27272a"
              thumbColor="#fafafa"
              textColor="#fafafa"
              activeTextColor="#18181b"
              size="md"
              radius={10}
              inset={3}
              equalSlots
              stretch={100}
              squash={3}
              speed={1}
              glide={75}
              draggable
              preset="periods"
            />

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

            {/* Collapse/Expand Space Optimizer Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !analyticsCollapsed;
                setAnalyticsCollapsed(next);
                localStorage.setItem('vpt_analytics_collapsed', String(next));
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              id="btn-toggle-analytics-collapse"
              title={analyticsCollapsed ? "Expand financial reports & charts" : "Collapse metrics to view orders above the fold"}
            >
              {analyticsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>{analyticsCollapsed ? 'Expand Reports' : 'Collapse'}</span>
            </button>
          </div>
        </div>

        {analyticsCollapsed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#f8fafc',
            borderRadius: '10px',
            marginTop: '12px',
            fontSize: '0.82rem',
            color: '#475569',
            flexWrap: 'wrap',
            gap: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span>💰 Revenue: <strong style={{ color: '#0f172a' }}>{formatPrice(periodRevenue)}</strong> <small style={{ color: '#64748b' }}>({analyticsPeriod === 'all' ? 'All Time' : analyticsPeriod === 'today' ? 'Today' : analyticsPeriod === 'week' ? 'Past 7 Days' : 'This Month'})</small></span>
              <span>📦 Active Pending: <strong style={{ color: orderCounts.all > 0 ? '#ea580c' : '#0f172a' }}>{orderCounts.all}</strong></span>
              <span>🚚 Undispatched: <strong style={{ color: orderCounts.undispatched > 0 ? '#ea580c' : '#0f172a' }}>{orderCounts.undispatched}</strong></span>
              <span>🏬 Pickup Pending: <strong style={{ color: '#0f172a' }}>{orderCounts.pickupPending}</strong></span>
              <span>🔧 Workshop: <strong style={{ color: '#0f172a' }}>{repairs.filter(r => r.status !== 'Handed Over' && !r.handoverVerified).length}</strong> jobs</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Orders brought above the fold • Click 'Expand Reports' for full details
            </span>
          </div>
        ) : (
          /* 4 Analytics Metric Cards */
          <div className="store-analytics-grid">
            <div className="store-analytics-metric-card">
              <span className="store-metric-label">
                Revenue ({analyticsPeriod === 'all' ? 'All Time' : analyticsPeriod === 'today' ? 'Today' : analyticsPeriod === 'week' ? 'Past 7 Days' : 'This Month'})
              </span>
              <div className="store-metric-value-huge">
                {formatPrice(periodRevenue)}
              </div>
              <span className="store-metric-subtext">
                {activePeriodOrders.length} active order{activePeriodOrders.length === 1 ? '' : 's'} in selected period
                {cancelledPeriodOrders.length > 0 && (
                  <span style={{ color: '#dc2626', display: 'block', fontSize: '0.72rem', marginTop: '2px', fontWeight: '700' }}>
                    ({cancelledPeriodOrders.length} cancelled/refunded order excluded)
                  </span>
                )}
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
                {periodRefundedAmount > 0 && (
                  <div className="store-metric-split-item" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                    <span className="store-metric-item-label" style={{ color: '#64748b' }}>↩ Refunded Online</span>
                    <span className="store-metric-item-value" style={{ color: '#dc2626' }}>{formatPrice(periodRefundedAmount)} <small>({cancelledPeriodOrders.length})</small></span>
                  </div>
                )}
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
                {cancelledPeriodOrders.length > 0 && (
                  <div className="store-metric-split-item" style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '4px', marginTop: '4px' }}>
                    <span className="store-metric-item-label" style={{ color: '#64748b' }}>● Cancelled</span>
                    <span className="store-metric-item-value" style={{ color: '#64748b' }}>{cancelledPeriodOrders.length} <small>cancelled</small></span>
                  </div>
                )}
              </div>
            </div>

            <div className="store-analytics-metric-card">
              <span className="store-metric-label">
                Workshop & Repairs Active
              </span>
              <div className="store-metric-split-list">
                <div className="store-metric-split-item">
                  <span className="store-metric-item-label" style={{ color: '#ea580c' }}>● In Workshop</span>
                  <span className="store-metric-item-value">{repairs.filter(r => r.status !== 'Handed Over' && !r.handoverVerified).length} <small>jobs</small></span>
                </div>
                <div className="store-metric-split-item">
                  <span className="store-metric-item-label" style={{ color: '#16a34a' }}>● Ready for Pickup</span>
                  <span className="store-metric-item-value" style={{ color: '#16a34a' }}>{repairs.filter(r => r.status === 'Repaired & Ready' && !r.handoverVerified).length} <small>ready</small></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Navigation Hub Cards for Department Sections */}
          <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 3px' }}>
                Store Operations &amp; Department Hub
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Direct access to manage orders, catalog inventory, customer directory, discounts, and repair jobs:
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {/* Hub Card 1: Customer Orders */}
              <HoverDevCard
                id="hub-card-orders"
                title="Customer Orders"
                subtitle={`${orders.length} total customer orders • Courier shipping & store pickup OTP passes`}
                Icon={ShoppingBag}
                badge={orderCounts.all > 0 ? `${orderCounts.all} pending` : 'All attended'}
                badgeBg={orderCounts.all > 0 ? '#ffedd5' : '#ecfdf5'}
                badgeColor={orderCounts.all > 0 ? '#c2410c' : '#15803d'}
                iconColor="#dc2626"
                iconBg="#fef2f2"
                gradient="linear-gradient(135deg, #dc2626 0%, #ea580c 100%)"
                actionText="Open Orders Page"
                actionColor="#dc2626"
                onClick={() => setActiveTab('orders')}
              />

              {/* Hub Card 2: Inventory & Stock */}
              <HoverDevCard
                id="hub-card-inventory"
                title="Inventory & Stock"
                subtitle={`${products.length} catalog equipment • Instant stock updates, pricing & barcode passes`}
                Icon={Package}
                badge={lowStockCount > 0 ? `${lowStockCount} low stock` : 'Healthy stock'}
                badgeBg={lowStockCount > 0 ? '#fee2e2' : '#f0fdf4'}
                badgeColor={lowStockCount > 0 ? '#b91c1c' : '#166534'}
                iconColor="#ea580c"
                iconBg="#fff7ed"
                gradient="linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)"
                actionText="Open Inventory Page"
                actionColor="#ea580c"
                onClick={() => setActiveTab('inventory')}
              />

              {/* Hub Card 3: Cancel Requests */}
              <HoverDevCard
                id="hub-card-cancellations"
                title="Cancel Requests"
                subtitle="Review customer cancellation requests for dispatched orders with 1-click refund"
                Icon={Ban}
                badge={`${pendingCancellationRequests.length} pending`}
                badgeBg={pendingCancellationRequests.length > 0 ? '#fee2e2' : '#f1f5f9'}
                badgeColor={pendingCancellationRequests.length > 0 ? '#dc2626' : '#64748b'}
                iconColor="#ef4444"
                iconBg="#fef2f2"
                gradient="linear-gradient(135deg, #e11d48 0%, #f43f5e 100%)"
                actionText="Review Cancellations"
                actionColor="#ef4444"
                onClick={() => setActiveTab('cancellations')}
              />

              {/* Hub Card 4: Customer Directory (CRM) */}
              <HoverDevCard
                id="hub-card-customers"
                title="Customer Directory (CRM)"
                subtitle="Customer CRM accounts, lifetime spend, purchase history & WhatsApp communication"
                Icon={Users}
                badge={`${customers.length} registered`}
                badgeBg="#dbeafe"
                badgeColor="#1d4ed8"
                iconColor="#3b82f6"
                iconBg="#eff6ff"
                gradient="linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)"
                actionText="Open Customer CRM"
                actionColor="#2563eb"
                onClick={() => setActiveTab('customers')}
              />

              {/* Hub Card 5: Coupons & Discounts */}
              <HoverDevCard
                id="hub-card-coupons"
                title="Coupons & Discounts"
                subtitle="Manage promotional coupon codes, percentage discounts & usage limits"
                Icon={Percent}
                badge={`${coupons.length} active`}
                badgeBg="#f3e8ff"
                badgeColor="#7e22ce"
                iconColor="#a855f7"
                iconBg="#faf5ff"
                gradient="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                actionText="Manage Coupons"
                actionColor="#9333ea"
                onClick={() => setActiveTab('coupons')}
              />

              {/* Hub Card 6: Workshop & Repairs */}
              <HoverDevCard
                id="hub-card-repairs"
                title="Workshop & Repairs"
                subtitle="Machinery clinic service queue, job estimates & counter handover OTPs"
                Icon={Wrench}
                badge={`${repairs.filter(r => r.status !== 'Handed Over' && !r.handoverVerified).length} active jobs`}
                badgeBg="#d1fae5"
                badgeColor="#065f46"
                iconColor="#10b981"
                iconBg="#ecfdf5"
                gradient="linear-gradient(135deg, #059669 0%, #0d9488 100%)"
                actionText="Open Workshop"
                actionColor="#059669"
                onClick={() => setActiveTab('repairs')}
              />

              {/* Hub Card 7: Categories & Brands */}
              <HoverDevCard
                id="hub-card-taxonomy"
                title="Categories & Brands"
                subtitle="Manage tool categories, equipment classification & verified brand tags"
                Icon={Layers}
                badge={`${taxonomy.categories.length} Categories • ${taxonomy.brands.length} Brands`}
                badgeBg="#fef9c3"
                badgeColor="#854d0e"
                iconColor="#eab308"
                iconBg="#fefce8"
                gradient="linear-gradient(135deg, #d97706 0%, #eab308 100%)"
                actionText="Edit Categories"
                actionColor="#ca8a04"
                onClick={() => setActiveTab('taxonomy')}
              />
            </div>
          </div>

          {/* Recent Orders Activity Preview on Overview */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '22px 24px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 2px' }}>
                  Recent Orders Activity
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Showing latest 5 orders placed at Variathu Power Tools
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  color: '#dc2626',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                id="btn-view-all-orders-overview"
              >
                <span>View Full Orders Management ({orders.length})</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '0.86rem' }}>
                No orders recorded yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Fulfillment</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase' }}>Live Status</th>
                      <th style={{ padding: '10px 12px', fontWeight: '700', fontSize: '0.72rem', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{ord.id}</td>
                        <td style={{ padding: '12px', color: '#334155' }}>
                          <strong>{ord.customer?.name || 'Customer'}</strong>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: '#64748b' }}>+91 {ord.customer?.phone}</span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>{new Date(ord.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: ord.deliveryType === 'store-pickup' ? '#eff6ff' : '#f0fdf4',
                            color: ord.deliveryType === 'store-pickup' ? '#0369a1' : '#15803d',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: '700'
                          }}>
                            {ord.deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '800', color: '#0f172a' }}>{formatPrice(ord.totalAmount)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: ord.status?.includes('Completed') ? '#f0fdf4' : ord.status?.includes('Dispatched') ? '#eff6ff' : '#fffbeb',
                            color: ord.status?.includes('Completed') ? '#166534' : ord.status?.includes('Dispatched') ? '#1d4ed8' : '#b45309',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}>
                            ● {ord.status || 'Processing'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('orders');
                              setOrderSearchQuery(ord.id);
                            }}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* DEDICATED PAGE TOP HEADER (When NOT on Overview) */}
      {activeTab !== 'overview' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          marginBottom: '20px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              id="btn-back-to-overview"
            >
              <ArrowLeft size={14} />
              <span>Back to Overview</span>
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Store Portal</span>
                <span>/</span>
                <span style={{ color: '#ea580c', fontWeight: '800' }}>
                  {activeTab === 'orders' ? 'Customer Orders' :
                   activeTab === 'cancellations' ? 'Cancel Requests' :
                   activeTab === 'customers' ? 'Customer Directory' :
                   activeTab === 'inventory' ? 'Inventory & Stock' :
                   activeTab === 'coupons' ? 'Coupons & Discounts' :
                   activeTab === 'repairs' ? 'Workshop & Repairs' :
                   'Categories & Brands'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick action toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              style={{
                background: soundEnabled ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${soundEnabled ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: '700',
                color: soundEnabled ? '#15803d' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              id="btn-sound-toggle-header"
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
            </button>

            <button
              type="button"
              onClick={() => setAutoRefresh(prev => !prev)}
              style={{
                background: autoRefresh ? '#f0f9ff' : '#f8fafc',
                border: `1px solid ${autoRefresh ? '#bae6fd' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: '700',
                color: autoRefresh ? '#0284c7' : '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              id="btn-sync-toggle-header"
            >
              <RefreshCw size={12} className={autoRefresh ? 'spin-slow' : ''} />
              <span>{autoRefresh ? '30s Sync' : 'Sync Paused'}</span>
            </button>

            <button
              type="button"
              onClick={handleStoreLogout}
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: '700',
                color: '#dc2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: CUSTOMER ORDERS MANAGER */}
      {activeTab === 'orders' && (
        <div className="store-tab-content-card">
          <div id="orders-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Customer Orders Management
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Change delivery progress statuses in real time. Updates automatically reflect on customer order screens.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => startOrdersTour(true)}
                className="store-action-btn-tour"
                id="btn-start-orders-tour"
                title="Start Guided Interactive Tour of Customer Orders"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

              <button
                onClick={loadOrders}
                id="btn-refresh-orders"
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
            <>
              {/* Urgent Action Alert Banner (Undispatched / Pending Cancellation) */}
              {(orderCounts.undispatched > 0 || orderCounts.cancelPending > 0) && (
                <div style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#ea580c', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#9a3412' }}>
                        Fulfillment Action Needed: {orderCounts.undispatched > 0 ? `${orderCounts.undispatched} Order${orderCounts.undispatched === 1 ? '' : 's'} Pending Courier Dispatch` : ''}{orderCounts.undispatched > 0 && orderCounts.cancelPending > 0 ? ' • ' : ''}{orderCounts.cancelPending > 0 ? `${orderCounts.cancelPending} Cancellation Request${orderCounts.cancelPending === 1 ? '' : 's'} Pending Review` : ''}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                        Assign courier partners & print shipping labels, or review customer cancellation requests.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {orderCounts.undispatched > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('undispatched')}
                        style={{
                          background: '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        id="btn-alert-undispatched"
                      >
                        <Truck size={14} />
                        <span>Filter Undispatched ({orderCounts.undispatched})</span>
                      </button>
                    )}
                    {orderCounts.cancelPending > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderStatusFilter('cancel-pending')}
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 12px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        id="btn-alert-cancel-req"
                      >
                        <AlertTriangle size={14} />
                        <span>Filter Cancel Requests ({orderCounts.cancelPending})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Status Filter Chips (Horizontal Scrollable Strip with Arrows & Mouse Drag) */}
              <div className="store-order-status-chips-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', width: '100%', minWidth: 0 }}>
                <button
                  type="button"
                  onClick={() => scrollStatusChips('left')}
                  className="store-order-status-scroll-btn"
                  style={{
                    flexShrink: 0,
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Scroll left"
                  aria-label="Scroll status filters left"
                >
                  <ChevronLeft size={16} />
                </button>

                <div
                  ref={statusChipsBarRef}
                  onMouseDown={handleChipsDragStart}
                  onMouseMove={handleChipsDragMove}
                  onMouseUp={handleChipsDragEnd}
                  onMouseLeave={handleChipsDragEnd}
                  onWheel={(e) => {
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    overflowX: 'auto',
                    padding: '4px 2px',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    cursor: isDraggingChips ? 'grabbing' : 'grab',
                    flex: 1,
                    minWidth: 0,
                    userSelect: 'none'
                  }}
                  className="store-order-status-chips"
                >
                  {[
                    { id: 'all', label: 'All Orders', count: orderCounts.all, icon: ShoppingBag, color: '#0f172a' },
                    { id: 'today', label: "⚡ Today's Orders", count: orderCounts.today, icon: Clock, color: '#ea580c' },
                    { id: 'undispatched', label: '📦 Undispatched', count: orderCounts.undispatched, icon: AlertCircle, color: '#d97706' },
                    { id: 'dispatched', label: '🚚 Dispatched', count: orderCounts.dispatched, icon: Truck, color: '#16a34a' },
                    { id: 'pickup-pending', label: '🏬 Counter Pickup', count: orderCounts.pickupPending, icon: ShieldCheck, color: '#0284c7' },
                    { id: 'completed', label: '✅ Completed', count: 0, icon: CheckCircle2, color: '#059669' },
                    ...(orderCounts.cancelPending > 0 ? [
                      { id: 'cancel-pending', label: '⚠️ Cancel Requests', count: orderCounts.cancelPending, icon: AlertTriangle, color: '#dc2626' }
                    ] : []),
                    { id: 'cancelled', label: '❌ Cancelled', count: 0, icon: XCircle, color: '#64748b' }
                  ].map(chip => {
                    const isSelected = orderStatusFilter === chip.id;
                    const IconComp = chip.icon;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          if (!chipsDragMovedRef.current) {
                            setOrderStatusFilter(chip.id);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? '800' : '600',
                          cursor: 'pointer',
                          border: isSelected ? `1.5px solid ${chip.color}` : '1px solid #cbd5e1',
                          background: isSelected ? chip.color : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                        id={`btn-filter-order-status-${chip.id}`}
                      >
                        <IconComp size={14} style={{ color: isSelected ? '#ffffff' : chip.color }} />
                        <span>{chip.label}</span>
                        {chip.count > 0 && (
                          <span
                            style={{
                              background: isSelected ? 'rgba(255, 255, 255, 0.28)' : '#f1f5f9',
                              color: isSelected ? '#ffffff' : '#0f172a',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              padding: '2px 7px',
                              borderRadius: '9999px',
                              marginLeft: '2px'
                            }}
                          >
                            {chip.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollStatusChips('right')}
                  className="store-order-status-scroll-btn"
                  style={{
                    flexShrink: 0,
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Scroll right"
                  aria-label="Scroll status filters right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Filter Toolbar (Search + Fast OTP + Date + Delivery + Payment + Sort) */}
              <div className="store-orders-toolbar">
                {/* Search Box */}
                <div className="store-orders-search-wrap">
                  <Search size={15} className="store-orders-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, name, phone, city, AWB, item..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="store-orders-search-input"
                    id="input-order-search"
                  />
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setOrderSearchQuery('')}
                      className="store-orders-search-clear"
                      title="Clear search text"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Fast Pickup OTP Verification Input */}
                <div className="store-orders-fast-otp">
                  <div className="store-orders-fast-otp-left">
                    <ShieldCheck size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <label>Fast OTP:</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="4-digit..."
                      value={quickOtpInput}
                      onChange={(e) => handleQuickOtpChange(e.target.value)}
                      title="Enter 4-digit OTP to instantly locate and verify customer pickup"
                      id="input-fast-otp-lookup"
                    />
                  </div>
                  {quickOtpInput && (
                    <button
                      type="button"
                      onClick={() => { setQuickOtpInput(''); setQuickOtpMatchedOrder(null); }}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filters Grid (2x2 on Mobile, Flex Row on Desktop) */}
                <div className="store-orders-filter-grid">
                  {/* Date Filter */}
                  <div className="store-orders-filter-cell">
                    <label>Date:</label>
                    <GlideSelect
                      id="select-order-date-filter"
                      options={ORDER_DATE_OPTIONS}
                      value={orderDateFilter}
                      onChange={(val) => setOrderDateFilter(val)}
                      ariaLabel="Filter orders by date"
                      showTags
                      accentColor="#0284c7"
                      surfaceColor={orderDateFilter !== 'all' ? '#eff6ff' : '#ffffff'}
                      borderColor={orderDateFilter !== 'all' ? '#0284c7' : '#cbd5e1'}
                      textColor={orderDateFilter !== 'all' ? '#0369a1' : '#0f172a'}
                      highlightColor="#e0f2fe"
                      size="md"
                      radius={8}
                      menuWidth={210}
                    />
                  </div>

                  {/* Delivery Mode Filter */}
                  <div className="store-orders-filter-cell">
                    <label>Delivery:</label>
                    <GlideSelect
                      id="select-order-delivery-filter"
                      options={ORDER_DELIVERY_OPTIONS}
                      value={orderDeliveryFilter}
                      onChange={(val) => setOrderDeliveryFilter(val)}
                      ariaLabel="Filter orders by delivery type"
                      showTags
                      accentColor="#0284c7"
                      surfaceColor={orderDeliveryFilter !== 'all' ? '#eff6ff' : '#ffffff'}
                      borderColor={orderDeliveryFilter !== 'all' ? '#0284c7' : '#cbd5e1'}
                      textColor={orderDeliveryFilter !== 'all' ? '#0369a1' : '#0f172a'}
                      highlightColor="#e0f2fe"
                      size="md"
                      radius={8}
                      menuWidth={275}
                    />
                  </div>

                  {/* Payment Status Filter */}
                  <div className="store-orders-filter-cell">
                    <label>Payment:</label>
                    <GlideSelect
                      id="select-order-payment-filter"
                      options={ORDER_PAYMENT_OPTIONS}
                      value={orderPaymentFilter}
                      onChange={(val) => setOrderPaymentFilter(val)}
                      ariaLabel="Filter orders by payment status"
                      showTags
                      accentColor="#0284c7"
                      surfaceColor={orderPaymentFilter !== 'all' ? '#eff6ff' : '#ffffff'}
                      borderColor={orderPaymentFilter !== 'all' ? '#0284c7' : '#cbd5e1'}
                      textColor={orderPaymentFilter !== 'all' ? '#0369a1' : '#0f172a'}
                      highlightColor="#e0f2fe"
                      size="md"
                      radius={8}
                      menuWidth={275}
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="store-orders-filter-cell">
                    <label>Sort:</label>
                    <GlideSelect
                      id="select-order-sort"
                      options={ORDER_SORT_OPTIONS}
                      value={orderSortFilter}
                      onChange={(val) => setOrderSortFilter(val)}
                      ariaLabel="Sort orders"
                      showTags
                      accentColor="#ea580c"
                      surfaceColor={orderSortFilter !== 'newest' ? '#fff7ed' : '#ffffff'}
                      borderColor={orderSortFilter !== 'newest' ? '#ea580c' : '#cbd5e1'}
                      textColor={orderSortFilter !== 'newest' ? '#c2410c' : '#0f172a'}
                      highlightColor="#ffedd5"
                      size="md"
                      radius={8}
                      menuWidth={250}
                    />
                  </div>
                </div>

                {/* Reset Filters */}
                {hasActiveOrderFilters && (
                  <button
                    type="button"
                    onClick={handleResetOrderFilters}
                    className="store-orders-reset-btn"
                    title="Clear all active filters and searches"
                    id="btn-reset-order-filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Active Filter Counter Bar with View Switcher (Cards vs Compact Table) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                    Showing <strong style={{ color: '#0f172a' }}>{filteredOrders.length}</strong> of <strong style={{ color: '#0f172a' }}>{orders.length}</strong> customer orders
                    {hasActiveOrderFilters && (
                      <span style={{ marginLeft: '8px', fontSize: '0.76rem', color: '#ea580c', fontWeight: '700' }}>
                        (Filtered)
                      </span>
                    )}
                  </div>

                  {/* Pastel Status Color Legend */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '3px 8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '700', marginRight: '2px' }}>Status Colors:</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></span> Ordered (Blue)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }}></span> Dispatched (Orange)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span> Completed (Green)
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fff1f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span> Cancelled (Red)
                    </span>
                  </div>
                </div>

                {/* View Switcher: Cards vs Compact Table */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid #cbd5e1' }}>
                  <button
                    type="button"
                    onClick={() => { setOrdersViewMode('cards'); localStorage.setItem('vpt_orders_view_mode', 'cards'); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: ordersViewMode === 'cards' ? '#ffffff' : 'transparent',
                      color: ordersViewMode === 'cards' ? '#0f172a' : '#64748b',
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: ordersViewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    id="btn-view-cards"
                  >
                    <Layers size={13} />
                    <span>Cards</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOrdersViewMode('table'); localStorage.setItem('vpt_orders_view_mode', 'table'); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: ordersViewMode === 'table' ? '#ffffff' : 'transparent',
                      color: ordersViewMode === 'table' ? '#0f172a' : '#64748b',
                      fontSize: '0.76rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: ordersViewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                    id="btn-view-table"
                  >
                    <FileText size={13} />
                    <span>Compact Table</span>
                  </button>
                </div>
              </div>

              {/* Fast OTP Quick Verification Popup if Matched */}
              {quickOtpMatchedOrder && (
                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #16a34a',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 16px rgba(22, 163, 74, 0.16)'
                }}
                id="box-matched-otp-order"
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ background: '#16a34a', color: '#ffffff', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '0.96rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>Pickup Order Match Found: <strong>{quickOtpMatchedOrder.id}</strong> • {quickOtpMatchedOrder.customer?.name}</span>
                          <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: '800', border: '1px solid #86efac' }}>
                            🏬 Counter Pickup
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '3px' }}>
                          Customer Phone: <strong>{quickOtpMatchedOrder.customer?.phone}</strong> • Total: <strong style={{ color: '#0f172a' }}>{formatPrice(quickOtpMatchedOrder.totalAmount)}</strong> ({quickOtpMatchedOrder.paymentStatus === 'PAID' ? 'PAID ONLINE' : 'COLLECT CASH AT COUNTER'}) • OTP: <strong style={{ color: '#ea580c', fontFamily: 'var(--font-mono)', fontSize: '0.92rem' }}>{quickOtpMatchedOrder.pickupOtp}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderForDetails(quickOtpMatchedOrder)}
                        style={{
                          padding: '9px 14px',
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          transition: 'all 0.15s ease'
                        }}
                        id="btn-fast-otp-view-details"
                        title="View Full Order Breakdown & Specifications"
                      >
                        <Eye size={15} style={{ color: '#0284c7' }} />
                        <span>Details</span>
                      </button>

                      {/* Verify & Complete Handover Button */}
                      <button
                        type="button"
                        disabled={verifyingOrderId === quickOtpMatchedOrder.id}
                        onClick={async () => {
                          setVerifyingOrderId(quickOtpMatchedOrder.id);
                          try {
                            await api.verifyPickupOtp(quickOtpMatchedOrder.id, quickOtpMatchedOrder.pickupOtp);
                            showNotification(`✅ Counter handover verified for ${quickOtpMatchedOrder.id}!`);
                            setQuickOtpInput('');
                            setQuickOtpMatchedOrder(null);
                            loadOrders();
                            if (onProductUpdated) onProductUpdated();
                          } catch (err) {
                            showNotification(`❌ ${err.message}`);
                          } finally {
                            setVerifyingOrderId(null);
                          }
                        }}
                        style={{
                          padding: '9px 18px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '800',
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(22,163,74,0.3)'
                        }}
                        id="btn-fast-otp-verify-handover"
                      >
                        <ShieldCheck size={16} />
                        <span>{verifyingOrderId === quickOtpMatchedOrder.id ? 'Verifying...' : 'Verify & Complete Handover'}</span>
                      </button>

                      {/* Dismiss Button */}
                      <button
                        type="button"
                        onClick={() => { setQuickOtpInput(''); setQuickOtpMatchedOrder(null); }}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px' }}
                        title="Dismiss"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Purchased Products / Items List */}
                  {quickOtpMatchedOrder.items && quickOtpMatchedOrder.items.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      border: '1px solid #bbf7d0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Package size={13} style={{ color: '#ea580c' }} />
                          Items to Handover ({quickOtpMatchedOrder.items.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetails(quickOtpMatchedOrder)}
                          style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.74rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                        >
                          Full Breakdown &rarr;
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                        {quickOtpMatchedOrder.items.map((item, idx) => {
                          const matchedProd = products.find(p =>
                            (p.id && item.id && String(p.id) === String(item.id)) ||
                            (p._id && item.id && String(p._id) === String(item.id)) ||
                            (p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase())
                          );
                          const displayImg = item.image || matchedProd?.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80';
                          const brand = item.brand || matchedProd?.brand || '';
                          const qty = item.quantity || 1;
                          const lineTotal = (item.price || 0) * qty;

                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '8px 10px'
                              }}
                            >
                              <img
                                src={displayImg}
                                alt=""
                                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0', flexShrink: 0 }}
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80'; }}
                              />
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  onClick={() => setSelectedOrderForDetails(quickOtpMatchedOrder)}
                                  style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                                  title={item.name}
                                >
                                  {brand && (
                                    <span style={{ fontSize: '0.64rem', fontWeight: '900', color: '#ea580c', background: '#fff7ed', padding: '1px 4px', borderRadius: '3px', marginRight: '4px', border: '1px solid #fed7aa' }}>
                                      {brand}
                                    </span>
                                  )}
                                  <span>{item.name}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                                  Unit: {formatPrice(item.price)}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: '800', background: '#0284c7', color: '#ffffff', padding: '2px 7px', borderRadius: '4px' }}>
                                  ×{qty}
                                </span>
                                <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                                  {formatPrice(lineTotal)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty Results When Filter Matches Zero Orders */}
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <Search size={28} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
                  <strong style={{ fontSize: '0.94rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>No Orders Match Your Filter Criteria</strong>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '12px' }}>Try switching the status chip above or clearing your search keywords.</p>
                  <button
                    type="button"
                    onClick={handleResetOrderFilters}
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : ordersViewMode === 'table' ? (
                /* Compact Table Mode */
                <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', fontWeight: '800' }}>
                        <th style={{ padding: '12px 14px' }}>Order ID & Date</th>
                        <th style={{ padding: '12px 14px' }}>Customer</th>
                        <th style={{ padding: '12px 14px' }}>Fulfillment</th>
                        <th style={{ padding: '12px 14px' }}>Items</th>
                        <th style={{ padding: '12px 14px' }}>Total Amount</th>
                        <th style={{ padding: '12px 14px' }}>Status</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order, idx) => {
                        const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
                        const isStorePickup = order.deliveryType === 'store-pickup';
                        const isPaid = order.paymentStatus === 'PAID';
                        const isRefunded = order.paymentStatus === 'REFUNDED';
                        const isCompleted = isOrderCompleted(order);
                        const isDispatched = isOrderDispatched(order);
                        const statusKey = isCancelled ? 'cancelled' : isCompleted ? 'completed' : isDispatched ? 'dispatched' : 'ordered';
                        const tableRowBg = {
                          ordered: '#f8fbff',
                          dispatched: '#fffaf5',
                          completed: '#f7fef9',
                          cancelled: '#fff5f5'
                        }[statusKey];
                        const tableStripe = {
                          ordered: '#2563eb',
                          dispatched: '#ea580c',
                          completed: '#16a34a',
                          cancelled: '#ef4444'
                        }[statusKey];

                        return (
                          <tr
                            key={order.id}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: tableRowBg,
                              borderLeft: `4px solid ${tableStripe}`,
                              transition: 'background 0.15s ease'
                            }}
                            className={`store-table-order-row order-status-${statusKey}`}
                          >
                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)', fontSize: '0.86rem', display: 'block' }}>
                                {order.id}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (order.date || 'Today')}
                              </span>
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div style={{ fontWeight: '700', color: '#0f172a' }}>{order.customer?.name || 'Customer'}</div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{order.customer?.phone || 'No phone'}</div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                                {order.customer?.city || order.customer?.district || 'Kerala'}
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              {isStorePickup ? (
                                <div>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: '800', color: order.handoverVerified ? '#166534' : '#0284c7', background: order.handoverVerified ? '#ecfdf5' : '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                                    {order.handoverVerified ? '✅ Collected' : '🏬 Counter Pickup'}
                                  </span>
                                  {!order.handoverVerified && !isCancelled && (
                                    <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: '700', marginTop: '3px' }}>
                                      🔒 Code Required
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: '800', color: isOrderCompleted(order) ? '#166534' : (order.awb && order.awb.trim()) ? '#166534' : '#ea580c', background: isOrderCompleted(order) ? '#ecfdf5' : (order.awb && order.awb.trim()) ? '#ecfdf5' : '#fff7ed', padding: '2px 8px', borderRadius: '6px' }}>
                                    {isOrderCompleted(order) ? <CheckCircle2 size={12} /> : <Truck size={12} />}
                                    {isOrderCompleted(order) ? `✅ Delivered • ${order.courierPartner || 'Courier'}` : (order.awb && order.awb.trim()) ? (order.courierPartner || 'Dispatched') : 'Needs Dispatch'}
                                  </span>
                                  {order.awb && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                      AWB: {order.awb}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <div
                                onClick={() => setSelectedOrderForDetails(order)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view full order & product specifications"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.82rem' }}>
                                    {order.items?.length || 1} Product{order.items?.length === 1 ? '' : 's'}
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: '4px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                    <Eye size={10} /> Details
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {order.items?.slice(0, 3).map((it, i) => {
                                    const mProd = products.find(p => (p.id && it.id && String(p.id) === String(it.id)) || (p.name && it.name && p.name.toLowerCase() === it.name.toLowerCase()));
                                    const img = it.image || mProd?.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80';
                                    return (
                                      <div key={i} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden', flexShrink: 0, padding: '1px' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80'; }} />
                                      </div>
                                    );
                                  })}
                                  <div style={{ fontSize: '0.72rem', color: '#475569', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {order.items?.map(i => `${i.quantity || 1}x ${i.name || i.title}`).join(', ') || 'Tools & Equipment'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                                {formatPrice(order.totalAmount)}
                              </strong>
                              <div>
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '800',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: isRefunded ? '#fef2f2' : isPaid ? '#ecfdf5' : '#fffbeb',
                                  color: isRefunded ? '#dc2626' : isPaid ? '#15803d' : '#b45309'
                                }}>
                                  {isRefunded ? 'REFUNDED' : isPaid ? 'PAID ONLINE' : 'COD'}
                                </span>
                              </div>
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                              {isCancelled ? (
                                <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#dc2626', background: '#fef2f2', padding: '3px 8px', borderRadius: '6px' }}>
                                  ❌ Cancelled
                                </span>
                              ) : (
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.74rem',
                                    fontWeight: '700',
                                    background: '#ffffff',
                                    color: '#0f172a',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {STATUS_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}
                            </td>

                            <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDetails(order)}
                                  style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="View Full Order & Products Breakdown"
                                >
                                  <Eye size={12} />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForInvoice(order)}
                                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '700', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  title="Print GST Invoice"
                                >
                                  <Printer size={12} />
                                  <span>Invoice</span>
                                </button>

                                {!isStorePickup && !isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForLabel(order)}
                                    style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '700', color: '#1d4ed8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Print 4x6 Thermal Shipping Label"
                                  >
                                    <Truck size={12} />
                                    <span>Label</span>
                                  </button>
                                )}

                                {isStorePickup && !order.handoverVerified && !isCancelled && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifySingleOrderOtp(null, order.id)}
                                    style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: '800', color: '#166534', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Verify Handover"
                                  >
                                    <CheckCircle2 size={12} />
                                    <span>Handover</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredOrders.map((order) => {
                    const isPickup = order.deliveryType === 'store-pickup';
                    const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
                    const isCancelRequested = order.cancellationRequested && !isCancelled;
                    const isCompleted = isOrderCompleted(order);
                    const isDispatched = isOrderDispatched(order);
                    const isPaidOnline = order.paymentStatus === 'PAID' && isOnlinePayment(order);
                    const isRefunded = order.paymentStatus === 'REFUNDED' || (isCancelled && order.paymentStatus === 'REFUNDED');
                    const hasAwb = !!(order.awb && order.awb.trim());
                    const courierCfg = !isPickup ? resolveCourierConfig(order.courierPartner) : null;
                    const itemCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

                    // Dynamic Pastel Status Configuration:
                    // ordered -> blue, dispatched -> orange, completed -> green, cancelled -> red
                    const statusKey = isCancelled
                      ? 'cancelled'
                      : isCompleted
                      ? 'completed'
                      : isDispatched
                      ? 'dispatched'
                      : 'ordered';

                    const statusColorConfig = {
                      ordered: {
                        bg: '#f0f7ff',
                        border: '#bfdbfe',
                        stripe: '#2563eb',
                        headerBorder: '#dbeafe',
                        boxBg: 'rgba(255, 255, 255, 0.92)',
                        boxBorder: '#bfdbfe',
                        shadow: '0 2px 10px rgba(37, 99, 235, 0.07)'
                      },
                      dispatched: {
                        bg: '#fff7ed',
                        border: '#fed7aa',
                        stripe: '#ea580c',
                        headerBorder: '#ffedd5',
                        boxBg: 'rgba(255, 255, 255, 0.92)',
                        boxBorder: '#fed7aa',
                        shadow: '0 2px 10px rgba(234, 88, 12, 0.07)'
                      },
                      completed: {
                        bg: '#f0fdf4',
                        border: '#bbf7d0',
                        stripe: '#16a34a',
                        headerBorder: '#dcfce7',
                        boxBg: 'rgba(255, 255, 255, 0.92)',
                        boxBorder: '#bbf7d0',
                        shadow: '0 2px 10px rgba(22, 163, 74, 0.07)'
                      },
                      cancelled: {
                        bg: '#fff1f2',
                        border: '#fecaca',
                        stripe: '#ef4444',
                        headerBorder: '#fee2e2',
                        boxBg: 'rgba(255, 255, 255, 0.92)',
                        boxBorder: '#fecaca',
                        shadow: '0 2px 10px rgba(239, 68, 68, 0.07)'
                      }
                    }[statusKey];

                    return (
                      <div
                        key={order.id}
                        className={`store-order-card order-status-${statusKey} ${isCancelled ? 'order-card-cancelled' : isPickup ? 'order-card-pickup' : 'order-card-courier'}`}
                        style={{
                          backgroundColor: statusColorConfig.bg,
                          borderColor: statusColorConfig.border,
                          borderLeft: `5px solid ${statusColorConfig.stripe}`,
                          boxShadow: statusColorConfig.shadow
                        }}
                        id={`store-order-row-${order.id}`}
                      >
                        {/* 1. COMPACT HEADER BAR */}
                        <div className="store-order-header" style={{ borderBottomColor: statusColorConfig.headerBorder }}>
                          <div className="store-order-header-left">
                            <span className="store-order-id-badge" title="Order ID">
                              {order.id}
                            </span>

                            <span className="store-order-time">
                              {new Date(order.date || order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(order.date || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Delivery Type Badge */}
                            <span className={`order-badge ${isPickup ? 'order-badge-pickup' : 'order-badge-courier'}`}>
                              {isPickup ? '🏬 Counter Pickup' : '🚚 Courier Delivery'}
                            </span>

                            {/* Fulfillment Status Badge */}
                            {isCancelled ? (
                              <span className="order-badge order-badge-danger">
                                ❌ Cancelled {isRefunded ? '• Refunded' : ''}
                              </span>
                            ) : isCancelRequested ? (
                              <span className="order-badge order-badge-warning" title={order.cancellationRequestReason || 'Customer requested cancel'}>
                                ⚠️ Cancel Requested
                              </span>
                            ) : isOrderCompleted(order) ? (
                              <span className="order-badge order-badge-success" style={{ background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                ✅ {isPickup ? 'Collected & Completed' : `Delivered • ${courierCfg?.badge || order.courierPartner || 'Courier'}`}
                              </span>
                            ) : isPickup ? (
                              order.handoverVerified ? (
                                <span className="order-badge order-badge-success">
                                  ✅ Collected
                                </span>
                              ) : (
                                <span className="order-badge order-badge-warning">
                                  ⏳ Ready for Pickup
                                </span>
                              )
                            ) : hasAwb ? (
                              <span className="order-badge order-badge-success">
                                🚚 Dispatched • {courierCfg?.badge || order.courierPartner}
                              </span>
                            ) : (
                              <span className="order-badge order-badge-warning">
                                ⏳ Needs Courier Dispatch
                              </span>
                            )}

                            {/* Payment Status Badge - Accurate & Clean (NO PENDING PAYMENT ON CASH AT COUNTER!) */}
                            {isRefunded ? (
                              <span className="order-badge order-badge-success" title={order.refundId ? `Refund ID: ${order.refundId}` : ''}>
                                ⚡ Refunded
                              </span>
                            ) : isPickup ? (
                              order.handoverVerified ? (
                                <span className="order-badge order-badge-success">
                                  💵 Cash Paid at Counter
                                </span>
                              ) : isPaidOnline ? (
                                <span className="order-badge order-badge-success">
                                  ✅ Paid Online (UPI)
                                </span>
                              ) : (
                                <span className="order-badge order-badge-neutral">
                                  💵 Pay at Counter
                                </span>
                              )
                            ) : isPaidOnline ? (
                              <span className="order-badge order-badge-success">
                                ✅ Paid Online ({order.paymentMethod || 'UPI'})
                              </span>
                            ) : (
                              <span className="order-badge order-badge-neutral">
                                💵 Cash on Delivery (COD)
                              </span>
                            )}
                          </div>

                          <div className="store-order-header-right">
                            <span className="store-order-total-price">
                              {formatPrice(order.totalAmount)}
                            </span>
                            <span className="store-order-items-count">
                              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
                            </span>
                          </div>
                        </div>

                        {/* 2. BODY GRID: CUSTOMER/FULFILLMENT INFO (LEFT) & PACKING LIST (RIGHT) */}
                        <div className="store-order-body-grid">
                          {/* LEFT COLUMN: Customer & Dispatch/Handover Info */}
                          <div className="store-order-context-box" style={{ background: statusColorConfig.boxBg, borderColor: statusColorConfig.boxBorder }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <div>
                                <span style={{ color: '#64748b', fontSize: '0.74rem' }}>Customer:</span>{' '}
                                <strong style={{ color: '#0f172a' }}>{order.customer?.name || 'Customer'}</strong>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <a
                                  href={`tel:${order.customer?.phone}`}
                                  style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '700', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                  title="Call customer"
                                >
                                  <Phone size={11} />
                                  <span>{order.customer?.phone}</span>
                                </a>
                                {(() => {
                                  const cLink = order.awb ? (courierCfg?.trackingUrl || courierCfg?.portalUrl || 'https://www.dtdc.com/track-your-shipment/') : '';
                                  const waText = order.awb
                                    ? `Hello ${order.customer?.name || ''}, your order #${order.id} from Variathu Power Tools has been dispatched!\n\n📦 Delivery Partner: ${courierCfg?.name || order.courierPartner || 'Courier'}\n🔖 Consignment AWB: ${order.awb}\n🔗 Live Tracking Link: ${cLink}\n\nThank you for choosing Variathu Power Tools, Kozhencherry.`
                                    : isPickup && (order.pickupOtp || (order.status || '').toLowerCase().includes('ready'))
                                    ? `Hello ${order.customer?.name || ''}, your order #${order.id} from Variathu Power Tools is ready for counter pickup at Poyanil Building, Kozhencherry!\n🔐 Secret Pickup OTP: ${order.pickupOtp || ''}`
                                    : `Hello ${order.customer?.name || ''}, this is Variathu Power Tools regarding order #${order.id}.`;
                                  return (
                                    <a
                                      href={`https://wa.me/${(order.customer?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', padding: '2px 6px', borderRadius: '4px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.7rem', fontWeight: '700' }}
                                      title="Chat on WhatsApp"
                                      id={`btn-whatsapp-order-${order.id}`}
                                    >
                                      <MessageCircle size={11} /> WhatsApp
                                    </a>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Fulfillment Destination / Handover Area */}
                            {isPickup ? (
                              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '0.76rem' }}>
                                  <MapPin size={12} style={{ color: '#0284c7', flexShrink: 0 }} />
                                  <span><strong>Counter Pickup:</strong> Poyanil Building, Kozhencherry</span>
                                </div>

                                {/* Handover OTP or Completed Status */}
                                {order.handoverVerified ? (
                                  <div style={{ color: '#166534', fontSize: '0.76rem', fontWeight: '700', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                                    <span>Handover completed{order.collectedAt ? ` at ${new Date(order.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
                                  </div>
                                ) : !isCancelled && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }} id={`pickup-otp-bar-${order.id}`}>
                                    <span style={{ fontSize: '0.74rem', color: '#475569', fontWeight: '700' }}>Customer Code:</span>
                                    {revealedOtps[order.id] ? (
                                      <span
                                        onClick={() => toggleRevealOtp(order.id)}
                                        style={{
                                          background: '#fff7ed',
                                          border: '1px solid #fed7aa',
                                          color: '#ea580c',
                                          fontFamily: 'var(--font-mono)',
                                          fontWeight: '900',
                                          fontSize: '0.82rem',
                                          padding: '2px 7px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Click to hide"
                                      >
                                        <span>{order.pickupOtp || '4819'}</span>
                                        <EyeOff size={12} style={{ color: '#ea580c' }} />
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => toggleRevealOtp(order.id)}
                                        style={{
                                          background: '#f8fafc',
                                          border: '1px solid #cbd5e1',
                                          color: '#64748b',
                                          fontSize: '0.72rem',
                                          fontWeight: '700',
                                          padding: '2px 7px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        title="Ask customer for their 4-digit code. Use reveal only if customer phone battery died."
                                      >
                                        <Eye size={12} />
                                        <span>•••• (Reveal)</span>
                                      </button>
                                    )}
                                    <form
                                      onSubmit={(e) => handleVerifySingleOrderOtp(e, order.id)}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                    >
                                      <input
                                        type="text"
                                        maxLength={6}
                                        placeholder="4-Digit OTP"
                                        value={orderOtpInputs[order.id] || ''}
                                        onChange={(e) => setOrderOtpInputs({ ...orderOtpInputs, [order.id]: e.target.value })}
                                        style={{
                                          width: '100px',
                                          padding: '4px 8px',
                                          textAlign: 'center',
                                          fontSize: '0.82rem',
                                          fontWeight: '800',
                                          letterSpacing: '0.1em',
                                          fontFamily: 'var(--font-mono)',
                                          borderRadius: '6px',
                                          border: '1.5px solid #cbd5e1',
                                          background: '#ffffff',
                                          color: '#0f172a',
                                          outline: 'none'
                                        }}
                                        id={`input-order-otp-${order.id}`}
                                      />
                                      <button
                                        type="submit"
                                        disabled={verifyingOrderId === order.id}
                                        style={{
                                          padding: '4px 10px',
                                          fontSize: '0.74rem',
                                          fontWeight: '800',
                                          background: '#16a34a',
                                          color: '#ffffff',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px'
                                        }}
                                        id={`btn-verify-otp-${order.id}`}
                                      >
                                        <CheckCircle2 size={12} />
                                        <span>{verifyingOrderId === order.id ? 'Verifying...' : 'Verify & Handover'}</span>
                                      </button>
                                    </form>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                                <div style={{ color: '#475569', fontSize: '0.76rem', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                                  <MapPin size={12} style={{ color: '#ea580c', flexShrink: 0, marginTop: '2px' }} />
                                  <span>
                                    <strong>Courier Destination:</strong> {order.customer?.address ? `${order.customer.address}, ` : ''}{order.customer?.district || 'Pathanamthitta'}, PIN: {order.customer?.pincode || '689641'}
                                  </span>
                                </div>
                                {isOrderCompleted(order) ? (
                                  <div style={{ marginTop: '4px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{ color: '#16a34a', fontWeight: '800', background: '#ecfdf5', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                                      ✅ Delivered
                                    </span>
                                    <CourierLogo partner={order.courierPartner} size="xs" />
                                    {order.awb && (
                                      <span style={{ fontFamily: 'var(--font-mono)', background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', color: '#0f172a', fontWeight: '700' }}>
                                        AWB: {order.awb}
                                      </span>
                                    )}
                                    {courierCfg?.portalUrl && (
                                      <a
                                        href={courierCfg.portalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#ea580c', fontSize: '0.72rem', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        Track <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                ) : hasAwb ? (
                                  <div style={{ marginTop: '4px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <CourierLogo partner={order.courierPartner} size="xs" />
                                    <span style={{ fontFamily: 'var(--font-mono)', background: '#ffffff', border: '1px solid #cbd5e1', padding: '1px 6px', borderRadius: '4px', fontSize: '0.74rem', color: '#0f172a', fontWeight: '700' }}>
                                      AWB: {order.awb}
                                    </span>
                                    {courierCfg?.portalUrl && (
                                      <a
                                        href={courierCfg.portalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#ea580c', fontSize: '0.72rem', textDecoration: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                                      >
                                        Track <ExternalLink size={10} />
                                      </a>
                                    )}
                                  </div>
                                ) : !isCancelled && (
                                  <div style={{ marginTop: '4px', fontSize: '0.74rem', color: '#b45309', fontWeight: '700' }}>
                                    ⏳ Needs courier consignment booking & AWB dispatch
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* RIGHT COLUMN: Scannable Packing List (Ordered Items) */}
                          <div className="store-order-items-box" style={{ background: statusColorConfig.boxBg, borderColor: statusColorConfig.boxBorder }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Package size={12} style={{ color: '#ea580c' }} />
                                Items to Dispatch ({order.items?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForDetails(order)}
                                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                              >
                                Full Breakdown &rarr;
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {order.items?.map((item, idx) => {
                                const matchedProd = products.find(p =>
                                  (p.id && item.id && String(p.id) === String(item.id)) ||
                                  (p._id && item.id && String(p._id) === String(item.id)) ||
                                  (p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase())
                                );
                                const displayImg = item.image || matchedProd?.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80';
                                const brand = item.brand || matchedProd?.brand || '';
                                const qty = item.quantity || 1;
                                const lineTotal = (item.price || 0) * qty;

                                return (
                                  <div key={idx} className="store-order-item-row">
                                    <div className="store-order-item-left">
                                      <img
                                        src={displayImg}
                                        alt=""
                                        className="store-order-item-thumb"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=100&q=80'; }}
                                      />
                                      <div style={{ minWidth: 0, flex: 1 }}>
                                        <div
                                          className="store-order-item-name"
                                          onClick={() => setSelectedOrderForDetails(order)}
                                          title={item.name}
                                        >
                                          {brand && (
                                            <span style={{ fontSize: '0.64rem', fontWeight: '900', color: '#ea580c', background: '#fff7ed', padding: '1px 4px', borderRadius: '3px', marginRight: '4px', border: '1px solid #fed7aa' }}>
                                              {brand}
                                            </span>
                                          )}
                                          <span>{item.name}</span>
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                          Unit: {formatPrice(item.price)}
                                        </div>
                                      </div>
                                    </div>

                                    <span className="store-order-item-qty">
                                      x{qty}
                                    </span>

                                    <span className="store-order-item-price">
                                      {formatPrice(lineTotal)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* 3. ALERTS (CANCELLED / CANCELLATION REQUESTED) - COMPACT */}
                        {isCancelled && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <XCircle size={14} style={{ color: '#dc2626' }} />
                              <span>Order Cancelled by {(order.cancelledBy || 'customer').toUpperCase()}: "<strong>{order.cancellationReason || order.cancellationRequestReason || order.cancelReason || 'Cancelled'}</strong>"</span>
                            </div>
                            {isRefunded && (
                              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>
                                ⚡ Refund: {order.refundId || 'Processed'}
                              </span>
                            )}
                          </div>
                        )}

                        {isCancelRequested && (
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <AlertTriangle size={14} style={{ color: '#b45309' }} />
                              <span>Customer requested cancel: "<strong>{order.cancellationRequestReason || order.cancellationReason || 'Cancel requested'}</strong>"</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('cancellations')}
                              style={{ background: '#f59e0b', color: '#ffffff', border: 'none', borderRadius: '5px', padding: '3px 8px', fontSize: '0.72rem', fontWeight: '800', cursor: 'pointer' }}
                            >
                              Review in Cancellations &rarr;
                            </button>
                          </div>
                        )}

                        {/* 4. CONTEXTUAL ACTIONS BAR */}
                        <div className="store-order-actions-bar" style={{ borderTopColor: statusColorConfig.headerBorder }}>
                          {/* Left helper note or quick status */}
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {isPickup 
                              ? (order.handoverVerified ? '✅ Counter handover complete.' : 'Awaiting customer pickup at counter.')
                              : (isOrderCompleted(order)
                                  ? `✅ Order marked as Completed (Delivered with ${order.courierPartner || 'Courier'}).`
                                  : (hasAwb ? `Dispatched with ${order.courierPartner}.` : 'Pending courier dispatch.')
                                )
                            }
                          </div>

                          {/* Right actions */}
                          <div className="store-order-actions-right">
                            {/* Dispatch actions (COURIER ONLY) */}
                            {!isPickup && !isCancelled && !hasAwb && !isOrderCompleted(order) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cfg = resolveCourierConfig(order.courierPartner);
                                  setDispatchForm({
                                    courierPartner: cfg.name,
                                    awb: order.awb || ''
                                  });
                                  setDispatchModalOrder(order);
                                }}
                                className="btn-store-action btn-store-primary"
                                id={`btn-dispatch-order-${order.id}`}
                                title="Assign Courier Partner & Enter Consignment AWB"
                              >
                                <Truck size={13} />
                                <span>Dispatch via Courier</span>
                              </button>
                            )}

                            {!isPickup && !isCancelled && hasAwb && !isOrderCompleted(order) && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                                className="btn-store-action"
                                style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #86efac', fontWeight: '800' }}
                                id={`btn-complete-order-${order.id}`}
                                title="Mark order as Delivered & Completed"
                              >
                                <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
                                <span>Mark Delivered</span>
                              </button>
                            )}

                            {!isPickup && !isCancelled && hasAwb && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForLabel(order)}
                                  className="btn-store-action"
                                  id={`btn-print-label-${order.id}`}
                                  title="Print 4x6 Courier Shipping Label"
                                >
                                  <Truck size={13} style={{ color: '#ea580c' }} />
                                  <span>Courier Label</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cfg = resolveCourierConfig(order.courierPartner);
                                    setDispatchForm({
                                      courierPartner: cfg.name,
                                      awb: order.awb || ''
                                    });
                                    setDispatchModalOrder(order);
                                  }}
                                  className="btn-store-action"
                                  title="Edit Courier Partner / AWB"
                                >
                                  <Edit3 size={12} />
                                  <span>Edit Courier</span>
                                </button>
                              </>
                            )}

                            {/* GST Invoice */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForInvoice(order)}
                              className="btn-store-action"
                              id={`btn-print-invoice-${order.id}`}
                              title="Generate & print GST Tax Invoice"
                            >
                              <Printer size={13} style={{ color: '#0284c7' }} />
                              <span>GST Invoice</span>
                            </button>

                            {/* Details Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForDetails(order)}
                              className="btn-store-action"
                              id={`btn-view-details-${order.id}`}
                              title="View Full Order Breakdown & Specs"
                            >
                              <Eye size={13} style={{ color: '#475569' }} />
                              <span>Details</span>
                            </button>

                            {/* Cancel Order */}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOrderToCancel(order);
                                  setCancelReasonInput('Customer requested cancellation');
                                }}
                                className="btn-store-action btn-store-cancel"
                                id={`btn-cancel-order-${order.id}`}
                                title="Cancel Order"
                              >
                                <XCircle size={13} />
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </>
      )}
        </div>
      )}

      {/* TAB 2: INVENTORY & EQUIPMENT CONTROL */}
      {activeTab === 'inventory' && (
        <div className="store-tab-content-card">
          <div className="store-section-header" id="inventory-section-header">
            <div>
              <h2>Inventory & Product Control</h2>
              <p>Add, edit prices, update stock levels, or remove tools from the store catalog.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => startInventoryTour(true)}
                className="store-action-btn-tour"
                id="btn-start-inventory-tour"
                title="Start Guided Interactive Tour of Inventory & Stock"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

              <button
                type="button"
                onClick={() => loadProducts()}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#334155'
                }}
                id="btn-refresh-inventory"
                title="Fetch latest stock levels from database"
              >
                <RefreshCw size={14} className={loadingProducts ? 'spin-slow' : ''} />
                <span>Refresh Catalog</span>
              </button>

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
            {/* Top Row: Search & Selection Filters */}
            <div className="store-inv-toolbar-top">
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

              {/* 2. Filter by Company / Brand (Fixed width trigger) */}
              <div className="store-inv-filter-group">
                <label>Company:</label>
                <div className="store-inv-filter-dropdown-wrap store-inv-filter-brand-wrap">
                  <GlideSelect
                    id="select-filter-brand"
                    fullWidth
                    options={[
                      { value: 'all', label: 'All Companies / Brands', tag: `${products.length}` },
                      ...uniqueBrands.map(b => {
                        const count = products.filter(p => (p.brand || '').toLowerCase() === b.toLowerCase()).length;
                        return {
                          value: b,
                          label: b,
                          tag: count > 0 ? `${count}` : undefined
                        };
                      })
                    ]}
                    value={inventoryBrandFilter}
                    onChange={(val) => handleBrandFilterChange(val)}
                    ariaLabel="Filter inventory by brand"
                    showTags
                    accentColor="#0284c7"
                    surfaceColor={inventoryBrandFilter !== 'all' ? '#eff6ff' : '#ffffff'}
                    borderColor={inventoryBrandFilter !== 'all' ? '#0284c7' : '#cbd5e1'}
                    textColor={inventoryBrandFilter !== 'all' ? '#0369a1' : '#0f172a'}
                    highlightColor="#e0f2fe"
                    size="md"
                    radius={8}
                    menuWidth={260}
                    maxHeight={280}
                  />
                </div>
              </div>

              {/* 3. Filter by Category (Fixed width trigger) */}
              <div className="store-inv-filter-group">
                <label>Category:</label>
                <div className="store-inv-filter-dropdown-wrap store-inv-filter-category-wrap">
                  <GlideSelect
                    id="select-filter-category"
                    fullWidth
                    options={[
                      { value: 'all', label: 'All Categories', tag: `${selectedBrandProductCount}` },
                      ...sortedCategoryIds.map(catId => {
                        const count = getCategoryCountForSelectedBrand(catId);
                        return {
                          value: catId,
                          label: getCategoryLabel(catId),
                          tag: `${count}`
                        };
                      })
                    ]}
                    value={inventoryCategoryFilter}
                    onChange={(val) => setInventoryCategoryFilter(val)}
                    ariaLabel="Filter inventory by category"
                    showTags
                    accentColor="#0284c7"
                    surfaceColor={inventoryCategoryFilter !== 'all' ? '#eff6ff' : '#ffffff'}
                    borderColor={inventoryCategoryFilter !== 'all' ? '#0284c7' : '#cbd5e1'}
                    textColor={inventoryCategoryFilter !== 'all' ? '#0369a1' : '#0f172a'}
                    highlightColor="#e0f2fe"
                    size="md"
                    radius={8}
                    menuWidth={260}
                    maxHeight={280}
                  />
                </div>
              </div>

              {/* 4. Sort By (Fixed width trigger) */}
              <div className="store-inv-filter-group sort-group">
                <label>Sort:</label>
                <div className="store-inv-filter-dropdown-wrap store-inv-filter-sort-wrap">
                  <GlideSelect
                    id="select-sort-inventory"
                    fullWidth
                    options={INVENTORY_SORT_OPTIONS}
                    value={inventorySortFilter}
                    onChange={(val) => setInventorySortFilter(val)}
                    ariaLabel="Sort inventory"
                    showTags
                    accentColor="#ea580c"
                    surfaceColor={inventorySortFilter !== 'default' ? '#fff7ed' : '#ffffff'}
                    borderColor={inventorySortFilter !== 'default' ? '#ea580c' : '#cbd5e1'}
                    textColor={inventorySortFilter !== 'default' ? '#c2410c' : '#0f172a'}
                    highlightColor="#ffedd5"
                    size="md"
                    radius={8}
                    menuWidth={250}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row: Actions & Filter Chips */}
            <div className="store-inv-toolbar-bottom">
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
          </div>

          {/* Catalog Count Summary & Top Quick Nav */}
          <div className="store-inv-count-bar" id="store-inventory-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>
                Showing <strong>{filteredProducts.length === 0 ? 0 : invStartIdx + 1} – {invEndIdx}</strong> of <strong>{filteredProducts.length}</strong> equipment models
                {filteredProducts.length > 0 && (
                  <span style={{ marginLeft: '6px', color: '#64748b', fontSize: '0.8rem', fontWeight: '600' }}>
                    • Segment <strong>{currentInvPage}</strong> of <strong>{totalInvPages}</strong>
                  </span>
                )}
                {inventoryBrandFilter !== 'all' && <span> for <strong>{inventoryBrandFilter}</strong></span>}
                {inventoryCategoryFilter !== 'all' && <span> in <strong>{getCategoryLabel(inventoryCategoryFilter)}</strong></span>}
                {showLowStockOnly && <span style={{ color: '#dc2626', fontWeight: '800' }}> (Low stock only)</span>}
              </span>

              {hasActiveInventoryFilters && (
                <button
                  type="button"
                  onClick={handleResetInventoryFilters}
                  style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', padding: '0 4px' }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Quick mini-switcher at top if multiple segments */}
            {totalInvPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  disabled={currentInvPage === 1}
                  onClick={() => changeInvPage(currentInvPage - 1)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentInvPage === 1 ? '#f8fafc' : '#ffffff',
                    color: currentInvPage === 1 ? '#94a3b8' : '#0f172a',
                    cursor: currentInvPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    fontWeight: '700'
                  }}
                  id="btn-inv-top-prev"
                  title="Previous segment"
                >
                  <ChevronLeft size={13} />
                  <span>Prev</span>
                </button>

                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0f172a', padding: '0 4px' }}>
                  {currentInvPage} / {totalInvPages}
                </span>

                <button
                  type="button"
                  disabled={currentInvPage >= totalInvPages}
                  onClick={() => changeInvPage(currentInvPage + 1)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: currentInvPage >= totalInvPages ? '#f8fafc' : '#ffffff',
                    color: currentInvPage >= totalInvPages ? '#94a3b8' : '#0f172a',
                    cursor: currentInvPage >= totalInvPages ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.76rem',
                    fontWeight: '700'
                  }}
                  id="btn-inv-top-next"
                  title="Next segment"
                >
                  <span>Next</span>
                  <ChevronRight size={13} />
                </button>
              </div>
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
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pagedProducts.map((prod) => {
                const badgeConfig = getBadgeConfig(prod.badge);
                const warrantyText = prod.specs?.warranty || prod.warranty;
                return (
                <div
                  key={prod.id}
                  className="store-product-item-card"
                  id={`store-tool-row-${prod.id}`}
                >
                  <div className="store-product-main-info">
                    <a
                      href={`/product/${prod.id || prod._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="store-product-thumb-link"
                      title={`View ${prod.name} on live store`}
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="store-product-thumbnail"
                      />
                    </a>
                    <div className="store-product-details">
                      <span className="store-product-meta-badge">
                        {prod.brand} • {prod.category}
                      </span>
                      <a
                        href={`/product/${prod.id || prod._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="store-product-title-link"
                        title={`View ${prod.name} on live store`}
                      >
                        <h4 className="store-product-name">
                          {prod.name}
                        </h4>
                        <ExternalLink size={13} className="store-product-ext-icon" />
                      </a>

                      {/* Storefront Highlight Ribbon, Warranty & Cordless Badges */}
                      {(badgeConfig || (warrantyText && warrantyText !== 'No Warranty') || warrantyText === 'No Warranty' || prod.cordless) && (
                        <div className="store-product-badges-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '3px 0 6px' }}>
                          {/* Highlight Ribbon Pill (e.g. Pro Choice, Best Seller, New Arrival, etc.) */}
                          {badgeConfig && (
                            <span
                              className="store-product-badge-pill"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                ...badgeConfig.pillStyle
                              }}
                              onClick={() => openEditProduct(prod)}
                              title={`Storefront Highlight Ribbon: ${badgeConfig.label} (Click Full Edit to change)`}
                            >
                              {badgeConfig.icon}
                              <span>{badgeConfig.label}</span>
                            </span>
                          )}

                          {/* Official Warranty Badge */}
                          {warrantyText && warrantyText !== 'No Warranty' && (
                            <span
                              className="store-product-warranty-pill"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                color: '#16a34a',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                              }}
                              onClick={() => openEditProduct(prod)}
                              title={`Warranty Coverage: ${warrantyText} (Click to edit)`}
                            >
                              <ShieldCheck size={11} strokeWidth={2.2} />
                              <span>{warrantyText}</span>
                            </span>
                          )}

                          {/* No Warranty Pill */}
                          {warrantyText === 'No Warranty' && (
                            <span
                              className="store-product-warranty-pill-none"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.7rem',
                                color: '#64748b',
                                background: '#f1f5f9',
                                border: '1px solid #e2e8f0',
                                padding: '2px 7px',
                                borderRadius: '5px',
                                fontWeight: '500',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                              }}
                              onClick={() => openEditProduct(prod)}
                              title="No Warranty selected (Click to edit)"
                            >
                              <Shield size={11} strokeWidth={2} />
                              <span>No Warranty</span>
                            </span>
                          )}

                          {/* Cordless Badge */}
                          {prod.cordless && (
                            <span
                              className="store-product-cordless-pill"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                color: '#0284c7',
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                padding: '2px 8px',
                                borderRadius: '5px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                              }}
                              onClick={() => openEditProduct(prod)}
                              title="Cordless Battery Equipment (Click to edit)"
                            >
                              <Zap size={11} strokeWidth={2.5} />
                              <span>Cordless</span>
                            </span>
                          )}
                        </div>
                      )}

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
              );
              })}
            </div>

            {/* Inventory Segment-based Pagination Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid #e2e8f0',
                background: '#ffffff',
                borderRadius: '12px'
              }}
              id="store-inventory-bottom-pagination"
            >
              {/* Left: Segment Size Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '600' }}>Segment size:</span>
                {[6, 8, 10, 20].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => { setInvPageSize(sz); setInvPage(1); }}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '6px',
                      border: invPageSize === sz ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                      background: invPageSize === sz ? '#fff7ed' : '#ffffff',
                      color: invPageSize === sz ? '#ea580c' : '#475569',
                      fontWeight: invPageSize === sz ? '800' : '600',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      transition: 'all 0.15s ease'
                    }}
                    title={`Show ${sz} tools per segment`}
                  >
                    {sz}
                  </button>
                ))}
                <span style={{ marginLeft: '4px', fontSize: '0.76rem', color: '#94a3b8' }}>
                  (Showing {filteredProducts.length === 0 ? 0 : invStartIdx + 1}–{invEndIdx} of {filteredProducts.length})
                </span>
              </div>

              {/* Right: Previous, Number Buttons, Next */}
              {totalInvPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button
                    type="button"
                    disabled={currentInvPage === 1}
                    onClick={() => changeInvPage(currentInvPage - 1)}
                    style={{
                      padding: '6px 12px',
                      background: currentInvPage === 1 ? '#f8fafc' : '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '7px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: currentInvPage === 1 ? '#94a3b8' : '#0f172a',
                      cursor: currentInvPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: currentInvPage === 1 ? 'none' : '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    id="btn-inv-bottom-prev"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  {/* Page numbers with smart windowing */}
                  {Array.from({ length: totalInvPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalInvPages || Math.abs(p - currentInvPage) <= 1)
                    .map((pageNum, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && pageNum - prevPage > 1;
                      const isSelected = pageNum === currentInvPage;
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span style={{ padding: '0 4px', color: '#94a3b8', fontSize: '0.8rem' }}>…</span>
                          )}
                          <button
                            type="button"
                            onClick={() => changeInvPage(pageNum)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '7px',
                              border: isSelected ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                              background: isSelected ? '#ea580c' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#0f172a',
                              fontWeight: isSelected ? '800' : '600',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isSelected ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                            id={`btn-inv-page-${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    disabled={currentInvPage >= totalInvPages}
                    onClick={() => changeInvPage(currentInvPage + 1)}
                    style={{
                      padding: '6px 12px',
                      background: currentInvPage >= totalInvPages ? '#f8fafc' : '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '7px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: currentInvPage >= totalInvPages ? '#94a3b8' : '#0f172a',
                      cursor: currentInvPage >= totalInvPages ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: currentInvPage >= totalInvPages ? 'none' : '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    id="btn-inv-bottom-next"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: PROMOTIONS & COUPONS MANAGER (Feature 4) */}
      {activeTab === 'coupons' && (
        <div className="store-tab-content-card">
          <div id="coupons-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => startCouponsTour(true)}
                className="store-action-btn-tour"
                id="btn-start-coupons-tour"
                title="Start Guided Interactive Tour of Coupons"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

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
          <div className="store-section-header" id="repairs-section-header">
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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => startRepairsTour(true)}
                className="store-action-btn-tour"
                id="btn-start-repairs-tour"
                title="Start Guided Interactive Tour of Workshop Repairs"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

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

          {/* Workshop Search Bar */}
          <div style={{ marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search repairs by customer name, phone, tool brand, model, or ticket ID (e.g. VPT-REP-2433)..."
                value={repairsSearch}
                onChange={(e) => setRepairsSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 36px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  background: '#ffffff',
                  color: '#0f172a'
                }}
                id="input-search-repairs"
              />
              {repairsSearch && (
                <button
                  type="button"
                  onClick={() => setRepairsSearch('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {repairsSearch && (
              <span style={{ fontSize: '0.82rem', color: '#ea580c', fontWeight: '700', whiteSpace: 'nowrap' }}>
                Showing {filteredRepairs.length} of {repairs.length} tickets
              </span>
            )}
          </div>

          {loadingRepairs ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading workshop jobs...</div>
          ) : repairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Wrench size={36} style={{ color: '#94a3b8', margin: '0 auto 12px', display: 'block' }} />
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>No Active Repair Jobs</strong>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>Click "Log Inward Tool" to create a new job ticket when a customer brings a broken machine to Poyanil Building.</p>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                No repair tickets found matching "{repairsSearch}"
              </strong>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 12px' }}>
                Try searching by customer name, 10-digit mobile number, or tool name.
              </p>
              <button
                type="button"
                onClick={() => setRepairsSearch('')}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredRepairs.map(job => {
                const isHandedOver = Boolean(job.handoverVerified) || job.status === 'Handed Over';
                return (
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
                  {/* Ready for pickup OTP Banner - OTP is secret, NEVER shown on dashboard! */}
                  {job.status === 'Repaired & Ready' && !isHandedOver && (
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
                        <CheckCircle2 size={22} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: '#0369a1', display: 'block' }}>
                            Repaired &amp; Tested! Secret 4-Digit OTP Sent to Customer
                          </strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                            The secret collection code was sent to <strong>{job.customerName}</strong> ({job.customerPhone}) via WhatsApp. Enter customer's code below to release:
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

                  {isHandedOver && (
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
                        {isHandedOver ? 'Bill: ' : 'Est: '}{formatPrice(job.finalCost || job.estimatedCost || 0)}
                      </span>
                      {job.advancePaid > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700' }}>
                          Advance Paid: {formatPrice(job.advancePaid)}
                        </div>
                      )}
                      {((job.finalCost || job.estimatedCost || 0) - (job.advancePaid || 0)) > 0 && (
                        <div style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '700' }}>
                          Balance Due: {formatPrice(Math.max(0, (job.finalCost || job.estimatedCost || 0) - (job.advancePaid || 0)))}
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

                  {/* Status Stepper - Options 1 & 2 are hidden once handed over to customer */}
                  <div style={{ marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      {isHandedOver ? 'Workshop Ticket Status:' : 'Workshop Progress Stage (Click to update):'}
                    </span>

                    {isHandedOver ? (
                      /* When handed over, DO NOT SHOW stages 1 & 2! Only show completed badge */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '8px 14px', background: '#dcfce7', border: '1.5px solid #86efac', color: '#15803d', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={15} />
                          <span>3. Handed Over to Customer • Ticket Closed</span>
                        </span>
                      </div>
                    ) : (
                      /* Only show stages 1 & 2 if NOT handed over! */
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['Received', 'Repaired & Ready'].map((st, sidx) => {
                          const isCurrent = job.status === st;
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateRepairStatus(job, st)}
                              style={{
                                padding: '7px 16px',
                                borderRadius: '8px',
                                border: isCurrent ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                                background: isCurrent ? '#ea580c' : '#ffffff',
                                color: isCurrent ? '#ffffff' : '#475569',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: isCurrent ? '0 2px 8px rgba(234, 88, 12, 0.25)' : 'none',
                                transition: 'all 0.15s'
                              }}
                            >
                              <span>{sidx + 1}. {st}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditRepair(job)}
                      style={{
                        padding: '6px 12px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#0284c7',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      id={`btn-edit-repair-${job.jobId}`}
                      title="Update bill estimate, added spare parts, and notify customer via WhatsApp"
                    >
                      <Edit3 size={13} />
                      <span>Update Bill &amp; Parts</span>
                    </button>

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
              );
              })}
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
                    background: editingBrandName === b ? '#fff7ed' : '#f8fafc',
                    border: editingBrandName === b ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    transition: 'all 0.15s ease'
                  }}
                  id={`brand-badge-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  {editingBrandName === b ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="text"
                        value={editBrandInput}
                        onChange={(e) => setEditBrandInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleSaveEditBrand(b); }
                          if (e.key === 'Escape') { e.preventDefault(); handleCancelEditBrand(); }
                        }}
                        autoFocus
                        disabled={isUpdatingBrand}
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.82rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          outline: 'none',
                          color: '#0f172a',
                          fontWeight: '700',
                          minWidth: '100px',
                          background: '#ffffff'
                        }}
                        id={`input-edit-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditBrand(b)}
                        disabled={isUpdatingBrand}
                        title="Save brand changes (Enter)"
                        style={{
                          background: '#16a34a',
                          border: 'none',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        id={`btn-save-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <Check size={12} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditBrand}
                        disabled={isUpdatingBrand}
                        title="Cancel (Esc)"
                        style={{
                          background: '#e2e8f0',
                          border: 'none',
                          color: '#475569',
                          borderRadius: '4px',
                          padding: '4px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        id={`btn-cancel-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() => handleStartEditBrand(b)}
                        title={`Edit brand name "${b}"`}
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
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ea580c')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                        id={`btn-edit-brand-${b.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDeleteBrand(b)}
                        title={`Delete brand "${b}"`}
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
                        <X size={13} />
                      </button>
                    </>
                  )}
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
                    background: editingCategoryId === cat.id ? '#fff7ed' : '#f8fafc',
                    border: editingCategoryId === cat.id ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.86rem',
                    transition: 'all 0.15s ease'
                  }}
                  id={`cat-badge-${cat.id}`}
                >
                  {editingCategoryId === cat.id ? (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '180px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Category Name</span>
                        <input
                          type="text"
                          value={editCatNameInput}
                          onChange={(e) => {
                            setEditCatNameInput(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSaveEditCategory(cat.id); }
                            if (e.key === 'Escape') { e.preventDefault(); handleCancelEditCategory(); }
                          }}
                          autoFocus
                          disabled={isUpdatingCat}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.84rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#0f172a',
                            fontWeight: '700',
                            background: '#ffffff'
                          }}
                          id={`input-edit-cat-name-${cat.id}`}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: '140px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>URL Slug (ID)</span>
                        <input
                          type="text"
                          value={editCatSlugInput}
                          onChange={(e) => setEditCatSlugInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); handleSaveEditCategory(cat.id); }
                            if (e.key === 'Escape') { e.preventDefault(); handleCancelEditCategory(); }
                          }}
                          disabled={isUpdatingCat}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.84rem',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#475569',
                            fontFamily: 'var(--font-mono)',
                            background: '#ffffff'
                          }}
                          id={`input-edit-cat-slug-${cat.id}`}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(cat.id)}
                          disabled={isUpdatingCat}
                          className="btn-hero-clean"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#16a34a' }}
                          id={`btn-save-cat-${cat.id}`}
                        >
                          <Check size={14} />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditCategory}
                          disabled={isUpdatingCat}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.78rem',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            color: '#475569',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          id={`btn-cancel-cat-${cat.id}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <strong style={{ color: '#0f172a' }}>{cat.name}</strong>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '8px', fontFamily: 'var(--font-mono)' }}>
                          slug: {cat.id}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          title={`Edit category "${cat.name}"`}
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
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ea580c')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                          id={`btn-edit-cat-${cat.id}`}
                        >
                          <Edit3 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => triggerDeleteCategory(cat.id, cat.name)}
                          title={`Delete category "${cat.name}"`}
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
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CANCELLATION REQUESTS */}
      {activeTab === 'cancellations' && (
        <div className="store-tab-content-card">
          <div id="cancellations-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Customer Cancellation Requests
              </h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
                Review and approve/reject cancellation requests from customers for dispatched orders.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => startCancellationsTour(true)}
                className="store-action-btn-tour"
                id="btn-start-cancellations-tour"
                title="Start Guided Interactive Tour of Cancellation Requests"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

              <button
                onClick={loadOrders}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '9px 14px',
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
            </div>
          </div>


          {pendingCancellationRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <CheckCircle2 size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
                No Pending Requests
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                All cancellation requests have been processed. When customers request to cancel dispatched orders, they will appear here for your review.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingCancellationRequests.map((order) => {
                const courierCfg = resolveCourierConfig(order.courierPartner);
                return (
                  <div
                    key={order.id}
                    style={{
                      background: '#fffbeb',
                      border: '1.5px solid #fde68a',
                      borderRadius: '14px',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.08)'
                    }}
                    id={`cancel-request-${order.id}`}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>{order.id}</strong>
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '2px 10px',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: '800'
                            }}
                          >
                            ⏳ CANCELLATION REQUESTED
                          </span>
                          {order.paymentStatus === 'PAID' && (
                            <span style={{ background: '#ecfdf5', color: '#15803d', border: '1px solid #86efac', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: '800' }}>
                              PAID (Refund Required)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block' }}>
                          Customer: <strong>{order.customer?.name || 'Unknown'}</strong> • Phone: <strong>{order.customer?.phone || 'N/A'}</strong>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {order.paymentMethod}
                        </div>
                      </div>
                    </div>

                    {/* Courier & AWB Info */}
                    <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <CourierLogo partner={order.courierPartner} size="sm" />
                      <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                        <strong>{courierCfg.name}</strong>
                        {order.awb && (
                          <span style={{ marginLeft: '10px', fontFamily: 'var(--font-mono)', color: '#0369a1', fontWeight: '700' }}>
                            AWB: {order.awb}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Reason */}
                    {(order.cancellationRequestReason || order.cancellationReason) && (
                      <div style={{ background: '#ffffff', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '0.86rem' }}>
                        <span style={{ color: '#b45309', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
                          Customer's Cancellation Reason
                        </span>
                        <span style={{ color: '#78350f', fontWeight: '700', lineHeight: 1.5, display: 'block', fontStyle: 'italic' }}>
                          "{order.cancellationRequestReason || order.cancellationReason}"
                        </span>
                      </div>
                    )}

                    {/* Request timestamp */}
                    {order.cancellationRequestedAt && (
                      <div style={{ fontSize: '0.74rem', color: '#a16207', marginBottom: '14px' }}>
                        Requested on: {new Date(order.cancellationRequestedAt).toLocaleDateString()} at {new Date(order.cancellationRequestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    {/* Ordered Items Summary */}
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>
                      <strong>Items:</strong> {order.items?.map(i => `${i.name} (×${i.quantity})`).join(', ')}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleRejectCancellationRequest(order)}
                        disabled={rejectingCancelId === order.id || approvingCancelId === order.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#475569',
                          padding: '9px 16px',
                          borderRadius: '8px',
                          fontSize: '0.84rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: (rejectingCancelId === order.id || approvingCancelId === order.id) ? 0.6 : 1
                        }}
                        id={`btn-reject-cancel-${order.id}`}
                      >
                        <X size={14} />
                        <span>{rejectingCancelId === order.id ? 'Rejecting...' : 'Reject Request'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveCancellationRequest(order)}
                        disabled={approvingCancelId === order.id || rejectingCancelId === order.id}
                        style={{
                          background: '#dc2626',
                          border: 'none',
                          color: '#ffffff',
                          padding: '9px 18px',
                          borderRadius: '8px',
                          fontSize: '0.84rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.2)',
                          opacity: (approvingCancelId === order.id || rejectingCancelId === order.id) ? 0.6 : 1
                        }}
                        id={`btn-approve-cancel-${order.id}`}
                      >
                        <CheckCircle2 size={14} />
                        <span>{approvingCancelId === order.id ? 'Processing Cancel & Refund...' : 'Approve Cancel & Refund'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* REDESIGNED ADD / EDIT PRODUCT MODAL (OUTSIDE CLICK PROTECTED) */}
      <AddEquipmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        editingProduct={editingProduct}
        taxonomy={taxonomy}
        onSaveProduct={handleSaveProduct}
        showAddBrandInline={showAddBrandInline}
        setShowAddBrandInline={setShowAddBrandInline}
        newBrandInput={newBrandInput}
        setNewBrandInput={setNewBrandInput}
        handleAddBrandInline={handleAddBrandInline}
        isAddingBrand={isAddingBrand}
        showAddCatInline={showAddCatInline}
        setShowAddCatInline={setShowAddCatInline}
        newCatNameInput={newCatNameInput}
        setNewCatNameInput={setNewCatNameInput}
        handleAddCategoryInline={handleAddCategoryInline}
        isAddingCat={isAddingCat}
      />

      {/* SPRING CONFIRMATION MODAL FOR DELETING A PRODUCT */}
      <SpringModal
        isOpen={Boolean(productToDelete)}
        setIsOpen={(open) => !open && !isDeleting && setProductToDelete(null)}
        title="Delete Equipment?"
        description="Are you sure you want to delete this tool? It will be permanently removed from the live online catalog and inventory database."
        confirmText={isDeleting ? 'Deleting...' : 'Delete Permanently'}
        cancelText="Cancel"
        variant="danger"
        iconType="trash"
        itemPreview={
          productToDelete && (
            <>
              <img
                src={productToDelete.image}
                alt={productToDelete.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', background: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
              />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fef08a', textTransform: 'uppercase', display: 'block' }}>
                  {productToDelete.brand} • {productToDelete.category}
                </span>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {productToDelete.name}
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#fef08a', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(productToDelete.price)}
                </div>
              </div>
            </>
          )
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setProductToDelete(null)}
      />

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

      {/* TAB 7: CUSTOMER DIRECTORY & CRM (500+ CLIENTS) */}
      {activeTab === 'customers' && (
        <div className="store-tab-content-card">
          <div className="store-section-header" id="customers-section-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} style={{ color: '#ea580c' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Customer Directory & CRM ({filteredCustomers.length})
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '4px 0 0' }}>
                Single source of truth for 500+ customer profiles, lifetime purchase histories, registered addresses, and direct WhatsApp / phone contact.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => startCustomersTour(true)}
                className="store-action-btn-tour"
                id="btn-start-customers-tour"
                title="Start Guided Interactive Tour of Customer Directory"
              >
                <Compass size={14} style={{ color: '#ea580c' }} />
                <span>Take Tour</span>
              </button>

              <button
                type="button"
                onClick={loadCustomers}
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
                id="btn-refresh-customers"
              >
                <RefreshCw size={14} className={loadingCustomers ? 'spin' : ''} />
                <span>Refresh Directory</span>
              </button>
            </div>
          </div>

          {/* CRM KPI Metrics Strip */}
          <div className="store-crm-kpi-grid">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total Registered Clients
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
                {customers.length} <small style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>profiles</small>
              </div>
            </div>

            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Total Customer Revenue
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#047857' }}>
                {formatPrice(customers.reduce((s, c) => s + (c.totalSpent || 0), 0))}
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Repeat Buyers (2+ Orders)
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e40af' }}>
                {customers.filter(c => (c.totalOrders || 0) > 1).length} <small style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: '600' }}>({customers.length > 0 ? Math.round((customers.filter(c => (c.totalOrders || 0) > 1).length / customers.length) * 100) : 0}%)</small>
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px' }}>
              <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Average Spend / Customer
              </span>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#b45309' }}>
                {formatPrice(customers.length > 0 ? Math.round(customers.reduce((s, c) => s + (c.totalSpent || 0), 0) / customers.length) : 0)}
              </div>
            </div>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="store-customer-toolbar">
            <div className="store-customer-search-wrap">
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search customers by name, phone (+91), district, or PIN..."
                value={customersSearch}
                onChange={(e) => setCustomersSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.86rem',
                  outline: 'none',
                  background: '#ffffff'
                }}
                id="input-customer-search"
              />
              {customersSearch && (
                <button
                  type="button"
                  onClick={() => setCustomersSearch('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="store-customer-sort-group">
              <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#475569', whiteSpace: 'nowrap' }}>Sort By:</label>
              <GlideSelect
                id="select-customer-sort"
                options={CUSTOMER_SORT_OPTIONS}
                value={customersSort}
                onChange={(val) => setCustomersSort(val)}
                ariaLabel="Sort customers"
                showTags
                accentColor="#ea580c"
                surfaceColor="#ffffff"
                borderColor="#cbd5e1"
                textColor="#0f172a"
                highlightColor="#fff7ed"
                size="md"
                radius={8}
                menuWidth={260}
              />
            </div>
          </div>

          {/* Customers List Cards */}
          {loadingCustomers ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p>Loading customer database...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Users size={36} style={{ color: '#94a3b8', margin: '0 auto 8px', display: 'block' }} />
              <h4 style={{ color: '#0f172a', marginBottom: '4px' }}>No Customers Found</h4>
              <p style={{ color: '#64748b', fontSize: '0.84rem' }}>
                {customersSearch ? `No customers matched "${customersSearch}". Try searching by 10-digit mobile number.` : 'Customer profiles will automatically appear as orders and repairs are booked.'}
              </p>
            </div>
          ) : (
            <div className="store-customer-list-wrap">
              <div className="store-customer-list-header">
                <span style={{ minWidth: '210px' }}>Customer Profile</span>
                <span style={{ flex: '1 1 220px', minWidth: '180px' }}>Registered Address</span>
                <span style={{ minWidth: '160px', textAlign: 'center' }}>Purchases & Revenue</span>
                <span style={{ minWidth: '180px', textAlign: 'right', paddingRight: '10px' }}>Quick Actions</span>
              </div>

              {filteredCustomers.map((cust) => {
                const isVip = (cust.totalSpent || 0) >= 20000 || (cust.totalOrders || 0) >= 3;
                return (
                  <div
                    key={cust._id || cust.phone}
                    className={`store-customer-row ${isVip ? 'vip' : ''}`}
                  >
                    <div className="store-customer-col-identity">
                      <div className={`store-customer-avatar ${isVip ? 'vip' : ''}`}>
                        {(cust.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cust.name || 'Customer'}
                          </h4>
                          {isVip && (
                            <span style={{ background: '#ffedd5', color: '#ea580c', fontSize: '0.65rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                              ★ VIP
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#0284c7', fontWeight: '700', marginTop: '2px' }}>
                          <Phone size={12} />
                          <a href={`tel:${cust.phone}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                            +91 {cust.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="store-customer-col-address">
                      <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>📍</span>
                      <span style={{ wordBreak: 'break-word' }}>
                        {cust.address ? `${cust.address}, ` : ''}{cust.district || 'Pathanamthitta'}, Kerala{cust.pincode ? ` • PIN: ${cust.pincode}` : ''}
                      </span>
                    </div>

                    <div className="store-customer-col-stats">
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', textAlign: 'center', minWidth: '70px' }}>
                        <div style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', lineHeight: 1 }}>Orders</div>
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>{cust.totalOrders || 0}</strong>
                      </div>

                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', textAlign: 'center', minWidth: '85px' }}>
                        <div style={{ fontSize: '0.64rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: '700', lineHeight: 1 }}>Lifetime</div>
                        <strong style={{ fontSize: '0.88rem', color: '#16a34a' }}>{formatPrice(cust.totalSpent || 0)}</strong>
                      </div>
                    </div>

                    <div className="store-customer-col-actions">
                      <a
                        href={`https://wa.me/91${(cust.phone || '').replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${cust.name || ''}, this is Variathu Power Tools Kozhencherry. We are checking in to see if you require any equipment spares, blades, or servicing support.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#059669',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenCustomerHistoryModal(cust)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1d4ed8',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Eye size={13} />
                        <span>View Profile</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CUSTOMER PROFILE & PURCHASE HISTORY */}
      {selectedCustomerForModal && (
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
          onClick={() => setSelectedCustomerForModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCustomerForModal(null)}
              style={{ position: 'absolute', right: 18, top: 18, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.3rem' }}>
                {(selectedCustomerForModal.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                  {selectedCustomerForModal.name}
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span>📞 +91 {selectedCustomerForModal.phone}</span>
                  {selectedCustomerForModal.email && <span>✉️ {selectedCustomerForModal.email}</span>}
                  <span>📍 {selectedCustomerForModal.district || 'Kerala'}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats Banner */}
            {(() => {
              const activeCustOrders = (customerOrderHistory || []).filter(o => !isCancelledOrder(o));
              const activeCustTotalSpent = activeCustOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
              const activeCustTotalOrders = activeCustOrders.length;
              const totalCancelledAmount = (customerOrderHistory || []).filter(o => isCancelledOrder(o)).reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: '700' }}>LIFETIME SPEND</span>
                    <strong style={{ fontSize: '1.1rem', color: '#16a34a' }}>{formatPrice(activeCustTotalSpent)}</strong>
                    {totalCancelledAmount > 0 && (
                      <span style={{ fontSize: '0.68rem', color: '#dc2626', display: 'block', fontWeight: '700' }}>({formatPrice(totalCancelledAmount)} refunded)</span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: '700' }}>TOTAL ORDERS</span>
                    <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{activeCustTotalOrders} active</strong>
                    {customerOrderHistory.length > activeCustTotalOrders && (
                      <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>({customerOrderHistory.length} total placed)</span>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', fontWeight: '700' }}>CUSTOMER STATUS</span>
                    <strong style={{ fontSize: '0.88rem', color: '#ea580c' }}>
                      {activeCustTotalSpent >= 20000 ? '⭐ VIP Client' : activeCustTotalOrders > 0 ? 'Active Customer' : customerOrderHistory.length > 0 ? 'Cancelled / Refunded' : 'Registered Client'}
                    </strong>
                  </div>
                </div>
              );
            })()}

            {/* Order History */}
            <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingBag size={16} style={{ color: '#ea580c' }} />
              <span>Purchase History ({customerOrderHistory.length} orders)</span>
            </h4>

            {loadingCustomerHistory ? (
              <p style={{ color: '#64748b', fontSize: '0.84rem' }}>Loading purchase history...</p>
            ) : customerOrderHistory.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', marginBottom: '20px' }}>No recorded online orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {customerOrderHistory.map((ord) => {
                  const isCancelled = isCancelledOrder(ord);
                  const isOnline = isOnlinePayment(ord);

                  return (
                    <div
                      key={ord.id}
                      style={{
                        background: isCancelled ? '#fffafb' : '#ffffff',
                        border: isCancelled ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      {/* Top row: Order ID, Date, Delivery, Payment, Status & Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{ord.id}</strong>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: '800',
                                background: isCancelled ? '#fee2e2' : ord.status === 'Completed' ? '#dcfce7' : '#fef3c7',
                                color: isCancelled ? '#dc2626' : ord.status === 'Completed' ? '#15803d' : '#b45309'
                              }}
                            >
                              {isCancelled ? (ord.refundId ? `Cancelled • Refunded (${ord.refundId})` : 'Cancelled') : ord.status}
                            </span>
                            {ord.cancelledBy && (
                              <span style={{ fontSize: '0.68rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '1px 6px', borderRadius: '4px' }}>
                                Cancelled by {ord.cancelledBy}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span>📅 {new Date(ord.date || ord.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{ord.deliveryType === 'store-pickup' ? '🏬 Counter Pickup' : '🚚 Courier Doorstep'}</span>
                            <span>•</span>
                            <span style={{ fontWeight: '700', color: isOnline ? '#16a34a' : '#ea580c' }}>
                              {isOnline ? '💳 Online / UPI' : '💵 Cash at Counter'}
                            </span>
                          </div>
                          {(ord.cancellationReason || ord.cancellationRequestReason) && (
                            <div style={{ marginTop: '6px', padding: '4px 8px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.74rem', color: '#991b1b' }}>
                              <strong>Cancellation Reason:</strong> {ord.cancellationReason || ord.cancellationRequestReason}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', fontSize: '1.05rem', color: isCancelled ? '#94a3b8' : '#16a34a', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                            {formatPrice(ord.totalAmount)}
                          </div>
                          {isCancelled && (
                            <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '800', display: 'block' }}>
                              ₹ Refunded
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Purchased Products / Items Section */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Package size={13} style={{ color: '#ea580c' }} />
                          <span>Purchased Equipment ({(ord.items || []).length})</span>
                        </div>

                        {(ord.items && ord.items.length > 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {ord.items.map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '5px 0',
                                  borderBottom: idx < ord.items.length - 1 ? '1px dashed #e2e8f0' : 'none',
                                  fontSize: '0.82rem'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                                  {it.image ? (
                                    it.product || it.id || it.productId ? (
                                      <a
                                        href={`/product/${it.product || it.id || it.productId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`View ${it.name} on live store`}
                                        style={{ display: 'inline-flex', flexShrink: 0, textDecoration: 'none' }}
                                      >
                                        <img
                                          src={it.image}
                                          alt={it.name}
                                          style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                        />
                                      </a>
                                    ) : (
                                      <img
                                        src={it.image}
                                        alt={it.name}
                                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0', flexShrink: 0 }}
                                      />
                                    )
                                  ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                                      <Package size={16} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    {it.product || it.id || it.productId ? (
                                      <a
                                        href={`/product/${it.product || it.id || it.productId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={`View ${it.name} on live store`}
                                        style={{ fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ea580c'; e.currentTarget.style.textDecoration = 'underline'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.textDecoration = 'none'; }}
                                      >
                                        {it.name}
                                      </a>
                                    ) : (
                                      <span style={{ fontWeight: '700', color: '#0f172a' }}>{it.name}</span>
                                    )}
                                    <span style={{ color: '#64748b', fontSize: '0.76rem', marginLeft: '8px' }}>
                                      Qty: <strong>{it.quantity || 1}</strong> &bull; {formatPrice(it.price)} each
                                    </span>
                                  </div>
                                </div>
                                <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)', fontSize: '0.86rem', flexShrink: 0, marginLeft: '8px' }}>
                                  {formatPrice((it.price || 0) * (it.quantity || 1))}
                                </strong>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            No item breakdown available for this record.
                          </div>
                        )}
                      </div>

                      {/* Invoice & Actions Row */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForInvoice(ord)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1d4ed8',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                          title="View and print official GST tax invoice in A4 format"
                        >
                          <Printer size={14} />
                          <span>View / Print GST Invoice (A4)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Repair Job History */}
            <h4 style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wrench size={16} style={{ color: '#ea580c' }} />
              <span>Workshop Service & Repair Tickets ({customerRepairHistory.length})</span>
            </h4>

            {customerRepairHistory.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', fontStyle: 'italic', marginBottom: '20px' }}>No repair jobs recorded for this phone number.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {customerRepairHistory.map((rep) => (
                  <div key={rep.id || rep.jobId} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.86rem', color: '#0f172a' }}>
                        #{rep.jobId} — {rep.toolBrand} {rep.toolModel}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Issue: {rep.issueDescription}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a' }}>
                        {formatPrice(rep.finalCost || rep.estimatedCost || 0)}
                      </div>
                      <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: rep.status === 'Handed Over' ? '#dcfce7' : '#e0f2fe', color: rep.status === 'Handed Over' ? '#15803d' : '#0284c7', fontWeight: '700' }}>
                        {rep.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedCustomerForModal(null)}
                style={{ padding: '8px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPATCH ORDER VIA DTDC / THE PROFESSIONAL COURIERS                 */}
      {/* ========================================================================= */}
      {dispatchModalOrder && (
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
          onClick={() => setDispatchModalOrder(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Dispatch Courier Shipment
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Order ID: <strong>{dispatchModalOrder.id}</strong> • {dispatchModalOrder.customer?.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Destination Box */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                  Ship To Destination
                </span>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>
                  {dispatchModalOrder.customer?.address || 'Doorstep Delivery'}
                </div>
                <div style={{ color: '#475569', fontSize: '0.76rem' }}>
                  District: {dispatchModalOrder.customer?.district || 'Kerala'} • PIN: {dispatchModalOrder.customer?.pincode || '689641'}
                </div>
              </div>

              {/* Select Courier Partner (4 Partners) */}
              <div>
                <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Select Logistics Partner *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                  {COURIER_PARTNERS.map(cp => {
                    const isSelected = dispatchForm.courierPartner === cp.name;
                    return (
                      <div
                        key={cp.id}
                        onClick={() => {
                          setDispatchForm(prev => ({
                            ...prev,
                            courierPartner: cp.name,
                            awb: prev.awb ? prev.awb : cp.generateAwb()
                          }));
                        }}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${cp.color}` : '1.5px solid #e2e8f0',
                          background: isSelected ? cp.bg : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                          <div
                            style={{
                              height: '34px',
                              background: '#ffffff',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                            }}
                          >
                            <img
                              src={cp.logo}
                              alt={cp.name}
                              style={{ maxHeight: '26px', maxWidth: '120px', objectFit: 'contain' }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                          <span style={{ fontSize: '0.68rem', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', background: isSelected ? cp.color : '#f1f5f9', color: isSelected ? '#ffffff' : '#475569' }}>
                            {cp.badge}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: isSelected ? cp.color : '#0f172a', fontSize: '0.86rem', display: 'block', marginBottom: '2px' }}>{cp.name}</strong>
                          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', lineHeight: 1.3 }}>{cp.tagline}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Consignment AWB input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700' }}>
                    Consignment / AWB / LR Number *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const cfg = resolveCourierConfig(dispatchForm.courierPartner);
                      setDispatchForm(prev => ({ ...prev, awb: cfg.generateAwb() }));
                    }}
                    style={{ fontSize: '0.72rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}
                  >
                    + Auto-Generate Sample AWB
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={dispatchForm.awb}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, awb: e.target.value })}
                  placeholder={resolveCourierConfig(dispatchForm.courierPartner).awbPlaceholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700'
                  }}
                  id="input-dispatch-awb"
                />
                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Enter the consignment / LR number from your physical receipt (DTDC, Professional, Alleppey, or Delhivery).
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px',
                    background: '#ea580c',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  id="btn-confirm-dispatch"
                >
                  <Check size={16} />
                  <span>Confirm Dispatch & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL ORDER & TRIGGER AUTOMATIC ONLINE REFUND (Store Manager)      */}
      {/* ========================================================================= */}
      {orderToCancel && (
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
          onClick={() => !isCancellingOrder && setOrderToCancel(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
            id="modal-store-cancel-order"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Cancel Order {orderToCancel.id}?
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Customer: <strong>{orderToCancel.customer?.name}</strong> ({orderToCancel.customer?.phone}) • Amount: <strong>{formatPrice(orderToCancel.totalAmount)}</strong>
                </span>
              </div>
            </div>

            {orderToCancel.paymentStatus === 'PAID' ? (
              <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.84rem', color: '#166534' }}>
                <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span>⚡ Automatic Full Online Refund</span>
                </div>
                Because this order was paid online via Razorpay/UPI, confirming cancellation will <strong>automatically trigger an immediate full refund of {formatPrice(orderToCancel.totalAmount)}</strong> to the customer's account and restore tool inventory stock.
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.84rem', color: '#475569' }}>
                This order is unpaid / Pay at Store. Cancelling will void the order and restore the reserved tool stock in the catalog.
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.78rem', color: '#334155', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Cancellation Reason (Stored for Records):
              </label>
              <input
                type="text"
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Customer requested cancellation / Out of stock"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  color: '#0f172a'
                }}
                id="input-store-cancel-reason"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={isCancellingOrder}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleConfirmStoreCancel}
                disabled={isCancellingOrder}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  color: '#ffffff',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                }}
                id="btn-confirm-store-cancel"
              >
                {isCancellingOrder ? 'Cancelling & Refunding...' : 'Confirm Cancel & Refund'}
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
                    placeholder="Customer full name"
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Tool Brand
                  </label>
                  <GlideSelect
                    id="select-repair-tool-brand"
                    options={[
                      ...(taxonomy.brands || []).map(b => ({ value: b, label: b })),
                      { value: 'Other', label: 'Other Brand' }
                    ]}
                    value={repairForm.toolBrand || 'Bosch'}
                    onChange={(val) => setRepairForm({ ...repairForm, toolBrand: val })}
                    ariaLabel="Select tool brand for repair"
                    placeholder="Select Brand…"
                    size="lg"
                    radius={8}
                    fullWidth
                    menuWidth="100%"
                    maxHeight={260}
                    align="left"
                    accentColor="#ea580c"
                    surfaceColor="#ffffff"
                    borderColor="#cbd5e1"
                    textColor="#0f172a"
                    highlightColor="#fff7ed"
                  />
                  {repairForm.toolBrand === 'Other' && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#ea580c', marginBottom: '3px' }}>
                        Specify Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. iBell, Dongcheng, Cumi, Foster..."
                        value={repairForm.customBrand || ''}
                        onChange={(e) => setRepairForm({ ...repairForm, customBrand: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #ea580c', borderRadius: '8px', fontSize: '0.84rem' }}
                        id="input-repair-custom-brand"
                      />
                    </div>
                  )}
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
      {/* MODAL: UPDATE REPAIR BILL & SPARE PARTS MODAL                             */}
      {/* ========================================================================= */}
      {editingRepairJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingRepairJob(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: 'var(--shadow-2xl)',
              border: '1px solid #e2e8f0',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} style={{ color: '#ea580c' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Update Bill &amp; Spare Parts
                  </h3>
                  <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Ticket: <strong>{editingRepairJob.jobId}</strong> &bull; {editingRepairJob.toolBrand ? `${editingRepairJob.toolBrand} ` : ''}{editingRepairJob.toolModel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRepairJob(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.82rem' }}>
              <div>Customer: <strong>{editingRepairJob.customerName}</strong> (📞 {editingRepairJob.customerPhone})</div>
              <div style={{ color: '#64748b', marginTop: '2px' }}>
                Initial Issue: <em>{editingRepairJob.issueDescription}</em>
              </div>
            </div>

            <form onSubmit={handleSaveEditRepair} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Revised Total Bill (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 750"
                    value={editRepairForm.estimatedCost}
                    onChange={(e) => setEditRepairForm({ ...editRepairForm, estimatedCost: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #0284c7', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}
                    id="input-edit-repair-cost"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Advance Paid at Counter (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    value={editRepairForm.advancePaid}
                    onChange={(e) => setEditRepairForm({ ...editRepairForm, advancePaid: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem' }}
                    id="input-edit-repair-advance"
                  />
                </div>
              </div>

              {/* Live balance calculation preview */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                <span style={{ color: '#9a3412', fontWeight: '700' }}>Balance Due at Counter Collection:</span>
                <strong style={{ fontSize: '0.95rem', color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                  ₹{Math.max(0, (Number(editRepairForm.estimatedCost) || 0) - (Number(editRepairForm.advancePaid) || 0)).toLocaleString('en-IN')}
                </strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Technician Notes / Replaced Spare Parts
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Replaced armature bearings, changed carbon brushes, stator coil rewound"
                  value={editRepairForm.technicianNotes}
                  onChange={(e) => setEditRepairForm({ ...editRepairForm, technicianNotes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', resize: 'vertical' }}
                  id="input-edit-repair-notes"
                />
                <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Explain what additional parts or labor were required so the customer understands the bill revision.
                </span>
              </div>

              {/* WhatsApp notification checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#166534', fontWeight: '700' }}>
                <input
                  type="checkbox"
                  checked={editRepairForm.sendWhatsApp}
                  onChange={(e) => setEditRepairForm({ ...editRepairForm, sendWhatsApp: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }}
                />
                <span>Send revised estimate &amp; parts update to customer via WhatsApp</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingRepairJob(null)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditRepair}
                  className="btn-hero-clean"
                  style={{ padding: '9px 20px', fontSize: '0.84rem' }}
                  id="btn-submit-edit-repair"
                >
                  {isSubmittingEditRepair ? 'Saving & Sending...' : (editRepairForm.sendWhatsApp ? 'Update & Send WhatsApp' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedOrderForInvoice && (
        <GstInvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
          defaultCopy="Original for Recipient"
          showCopySelector={true}
        />
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
                  {(() => {
                    const cfg = resolveCourierConfig(selectedOrderForLabel.courierPartner);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center' }}>
                          <img
                            src={cfg.logo}
                            alt={cfg.name}
                            style={{ maxHeight: '34px', maxWidth: '180px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextSibling) {
                                e.currentTarget.nextSibling.style.display = 'block';
                              }
                            }}
                          />
                          <strong style={{ display: 'none', fontSize: '1.1rem', fontWeight: '900', color: cfg.color }}>
                            {cfg.badge || cfg.name}
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{ border: '2px solid #000000', padding: '4px 8px', fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                    {selectedOrderForLabel.paymentStatus === 'PAID' ? 'PREPAID' : 'COD - ₹' + selectedOrderForLabel.totalAmount}
                  </div>
                </div>

                {/* Official Code 128 Courier Barcode (Decodable by Handheld Laser/Optical Scanners) */}
                <div style={{ textAlign: 'center', padding: '12px 6px 10px', borderBottom: '2px solid #000000', background: '#ffffff' }}>
                  <Barcode
                    value={selectedOrderForLabel.awb || resolveCourierConfig(selectedOrderForLabel.courierPartner).generateAwb()}
                    width={2}
                    height={62}
                    fontSize={15}
                    displayValue={true}
                  />
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
                    {selectedOrderForLabel.customer?.address || 'Customer Delivery Address'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', marginTop: '2px' }}>
                    District: {selectedOrderForLabel.customer?.district || 'Pathanamthitta'}, KERALA
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', marginTop: '6px', background: '#000000', color: '#ffffff', padding: '4px 8px', display: 'inline-block', letterSpacing: '0.05em' }}>
                    PIN: {selectedOrderForLabel.customer?.pincode || '689641'}
                  </div>
                </div>

                {/* Origin Hub */}
                <div style={{ padding: '10px 0 2px', fontSize: '0.74rem' }}>
                  <div style={{ fontWeight: '800', textTransform: 'uppercase', color: '#333333' }}>
                    SHIPPED BY / ORIGIN HUB:
                  </div>
                  <div style={{ margin: '4px 0' }}>
                    <img
                      src="/Logo.jpeg"
                      alt="Variathu Power Tools"
                      style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                  <div>Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala</div>
                  <div>Helpline: +91 94475 59333</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FULL ORDER & PRODUCTS INSPECTION DETAILS MODAL                     */}
      {/* ========================================================================= */}
      {selectedOrderForDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderForDetails(null);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '860px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>
                    {selectedOrderForDetails.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedOrderForDetails.id);
                      setCopiedOrderId(true);
                      setTimeout(() => setCopiedOrderId(false), 2000);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Copy Order ID"
                  >
                    {copiedOrderId ? <Check size={12} style={{ color: '#4ade80' }} /> : <Copy size={12} />}
                    <span>{copiedOrderId ? 'Copied!' : 'Copy ID'}</span>
                  </button>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: selectedOrderForDetails.deliveryType === 'store-pickup' ? '#0284c7' : '#ea580c',
                    color: '#ffffff'
                  }}>
                    {selectedOrderForDetails.deliveryType === 'store-pickup' ? '🏬 Store Counter Pickup' : '🚚 Express Courier'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
                  Placed on {new Date(selectedOrderForDetails.createdAt || selectedOrderForDetails.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(selectedOrderForDetails.createdAt || selectedOrderForDetails.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: selectedOrderForDetails.paymentStatus === 'PAID' || selectedOrderForDetails.handoverVerified 
                    ? '#166534' 
                    : selectedOrderForDetails.paymentStatus === 'REFUNDED' 
                    ? '#991b1b' 
                    : '#475569',
                  color: '#ffffff'
                }}>
                  {selectedOrderForDetails.paymentStatus === 'REFUNDED'
                    ? 'REFUNDED'
                    : selectedOrderForDetails.paymentStatus === 'PAID'
                    ? 'PAID ONLINE'
                    : selectedOrderForDetails.deliveryType === 'store-pickup'
                    ? (selectedOrderForDetails.handoverVerified ? 'PAID AT COUNTER' : 'PAY AT COUNTER')
                    : 'CASH ON DELIVERY (COD)'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetails(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pickup OTP Banner inside modal if store pickup */}
              {selectedOrderForDetails.deliveryType === 'store-pickup' && (
                <div style={{
                  background: selectedOrderForDetails.handoverVerified ? '#f0fdf4' : '#fff7ed',
                  border: `1.5px solid ${selectedOrderForDetails.handoverVerified ? '#86efac' : '#fed7aa'}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: selectedOrderForDetails.handoverVerified ? '#16a34a' : '#ea580c',
                      color: '#ffffff',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: selectedOrderForDetails.handoverVerified ? '#166534' : '#9a3412' }}>
                        {selectedOrderForDetails.handoverVerified ? '✅ Equipment Handed Over & Verified' : 'Store Pickup Code Verification'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {selectedOrderForDetails.handoverVerified
                          ? `Completed on ${new Date(selectedOrderForDetails.collectedAt || Date.now()).toLocaleString()}`
                          : 'Verify the 4-digit code provided by customer from their account/WhatsApp before handing over equipment.'}
                      </div>
                    </div>
                  </div>

                  {!selectedOrderForDetails.handoverVerified && (
                    <form
                      onSubmit={(e) => handleVerifySingleOrderOtp(e, selectedOrderForDetails.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter OTP"
                        value={orderOtpInputs[selectedOrderForDetails.id] || ''}
                        onChange={(e) => setOrderOtpInputs({ ...orderOtpInputs, [selectedOrderForDetails.id]: e.target.value })}
                        style={{
                          width: '110px',
                          padding: '7px 10px',
                          textAlign: 'center',
                          fontSize: '0.92rem',
                          fontWeight: '800',
                          letterSpacing: '0.12em',
                          fontFamily: 'var(--font-mono)',
                          border: '2px solid #cbd5e1',
                          borderRadius: '6px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={verifyingOrderId === selectedOrderForDetails.id}
                        className="btn-hero-clean"
                        style={{ padding: '7px 14px', fontSize: '0.78rem' }}
                      >
                        {verifyingOrderId === selectedOrderForDetails.id ? 'Verifying...' : 'Verify Handover'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TWO COLUMN CONTENT: LEFT (PRODUCTS), RIGHT (CUSTOMER & SUMMARY) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
                {/* LEFT COLUMN: ORDERED PRODUCTS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <Package size={16} style={{ color: '#ea580c' }} />
                      <span>Ordered Products ({selectedOrderForDetails.items?.length || 0})</span>
                    </h3>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b' }}>
                      Subtotal: {formatPrice(selectedOrderForDetails.items?.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0) || selectedOrderForDetails.totalAmount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedOrderForDetails.items?.map((item, idx) => {
                      const matchedProd = products.find(p =>
                        (p.id && item.id && String(p.id) === String(item.id)) ||
                        (p._id && item.id && String(p._id) === String(item.id)) ||
                        (p.name && item.name && p.name.toLowerCase() === item.name.toLowerCase())
                      );
                      const displayImg = item.image || matchedProd?.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80';
                      const brand = item.brand || matchedProd?.brand || '';
                      const qty = item.quantity || 1;
                      const lineTotal = item.price * qty;

                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            gap: '14px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Large Product Image Thumbnail */}
                          <div style={{
                            width: '76px',
                            height: '76px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            <img
                              src={displayImg}
                              alt={item.name}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80'; }}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          </div>

                          {/* Product Details Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              {brand && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '900',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  color: brand.toLowerCase().includes('dewalt') ? '#b45309' : brand.toLowerCase().includes('bosch') ? '#0284c7' : '#ea580c',
                                  background: brand.toLowerCase().includes('dewalt') ? '#fef3c7' : brand.toLowerCase().includes('bosch') ? '#eff6ff' : '#fff7ed',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  border: `1px solid ${brand.toLowerCase().includes('dewalt') ? '#fde68a' : brand.toLowerCase().includes('bosch') ? '#bfdbfe' : '#fed7aa'}`
                                }}>
                                  {brand}
                                </span>
                              )}
                              {matchedProd?.category && (
                                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', background: '#f1f5f9', padding: '2px 7px', borderRadius: '4px' }}>
                                  {matchedProd.category}
                                </span>
                              )}
                              {matchedProd?.stock !== undefined && (
                                <span style={{
                                  fontSize: '0.68rem',
                                  fontWeight: '700',
                                  color: matchedProd.stock > 3 ? '#166534' : '#dc2626',
                                  background: matchedProd.stock > 3 ? '#ecfdf5' : '#fef2f2',
                                  padding: '2px 7px',
                                  borderRadius: '4px'
                                }}>
                                  📦 {matchedProd.stock > 0 ? `${matchedProd.stock} in inventory` : 'Out of Stock'}
                                </span>
                              )}
                            </div>

                            <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px', lineHeight: '1.35' }}>
                              {item.name}
                            </h4>

                            {matchedProd?.description && (
                              <p style={{ fontSize: '0.74rem', color: '#64748b', margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                                {matchedProd.description}
                              </p>
                            )}

                            {/* Price Breakdown */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                                <span>Unit Price: <strong>{formatPrice(item.price)}</strong></span>
                                <span style={{ margin: '0 6px', color: '#cbd5e1' }}>&bull;</span>
                                <span>Quantity: <strong style={{ color: '#ea580c', background: '#fff7ed', padding: '1px 6px', borderRadius: '4px' }}>x{qty}</strong></span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.96rem', fontWeight: '900', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                                  {formatPrice(lineTotal)}
                                </span>
                              </div>
                            </div>

                            {/* Item Action Links */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '0.74rem' }}>
                              {(item.product || item.id) && (
                                <a
                                  href={`/product/${item.product || item.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#ea580c', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                >
                                  <span>View Live Product in Store</span>
                                  <ExternalLink size={11} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.name);
                                  showNotification(`Copied "${item.name}"`);
                                }}
                                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0, fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              >
                                <Copy size={11} />
                                <span>Copy Title</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT COLUMN: CUSTOMER, DELIVERY & BILLING BREAKDOWN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Customer Information Card */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0f172a', fontWeight: '800', fontSize: '0.84rem' }}>
                      <Users size={14} style={{ color: '#ea580c' }} />
                      <span>Customer Contact</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>
                      {selectedOrderForDetails.customer?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '2px' }}>
                      📞 <a href={`tel:${selectedOrderForDetails.customer?.phone}`} style={{ color: '#ea580c', fontWeight: '700', textDecoration: 'none' }}>
                        {selectedOrderForDetails.customer?.phone}
                      </a>
                    </div>
                    {selectedOrderForDetails.customer?.email && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        ✉️ {selectedOrderForDetails.customer?.email}
                      </div>
                    )}
                    {selectedOrderForDetails.customer?.alternatePhone && (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                        Alt Phone: {selectedOrderForDetails.customer?.alternatePhone}
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                      <a
                        href={`tel:${selectedOrderForDetails.customer?.phone}`}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          fontSize: '0.74rem',
                          fontWeight: '700',
                          color: '#0f172a',
                          textAlign: 'center',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        <Phone size={12} style={{ color: '#ea580c' }} />
                        <span>Call</span>
                      </a>
                      {(() => {
                        const dCourier = resolveCourierConfig(selectedOrderForDetails.courierPartner);
                        const dTrackLink = selectedOrderForDetails.awb ? (dCourier?.trackingUrl || dCourier?.portalUrl || 'https://www.dtdc.com/track-your-shipment/') : '';
                        const waText = selectedOrderForDetails.awb
                          ? `Hello ${selectedOrderForDetails.customer?.name || ''}, your order #${selectedOrderForDetails.id} from Variathu Power Tools has been dispatched!\n\n📦 Delivery Partner: ${dCourier?.name || selectedOrderForDetails.courierPartner}\n🔖 Consignment AWB: ${selectedOrderForDetails.awb}\n🔗 Live Tracking Link: ${dTrackLink}\n\nThank you for choosing Variathu Power Tools, Kozhencherry.`
                          : `Hello ${selectedOrderForDetails.customer?.name || ''}, this is Variathu Power Tools regarding order #${selectedOrderForDetails.id}.`;
                        return (
                          <a
                            href={`https://wa.me/${(selectedOrderForDetails.customer?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waText)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              color: '#15803d',
                              textAlign: 'center',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Delivery / Destination Details Card */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0f172a', fontWeight: '800', fontSize: '0.84rem' }}>
                      <MapPin size={14} style={{ color: '#ea580c' }} />
                      <span>{selectedOrderForDetails.deliveryType === 'store-pickup' ? 'Store Pickup Location' : 'Courier Shipping Destination'}</span>
                    </div>

                    {selectedOrderForDetails.deliveryType === 'store-pickup' ? (
                      <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                        <strong>Variathu Power Tools</strong><br />
                        Poyanil Building, Near St Thomas HSS Ground<br />
                        Poyanil Junction, Kozhencherry - 689641, Kerala<br />
                        <span style={{ color: '#0369a1', fontWeight: '700', marginTop: '4px', display: 'inline-block' }}>
                          🔒 Handover Code: <strong>Customer Verification Required</strong>
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            {selectedOrderForDetails.customer?.addressType || 'HOME'}
                          </span>
                          <strong>{selectedOrderForDetails.customer?.name}</strong>
                        </div>
                        <div>{selectedOrderForDetails.customer?.address || 'Address provided at checkout'}</div>
                        {selectedOrderForDetails.customer?.landmark && (
                          <div style={{ color: '#64748b', fontSize: '0.76rem' }}>Landmark: {selectedOrderForDetails.customer?.landmark}</div>
                        )}
                        <div style={{ fontWeight: '700', marginTop: '2px' }}>
                          {selectedOrderForDetails.customer?.city || selectedOrderForDetails.customer?.district || 'Pathanamthitta'}, PIN: {selectedOrderForDetails.customer?.pincode || '689641'}
                        </div>

                        {/* Courier Dispatch Status */}
                        <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>Courier Partner:</span>
                            {selectedOrderForDetails.courierPartner ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CourierLogo partner={selectedOrderForDetails.courierPartner} size="xs" />
                                <strong>{selectedOrderForDetails.courierPartner}</strong>
                              </div>
                            ) : (
                              <strong>Needs Dispatch</strong>
                            )}
                          </div>
                          {selectedOrderForDetails.awb && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ color: '#64748b' }}>AWB Track No:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#ea580c' }}>{selectedOrderForDetails.awb}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing & Payment Breakdown Card */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#0f172a', fontWeight: '800', fontSize: '0.84rem' }}>
                      <DollarSign size={14} style={{ color: '#ea580c' }} />
                      <span>Payment & Price Breakdown</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Items Subtotal</span>
                        <span style={{ fontWeight: '700', color: '#0f172a' }}>
                          {formatPrice(selectedOrderForDetails.items?.reduce((s, it) => s + (it.price * (it.quantity || 1)), 0) || selectedOrderForDetails.totalAmount)}
                        </span>
                      </div>

                      {selectedOrderForDetails.discountAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                          <span>Coupon Discount {selectedOrderForDetails.couponCode ? `(${selectedOrderForDetails.couponCode})` : ''}</span>
                          <span style={{ fontWeight: '800' }}>-{formatPrice(selectedOrderForDetails.discountAmount)}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Delivery Fee</span>
                        <span style={{ fontWeight: '700', color: selectedOrderForDetails.deliveryFee ? '#0f172a' : '#16a34a' }}>
                          {selectedOrderForDetails.deliveryFee ? formatPrice(selectedOrderForDetails.deliveryFee) : 'FREE'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '4px', borderTop: '1.5px dashed #cbd5e1', fontSize: '0.96rem' }}>
                        <strong style={{ color: '#0f172a' }}>Total Amount:</strong>
                        <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>
                          {formatPrice(selectedOrderForDetails.totalAmount)}
                        </strong>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                        Payment Method: <strong style={{ color: '#0f172a' }}>{selectedOrderForDetails.paymentMethod || (selectedOrderForDetails.paymentStatus === 'PAID' ? 'Razorpay Online UPI' : (selectedOrderForDetails.deliveryType === 'store-pickup' ? 'Cash at Counter' : 'Cash on Delivery (COD)'))}</strong>
                        {selectedOrderForDetails.transactionId && (
                          <div>Txn Ref: <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedOrderForDetails.transactionId}</span></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions Footer */}
            <div style={{
              padding: '14px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#475569' }}>Order Status:</span>
                <select
                  value={selectedOrderForDetails.status}
                  onChange={(e) => handleUpdateOrderStatus(selectedOrderForDetails.id, e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: 'pointer'
                  }}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForInvoice(selectedOrderForDetails)}
                  className="btn-store-action"
                  title="Generate & Print Official A4 GST Tax Invoice"
                >
                  <Printer size={13} style={{ color: '#0284c7' }} />
                  <span>Print GST Invoice</span>
                </button>

                {selectedOrderForDetails.deliveryType !== 'store-pickup' && (
                  <button
                    type="button"
                    onClick={() => setSelectedOrderForLabel(selectedOrderForDetails)}
                    className="btn-store-action"
                    title="Generate & Print 4x6 Thermal Courier Shipping Label"
                  >
                    <Truck size={13} style={{ color: '#ea580c' }} />
                    <span>Print Shipping Label</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetails(null)}
                  style={{
                    padding: '7px 16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4x6 Courier Shipping Label Print Style */}
      <style>{`
        @media print {
          #printable-label-modal-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 380px !important;
            margin: 0 !important;
            padding: 16px !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: 2.5px solid #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            visibility: visible !important;
          }
          #printable-label-modal-content * {
            visibility: visible !important;
          }
          #printable-label-modal-content img {
            visibility: visible !important;
            display: block !important;
            image-rendering: -webkit-optimize-contrast !important;
            image-rendering: pixelated !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
        </div>
      </div>
    </div>
  );
};
