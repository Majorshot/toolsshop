import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Package, MapPin, Truck, CheckCircle2, Clock, MessageCircle, LogOut,
  ShoppingBag, ArrowRight, Phone, RefreshCw, FileText, Printer, Shield, QrCode,
  X, ExternalLink, Navigation, Copy, Check, XCircle, AlertCircle, Edit3, Plus, Trash2,
  Building, Home, Briefcase, LayoutDashboard, ChevronDown, ChevronUp, ArrowLeft, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import GstInvoiceModal from '../components/GstInvoiceModal';
import DashboardSidebar from '../components/DashboardSidebar';
import { useConfirm } from '../components/SpringModal';
import HoverDevCard from '../components/HoverDevCard';
export { HoverDevCard };
import CourierLogo from '../components/CourierLogo';
import { resolveCourierPartner } from '../utils/courierPartners';
export { resolveCourierPartner };

export const CustomerAccountPage = () => {
  const { user, logout, updateUser } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const handleCustomerLogout = () => {
    confirm({
      title: "Sign Out of Account?",
      description: "Are you sure you want to sign out? You will need your mobile phone number to log back into your account.",
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
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // Selected order for GST Invoice modal
  const [customerCancelOrder, setCustomerCancelOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);

  const [cancelReasonPreset, setCancelReasonPreset] = useState('');
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');

  const CANCELLATION_REASONS = [
    'Ordered by mistake / wrong model',
    'Found lower price elsewhere',
    'Delivery time is too long',
    'Want to change delivery address or phone',
    'Specifications don’t fit requirements',
    'Other reason'
  ];

  const handleOpenCustomerCancelModal = (order) => {
    setCustomerCancelOrder(order);
    setCancelReasonPreset('');
    setCancelReasonCustom('');
  };

  // Address & Profile Management (Verified Customer Account)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalTab, setModalTab] = useState('addresses'); // 'addresses' or 'profile'
  const [addressView, setAddressView] = useState('list'); // 'list' or 'form'
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState(null);
  const [pincodeCheck, setPincodeCheck] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    pincode: user?.pincode || '689641',
    locality: user?.locality || '',
    address: user?.address || '',
    city: user?.district || 'Pathanamthitta',
    district: user?.district || 'Pathanamthitta',
    state: user?.state || 'Kerala',
    landmark: user?.landmark || '',
    alternatePhone: user?.alternatePhone || '',
    addressType: 'HOME',
    isDefault: false
  });

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStep, setProfileStep] = useState('form'); // 'form' or 'otp'
  const [profileOtp, setProfileOtp] = useState('');
  const [profileOtpSentTo, setProfileOtpSentTo] = useState('');
  const [profileResendTimer, setProfileResendTimer] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileDevOtp, setProfileDevOtp] = useState(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone ? String(user.phone).replace(/[^0-9]/g, '').slice(-10) : '',
    email: user?.email || ''
  });

  // Sync profileForm when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone ? String(user.phone).replace(/[^0-9]/g, '').slice(-10) : '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (profileResendTimer > 0) {
      const timer = setTimeout(() => setProfileResendTimer(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [profileResendTimer]);

  const handleOpenProfileModal = () => {
    setProfileForm({
      name: user?.name || '',
      phone: user?.phone ? String(user.phone).replace(/[^0-9]/g, '').slice(-10) : '',
      email: user?.email || ''
    });
    setProfileStep('form');
    setProfileOtp('');
    setProfileError('');
    setProfileDevOtp(null);
    setShowProfileModal(true);
  };

  // Open Modal
  const handleOpenAddressModal = (addressToEdit = null) => {
    setModalTab('addresses');
    if (addressToEdit) {
      setEditingAddressId(addressToEdit.id || addressToEdit._id);
      setAddressForm({
        name: addressToEdit.name || user?.name || '',
        phone: addressToEdit.phone || user?.phone || '',
        pincode: addressToEdit.pincode || '689641',
        locality: addressToEdit.locality || '',
        address: addressToEdit.address || '',
        city: addressToEdit.city || addressToEdit.district || 'Pathanamthitta',
        district: addressToEdit.district || 'Pathanamthitta',
        state: addressToEdit.state || 'Kerala',
        landmark: addressToEdit.landmark || '',
        alternatePhone: addressToEdit.alternatePhone || '',
        addressType: addressToEdit.addressType || 'HOME',
        isDefault: Boolean(addressToEdit.isDefault)
      });
      setAddressView('form');
    } else {
      setEditingAddressId(null);
      setAddressView('list');
    }
    setShowAddressModal(true);
  };

  const handleStartAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      name: user?.name || '',
      phone: user?.phone ? String(user.phone).replace(/[^0-9]/g, '').slice(-10) : '',
      pincode: '689641',
      locality: '',
      address: '',
      city: 'Pathanamthitta',
      district: 'Pathanamthitta',
      state: 'Kerala',
      landmark: '',
      alternatePhone: '',
      addressType: 'HOME',
      isDefault: !user?.savedAddresses || user.savedAddresses.length === 0
    });
    setAddressView('form');
    setModalTab('addresses');
    setShowAddressModal(true);
  };

  const handleStartEditAddress = (addr) => {
    if (!addr) return;
    setEditingAddressId(addr.id || addr._id || 'default-1');
    setAddressForm({
      name: addr.name || user?.name || '',
      phone: addr.phone ? String(addr.phone).replace(/[^0-9]/g, '').slice(-10) : (user?.phone ? String(user.phone).replace(/[^0-9]/g, '').slice(-10) : ''),
      pincode: addr.pincode ? String(addr.pincode).trim() : '689641',
      locality: addr.locality || '',
      address: addr.address || '',
      city: addr.city || addr.district || 'Pathanamthitta',
      district: addr.district || 'Pathanamthitta',
      state: addr.state || 'Kerala',
      landmark: addr.landmark || '',
      alternatePhone: addr.alternatePhone ? String(addr.alternatePhone).replace(/[^0-9]/g, '').slice(-10) : '',
      addressType: (addr.addressType || 'HOME').toUpperCase() === 'WORK' ? 'WORK' : 'HOME',
      isDefault: Boolean(addr.isDefault)
    });
    setAddressView('form');
    setModalTab('addresses');
    setShowAddressModal(true);
  };

  // Live Pincode Serviceability & Auto-Fill in CustomerAccountPage
  useEffect(() => {
    const pin = (addressForm.pincode || '').trim().replace(/[^0-9]/g, '');
    if (addressView === 'form' && pin.length === 6) {
      let active = true;
      setPincodeCheck({ checking: true });
      api.checkShippingPincode(pin)
        .then(res => {
          if (active) {
            setPincodeCheck({
              checking: false,
              serviceable: res.serviceable,
              city: res.city || res.district,
              district: res.district,
              state: res.state || 'Kerala'
            });
            if (res.serviceable) {
              setAddressForm(prev => ({
                ...prev,
                city: res.city || res.district || prev.city,
                district: res.district || prev.district,
                state: res.state || 'Kerala',
                locality: (!prev.locality && res.localityHint) ? res.localityHint : prev.locality
              }));
            }
          }
        })
        .catch(() => {
          if (active) setPincodeCheck(null);
        });
      return () => { active = false; };
    } else {
      setPincodeCheck(null);
    }
  }, [addressForm.pincode, addressView]);

  // Use Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data && data.address) {
            const rawPin = data.address.postcode ? String(data.address.postcode).replace(/[^0-9]/g, '').slice(0, 6) : '';
            const locality = data.address.suburb || data.address.neighbourhood || data.address.village || data.address.road || '';
            const district = (data.address.state_district || data.address.county || data.address.city || 'Pathanamthitta').replace(' District', '');
            const state = data.address.state || 'Kerala';

            setAddressForm(prev => ({
              ...prev,
              pincode: rawPin || prev.pincode,
              locality: locality || prev.locality,
              district: district || prev.district,
              city: district || prev.city,
              state: state || prev.state
            }));
          }
        } catch (err) {
          console.warn("Location error:", err);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const customerId = user?.id || user?._id || user?.phone;
      if (!customerId) throw new Error("Customer identifier missing");

      const payload = {
        ...addressForm,
        addressType: addressForm.addressType === 'WORK' ? 'WORK' : 'HOME'
      };

      let updatedCustomer;
      if (editingAddressId) {
        const res = await api.updateCustomerAddress(customerId, editingAddressId, payload);
        updatedCustomer = res.data;
        setAddressFeedback('Delivery address updated successfully!');
      } else {
        const res = await api.addCustomerAddress(customerId, payload);
        updatedCustomer = res.data;
        setAddressFeedback('New delivery address added successfully!');
      }

      if (updatedCustomer) {
        updateUser(updatedCustomer);
      }
      setAddressView('list');
      setEditingAddressId(null);
      setShowAddressModal(false);
      setTimeout(() => setAddressFeedback(null), 5000);
    } catch (err) {
      alert(`Failed to save address: ${err.message}`);
    } finally {
      setSavingAddress(false);
    }
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const customerId = user?.id || user?._id || user?.phone;
      const res = await api.setDefaultCustomerAddress(customerId, addressId);
      if (res.data) {
        updateUser(res.data);
        setAddressFeedback('Default delivery address updated!');
        setTimeout(() => setAddressFeedback(null), 4000);
      }
    } catch (err) {
      alert(`Failed to set default address: ${err.message}`);
    }
  };

  // Delete Address
  const handleDeleteAddress = (addressId) => {
    confirm({
      title: "Delete Delivery Address?",
      description: "Are you sure you want to delete this delivery address? This action cannot be undone.",
      confirmText: "Delete Address",
      cancelText: "Keep Address",
      variant: "danger",
      iconType: "trash",
      onConfirm: async () => {
        try {
          const customerId = user?.id || user?._id || user?.phone;
          const res = await api.deleteCustomerAddress(customerId, addressId);
          if (res.data) {
            updateUser(res.data);
            setAddressFeedback('Delivery address removed.');
            setTimeout(() => setAddressFeedback(null), 4000);
          }
        } catch (err) {
          alert(`Failed to delete address: ${err.message}`);
        }
      }
    });
  };

  // Save Profile Info (Supports Name, Phone & Email with OTP Verification)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    const cleanPhone = String(profileForm.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const cleanEmail = String(profileForm.email || '').trim().toLowerCase();
    const currentPhone = String(user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const currentEmail = String(user?.email || '').trim().toLowerCase();

    if (!profileForm.name.trim()) {
      setProfileError('Full customer name is required.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setProfileError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
      setProfileError('Please enter a valid email address.');
      return;
    }

    const phoneChanged = cleanPhone !== currentPhone;
    const emailChanged = cleanEmail !== currentEmail;

    setSavingProfile(true);
    try {
      const customerId = user?.id || user?._id || currentPhone;
      if (phoneChanged || emailChanged) {
        const res = await api.requestProfileUpdateOtp(customerId, {
          name: profileForm.name.trim(),
          phone: cleanPhone,
          email: cleanEmail
        });
        if (res.requiresOtp) {
          setProfileOtpSentTo(res.maskedDestination || res.maskedPhone);
          if (res.devOtp) setProfileDevOtp(res.devOtp);
          setProfileStep('otp');
          setProfileResendTimer(30);
        } else {
          if (res.data) updateUser(res.data);
          setShowProfileModal(false);
          setAddressFeedback('Account profile updated successfully!');
          setTimeout(() => setAddressFeedback(null), 5000);
        }
      } else {
        const res = await api.updateCustomer(customerId, { name: profileForm.name.trim() });
        if (res.data) {
          updateUser(res.data);
        } else {
          updateUser({ name: profileForm.name.trim() });
        }
        setShowProfileModal(false);
        setAddressFeedback('Account profile updated successfully!');
        setTimeout(() => setAddressFeedback(null), 5000);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Verify OTP for Profile Updates
  const handleVerifyProfileOtp = async (e) => {
    e?.preventDefault();
    if (!profileOtp || profileOtp.trim().length !== 6) {
      setProfileError('Please enter the 6-digit verification code.');
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    try {
      const customerId = user?.id || user?._id || user?.phone;
      const res = await api.verifyProfileUpdateOtp(customerId, { otp: profileOtp.trim() });
      if (res.data) {
        updateUser(res.data);
      }
      if (res.token) {
        try { localStorage.setItem('vpt_token', res.token); } catch {}
      }
      setShowProfileModal(false);
      setAddressFeedback('Account profile & contact details updated successfully!');
      setTimeout(() => setAddressFeedback(null), 5000);
    } catch (err) {
      setProfileError(err.message || 'Invalid or expired OTP');
    } finally {
      setSavingProfile(false);
    }
  };

  // Resend OTP for Profile Updates
  const handleResendProfileOtp = async () => {
    if (profileResendTimer > 0) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      const cleanPhone = String(profileForm.phone || '').replace(/[^0-9]/g, '').slice(-10);
      const cleanEmail = String(profileForm.email || '').trim().toLowerCase();
      const customerId = user?.id || user?._id || user?.phone;
      const res = await api.requestProfileUpdateOtp(customerId, {
        name: profileForm.name.trim(),
        phone: cleanPhone,
        email: cleanEmail
      });
      if (res.devOtp) setProfileDevOtp(res.devOtp);
      setProfileResendTimer(30);
      setAddressFeedback('New security code sent!');
      setTimeout(() => setAddressFeedback(null), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to resend code');
    } finally {
      setSavingProfile(false);
    }
  };

  // Determine if cancel should be instant or request-based
  const isCancelOrderDispatched = (order) => {
    return Boolean(order?.awb && String(order.awb).trim() !== '') || (order?.status || '').toLowerCase().includes('dispatch');
  };

  const handleConfirmCustomerCancel = async () => {
    if (!customerCancelOrder) return;
    
    let finalReason = cancelReasonCustom.trim();
    if (cancelReasonPreset) {
      finalReason = finalReason ? `${cancelReasonPreset}: ${finalReason}` : cancelReasonPreset;
    }
    if (!finalReason) {
      finalReason = 'Customer requested cancellation from account dashboard';
    }

    setCancellingOrder(true);
    try {
      const targetOrderId = customerCancelOrder.id || customerCancelOrder._id;
      if (isCancelOrderDispatched(customerCancelOrder)) {
        // Dispatched order → submit cancellation request
        const res = await api.requestCancellation(targetOrderId, {
          reason: finalReason
        });
        try {
          const bc = new BroadcastChannel('vpt_orders_channel');
          bc.postMessage({ type: 'CANCEL_REQUESTED', orderId: targetOrderId });
          bc.close();
        } catch (e) {}
        setCustomerCancelOrder(null);
        setCancelReasonPreset('');
        setCancelReasonCustom('');
        setCancelFeedback(res.message || 'Cancellation request submitted. Awaiting store approval.');
        setTimeout(() => setCancelFeedback(null), 8000);
      } else {
        // Non-dispatched order → instant cancel
        const res = await api.cancelOrder(targetOrderId, {
          reason: finalReason,
          cancelledBy: 'customer'
        });
        try {
          const bc = new BroadcastChannel('vpt_orders_channel');
          bc.postMessage({ type: 'ORDER_UPDATED', orderId: targetOrderId });
          bc.close();
        } catch (e) {}
        setCustomerCancelOrder(null);
        setCancelReasonPreset('');
        setCancelReasonCustom('');
        setCancelFeedback(res.message || 'Order cancelled successfully.');
        setTimeout(() => setCancelFeedback(null), 6000);
      }
      loadCustomerOrders();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setCancellingOrder(false);
    }
  };

  const userIdentifier = user?.id || user?.phone;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCustomerOrders();

    // Live sync: silent auto-refresh every 12 seconds so status updates (approval/rejection) reflect live
    const interval = setInterval(() => {
      loadCustomerOrders(true);
    }, 12000);

    let bc = null;
    try {
      bc = new BroadcastChannel('vpt_orders_channel');
      bc.onmessage = () => {
        loadCustomerOrders(true);
      };
    } catch (e) {}

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [userIdentifier]);

  const loadCustomerOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Sync fresh profile data from MongoDB Atlas if available
      if (user?.id || user?.phone) {
        try {
          const profileRes = await api.getCustomer(user.id || user.phone);
          if (profileRes?.data) {
            const d = profileRes.data;
            const diffs = {};
            if (d.name && d.name !== user.name) diffs.name = d.name;
            if (d.email && d.email !== user.email) diffs.email = d.email;
            if (d.phone && d.phone !== user.phone) diffs.phone = d.phone;
            if (d.address && d.address !== user.address) diffs.address = d.address;
            if (d.landmark && d.landmark !== user.landmark) diffs.landmark = d.landmark;
            if (d.district && d.district !== user.district) diffs.district = d.district;
            if (d.pincode && d.pincode !== user.pincode) diffs.pincode = d.pincode;

            if (Object.keys(diffs).length > 0) {
              updateUser(diffs);
            }
          }
        } catch (e) {
          // ignore error if profile fetch fails
        }
      }

      const res = await api.getCustomerOrders(user?.id || user?.phone || user?.email || user?.name || '');
      const fetchedOrders = res.data || [];
      setOrders(fetchedOrders);

      // Auto-sync real customer name and email from MongoDB Atlas past orders if placeholder
      if (fetchedOrders.length > 0 && updateUser && user?.name === 'Valued Customer') {
        const orderWithRealName = fetchedOrders.find(
          o => o.customer?.name && o.customer.name.trim() !== '' && !o.customer.name.toLowerCase().includes('valued customer')
        );
        if (orderWithRealName && orderWithRealName.customer?.name) {
          const realName = orderWithRealName.customer.name.trim();
          const realEmail = (orderWithRealName.customer.email || '').trim();
          updateUser({
            name: realName,
            ...(realEmail && !realEmail.includes('valuedcustomer') ? { email: realEmail } : {})
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const formatPrice = (num) => '₹' + Number(num).toLocaleString('en-IN');

  const getWhatsAppInquiry = (order) => {
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI am inquiring about my Order *${order.id}* placed for *${order.customer?.name}*.\nCurrent status shows: ${order.status}.\nPlease let me know when it will be ready.`
    );
    return `https://wa.me/919447559333?text=${text}`;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [sidebarTab, setSidebarTabState] = useState(() => urlTab || 'overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (urlTab && urlTab !== sidebarTab) {
      setSidebarTabState(urlTab);
    } else if (!urlTab && sidebarTab !== 'overview') {
      setSidebarTabState('overview');
    }
  }, [urlTab, sidebarTab]);

  const setSidebarTab = (tabId) => {
    setSidebarTabState(tabId);
    setSearchParams({ tab: tabId });
    if (tabId === 'orders') {
      setExpandedOrders({});
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Always start with all order cards collapsed
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleExpandAllOrders = () => {
    const all = {};
    orders.forEach((o) => {
      all[o.id] = true;
    });
    setExpandedOrders(all);
  };

  const handleCollapseAllOrders = () => {
    setExpandedOrders({});
  };

  if (!user) return null;

  const savedAddressesList = (user.savedAddresses && user.savedAddresses.length > 0)
    ? user.savedAddresses
    : (user.address ? [{
        id: 'default-1',
        name: user.name,
        phone: user.phone,
        address: user.address,
        district: user.district || 'Pathanamthitta',
        state: user.state || 'Kerala',
        pincode: user.pincode || '689641',
        landmark: user.landmark || '',
        addressType: 'HOME',
        isDefault: true
      }] : []);

  const customerSidebarItems = [
    {
      id: 'overview',
      title: 'Overview',
      icon: LayoutDashboard,
      selected: sidebarTab === 'overview',
      onClick: () => setSidebarTab('overview')
    },
    {
      id: 'orders',
      title: `Ordered Products${orders.length > 0 ? ` (${orders.length})` : ''}`,
      icon: Package,
      selected: sidebarTab === 'orders',
      notifs: orders.length > 0 ? orders.length : undefined,
      notifsColor: '#ea580c',
      onClick: () => setSidebarTab('orders')
    },
    {
      id: 'addresses',
      title: `Saved Addresses${savedAddressesList.length > 0 ? ` (${savedAddressesList.length})` : ''}`,
      icon: MapPin,
      selected: sidebarTab === 'addresses',
      notifs: savedAddressesList.length > 0 ? savedAddressesList.length : undefined,
      notifsColor: '#0284c7',
      onClick: () => setSidebarTab('addresses')
    },
    {
      id: 'refresh',
      title: 'Refresh Status',
      icon: RefreshCw,
      onClick: loadCustomerOrders
    }
  ];

  const customerBottomNavItems = [
    {
      id: 'shop-equipment',
      title: 'Shop Equipment',
      icon: ShoppingBag,
      onClick: () => navigate('/shop')
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp Support',
      icon: MessageCircle,
      onClick: () => window.open('https://wa.me/919447559333', '_blank')
    },
    {
      id: 'view-site',
      title: 'Home / Store',
      icon: Home,
      onClick: () => navigate('/')
    },
    {
      id: 'sign-out',
      title: 'Sign Out',
      icon: LogOut,
      variant: 'danger',
      onClick: handleCustomerLogout
    }
  ];

  const renderOrderProductCard = (order) => {
    const isCancelled = (order.status || '').toLowerCase().includes('cancel') || order.paymentStatus === 'REFUNDED';
    const isPickup = order.deliveryType === 'store-pickup';
    const isCompleted = ['delivered', 'completed'].some(w => (order.status || '').toLowerCase().includes(w)) || (isPickup && order.handoverVerified);
    const isDispatched = !isCompleted && (Boolean(order.awb && String(order.awb).trim() !== '') || (order.status || '').toLowerCase().includes('dispatch'));
    const courierCfg = resolveCourierPartner(order.courierPartner);
    const hasPendingCancelRequest = Boolean(order.cancellationRequested && order.status !== 'Cancelled');
    const isExpanded = Boolean(expandedOrders[order.id]);

    const primaryItem = order.items?.[0] || {};
    const otherItemsCount = (order.items?.length || 1) - 1;

    let statusBadgeText = 'Order Placed • Processing at Shop';
    let statusBadgeBg = 'rgba(234, 88, 12, 0.08)';
    let statusBadgeColor = '#ea580c';
    let statusBadgeBorder = 'rgba(234, 88, 12, 0.25)';

    if (isCancelled) {
      statusBadgeText = order.paymentStatus === 'REFUNDED' ? 'Cancelled & Refunded' : 'Order Cancelled';
      statusBadgeBg = '#fef2f2';
      statusBadgeColor = '#dc2626';
      statusBadgeBorder = '#fecaca';
    } else if (hasPendingCancelRequest) {
      statusBadgeText = 'Cancellation Requested • Awaiting Approval';
      statusBadgeBg = '#fffbeb';
      statusBadgeColor = '#b45309';
      statusBadgeBorder = '#fde68a';
    } else if (isCompleted) {
      statusBadgeText = isPickup ? 'Handover Completed' : 'Order Delivered';
      statusBadgeBg = '#ecfdf5';
      statusBadgeColor = '#16a34a';
      statusBadgeBorder = '#bbf7d0';
    } else if (isPickup) {
      if ((order.status || '').toLowerCase().includes('ready')) {
        statusBadgeText = 'Ready for Store Pickup';
        statusBadgeBg = '#eff6ff';
        statusBadgeColor = '#0284c7';
        statusBadgeBorder = '#bae6fd';
      }
    } else {
      if (isDispatched) {
        statusBadgeText = 'Dispatched via Courier';
        statusBadgeBg = '#ecfdf5';
        statusBadgeColor = '#16a34a';
        statusBadgeBorder = '#bbf7d0';
      }
    }

    return (
      <div
        key={order.id}
        className="customer-ordered-product-card"
        id={`customer-order-${order.id}`}
      >
        {/* Compact Summary Header (The Product Detail View) */}
        <div
          className="customer-product-summary-header"
          onClick={() => toggleOrderExpand(order.id)}
        >
          <div className="customer-product-summary-left">
            <img
              src={primaryItem.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'}
              alt={primaryItem.name || 'Equipment'}
              className="customer-product-thumb"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="customer-product-info">
              <h4 className="customer-product-name" title={primaryItem.name}>
                {primaryItem.name || 'Power Tool Equipment'}
                {otherItemsCount > 0 && (
                  <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: '800', marginLeft: '6px' }}>
                    +{otherItemsCount} more item{otherItemsCount > 1 ? 's' : ''}
                  </span>
                )}
              </h4>
              <div className="customer-product-meta">
                <span>Order: <strong style={{ color: '#0f172a' }}>{order.id}</strong></span>
                <span>•</span>
                <span>Qty: {primaryItem.quantity || 1}</span>
                <span>•</span>
                <span>{new Date(order.date).toLocaleDateString()}</span>
                <span>•</span>
                <span
                  style={{
                    background: statusBadgeBg,
                    color: statusBadgeColor,
                    border: `1px solid ${statusBadgeBorder}`,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}
                >
                  ● {statusBadgeText}
                </span>
                <span
                  style={{
                    background: order.paymentStatus === 'REFUNDED' ? '#f0fdf4' : order.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                    color: order.paymentStatus === 'REFUNDED' ? '#059669' : order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                    border: `1px solid ${order.paymentStatus === 'REFUNDED' ? '#a7f3d0' : order.paymentStatus === 'PAID' ? '#86efac' : '#fde68a'}`,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: '800'
                  }}
                >
                  {order.paymentStatus === 'REFUNDED'
                    ? 'REFUNDED'
                    : order.paymentStatus === 'PAID'
                    ? 'PAID (UPI)'
                    : 'CASH ON DELIVERY'}
                </span>
              </div>
            </div>
          </div>

          <div className="customer-product-summary-right">
            <span className="customer-product-price">
              {formatPrice(order.totalAmount)}
            </span>

            <button
              type="button"
              className="customer-product-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleOrderExpand(order.id);
              }}
            >
              <span>{isExpanded ? 'Hide Details' : 'View Order Details'}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Expanded Full Order Body: Delivery Pass, Tracking, All Items, Invoice, Cancellation */}
        {isExpanded && (
          <div className="customer-product-expanded-body">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <span>Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Payment Method: <strong style={{ color: '#0f172a' }}>{order.paymentMethod}</strong></span>
            </div>

            {/* Cancelled View */}
            {isCancelled ? (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '16px'
                }}
                id={`order-cancelled-box-${order.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <XCircle size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      Order Status • Cancelled
                    </span>
                    <strong style={{ fontSize: '0.94rem', color: '#991b1b', lineHeight: 1.3, display: 'block' }}>
                      {order.paymentStatus === 'REFUNDED' ? 'Order Cancelled & Full Refund Processed' : 'Order Cancelled'}
                    </strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: '0 0 10px', lineHeight: 1.5 }}>
                  {order.paymentStatus === 'REFUNDED' ? (
                    <>
                      Your order has been cancelled. An automatic full refund of <strong>{formatPrice(order.totalAmount)}</strong> was initiated to your original payment method. Depending on your bank/UPI app, it will reflect within 1-2 business days.
                    </>
                  ) : (
                    'This order has been cancelled. No payment was charged.'
                  )}
                </p>

                {order.refundId && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#047857', background: '#ecfdf5', padding: '5px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', fontFamily: 'var(--font-mono)', fontWeight: '700', marginBottom: '6px', wordBreak: 'break-all', maxWidth: '100%' }}>
                    <span>⚡ Refund Reference ID: {order.refundId}</span>
                  </div>
                )}

                {(order.cancellationReason || order.cancellationRequestReason) && (
                  <div style={{ background: '#ffffff', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '8px 12px', marginTop: '4px', marginBottom: '8px', fontSize: '0.8rem', color: '#991b1b' }}>
                    <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#b91c1c', fontWeight: '800', display: 'block', marginBottom: '2px' }}>
                      Cancellation Reason:
                    </span>
                    <strong>"{order.cancellationReason || order.cancellationRequestReason}"</strong>
                  </div>
                )}

                {order.cancelledAt && (
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Cancelled on: {new Date(order.cancelledAt).toLocaleDateString()} at {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ) : isPickup ? (
              <div
                style={{
                  background: order.handoverVerified ? '#f8fafc' : 'linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(234, 88, 12, 0.1) 100%)',
                  border: order.handoverVerified ? '1px solid #e2e8f0' : '1.5px dashed #ea580c',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    🏬 Store Counter Pickup Pass
                  </span>
                  <p style={{ fontSize: '0.82rem', color: '#475569', margin: '2px 0 6px' }}>
                    {order.handoverVerified
                      ? '✅ Handover verified by Poyanil counter staff. Equipment collected.'
                      : 'Show this 4-digit code at Poyanil Junction counter to collect your tested tools:'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#64748b' }}>
                    <MapPin size={12} style={{ color: '#ea580c' }} />
                    <a
                      href="https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}
                      title="Open in Google Maps"
                    >
                      Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641 (8 AM - 8 PM)
                    </a>
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                    {order.handoverVerified ? 'VERIFIED OTP' : 'SECRET OTP'}
                  </span>
                  <div
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: '900',
                      letterSpacing: '0.25em',
                      color: order.handoverVerified ? '#16a34a' : '#0f172a',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {order.pickupOtp}
                  </div>
                </div>
              </div>
            ) : isCompleted ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.12) 100%)',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '18px'
                }}
                id={`order-completed-box-${order.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                        flexShrink: 0
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Order Completed • Delivered
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                          Successfully Delivered via {courierCfg.name}
                        </strong>
                        <CourierLogo partner={order.courierPartner} size="xs" />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Consignment handed over to recipient. Thank you for shopping with Variathu Power Tools!
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {order.awb && (
                      <div style={{ fontSize: '0.86rem', color: '#166534', fontFamily: 'var(--font-mono)', fontWeight: '800', background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        AWB: {order.awb}
                      </div>
                    )}
                    {courierCfg.portalUrl && order.awb && (
                      <a
                        href={courierCfg.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>Track on {courierCfg.badge} Website</span>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #dcfce7', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d', fontWeight: '700' }}>
                    <CheckCircle2 size={14} />
                    <span>Official delivery completed. Your official GST Tax Invoice and manufacturer warranty are available below.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <MapPin size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>
                      Delivered To: <strong>{order.customer?.address || 'Customer Address'}, {order.customer?.district || 'Pathanamthitta'}, Kerala {order.customer?.pincode ? `• PIN: ${order.customer.pincode}` : ''}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : !isDispatched ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(234, 88, 12, 0.09) 100%)',
                  border: '1.5px dashed #ea580c',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '18px'
                }}
                id={`order-processing-box-${order.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      Step 1 of 2 • Order Status
                    </span>
                    <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                      Order Placed • Processing at Shop
                    </strong>
                  </div>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                  Our workshop technicians at <strong>Poyanil Building, Kozhencherry</strong> are inspecting, testing, and packaging your power tools. Once handed over to the courier partner, your official AWB consignment number and live tracking button will appear right here.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <MapPin size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
                  <span>
                    Destination: <strong>{order.customer?.address || 'Customer Address'}, {order.customer?.district || 'Pathanamthitta'}, Kerala {order.customer?.pincode ? `• PIN: ${order.customer.pincode}` : ''}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(2, 132, 199, 0.09) 100%)',
                  border: '1.5px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '18px'
                }}
                id={`order-dispatched-box-${order.id}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CourierLogo partner={order.courierPartner} size="md" />
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Step 2 of 2 • Delivery Details
                      </span>
                      <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                        {courierCfg.name}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Dispatched from Poyanil Building, Kozhencherry, Kerala
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '0.86rem', color: '#0369a1', fontFamily: 'var(--font-mono)', fontWeight: '800', background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      AWB: {order.awb}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(order.awb);
                        setCopiedAwb(order.id);
                        setTimeout(() => setCopiedAwb(null), 2000);
                      }}
                      style={{
                        fontSize: '0.76rem',
                        color: copiedAwb === order.id ? '#15803d' : '#334155',
                        background: copiedAwb === order.id ? '#dcfce7' : '#ffffff',
                        border: `1px solid ${copiedAwb === order.id ? '#86efac' : '#cbd5e1'}`,
                        padding: '7px 12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: '700'
                      }}
                      title="Copy AWB Consignment Code"
                      id={`btn-copy-awb-${order.id}`}
                    >
                      {copiedAwb === order.id ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedAwb === order.id ? 'Copied!' : 'Copy AWB'}</span>
                    </button>

                    <a
                      href={courierCfg.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '0.76rem',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: '800',
                        background: courierCfg.color,
                        padding: '7px 14px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                      }}
                      title={`Track live on official ${courierCfg.name} portal`}
                      id={`btn-track-courier-${order.id}`}
                    >
                      <span>Track on {courierCfg.badge} Website</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e0f2fe', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: '600' }}>
                    <Truck size={14} />
                    <span>Live parcel transit movement is tracked directly on the official courier portal using your AWB number above.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <MapPin size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <span>
                      Delivery Destination: <strong>{order.customer?.address || 'Customer Address'}, {order.customer?.district || 'Pathanamthitta'}, Kerala {order.customer?.pincode ? `• PIN: ${order.customer.pincode}` : ''}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Cancellation Requested Banner */}
            {hasPendingCancelRequest && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: '1.5px solid #fde68a',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <AlertCircle size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>
                    Cancellation Request Submitted
                  </strong>
                  <p style={{ fontSize: '0.8rem', color: '#78350f', margin: '2px 0 0', lineHeight: 1.5 }}>
                    Your cancellation request is being reviewed by the store manager at Variathu Power Tools. You'll see the updated status here once it's processed. If approved, a full refund will be initiated automatically.
                  </p>

                  {order.cancellationRequestReason && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.78rem', color: '#92400e' }}>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#b45309', fontWeight: '800', display: 'block', marginBottom: '2px' }}>
                        Your Cancellation Reason:
                      </span>
                      <strong>"{order.cancellationRequestReason}"</strong>
                    </div>
                  )}

                  {order.cancellationRequestedAt && (
                    <span style={{ fontSize: '0.72rem', color: '#a16207', display: 'block', marginTop: '6px' }}>
                      Requested on: {new Date(order.cancellationRequestedAt).toLocaleDateString()} at {new Date(order.cancellationRequestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Complete Items in Order */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.03em' }}>
                Ordered Equipment ({order.items?.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} className="customer-order-item-row">
                    <a
                      href={`/product/${item.product || item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="customer-order-item-link"
                      title="View product details"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="customer-order-item-img"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 className="customer-order-item-name">{item.name}</h4>
                        <span className="customer-order-item-sub">Quantity: {item.quantity}</span>
                      </div>
                    </a>

                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)', flexShrink: 0, paddingLeft: '8px' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons: Cancel, GST Invoice, WhatsApp & Collapse */}
            <div className="customer-order-actions-bar">
              {!isCancelled && !hasPendingCancelRequest && !isCompleted && (
                <button
                  type="button"
                  onClick={() => handleOpenCustomerCancelModal(order)}
                  style={{
                    background: isDispatched ? '#fffbeb' : '#ffffff',
                    border: `1px solid ${isDispatched ? '#fde68a' : '#fecaca'}`,
                    color: isDispatched ? '#b45309' : '#dc2626',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title={isDispatched ? 'Request cancellation for dispatched order (requires store approval)' : 'Cancel order and get immediate automatic refund if paid online'}
                  id={`btn-customer-cancel-${order.id}`}
                >
                  {isDispatched ? <AlertCircle size={15} /> : <XCircle size={15} />}
                  <span>{isDispatched ? 'Request Cancellation' : 'Cancel Order'}</span>
                </button>
              )}

              {/* Show GST Tax Invoice ONLY if order is Dispatched or Completed (Never for Cancelled or Pre-dispatch) */}
              {!isCancelled && (isDispatched || isCompleted) && (
                <button
                  type="button"
                  onClick={() => setInvoiceOrder(order)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Download Official GST B2C Tax Invoice"
                  id={`btn-customer-invoice-${order.id}`}
                >
                  <FileText size={15} style={{ color: '#ea580c' }} />
                  <span>GST Tax Invoice</span>
                </button>
              )}

              {!isCancelled && !isDispatched && !isCompleted && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#64748b',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'default'
                  }}
                  title={isPickup ? "Official GST Tax Invoice will be generated and available once your tools are collected at the counter" : "Official GST Tax Invoice will be generated and available for download once your order is dispatched"}
                >
                  <FileText size={14} style={{ color: '#94a3b8' }} />
                  <span>{isPickup ? 'Invoice on Pickup' : 'Invoice on Dispatch'}</span>
                </span>
              )}

              <a
                href={`https://wa.me/919447559333?text=${encodeURIComponent(`Hello Variathu Power Tools, I have a query about my order ${order.id}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#15803d',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                id={`btn-customer-whatsapp-${order.id}`}
              >
                <MessageCircle size={15} />
                <span>WhatsApp Shop</span>
              </a>

              <button
                type="button"
                onClick={() => toggleOrderExpand(order.id)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronUp size={14} />
                <span>Close Details</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="customer-dashboard-shell">
      <DashboardSidebar
        open={mobileSidebarOpen}
        setOpen={setMobileSidebarOpen}
        title={user.name || 'Valued Customer'}
        subtitle="Customer Account"
        logo={
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              display: 'grid',
              placeContent: 'center',
              fontWeight: '800',
              fontSize: '1rem',
              boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
              flexShrink: 0
            }}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        }
        items={customerSidebarItems}
        bottomItems={customerBottomNavItems}
        onTitleClick={() => handleOpenAddressModal()}
      />

      <div className="customer-dashboard-main-area">
        {/* Mobile Top Navigation Header */}
        <div className="dashboard-mobile-top-bar">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="dashboard-mobile-hamburger-btn"
            id="btn-customer-mobile-menu"
          >
            <Menu size={18} />
            <span>Menu</span>
          </button>

          <div className="dashboard-mobile-brand">
            <span style={{ color: '#ea580c' }}>●</span>
            <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name || 'Account'}
            </span>
          </div>

          <button
            type="button"
            onClick={loadCustomerOrders}
            className="dashboard-mobile-hamburger-btn"
            title="Refresh Orders"
            style={{ padding: '6px 8px' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Mobile 1-Tap Horizontal Tabs Scroll */}
        <div className="dashboard-mobile-tabs-scroll">
          <button
            type="button"
            onClick={() => setSidebarTab('overview')}
            className={`dashboard-mobile-tab-pill ${sidebarTab === 'overview' ? 'active-orange' : ''}`}
          >
            <LayoutDashboard size={14} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('orders')}
            className={`dashboard-mobile-tab-pill ${sidebarTab === 'orders' ? 'active-orange' : ''}`}
          >
            <Package size={14} />
            <span>Ordered Products</span>
            {orders.length > 0 && <span className="tab-pill-notif">{orders.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('addresses')}
            className={`dashboard-mobile-tab-pill ${sidebarTab === 'addresses' ? 'active-orange' : ''}`}
          >
            <MapPin size={14} />
            <span>Saved Addresses</span>
            {savedAddressesList.length > 0 && <span className="tab-pill-notif">{savedAddressesList.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="dashboard-mobile-tab-pill"
          >
            <ShoppingBag size={14} />
            <span>Shop Tools</span>
          </button>
        </div>

        <div className="customer-page-wrapper" style={{ width: '100%', maxWidth: '100%', margin: 0 }}>
      {/* TAB 1: OVERVIEW */}
      {sidebarTab === 'overview' && (
        <>
          {/* Top Customer Banner */}
          <div className="customer-profile-card">
            <div className="customer-profile-top">
              <div className="customer-profile-avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>

              <div className="customer-profile-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {user.name}
                  </h1>
                  <span
                    style={{
                      background: 'rgba(234, 88, 12, 0.08)',
                      color: '#ea580c',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(234, 88, 12, 0.2)'
                    }}
                  >
                    Customer Account
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '3px 0 0' }}>
                  {user.phone ? `+91 ${user.phone}` : user.email} • Kozhencherry, Pathanamthitta
                </p>
              </div>
            </div>

            <div className="customer-profile-actions">
              <button
                type="button"
                onClick={handleOpenProfileModal}
                style={{
                  background: '#fff7ed',
                  border: '1px solid #fdba74',
                  color: '#c2410c',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                id="btn-open-profile-edit"
              >
                <User size={14} />
                <span>Edit Profile</span>
              </button>

              <button
                onClick={loadCustomerOrders}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} />
                <span>Refresh Status</span>
              </button>

              <button
                onClick={handleCustomerLogout}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                id="btn-customer-logout"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Saved Addresses Bar */}
            {(() => {
              const defaultAddr = savedAddressesList.find(a => a.isDefault) || savedAddressesList[0];

              return (
                <div style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '720px' }}>
                    <MapPin size={18} style={{ color: '#ea580c', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: '800' }}>
                          Default Delivery Address & Contact
                        </span>
                        {defaultAddr?.addressType && (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                            {defaultAddr.addressType}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: '600', marginTop: '3px', lineHeight: '1.4' }}>
                        {defaultAddr ? (
                          <span>
                            <strong>{defaultAddr.name}</strong> • {defaultAddr.address}{defaultAddr.locality ? `, ${defaultAddr.locality}` : ''}{defaultAddr.landmark ? `, Near ${defaultAddr.landmark}` : ''}, {defaultAddr.city || defaultAddr.district} - <strong>{defaultAddr.pincode}</strong>
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontStyle: 'italic', fontWeight: '400' }}>
                            No delivery address saved yet. Save an address for 1-click rapid express checkout.
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                        Delivery Mobile: <strong style={{ color: '#334155' }}>+91 {defaultAddr?.phone || user.phone || 'Not set'}</strong> {user.email ? `• Email: ${user.email}` : '• (Add email for Resend receipts)'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSidebarTab('addresses')}
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fdba74',
                      color: '#c2410c',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    id="btn-edit-customer-address"
                  >
                    <MapPin size={14} />
                    <span>{savedAddressesList.length > 0 ? `Manage Addresses (${savedAddressesList.length})` : '+ Add Delivery Address'}</span>
                  </button>
                </div>
              );
            })()}
          </div>


          {/* HoverDevCards Navigation Section (Variathu Brand Colours) */}
          <div style={{ marginTop: '24px', marginBottom: '28px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.12rem', fontWeight: '800', color: '#0f172a', margin: '0 0 3px' }}>
                Account Services & Navigation
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                Direct access to your purchases, delivery destinations, catalog, and Kozhencherry support:
              </p>
            </div>

            <div className="hover-dev-cards-grid">
              <HoverDevCard
                title="Ordered Products"
                subtitle={`${orders.length} orders placed • Live tracking & invoices`}
                Icon={Package}
                badge={`${orders.length} Orders`}
                onClick={() => setSidebarTab('orders')}
              />
              <HoverDevCard
                title="Saved Addresses"
                subtitle={`${savedAddressesList.length} saved delivery destinations in Kerala`}
                Icon={MapPin}
                badge={`${savedAddressesList.length} Saved`}
                onClick={() => setSidebarTab('addresses')}
              />
              <HoverDevCard
                title="Profile & Contact"
                subtitle={`${user.name || 'Customer'} • +91 ${user.phone || 'Manage info'}`}
                Icon={User}
                badge="Verified"
                onClick={handleOpenProfileModal}
              />
              <HoverDevCard
                title="Shop Equipment"
                subtitle="Explore heavy duty power tools & workshop gear"
                Icon={ShoppingBag}
                badge="Catalog"
                onClick={() => navigate('/shop')}
              />
              <HoverDevCard
                title="WhatsApp Support"
                subtitle="Direct chat with Poyanil Junction counter staff"
                Icon={MessageCircle}
                badge="Online"
                onClick={() => window.open('https://wa.me/919447559333', '_blank')}
              />
              <HoverDevCard
                title="Refresh Status"
                subtitle="Sync real-time order tracking & shipments"
                Icon={RefreshCw}
                badge="Live Sync"
                onClick={loadCustomerOrders}
              />
            </div>
          </div>

          {/* Latest Order Preview */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 3px' }}>
                  Latest Order Activity
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  Quick glimpse of your most recent order placed at Variathu Power Tools
                </p>
              </div>

              {orders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSidebarTab('orders')}
                  className="customer-shop-more-link"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#ea580c', fontWeight: '700', fontSize: '0.84rem' }}
                >
                  <span>View All Ordered Products ({orders.length})</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading your latest order status...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
                <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>No Orders Placed Yet</h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px' }}>
                  Browse our heavy duty power tools catalog and place your first order.
                </p>
                <Link to="/shop" className="btn-hero-clean">
                  <span>Explore Equipment Catalog</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              renderOrderProductCard(orders[0])
            )}
          </div>
        </>
      )}

      {/* TAB 2: ORDERED PRODUCTS */}
      {sidebarTab === 'orders' && (
        <>
          {/* Dedicated Page Top Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: '18px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <button
              type="button"
              onClick={() => setSidebarTab('overview')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
              id="btn-customer-back-overview"
            >
              <ArrowLeft size={14} />
              <span>Back to Overview</span>
            </button>

            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: '600' }}>
              Account / <span style={{ color: '#ea580c', fontWeight: '700' }}>Ordered Products</span>
            </div>
          </div>

          {/* Orders Heading */}
          <div className="customer-orders-header">
            <div>
              <h2 className="customer-orders-title">
                Your Ordered Products & Live Status
              </h2>
              <p className="customer-orders-subtitle">
                Showing all {orders.length} orders. Click any product card to view full delivery pass, courier tracking, GST invoice, and cancellation.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {orders.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleExpandAllOrders}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={handleCollapseAllOrders}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Collapse All
                  </button>
                </>
              )}

              <Link to="/shop" className="customer-shop-more-link">
                <span>Shop More Tools</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
              Loading your ordered products...
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center'
              }}
            >
              <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
                No Orders Placed Yet
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px' }}>
                Browse our heavy duty power tools catalog and place your first order.
              </p>
              <Link to="/shop" className="btn-hero-clean">
                <span>Explore Equipment Catalog</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div>
              {orders.map((order) => renderOrderProductCard(order))}
            </div>
          )}
        </>
      )}

      {/* TAB 3: SAVED ADDRESSES */}
      {sidebarTab === 'addresses' && (
        <>
          {/* Dedicated Page Top Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            marginBottom: '18px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <button
              type="button"
              onClick={() => setSidebarTab('overview')}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                color: '#334155',
                cursor: 'pointer'
              }}
              id="btn-addresses-back-overview"
            >
              <ArrowLeft size={14} />
              <span>Back to Overview</span>
            </button>

            <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: '600' }}>
              Account / <span style={{ color: '#ea580c', fontWeight: '700' }}>Saved Addresses</span>
            </div>
          </div>

          <div className="customer-orders-header">
            <div>
              <h2 className="customer-orders-title">
                Saved Delivery Addresses
              </h2>
              <p className="customer-orders-subtitle">
                Manage delivery destinations for rapid 1-click express checkout on Variathu Power Tools.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleStartAddAddress}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={15} />
                <span>Add New Address</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('overview')}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Back to Overview
              </button>
            </div>
          </div>

          {savedAddressesList.length === 0 ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 20px', textAlign: 'center' }}>
              <MapPin size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
                No Delivery Addresses Saved Yet
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px' }}>
                Save your job site, workshop, or home address for rapid express checkout.
              </p>
              <button
                type="button"
                onClick={handleStartAddAddress}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                + Add Delivery Address
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {savedAddressesList.map((addr) => (
                <div
                  key={addr.id || addr._id}
                  style={{
                    background: '#ffffff',
                    border: addr.isDefault ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                        {addr.addressType || 'HOME'}
                      </span>
                      {addr.isDefault && (
                        <span style={{ background: '#ecfdf5', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                          Default Address
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a', margin: '0 0 4px' }}>
                      {addr.name}
                    </h4>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 6px', lineHeight: 1.45 }}>
                      {addr.address}{addr.locality ? `, ${addr.locality}` : ''}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city || addr.district} - <strong>{addr.pincode}</strong>
                    </p>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Phone: <strong style={{ color: '#0f172a' }}>+91 {addr.phone}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id || addr._id)}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStartEditAddress(addr)}
                      style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        color: '#ea580c',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id || addr._id)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {/* GST Invoice Modal */}
      {invoiceOrder && (
        <GstInvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          defaultCopy="Original for Recipient"
          showCopySelector={false}
        />
      )}
      {/* Customer Cancel / Request Cancellation Modal */}
      {customerCancelOrder && (
        <div className="modal-overlay" onClick={() => !cancellingOrder && setCustomerCancelOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', padding: '24px', textAlign: 'left' }}
            id="modal-customer-cancel-order"
          >
            {(() => {
              const isDispatchedModal = isCancelOrderDispatched(customerCancelOrder);
              const hasReasonProvided = Boolean(cancelReasonPreset || cancelReasonCustom.trim());

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDispatchedModal ? '#fef3c7' : '#fee2e2', color: isDispatchedModal ? '#b45309' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isDispatchedModal ? <AlertCircle size={22} /> : <XCircle size={22} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {isDispatchedModal ? 'Request Cancellation' : 'Cancel Order'} {customerCancelOrder.id || customerCancelOrder._id}?
                      </h3>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Total Amount: {formatPrice(customerCancelOrder.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {isDispatchedModal ? (
                    <>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '0.84rem', color: '#92400e' }}>
                        <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span>📦 Order Already Dispatched</span>
                        </div>
                        This order has been dispatched via courier <strong>(AWB: {customerCancelOrder.awb})</strong>. Your cancellation request will be sent to the store manager with your reason for prompt review.
                      </div>
                    </>
                  ) : (
                    <>
                      {customerCancelOrder.paymentStatus === 'PAID' ? (
                        <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '0.84rem', color: '#166534' }}>
                          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span>⚡ Instant Online Refund Guaranteed</span>
                          </div>
                          Because you paid online via Razorpay/UPI, a <strong>full refund of {formatPrice(customerCancelOrder.totalAmount)}</strong> will be automatically refunded to your original payment account.
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '14px' }}>
                          Are you sure you want to cancel this order? This will cancel your equipment reservation at our Poyanil Building counter.
                        </p>
                      )}
                    </>
                  )}

                  {/* CANCELLATION REASON SECTION */}
                  <div style={{ marginBottom: '18px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                      Select Reason for Cancellation <span style={{ color: '#dc2626' }}>*</span>
                    </label>

                    {/* Quick Preset Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      {CANCELLATION_REASONS.map((preset) => {
                        const isSelected = cancelReasonPreset === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCancelReasonPreset(isSelected ? '' : preset)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: isSelected ? '800' : '600',
                              padding: '5px 11px',
                              borderRadius: '20px',
                              border: `1.5px solid ${isSelected ? '#dc2626' : '#cbd5e1'}`,
                              background: isSelected ? '#fee2e2' : '#ffffff',
                              color: isSelected ? '#b91c1c' : '#475569',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Reason Textarea */}
                    <div>
                      <textarea
                        rows={2}
                        value={cancelReasonCustom}
                        onChange={(e) => setCancelReasonCustom(e.target.value)}
                        placeholder="Write additional details or specific reason (optional if chip selected)..."
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          border: '1.5px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: '#0f172a',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          lineHeight: 1.4,
                          background: '#ffffff'
                        }}
                        id="input-customer-cancel-reason"
                      />
                      <span style={{ fontSize: '0.71rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                        ℹ️ This reason will appear in the store manager dashboard and your email confirmation.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerCancelOrder(null);
                        setCancelReasonPreset('');
                        setCancelReasonCustom('');
                      }}
                      disabled={cancellingOrder}
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
                      onClick={handleConfirmCustomerCancel}
                      disabled={cancellingOrder || !hasReasonProvided}
                      style={{
                        background: !hasReasonProvided ? '#94a3b8' : (isDispatchedModal ? '#b45309' : '#dc2626'),
                        border: 'none',
                        color: '#ffffff',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        cursor: hasReasonProvided ? 'pointer' : 'not-allowed',
                        boxShadow: hasReasonProvided ? (isDispatchedModal ? '0 2px 8px rgba(180, 83, 9, 0.25)' : '0 2px 8px rgba(220, 38, 38, 0.25)') : 'none',
                        transition: 'all 0.15s ease'
                      }}
                      id="btn-confirm-customer-cancel"
                      title={!hasReasonProvided ? 'Please select or write a cancellation reason first' : ''}
                    >
                      {cancellingOrder
                        ? (isDispatchedModal ? 'Submitting Request...' : 'Processing Refund...')
                        : (isDispatchedModal ? 'Submit Cancellation Request' : 'Yes, Cancel & Refund')}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Comprehensive Manage Addresses & Profile Modal */}
      {showAddressModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}
          onClick={() => !savingAddress && setShowAddressModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Manage Addresses & Account
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
                  Synced to your primary account (+91 {user?.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                disabled={savingAddress}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => { setModalTab('addresses'); setAddressView('list'); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: modalTab === 'addresses' ? '2px solid #ea580c' : '2px solid transparent',
                  padding: '8px 16px',
                  fontSize: '0.88rem',
                  fontWeight: modalTab === 'addresses' ? '800' : '600',
                  color: modalTab === 'addresses' ? '#ea580c' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Saved Addresses ({user?.savedAddresses?.length || (user?.address ? 1 : 0)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  handleOpenProfileModal();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: modalTab === 'profile' ? '2px solid #ea580c' : '2px solid transparent',
                  padding: '8px 16px',
                  fontSize: '0.88rem',
                  fontWeight: modalTab === 'profile' ? '800' : '600',
                  color: modalTab === 'profile' ? '#ea580c' : '#64748b',
                  cursor: 'pointer'
                }}
              >
                Account Profile
              </button>
            </div>

            {/* TAB 1: SAVED ADDRESSES */}
            {modalTab === 'addresses' && (
              <div>
                {/* LIST VIEW */}
                {addressView === 'list' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                        Your Delivery Addresses
                      </span>
                      <button
                        type="button"
                        onClick={handleStartAddAddress}
                        style={{
                          background: '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus size={14} />
                        <span>Add New Address</span>
                      </button>
                    </div>

                    {/* Addresses list */}
                    {(() => {
                      const list = user?.savedAddresses && user.savedAddresses.length > 0
                        ? user.savedAddresses
                        : (user?.address ? [{
                            id: 'default-1',
                            name: user.name,
                            phone: user.phone,
                            address: user.address,
                            district: user.district || 'Pathanamthitta',
                            state: user.state || 'Kerala',
                            pincode: user.pincode || '689641',
                            landmark: user.landmark || '',
                            addressType: 'HOME',
                            isDefault: true
                          }] : []);

                      if (list.length === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                            <MapPin size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 14px' }}>
                              No delivery address saved yet.
                            </p>
                            <button
                              type="button"
                              onClick={handleStartAddAddress}
                              style={{ background: '#ea580c', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                            >
                              + Add First Delivery Address
                            </button>
                          </div>
                        );
                      }

                      return list.map((addr) => {
                        const isDefault = Boolean(addr.isDefault);
                        return (
                          <div
                            key={addr.id || addr._id}
                            style={{
                              border: isDefault ? '1.5px solid #2874f0' : '1px solid #e2e8f0',
                              background: isDefault ? '#f8faff' : '#ffffff',
                              borderRadius: '10px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  fontSize: '0.7rem',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  {addr.addressType || 'HOME'}
                                </span>
                                <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                                  {addr.name}
                                </strong>
                                {isDefault && (
                                  <span style={{
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    fontSize: '0.7rem',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}>
                                    ✓ DEFAULT ADDRESS
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditAddress(addr)}
                                  style={{
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    color: '#1d4ed8',
                                    fontSize: '0.76rem',
                                    fontWeight: '700',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <Edit3 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id || addr._id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '4px'
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: '1.5' }}>
                              {addr.address}{addr.locality ? `, ${addr.locality}` : ''}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city || addr.district}, {addr.state || 'Kerala'} - <strong>{addr.pincode}</strong>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              <span>Phone: <strong style={{ color: '#0f172a' }}>+91 {addr.phone}</strong></span>
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id || addr._id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ea580c',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Set as Default
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* EDIT / ADD FORM VIEW */}
                {addressView === 'form' && (
                  <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (sidebarTab === 'addresses') {
                            setShowAddressModal(false);
                          } else {
                            setAddressView('list');
                          }
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#2874f0', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        ← Back to Saved Addresses
                      </button>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        style={{
                          background: '#2874f0',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '5px 12px',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Navigation size={12} />
                        <span>{isLocating ? 'Locating...' : 'Use my location'}</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#0f172a' }}>
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </div>

                    {/* Name & Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Recipient Name *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          placeholder="e.g. Midhun Mohan"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>10-Digit Mobile *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                          placeholder="Delivery Phone"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Pincode & Locality */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Pincode *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                          placeholder="e.g. 689642"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                        {pincodeCheck?.serviceable === true && (
                          <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                            ✓ {pincodeCheck.district}, Kerala
                          </span>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Locality / Area *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.locality}
                          onChange={(e) => setAddressForm({ ...addressForm, locality: e.target.value })}
                          placeholder="e.g. Nirannukala Road, Naranganam"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Street Address */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Street / Building / House Address *</label>
                      <textarea
                        rows={2}
                        required
                        value={addressForm.address}
                        onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                        placeholder="House name, Flat No., Street"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* City / District & State */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>City / District *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city || addressForm.district}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value, district: e.target.value })}
                          placeholder="Pathanamthitta"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>State *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state || 'Kerala'}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          placeholder="Kerala"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Landmark & Alternate Phone */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Landmark (Optional)</label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          placeholder="e.g. Near Royal Seals / Temple"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Alternate Phone (Optional)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={addressForm.alternatePhone}
                          onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                          placeholder="Alternate Mobile"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    {/* Address Type: Radio buttons for HOME or WORK */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Address Type *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="accountAddressType"
                            value="HOME"
                            checked={addressForm.addressType === 'HOME'}
                            onChange={() => setAddressForm({ ...addressForm, addressType: 'HOME' })}
                            style={{ accentColor: '#ea580c' }}
                          />
                          <span>Home (All day delivery)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="accountAddressType"
                            value="WORK"
                            checked={addressForm.addressType === 'WORK'}
                            onChange={() => setAddressForm({ ...addressForm, addressType: 'WORK' })}
                            style={{ accentColor: '#ea580c' }}
                          />
                          <span>Work (Delivery 10 AM - 5 PM)</span>
                        </label>
                      </div>
                    </div>

                    {/* Set as default checkbox */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        id="check-default-address"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        style={{ accentColor: '#ea580c', width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="check-default-address" style={{ fontSize: '0.82rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                        Set as my default delivery address
                      </label>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddressModal(false);
                          setAddressView('list');
                        }}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '9px 16px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddress}
                        style={{ background: '#ea580c', border: 'none', color: '#ffffff', padding: '9px 22px', borderRadius: '6px', fontSize: '0.84rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)' }}
                      >
                        {savingAddress ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Account Profile Edit & OTP Verification Modal */}
      {showProfileModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}
          onClick={() => !savingProfile && setShowProfileModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '26px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                  {profileStep === 'otp' ? <Shield size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    {profileStep === 'otp' ? 'Security Verification' : 'Edit Account Profile'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                    {profileStep === 'otp' ? 'Authorize changes to your contact details' : `Account ID: +91 ${user?.phone || 'Customer'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                disabled={savingProfile}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {profileError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#b91c1c' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{profileError}</span>
              </div>
            )}

            {/* STEP 1: FORM */}
            {profileStep === 'form' && (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '5px' }}>
                    Full Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="e.g. Midhun Mohan"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>
                      Registered Mobile Number *
                    </label>
                    {profileForm.phone !== String(user?.phone || '').replace(/[^0-9]/g, '').slice(-10) && (
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: '700' }}>
                        Requires OTP verification
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.88rem', color: '#64748b', fontWeight: '700' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                      placeholder="10-digit mobile number"
                      style={{ width: '100%', padding: '10px 12px 10px 48px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Your primary login number. Changing this requires OTP sent to your current registered contact (+91 {user?.phone}).
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#334155' }}>
                      Email Address (Optional)
                    </label>
                    {profileForm.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase() && (
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: '700' }}>
                        Requires OTP verification
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="e.g. yourname@gmail.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Used for GST tax invoices, courier tracking updates, and warranty receipts.
                  </span>
                </div>

                {(profileForm.phone !== String(user?.phone || '').replace(/[^0-9]/g, '').slice(-10) ||
                  profileForm.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase()) && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '10px 14px', fontSize: '0.78rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ flexShrink: 0 }} />
                    <span>
                      To protect your account, modifying your phone or email will require a 6-digit security OTP sent to your currently registered phone and email.
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 18px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
                    }}
                  >
                    {savingProfile ? 'Processing...' : (
                      profileForm.phone !== String(user?.phone || '').replace(/[^0-9]/g, '').slice(-10) ||
                      profileForm.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase()
                        ? 'Next: Send OTP'
                        : 'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {profileStep === 'otp' && (
              <form onSubmit={handleVerifyProfileOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fff7ed', border: '2px solid #fdba74', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                    <Shield size={24} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
                    Enter 6-Digit Security Code
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
                    We sent a one-time verification code to your current registered contact:<br />
                    <strong style={{ color: '#0f172a' }}>{profileOtpSentTo}</strong>
                  </p>
                </div>

                {/* Changes Summary Pill */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Requested Updates:</div>
                  {profileForm.name !== user?.name && <div>• Name: {profileForm.name}</div>}
                  {profileForm.phone !== String(user?.phone || '').replace(/[^0-9]/g, '').slice(-10) && (
                    <div>• New Mobile: <strong>+91 {profileForm.phone}</strong></div>
                  )}
                  {profileForm.email.trim().toLowerCase() !== String(user?.email || '').trim().toLowerCase() && (
                    <div>• New Email: <strong>{profileForm.email || 'None'}</strong></div>
                  )}
                </div>

                {/* Dev OTP quick helper */}
                {profileDevOtp && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#065f46', textAlign: 'center' }}>
                    Dev Security OTP: <strong style={{ letterSpacing: '2px' }}>{profileDevOtp}</strong>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={profileOtp}
                    onChange={(e) => setProfileOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    style={{
                      width: '100%',
                      padding: '14px 12px',
                      borderRadius: '8px',
                      border: '2px solid #ea580c',
                      fontSize: '1.4rem',
                      fontWeight: '800',
                      letterSpacing: '10px',
                      textAlign: 'center',
                      outline: 'none',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => { setProfileStep('form'); setProfileOtp(''); setProfileError(''); }}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      ← Back to edit details
                    </button>
                    <button
                      type="button"
                      disabled={profileResendTimer > 0 || savingProfile}
                      onClick={handleResendProfileOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: profileResendTimer > 0 ? '#94a3b8' : '#ea580c',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: profileResendTimer > 0 ? 'default' : 'pointer'
                      }}
                    >
                      {profileResendTimer > 0 ? `Resend in ${profileResendTimer}s` : 'Resend Code'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 18px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile || profileOtp.length !== 6}
                    style={{
                      background: profileOtp.length === 6 ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#cbd5e1',
                      border: 'none',
                      color: '#ffffff',
                      padding: '10px 22px',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: profileOtp.length === 6 ? 'pointer' : 'not-allowed',
                      boxShadow: profileOtp.length === 6 ? '0 2px 8px rgba(22, 163, 74, 0.3)' : 'none'
                    }}
                  >
                    {savingProfile ? 'Verifying...' : 'Confirm & Update Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Address Saved Feedback Toast */}
      {addressFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '0.86rem',
            fontWeight: '600',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <span>{addressFeedback}</span>
        </div>
      )}

      {/* Cancellation Feedback Toast */}
      {cancelFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '0.86rem',
            fontWeight: '600',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <span>{cancelFeedback}</span>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
