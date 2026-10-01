import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, MapPin, Truck, ShieldCheck, AlertCircle, ArrowRight,
  User, Lock, Mail, Phone, MessageCircle, FileText, CheckCircle2, ChevronRight, Edit3,
  ShoppingBag, Shield, Check, Package, Building, Plus, Navigation, Home, Briefcase, Trash2,
  Minus, X, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useConfirm } from '../components/SpringModal';
import SlideCommit from '../components/SlideCommit';
import CodeSlots from '../components/CodeSlots';
import { COURIER_PARTNERS } from '../utils/courierPartners';

const KERALA_DISTRICTS = [
  'Pathanamthitta',
  'Kottayam',
  'Alappuzha',
  'Kollam',
  'Ernakulam',
  'Idukki',
  'Thrissur',
  'Palakkad',
  'Malappuram',
  'Kozhikode',
  'Wayanad',
  'Kannur',
  'Kasaragod',
  'Thiruvananthapuram'
];

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Buy Now vs Saved Cart Separation:
  // When a user clicks "Buy Now" on a product, ONLY that single product is billed.
  // Their saved cart items in CartContext remain completely intact and untouched!
  const [buyNowItem, setBuyNowItem] = useState(() => {
    if (location.state?.buyNow === false) {
      try { sessionStorage.removeItem('vpt_buy_now'); } catch {}
      return null;
    }
    if (location.state?.buyNow && location.state?.item) {
      return location.state.item;
    }
    try {
      const saved = sessionStorage.getItem('vpt_buy_now');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isBuyNow = Boolean(buyNowItem);

  const { user, isLoggedIn, login, register, sendOtp, verifyOtp, resendOtp, logout, updateUser } = useAuth();
  const {
    cart,
    clearCart,
    subtotal: cartSubtotal,
    discountAmount: cartDiscountAmount,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    verifyCouponWithPhone,
    deliveryFee: cartDeliveryFee,
    deliveryType,
    setDeliveryType,
    finalTotal: cartFinalTotal,
    updateQuantity: updateCartQuantity,
    removeFromCart: removeCartItem
  } = useCart();
  const { confirm } = useConfirm();

  // The actual items being billed for this checkout
  const checkoutItems = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [buyNowItem];
    }
    return cart || [];
  }, [isBuyNow, buyNowItem, cart]);

  // Calculations scoped strictly to checkoutItems (single product if Buy Now, full cart otherwise)
  const subtotal = useMemo(() => {
    if (isBuyNow) {
      return checkoutItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    }
    return cartSubtotal;
  }, [isBuyNow, checkoutItems, cartSubtotal]);

  const totalCourierFee = useMemo(() => {
    if (isBuyNow) {
      return checkoutItems.reduce((sum, item) => {
        const itemFee = typeof item.deliveryCost === 'number' ? item.deliveryCost : 120;
        return sum + (itemFee * (item.quantity || 1));
      }, 0);
    }
    return cartDeliveryFee;
  }, [isBuyNow, checkoutItems, cartDeliveryFee]);

  const deliveryFee = deliveryType === 'store-pickup' ? 0 : totalCourierFee;

  const discountAmount = useMemo(() => {
    if (!activeCoupon) return 0;
    if (isBuyNow) {
      if (activeCoupon.discountType === 'flat') {
        return Math.min(subtotal, Number(activeCoupon.discountValue) || 0);
      }
      return Math.round((subtotal * (Number(activeCoupon.discountValue) || 0)) / 100);
    }
    return cartDiscountAmount;
  }, [activeCoupon, isBuyNow, subtotal, cartDiscountAmount]);

  const finalTotal = useMemo(() => {
    if (isBuyNow) {
      return Math.max(0, subtotal - discountAmount + deliveryFee);
    }
    return cartFinalTotal;
  }, [isBuyNow, subtotal, discountAmount, deliveryFee, cartFinalTotal]);

  const updateQuantity = (itemId, newQty) => {
    if (isBuyNow && buyNowItem) {
      if (newQty <= 0) {
        removeFromCart(itemId);
        return;
      }
      const maxStock = typeof buyNowItem.stock === 'number' ? buyNowItem.stock : 999;
      const safeQty = Math.min(newQty, maxStock);
      const updated = { ...buyNowItem, quantity: safeQty };
      setBuyNowItem(updated);
      try {
        sessionStorage.setItem('vpt_buy_now', JSON.stringify(updated));
      } catch {}
    } else {
      updateCartQuantity(itemId, newQty);
    }
  };

  const removeFromCart = (itemId) => {
    if (isBuyNow) {
      setBuyNowItem(null);
      try {
        sessionStorage.removeItem('vpt_buy_now');
      } catch {}
      navigate('/shop');
    } else {
      removeCartItem(itemId);
    }
  };

  const isCustomerLoggedIn = isLoggedIn && user && user.role === 'customer';

  // Step state: 'login' | 'address' | 'summary' | 'payment'
  // When already logged in and has an address, default straight to 'summary' (Order Summary)!
  const getInitialStep = () => {
    if (!isCustomerLoggedIn) return 'login';
    if ((user?.savedAddresses && user.savedAddresses.length > 0) || user?.address) {
      return 'summary';
    }
    return 'address';
  };
  const [step, setStep] = useState(getInitialStep);

  // Payment method selection ('razorpay' or 'cash')
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Inline Step 1 Login State (Account Phone is Primary)
  const [loginForm, setLoginForm] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // Phone Lookup & Auto-Detection state
  const [phoneLookup, setPhoneLookup] = useState({
    checking: false,
    checkedPhone: '',
    exists: null,
    customerName: null,
    customerEmail: null,
    hasAddress: false
  });
  const [accountNotice, setAccountNotice] = useState(null);

  // Step 1 Checkout Login & OTP Verification State
  const [checkoutAuthStep, setCheckoutAuthStep] = useState('input'); // 'input' | 'otp'
  const [checkoutOtp, setCheckoutOtp] = useState('');
  const [checkoutOtpStatus, setCheckoutOtpStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [checkoutOtpMasked, setCheckoutOtpMasked] = useState('');
  const [checkoutDevOtp, setCheckoutDevOtp] = useState('');
  const [checkoutResendTimer, setCheckoutResendTimer] = useState(0);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (checkoutResendTimer > 0) {
      timer = setInterval(() => {
        setCheckoutResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [checkoutResendTimer]);

  // Flipkart-Style Delivery Address State
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    pincode: user?.pincode || '689641',
    locality: user?.locality || '',
    address: user?.address || '',
    city: user?.city || user?.district || 'Pathanamthitta',
    district: user?.district || 'Pathanamthitta',
    state: user?.state || 'Kerala',
    landmark: user?.landmark || '',
    alternatePhone: user?.alternatePhone || '',
    addressType: 'HOME' // 'HOME' or 'WORK'
  });

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Address Selection & Management Modal State (Matches Flipkart "Deliver to -> Change" Modal)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalView, setAddressModalView] = useState('list'); // 'list' | 'form'
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [modalAddressForm, setModalAddressForm] = useState({
    name: '',
    phone: '',
    pincode: '689641',
    locality: '',
    address: '',
    city: 'Pathanamthitta',
    district: 'Pathanamthitta',
    state: 'Kerala',
    landmark: '',
    alternatePhone: '',
    addressType: 'HOME', // 'HOME' or 'WORK'
    isDefault: false
  });
  const [modalPincodeCheck, setModalPincodeCheck] = useState(null);
  const [modalIsLocating, setModalIsLocating] = useState(false);
  const [modalIsSaving, setModalIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Coupon inline input
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState(null);
  const successViewRef = useRef(null);

  // Auto-scroll to top when order completes so user always lands at the top of the thank you card
  useEffect(() => {
    if (completedOrder) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      const rAF = requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        if (successViewRef.current) {
          successViewRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      });

      const t1 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }, 50);

      const t2 = setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      }, 150);

      return () => {
        cancelAnimationFrame(rAF);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [completedOrder]);

  // Sync user profile & saved addresses from AuthContext / Atlas
  useEffect(() => {
    if (isCustomerLoggedIn) {
      const saved = user.savedAddresses || [];
      if (saved.length > 0) {
        const defaultAddr = saved.find(a => a.isDefault) || saved[0];
        setSelectedAddressId(defaultAddr.id || defaultAddr._id);
        setDeliveryAddress({
          name: defaultAddr.name || user.name || '',
          phone: defaultAddr.phone || user.phone || '',
          pincode: defaultAddr.pincode || '689641',
          locality: defaultAddr.locality || '',
          address: defaultAddr.address || '',
          city: defaultAddr.city || defaultAddr.district || 'Pathanamthitta',
          district: defaultAddr.district || 'Pathanamthitta',
          state: defaultAddr.state || 'Kerala',
          landmark: defaultAddr.landmark || '',
          alternatePhone: defaultAddr.alternatePhone || '',
          addressType: defaultAddr.addressType || 'HOME'
        });
        setIsAddingNewAddress(false);
        // Automatically land on 'summary' if previously on login
        setStep(prev => (prev === 'login' ? 'summary' : prev));
      } else if (user.address) {
        setDeliveryAddress({
          name: user.name || '',
          phone: user.phone || '',
          pincode: user.pincode || '689641',
          locality: user.locality || '',
          address: user.address || '',
          city: user.district || 'Pathanamthitta',
          district: user.district || 'Pathanamthitta',
          state: user.state || 'Kerala',
          landmark: user.landmark || '',
          alternatePhone: user.alternatePhone || '',
          addressType: 'HOME'
        });
        setIsAddingNewAddress(false);
        setStep(prev => (prev === 'login' ? 'summary' : prev));
      } else {
        setDeliveryAddress({
          name: user.name || '',
          phone: user.phone || '',
          pincode: user.pincode || '689641',
          locality: user.locality || '',
          address: user.address || '',
          city: user.district || 'Pathanamthitta',
          district: user.district || 'Pathanamthitta',
          state: user.state || 'Kerala',
          landmark: user.landmark || '',
          alternatePhone: '',
          addressType: 'HOME'
        });
        setIsAddingNewAddress(true);
        setStep(prev => (prev === 'login' ? 'address' : prev));
      }
    } else {
      setStep('login');
    }
  }, [user, isCustomerLoggedIn]);

  // Live Pincode Serviceability & Auto-Fill for Delivery Address (Flipkart Style)
  useEffect(() => {
    const pin = (deliveryAddress.pincode || '').trim().replace(/[^0-9]/g, '');
    if (deliveryType === 'kerala-courier' && pin.length === 6) {
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
              state: res.state || 'Kerala',
              codAvailable: res.codAvailable,
              message: res.message
            });
            if (res.serviceable) {
              setDeliveryAddress(prev => ({
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
  }, [deliveryAddress.pincode, deliveryType]);

  // Live Pincode Serviceability & Auto-Fill inside Address Modal
  useEffect(() => {
    const pin = (modalAddressForm.pincode || '').trim().replace(/[^0-9]/g, '');
    if (showAddressModal && addressModalView === 'form' && pin.length === 6) {
      let active = true;
      setModalPincodeCheck({ checking: true });
      api.checkShippingPincode(pin)
        .then(res => {
          if (active) {
            setModalPincodeCheck({
              checking: false,
              serviceable: res.serviceable,
              city: res.city || res.district,
              district: res.district,
              state: res.state || 'Kerala'
            });
            if (res.serviceable) {
              setModalAddressForm(prev => ({
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
          if (active) setModalPincodeCheck(null);
        });
      return () => { active = false; };
    } else {
      setModalPincodeCheck(null);
    }
  }, [modalAddressForm.pincode, addressModalView, showAddressModal]);

  // Live Phone Existence Check (Account Lookup)
  useEffect(() => {
    const clean = (loginForm.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (clean.length === 10) {
      let active = true;
      setPhoneLookup(prev => ({ ...prev, checking: true, checkedPhone: clean }));
      api.checkPhone(clean)
        .then(res => {
          if (active) {
            setPhoneLookup({
              checking: false,
              checkedPhone: clean,
              exists: !!res.exists,
              customerName: res.name || null,
              customerEmail: res.email || null,
              hasAddress: !!res.hasAddress
            });
            if (res.exists && res.name) {
              setLoginForm(prev => ({ ...prev, name: res.name }));
            }
          }
        })
        .catch(() => {
          if (active) {
            setPhoneLookup({ checking: false, checkedPhone: clean, exists: null, customerName: null, customerEmail: null, hasAddress: false });
          }
        });
      return () => { active = false; };
    } else {
      setPhoneLookup({ checking: false, checkedPhone: '', exists: null, customerName: null, customerEmail: null, hasAddress: false });
    }
  }, [loginForm.phone]);

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const handleDeliveryAddressChange = (e) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({ ...prev, [name]: value }));
  };

  // HTML5 Browser Geolocation Reverse Lookup (Matches Flipkart "Use my current location")
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

            setDeliveryAddress(prev => ({
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

  // Select a saved address from list
  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr.id || addr._id);
    setDeliveryAddress({
      name: addr.name || user?.name || '',
      phone: addr.phone || user?.phone || '',
      pincode: addr.pincode || '689641',
      locality: addr.locality || '',
      address: addr.address || '',
      city: addr.city || addr.district || 'Pathanamthitta',
      district: addr.district || 'Pathanamthitta',
      state: addr.state || 'Kerala',
      landmark: addr.landmark || '',
      alternatePhone: addr.alternatePhone || '',
      addressType: addr.addressType || 'HOME'
    });
    setIsAddingNewAddress(false);
  };

  // Delete a saved address
  const handleDeleteSavedAddress = (e, addressId) => {
    e.stopPropagation();
    confirm({
      title: "Remove Saved Address?",
      description: "Are you sure you want to remove this delivery address from your account? This action cannot be undone.",
      confirmText: "Remove Address",
      cancelText: "Keep Address",
      variant: "danger",
      iconType: "trash",
      onConfirm: async () => {
        try {
          if (user && (user.id || user._id)) {
            const res = await api.deleteCustomerAddress(user.id || user._id, addressId);
            if (res.success && res.data) {
              updateUser(res.data);
              const remaining = res.data.savedAddresses || [];
              if (remaining.length > 0) {
                handleSelectSavedAddress(remaining[0]);
              } else {
                setIsAddingNewAddress(true);
              }
            }
          }
        } catch (err) {
          console.warn("Delete address notice:", err.message);
        }
      }
    });
  };

  // ============================================================
  // ADDRESS SELECTION & MANAGEMENT MODAL HANDLERS (FLIPKART STYLE)
  // ============================================================

  // Open Address Selection & Management Modal
  const handleOpenAddressModal = () => {
    setAddressModalView('list');
    setEditingAddressId(null);
    setModalError('');
    setShowAddressModal(true);
  };

  // Start Adding New Address inside Modal
  const handleStartAddAddressInModal = () => {
    setEditingAddressId(null);
    setModalAddressForm({
      name: user?.name || '',
      phone: user?.phone || '',
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
    setModalError('');
    setAddressModalView('form');
  };

  // Start Editing Address inside Modal
  const handleStartEditAddressInModal = (addr) => {
    const addrId = addr.id || addr._id;
    setEditingAddressId(addrId);
    setModalAddressForm({
      name: addr.name || user?.name || '',
      phone: addr.phone || user?.phone || '',
      pincode: addr.pincode || '689641',
      locality: addr.locality || '',
      address: addr.address || '',
      city: addr.city || addr.district || 'Pathanamthitta',
      district: addr.district || 'Pathanamthitta',
      state: addr.state || 'Kerala',
      landmark: addr.landmark || '',
      alternatePhone: addr.alternatePhone || '',
      addressType: (addr.addressType || 'HOME').toUpperCase() === 'WORK' ? 'WORK' : 'HOME',
      isDefault: Boolean(addr.isDefault)
    });
    setModalError('');
    setAddressModalView('form');
  };

  // Select Address and Deliver Here from Modal
  const handleSelectAndDeliverFromModal = (addr) => {
    const addrId = addr.id || addr._id;
    setSelectedAddressId(addrId);
    setDeliveryType('kerala-courier');
    setDeliveryAddress({
      name: addr.name || user?.name || '',
      phone: addr.phone || user?.phone || '',
      pincode: addr.pincode || '689641',
      locality: addr.locality || '',
      address: addr.address || '',
      city: addr.city || addr.district || 'Pathanamthitta',
      district: addr.district || 'Pathanamthitta',
      state: addr.state || 'Kerala',
      landmark: addr.landmark || '',
      alternatePhone: addr.alternatePhone || '',
      addressType: (addr.addressType || 'HOME').toUpperCase() === 'WORK' ? 'WORK' : 'HOME'
    });
    setShowAddressModal(false);
  };

  // Modal Geolocation Reverse Lookup
  const handleModalUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setModalIsLocating(true);
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

            setModalAddressForm(prev => ({
              ...prev,
              pincode: rawPin || prev.pincode,
              locality: locality || prev.locality,
              district: district || prev.district,
              city: district || prev.city,
              state: state || prev.state
            }));
          }
        } catch (err) {
          console.warn("Modal location error:", err);
        } finally {
          setModalIsLocating(false);
        }
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setModalIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Save (Create / Update) Address inside Modal and Deliver Here
  const handleModalSaveAddress = async (e) => {
    if (e) e.preventDefault();
    setModalError('');

    if (!modalAddressForm.name?.trim()) {
      setModalError('Please enter recipient name.');
      return;
    }
    const cleanPhone = (modalAddressForm.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setModalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanPin = (modalAddressForm.pincode || '').replace(/[^0-9]/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      setModalError('Please enter a valid 6-digit postal pincode.');
      return;
    }
    if (!modalAddressForm.address?.trim()) {
      setModalError('Please enter street / house / building address.');
      return;
    }

    setModalIsSaving(true);
    try {
      const customerId = user?.id || user?._id || user?.phone;
      const normalizedAddressType = modalAddressForm.addressType === 'WORK' ? 'WORK' : 'HOME';
      const payload = {
        name: modalAddressForm.name.trim(),
        phone: cleanPhone,
        pincode: cleanPin,
        address: modalAddressForm.address.trim(),
        locality: modalAddressForm.locality?.trim() || '',
        city: modalAddressForm.city || modalAddressForm.district || 'Pathanamthitta',
        district: modalAddressForm.district || 'Pathanamthitta',
        state: modalAddressForm.state || 'Kerala',
        landmark: modalAddressForm.landmark?.trim() || '',
        alternatePhone: (modalAddressForm.alternatePhone || '').replace(/[^0-9]/g, '').slice(-10),
        addressType: normalizedAddressType,
        isDefault: Boolean(modalAddressForm.isDefault)
      };

      let targetAddressId = editingAddressId;

      if (editingAddressId) {
        const res = await api.updateCustomerAddress(customerId, editingAddressId, payload);
        if (res.success && res.data) {
          updateUser(res.data);
        }
      } else {
        const res = await api.addCustomerAddress(customerId, payload);
        if (res.success && res.data) {
          updateUser(res.data);
          if (res.address && (res.address.id || res.address._id)) {
            targetAddressId = res.address.id || res.address._id;
          }
        }
      }

      // Automatically apply this saved address to the current checkout order!
      setSelectedAddressId(targetAddressId || 'saved-addr');
      setDeliveryType('kerala-courier');
      setDeliveryAddress({
        name: payload.name,
        phone: payload.phone,
        pincode: payload.pincode,
        locality: payload.locality,
        address: payload.address,
        city: payload.city,
        district: payload.district,
        state: payload.state,
        landmark: payload.landmark,
        alternatePhone: payload.alternatePhone,
        addressType: normalizedAddressType
      });

      setEditingAddressId(null);
      setShowAddressModal(false);
      setAddressModalView('list');
    } catch (err) {
      setModalError(err.message || 'Failed to save address.');
    } finally {
      setModalIsSaving(false);
    }
  };

  // Set Address as Default from inside Modal
  const handleModalSetDefault = async (addressId) => {
    try {
      const customerId = user?.id || user?._id;
      const res = await api.setDefaultCustomerAddress(customerId, addressId);
      if (res.success && res.data) {
        updateUser(res.data);
      }
    } catch (err) {
      console.warn("Set default failed:", err.message);
    }
  };

  // Delete Address from inside Modal
  const handleModalDeleteAddress = (e, addressId) => {
    e.stopPropagation();
    confirm({
      title: "Remove Saved Address?",
      description: "Are you sure you want to remove this delivery address from your account? This action cannot be undone.",
      confirmText: "Remove Address",
      cancelText: "Keep Address",
      variant: "danger",
      iconType: "trash",
      onConfirm: async () => {
        try {
          const customerId = user?.id || user?._id;
          const res = await api.deleteCustomerAddress(customerId, addressId);
          if (res.success && res.data) {
            updateUser(res.data);
            const remaining = res.data.savedAddresses || [];
            if (remaining.length > 0) {
              handleSelectAndDeliverFromModal(remaining[0]);
            }
          }
        } catch (err) {
          console.warn("Delete address failed:", err.message);
        }
      }
    });
  };

  // Step 1: Send OTP to Customer (Phone & Email/WhatsApp)
  const handleSendCheckoutOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (phoneLookup.exists === false) {
      if (!loginForm.name.trim()) {
        setErrorMsg('Please enter your full name to create your account.');
        return;
      }
      if (!loginForm.email.trim() || !loginForm.email.includes('@') || !loginForm.email.includes('.')) {
        setErrorMsg('Please enter a valid email address for tax invoices and security OTP.');
        return;
      }
    }

    setLoginLoading(true);
    try {
      const purpose = phoneLookup.exists === false ? 'register' : 'login';
      const res = await sendOtp({
        phone: cleanPhone,
        purpose,
        name: loginForm.name.trim() || phoneLookup.customerName || '',
        email: loginForm.email.trim()
      });

      setCheckoutAuthStep('otp');
      setCheckoutOtpMasked(res.maskedDestination || `+91 ${cleanPhone}`);
      setCheckoutDevOtp(res.devOtp || '');
      setCheckoutResendTimer(30);
      setCheckoutOtp('');
      setCheckoutOtpStatus('idle');
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Resend OTP
  const handleResendCheckoutOtp = async () => {
    if (checkoutResendTimer > 0 || loginLoading) return;
    setErrorMsg('');
    setLoginLoading(true);
    try {
      const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
      const purpose = phoneLookup.exists === false ? 'register' : 'login';
      const res = await resendOtp({
        phone: cleanPhone,
        purpose
      });
      setCheckoutDevOtp(res.devOtp || '');
      setCheckoutResendTimer(30);
      setCheckoutOtp('');
      setCheckoutOtpStatus('idle');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Verify 6-digit OTP & Authenticate Customer
  const handleVerifyCheckoutOtp = async (e, directCode) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');

    const code = String(directCode || checkoutOtp).replace(/[^0-9]/g, '').trim();
    if (code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      setCheckoutOtpStatus('error');
      return;
    }

    setLoginLoading(true);
    try {
      const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
      const purpose = phoneLookup.exists === false ? 'register' : 'login';
      const res = await verifyOtp({
        phone: cleanPhone,
        otp: code,
        purpose
      });

      setCheckoutOtpStatus('success');
      const verifiedUser = res.user;

      setAccountNotice({
        type: res.isNewAccount ? 'created' : 'existing',
        message: res.isNewAccount
          ? `🎉 Welcome to Variathu Power Tools, ${verifiedUser?.name || 'Customer'}! Your verified account has been created.`
          : `Welcome back, ${verifiedUser?.name || 'Customer'}!`
      });

      // User authenticated! Advance step based on saved addresses
      const saved = verifiedUser?.savedAddresses || [];
      if (saved.length > 0 || verifiedUser?.address) {
        setStep('summary');
      } else {
        setStep('address');
      }
    } catch (err) {
      setCheckoutOtpStatus('error');
      setErrorMsg(err.message || 'Verification failed. Please check the OTP code and try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Save Delivery Address & Return to Order Summary
  const handleSaveAndDeliver = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (deliveryType === 'store-pickup') {
      setStep('summary');
      return;
    }

    if (!deliveryAddress.name.trim()) {
      setErrorMsg('Please enter recipient full name for courier delivery.');
      return;
    }
    const cleanPhone = deliveryAddress.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter recipient 10-digit mobile number.');
      return;
    }
    if (!deliveryAddress.pincode || deliveryAddress.pincode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit postal pincode.');
      return;
    }
    if (!deliveryAddress.address.trim()) {
      setErrorMsg('Please enter house/building/street address.');
      return;
    }

    setIsSavingAddress(true);
    try {
      if (user && (user.id || user._id)) {
        const customerId = user.id || user._id;
        const res = await api.addCustomerAddress(customerId, deliveryAddress);
        if (res.success && res.data) {
          updateUser(res.data);
          if (res.address && res.address.id) {
            setSelectedAddressId(res.address.id);
          }
        }
      }
      setIsAddingNewAddress(false);
      setStep('summary');
    } catch (err) {
      console.warn("Save address notice:", err.message);
      setIsAddingNewAddress(false);
      setStep('summary');
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Step 2 Continue to Payment
  const handleContinueFromSummary = () => {
    setErrorMsg('');
    if (deliveryType === 'kerala-courier') {
      if (!deliveryAddress.address?.trim()) {
        setErrorMsg('Please provide a delivery address before continuing.');
        setStep('address');
        return;
      }
      if (!deliveryAddress.pincode || deliveryAddress.pincode.trim().length !== 6) {
        setErrorMsg('Please provide a valid 6-digit postal pincode.');
        setStep('address');
        return;
      }
    }
    setStep('payment');
  };

  // Inline Coupon Apply
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setErrorMsg('');
    try {
      const userIdent = {
        customerId: user?.id || user?._id,
        phone: user?.phone || loginForm.phone,
        email: user?.email || loginForm.email
      };
      const res = await applyCoupon(couponInput.trim(), userIdent);
      if (res && res.success) {
        setCouponInput('');
      } else {
        setErrorMsg(res?.message || 'Invalid or already redeemed coupon code.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Submit Order & Payment Handling
  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!isCustomerLoggedIn) {
      setStep('login');
      const msg = 'Please sign in with your mobile number to complete your order.';
      setErrorMsg(msg);
      throw new Error(msg);
    }

    const cleanAccountPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (cleanAccountPhone.length !== 10) {
      setStep('login');
      const msg = 'Valid 10-digit mobile number is required on customer account.';
      setErrorMsg(msg);
      throw new Error(msg);
    }

    if (deliveryType === 'kerala-courier' && !deliveryAddress.address?.trim()) {
      setStep('address');
      const msg = 'Please specify a delivery street address.';
      setErrorMsg(msg);
      throw new Error(msg);
    }

    // Final anti-abuse check for single-use coupon
    if (activeCoupon && Number(activeCoupon.usageLimitPerUser) === 1) {
      const userIdent = {
        customerId: user?.id || user?._id,
        phone: cleanAccountPhone,
        email: user?.email
      };
      const vRes = await verifyCouponWithPhone(userIdent, { silent: true });
      if (vRes && !vRes.valid) {
        const msg = vRes.message || 'This coupon has already been redeemed by your account.';
        setErrorMsg(msg);
        throw new Error(msg);
      }
    }

    setIsSubmitting(true);

    try {
      const isPrepaid = paymentMethod === 'razorpay';
      const recipientName = deliveryType === 'store-pickup'
        ? (user?.name || 'Customer')
        : (deliveryAddress.name?.trim() || user?.name || 'Customer');

      const recipientPhone = deliveryType === 'store-pickup'
        ? cleanAccountPhone
        : (deliveryAddress.phone?.replace(/[^0-9]/g, '').slice(-10) || cleanAccountPhone);

      const formattedDeliveryAddress = deliveryType === 'store-pickup'
        ? 'Poyanil Building Store Pickup, Kozhencherry, Kerala - 689641'
        : `${deliveryAddress.address?.trim()}${deliveryAddress.locality ? ', ' + deliveryAddress.locality.trim() : ''}${deliveryAddress.landmark ? ', near ' + deliveryAddress.landmark.trim() : ''}, ${deliveryAddress.city || deliveryAddress.district || 'Pathanamthitta'}, ${deliveryAddress.state || 'Kerala'} - ${deliveryAddress.pincode || '689641'}`;

      const orderPayload = {
        customerId: user?.id || user?._id,
        customer: {
          name: user?.name?.trim() || recipientName,
          phone: cleanAccountPhone,
          email: (user?.email || '').trim(),
          recipientName,
          recipientPhone,
          address: formattedDeliveryAddress,
          street: deliveryAddress.address,
          locality: deliveryAddress.locality,
          city: deliveryAddress.city || deliveryAddress.district || 'Pathanamthitta',
          district: deliveryAddress.district || 'Pathanamthitta',
          state: deliveryAddress.state || 'Kerala',
          pincode: deliveryAddress.pincode || '689641',
          landmark: deliveryAddress.landmark || '',
          alternatePhone: deliveryAddress.alternatePhone || '',
          addressType: deliveryAddress.addressType || 'HOME'
        },
        items: checkoutItems.map(item => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: finalTotal,
        deliveryType,
        deliveryFee: deliveryFee || 0,
        courierPartner: null,
        couponCode: activeCoupon?.code || null,
        discountAmount: discountAmount || 0
      };

      // LIVE RAZORPAY PAYMENT GATEWAY
      if (isPrepaid) {
        if (typeof window === 'undefined' || !window.Razorpay) {
          const msg = 'Razorpay payment gateway could not be loaded. Please choose Cash / Counter Payment or check internet.';
          setErrorMsg(msg);
          setIsSubmitting(false);
          throw new Error(msg);
        }

        setIsProcessingPayment(true);

        return new Promise(async (resolve, reject) => {
          try {
            const rzpOrderRes = await api.createRazorpayOrder(
              finalTotal,
              `rcpt_${Date.now().toString().slice(-6)}`,
              {
                customer_name: user?.name?.trim() || recipientName,
                customer_phone: cleanAccountPhone,
                delivery_type: deliveryType
              }
            );

            const rzpOrder = rzpOrderRes.order;

            const options = {
              key: rzpOrderRes.keyId || 'rzp_test_TZQUSp5JtcBjMs',
              amount: rzpOrder.amount,
              currency: rzpOrder.currency || 'INR',
              name: 'Variathu Power Tools',
              description: `Order #${rzpOrder.id} • ${recipientName}`,
              image: (typeof window !== 'undefined' ? window.location.origin : '') + '/logo.jpg',
              order_id: rzpOrder.id,
              prefill: {
                name: user?.name?.trim() || recipientName,
                contact: cleanAccountPhone,
                email: (user?.email || '').trim()
              },
              notes: {
                customerId: String(user?.id || user?._id || ''),
                recipientName,
                recipientPhone,
                address: formattedDeliveryAddress,
                district: deliveryAddress.district || 'Pathanamthitta',
                pincode: deliveryAddress.pincode || '689641'
              },
              theme: { color: '#fb641b' },
              handler: async function (response) {
                try {
                  setIsProcessingPayment(true);
                  const verifyRes = await api.verifyRazorpayPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderPayload
                  });

                  try {
                    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
                  } catch {}

                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                  if (document.documentElement) document.documentElement.scrollTop = 0;
                  if (document.body) document.body.scrollTop = 0;
                  setCompletedOrder(verifyRes.data);
                  if (isBuyNow) {
                    try { sessionStorage.removeItem('vpt_buy_now'); } catch {}
                  } else {
                    clearCart();
                  }
                  resolve(verifyRes.data);
                } catch (vErr) {
                  const m = vErr.message || 'Payment verification failed.';
                  setErrorMsg(m);
                  reject(new Error(m));
                } finally {
                  setIsSubmitting(false);
                  setIsProcessingPayment(false);
                }
              },
              modal: {
                ondismiss: function () {
                  setIsSubmitting(false);
                  setIsProcessingPayment(false);
                  reject(new Error('Payment window closed.'));
                }
              }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp) {
              const m = `Payment Failed: ${resp.error?.description || 'Transaction declined by bank'}`;
              setErrorMsg(m);
              setIsSubmitting(false);
              setIsProcessingPayment(false);
              reject(new Error(m));
            });
            rzp.open();
          } catch (initErr) {
            setIsSubmitting(false);
            setIsProcessingPayment(false);
            setErrorMsg(initErr.message || 'Failed to initiate payment.');
            reject(initErr);
          }
        });
      }

      // Cash on Delivery / Counter Pickup Handover
      const cashMethod = deliveryType === 'store-pickup' ? 'PAY_AT_STORE' : 'COD';
      const result = await api.createOrder({
        ...orderPayload,
        paymentMethod: cashMethod,
        paymentStatus: 'PENDING',
        transactionId: null
      });

      try {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      } catch {}

      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      setCompletedOrder(result.data);
      if (isBuyNow) {
        try { sessionStorage.removeItem('vpt_buy_now'); } catch {}
      } else {
        clearCart();
      }
      return result.data;
    } catch (err) {
      if (!errorMsg) {
        setErrorMsg(err.message || 'Failed to place order. Please check your details and try again.');
      }
      throw err;
    } finally {
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  };

  // Calculations for Price Details Sidebar (Matches Flipkart exactly)
  const totalMrp = checkoutItems.reduce((sum, item) => {
    const itemMrp = item.mrp || Math.round(item.price * 1.35);
    return sum + (itemMrp * item.quantity);
  }, 0);
  const mrpDiscount = Math.max(0, totalMrp - subtotal);
  const totalSavings = mrpDiscount + (discountAmount || 0);

  // SUCCESS VIEW
  if (completedOrder) {
    return (
      <div
        ref={successViewRef}
        id="checkout-order-success-view"
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '36px 16px 80px',
          background: '#f1f3f6',
          overflowAnchor: 'none'
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '36px 28px', border: '1px solid #e2e8f0', boxShadow: '0 10px 35px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Order Placed Successfully
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0f172a', margin: '4px 0 8px' }}>
              Thank You for Your Order!
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
              Order ID: <strong style={{ color: '#0f172a' }}>{completedOrder.orderId || completedOrder.id || 'VPT-' + Date.now().toString().slice(-6)}</strong>
            </p>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
              <span style={{ color: '#64748b' }}>Customer Name:</span>
              <strong style={{ color: '#0f172a' }}>{completedOrder.customer?.recipientName || completedOrder.customer?.name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
              <span style={{ color: '#64748b' }}>Account Phone:</span>
              <strong style={{ color: '#0f172a' }}>+91 {completedOrder.customer?.phone}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
              <span style={{ color: '#64748b' }}>Fulfillment:</span>
              <strong style={{ color: '#0f172a' }}>
                {completedOrder.deliveryType === 'store-pickup' ? 'Counter Pickup (Kozhencherry)' : 'Express Courier Delivery'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
              <span style={{ color: '#64748b' }}>Total Paid / Due:</span>
              <strong style={{ color: '#fb641b', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                {formatPrice(completedOrder.totalAmount)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#047857', fontSize: '0.82rem', background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              <MessageCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                WhatsApp order confirmation and PDF invoice sent to <strong>+91 {completedOrder.customer?.phone}</strong>
              </span>
            </div>
            {completedOrder.customer?.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0369a1', fontSize: '0.82rem', background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                <Mail size={18} style={{ flexShrink: 0 }} />
                <span>Tax invoice and warranty certificate emailed to <strong>{completedOrder.customer.email}</strong></span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/account"
              style={{
                flex: 1,
                minWidth: '140px',
                textAlign: 'center',
                padding: '12px 18px',
                borderRadius: '8px',
                background: '#2874f0',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.88rem',
                textDecoration: 'none'
              }}
            >
              Track in My Account
            </Link>
            <Link
              to="/shop"
              style={{
                flex: 1,
                minWidth: '140px',
                textAlign: 'center',
                padding: '12px 18px',
                borderRadius: '8px',
                background: '#f8fafc',
                color: '#0f172a',
                fontWeight: '700',
                fontSize: '0.88rem',
                textDecoration: 'none',
                border: '1px solid #cbd5e1'
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CHECKOUT ITEMS EMPTY VIEW
  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 16px', background: '#f1f3f6' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', background: '#ffffff', borderRadius: '12px', padding: '40px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <ShoppingBag size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px' }}>
            Select power tools, spares, or accessories from our Kozhencherry store catalog to begin checkout.
          </p>
          <Link to="/shop" className="btn-hero-clean" style={{ justifyContent: 'center', width: '100%', padding: '12px' }}>
            <span>Browse Power Tools</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // MAIN CHECKOUT 2-COLUMN VIEW WITH TOP FLIPKART STEPPER
  return (
    <div className="checkout-page-root">
      <div className="checkout-page-container">

        {/* Top Branding Bar */}
        <div className="checkout-top-branding">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <img
              src="/Logo.jpeg"
              alt="Variathu Power Tools"
              style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Variathu Checkout
              </h1>
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: '500' }}>
                Official Power Tools Buying Portal
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.78rem', fontWeight: '700', background: '#ecfdf5', padding: '5px 12px', borderRadius: '9999px', border: '1px solid #a7f3d0', flexShrink: 0 }}>
            <ShieldCheck size={16} />
            <span>100% Safe & Secure Payments</span>
          </div>
        </div>

        {/* HORIZONTAL STEPPER BAR (RESPONSIVE FLUID STEPPER) */}
        <div className="checkout-stepper-card">
          <div className="checkout-stepper-inner">
            {/* STEP 1: ADDRESS (OR LOGIN IF NOT LOGGED IN) */}
            <div
              onClick={() => {
                if (isCustomerLoggedIn) setStep('address');
              }}
              className="checkout-step-item"
              style={{
                cursor: isCustomerLoggedIn ? 'pointer' : 'default'
              }}
            >
              <div
                className="checkout-step-circle"
                style={{
                  background: (step === 'summary' || step === 'payment')
                    ? '#ea580c'
                    : (step === 'address' || step === 'login' ? '#ea580c' : '#e0e0e0'),
                  color: '#ffffff'
                }}
              >
                {(step === 'summary' || step === 'payment') ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  '1'
                )}
              </div>
              <span
                className="checkout-step-label"
                style={{
                  fontWeight: (step === 'address' || step === 'login') ? '800' : '600',
                  color: (step === 'summary' || step === 'payment')
                    ? '#0f172a'
                    : (step === 'address' || step === 'login' ? '#ea580c' : '#878787')
                }}
              >
                {!isCustomerLoggedIn ? 'Login' : 'Address'}
              </span>
            </div>

            {/* CONNECTING LINE 1 */}
            <div
              className="checkout-step-line"
              style={{
                background: (step === 'summary' || step === 'payment') ? '#ea580c' : '#e2e8f0'
              }}
            />

            {/* STEP 2: ORDER SUMMARY */}
            <div
              onClick={() => {
                if (isCustomerLoggedIn && (step === 'payment' || step === 'address')) {
                  setStep('summary');
                }
              }}
              className="checkout-step-item"
              style={{
                cursor: (isCustomerLoggedIn && step === 'payment') ? 'pointer' : 'default'
              }}
            >
              <div
                className="checkout-step-circle"
                style={{
                  background: step === 'payment'
                    ? '#ea580c'
                    : (step === 'summary' ? '#ea580c' : '#f1f5f9'),
                  color: (step === 'summary' || step === 'payment') ? '#ffffff' : '#878787',
                  border: (step === 'summary' || step === 'payment') ? 'none' : '1.5px solid #cbd5e1'
                }}
              >
                {step === 'payment' ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  '2'
                )}
              </div>
              <span
                className="checkout-step-label"
                style={{
                  fontWeight: step === 'summary' ? '800' : '600',
                  color: step === 'summary'
                    ? '#ea580c'
                    : (step === 'payment' ? '#0f172a' : '#878787')
                }}
              >
                <span className="hide-on-xs">Order </span>Summary
              </span>
            </div>

            {/* CONNECTING LINE 2 */}
            <div
              className="checkout-step-line"
              style={{
                background: step === 'payment' ? '#ea580c' : '#e2e8f0'
              }}
            />

            {/* STEP 3: PAYMENT */}
            <div className="checkout-step-item">
              <div
                className="checkout-step-circle"
                style={{
                  background: step === 'payment' ? '#ea580c' : '#f1f5f9',
                  color: step === 'payment' ? '#ffffff' : '#878787',
                  border: step === 'payment' ? 'none' : '1.5px solid #cbd5e1'
                }}
              >
                3
              </div>
              <span
                className="checkout-step-label"
                style={{
                  fontWeight: step === 'payment' ? '800' : '600',
                  color: step === 'payment' ? '#ea580c' : '#878787'
                }}
              >
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 18px',
              color: '#991b1b',
              fontSize: '0.86rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2-COLUMN MAIN GRID */}
        <div className="checkout-main-grid">

          {/* LEFT COLUMN: PRODUCT DETAILS & PRICE DETAILS SIDEBAR (ORDER ITEMS & SUMMARY) */}
          <div className="checkout-summary-column">

            {/* 1. PRODUCT DETAILS (MOVED DIRECTLY ABOVE PRICE DETAILS) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1.5px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{
                fontSize: '0.84rem',
                fontWeight: '800',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                paddingBottom: '10px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ color: '#0f172a', fontSize: '0.94rem' }}>Order Items ({checkoutItems.length})</span>
                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '600' }}>
                  {checkoutItems.reduce((s, i) => s + i.quantity, 0)} total unit(s)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {checkoutItems.map((item, idx) => {
                  const itemMrp = item.mrp || Math.round(item.price * 1.35);
                  const discountPct = Math.round(((itemMrp - item.price) / itemMrp) * 100);

                  return (
                    <div
                      key={item.id}
                      style={{
                        paddingBottom: idx < checkoutItems.length - 1 ? '14px' : '0',
                        borderBottom: idx < checkoutItems.length - 1 ? '1px dashed #e2e8f0' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Product Details Row */}
                      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        {/* Thumbnail */}
                        <div style={{
                          width: '76px',
                          height: '76px',
                          borderRadius: '10px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}>
                          <img
                            src={item.image || '/Logo.jpeg'}
                            alt={item.name}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => { e.target.src = '/Logo.jpeg'; }}
                          />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {item.brand && (
                            <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {item.brand}
                            </span>
                          )}

                          <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#0f172a',
                            margin: 0,
                            lineHeight: '1.35'
                          }}>
                            {item.name}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              Unit Price: <strong style={{ color: '#0f172a' }}>{formatPrice(item.price)}</strong>
                            </span>
                            <span style={{
                              fontSize: '0.72rem',
                              color: '#0284c7',
                              fontWeight: '700',
                              background: '#f0f9ff',
                              border: '1px solid #bae6fd',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              🚚 Courier: {item.deliveryCost === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${item.deliveryCost ?? 120}/unit`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Stepper, Remove & Line Total */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#f8fafc',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ padding: '0 8px', fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                color: '#334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              background: '#fef2f2',
                              border: '1px solid #fee2e2',
                              borderRadius: '8px',
                              color: '#dc2626',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Remove item"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Price Line */}
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {discountPct > 0 && (
                            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#16a34a' }}>
                              ↓ {discountPct}%
                            </span>
                          )}
                          {itemMrp > item.price && (
                            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                              {formatPrice(itemMrp * item.quantity)}
                            </span>
                          )}
                          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PRICE DETAILS CARD (IMAGE 1 STYLE) */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                Price Details
              </div>

              {/* Breakdown Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#475569' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>MRP (incl. of all taxes)</span>
                  <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatPrice(totalMrp)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fee</span>
                  <span style={{ color: deliveryType === 'store-pickup' || deliveryFee === 0 ? '#16a34a' : '#0f172a', fontWeight: '700' }}>
                    {deliveryType === 'store-pickup' || deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                  </span>
                </div>

                {mrpDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Discount on MRP</span>
                    <span style={{ fontWeight: '700' }}>- {formatPrice(mrpDiscount)}</span>
                  </div>
                )}

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                    <span>Coupons Applied ({activeCoupon?.code})</span>
                    <span style={{ fontWeight: '700' }}>- {formatPrice(discountAmount)}</span>
                  </div>
                )}

                {/* Total Amount */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', borderTop: '2px solid #0f172a', paddingTop: '14px', marginTop: '4px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#ea580c', fontFamily: 'monospace', fontSize: '1.25rem' }}>{formatPrice(finalTotal)}</span>
                </div>

                {/* Green Savings Highlight */}
                {totalSavings > 0 && (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#16a34a',
                    fontWeight: '700',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>🌱</span>
                    <span>You'll save {formatPrice(totalSavings)} on this order!</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. STORE GUARANTEES */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#475569' }}>
                <ShieldCheck size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span>100% Genuine Tools from Authorized Dealers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#475569' }}>
                <FileText size={16} style={{ color: '#0284c7', flexShrink: 0 }} />
                <span>Official GST Tax Invoice & Warranty Card</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: '#475569' }}>
                <Mail size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>Instant WhatsApp & Email Order Receipts</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ACTIVE STEP VIEWS */}
          <div className="checkout-steps-column">

            {/* ============================================================ */}
            {/* VIEW A: STEP === 'login' (UNAUTHENTICATED)                     */}
            {/* ============================================================ */}
            {step === 'login' && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.84rem' }}>
                    1
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      1. LOGIN OR SIGNUP
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                      {checkoutAuthStep === 'otp'
                        ? 'Verify your mobile number with the one-time password (OTP)'
                        : 'Enter your mobile number to receive a secure verification OTP'}
                    </p>
                  </div>
                </div>

                {checkoutAuthStep === 'input' ? (
                  <form onSubmit={handleSendCheckoutOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '10px 14px', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      Orders, payment receipts, and delivery tracking are tied to your primary mobile account.
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                        10-Digit Mobile Number *
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: phoneLookup.exists === true ? '2px solid #22c55e' : phoneLookup.exists === false ? '2px solid #f59e0b' : '1.5px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#ffffff' }}>
                        <span style={{ padding: '10px 14px', background: '#f8fafc', color: '#475569', fontWeight: '800', fontSize: '0.9rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          🇮🇳 +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={loginForm.phone}
                          onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                          style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: '0.95rem', fontWeight: '700', outline: 'none', color: '#0f172a' }}
                          id="input-account-phone"
                        />
                      </div>
                    </div>

                    {phoneLookup.checking && (
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', animation: 'pulse 1s infinite' }} />
                        <span>Checking customer profile for +91 {phoneLookup.checkedPhone}...</span>
                      </div>
                    )}

                    {phoneLookup.exists === true && !phoneLookup.checking && (
                      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '800', fontSize: '0.86rem' }}>
                          <CheckCircle2 size={16} />
                          <span>Existing Customer Account Found</span>
                        </div>
                        <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                          {phoneLookup.customerName || 'Customer'} (+91 {phoneLookup.checkedPhone})
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#166534', margin: 0 }}>
                          We will send a 6-digit verification OTP to authenticate and protect your account.
                        </p>
                      </div>
                    )}

                    {phoneLookup.exists === false && !phoneLookup.checking && (
                      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '800', fontSize: '0.86rem' }}>
                          <AlertCircle size={16} />
                          <span>New Customer Account for +91 {phoneLookup.checkedPhone}</span>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            Your Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Midhun Mohan"
                            value={loginForm.name}
                            onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            Email Address <span style={{ color: '#dc2626' }}>*</span> (For Tax Invoices & Order Receipts)
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. midhun@gmail.com"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={
                        loginLoading ||
                        loginForm.phone.length !== 10 ||
                        (phoneLookup.exists === false && (
                          !loginForm.name.trim() ||
                          !loginForm.email.trim() ||
                          !loginForm.email.includes('@')
                        ))
                      }
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '0.94rem',
                        fontWeight: '800',
                        cursor: (loginLoading || loginForm.phone.length !== 10 || (phoneLookup.exists === false && (!loginForm.name.trim() || !loginForm.email.trim() || !loginForm.email.includes('@')))) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                        opacity: (loginForm.phone.length === 10 && (phoneLookup.exists !== false || (loginForm.name.trim() && loginForm.email.trim() && loginForm.email.includes('@')))) ? 1 : 0.6,
                        transition: 'all 0.15s ease'
                      }}
                      id="btn-checkout-login-continue"
                    >
                      <span>
                        {loginLoading ? 'Sending Verification OTP...' : 'SEND VERIFICATION OTP'}
                      </span>
                      {!loginLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                ) : (
                  /* Step 1.2: Enter 6-digit OTP */
                  <form onSubmit={handleVerifyCheckoutOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontSize: '0.84rem', fontWeight: '700' }}>
                        <ShieldCheck size={18} style={{ color: '#0284c7' }} />
                        <span>Security OTP Verification</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCheckoutAuthStep('input'); setCheckoutOtp(''); setErrorMsg(''); }}
                        style={{ background: 'transparent', border: 'none', color: '#ea580c', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit3 size={13} />
                        <span>Change Number</span>
                      </button>
                    </div>

                    <p style={{ margin: '0', fontSize: '0.82rem', color: '#475569', lineHeight: '1.45' }}>
                      Enter the 6-digit code dispatched to <strong>{checkoutOtpMasked || `+91 ${loginForm.phone}`}</strong> to authenticate your account.
                    </p>

                    {/* 6-Digit OTP Animated Grid using CodeSlots */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#475569',
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        Enter 6-Digit Verification Code <span style={{ color: '#dc2626' }}>*</span>
                      </label>

                      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '4px 0 14px' }}>
                        <CodeSlots
                          length={6}
                          value={checkoutOtp}
                          status={checkoutOtpStatus}
                          onChange={(code) => {
                            setCheckoutOtp(code);
                            if (checkoutOtpStatus !== 'idle') setCheckoutOtpStatus('idle');
                            if (errorMsg) setErrorMsg('');
                          }}
                          onComplete={async (code) => {
                            await handleVerifyCheckoutOtp(null, code);
                          }}
                          accentColor="#f5f5f5"
                          inkColor="#f5f5f5"
                          slotColor="#27272a"
                          digitColor="#18181b"
                          dangerColor="#ff3b30"
                          slotSize={44}
                          gap={8}
                          radius={12}
                          bounce={0.2}
                          settle={0.3}
                          rise={8}
                          cascade={20}
                          mask={false}
                          caret
                          outcome="accept"
                          disabled={loginLoading || checkoutOtpStatus === 'success'}
                          autoFocus
                        />
                      </div>
                    </div>

                    {checkoutDevOtp && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', color: '#047857' }}>
                        <span>⚡ Quick Test Code: <strong style={{ letterSpacing: '0.1em' }}>{checkoutDevOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutOtp(checkoutDevOtp);
                            handleVerifyCheckoutOtp(null, checkoutDevOtp);
                          }}
                          style={{ background: '#059669', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer' }}
                        >
                          Auto Fill & Verify
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                      <span>Didn't receive code?</span>
                      {checkoutResendTimer > 0 ? (
                        <span style={{ fontWeight: '700', color: '#94a3b8' }}>
                          Resend code in {checkoutResendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendCheckoutOtp}
                          disabled={loginLoading}
                          style={{ background: 'transparent', border: 'none', color: '#ea580c', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Resend OTP Code
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading || checkoutOtp.length !== 6 || checkoutOtpStatus === 'success'}
                      style={{
                        background: checkoutOtpStatus === 'success' ? '#16a34a' : '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '14px',
                        fontSize: '0.94rem',
                        fontWeight: '800',
                        cursor: (loginLoading || checkoutOtp.length !== 6 || checkoutOtpStatus === 'success') ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                        opacity: (checkoutOtp.length === 6) ? 1 : 0.6,
                        transition: 'all 0.15s ease'
                      }}
                      id="btn-checkout-verify-otp"
                    >
                      <span>
                        {checkoutOtpStatus === 'success'
                          ? 'OTP Verified! Redirecting...'
                          : loginLoading
                            ? 'Verifying OTP...'
                            : 'VERIFY & CONTINUE'}
                      </span>
                      {!loginLoading && checkoutOtpStatus !== 'success' && <ArrowRight size={16} />}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW B: STEP === 'address' (MANAGE / ADD DELIVERY ADDRESS)    */}
            {/* ============================================================ */}
            {step === 'address' && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.84rem' }}>
                      1
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        DELIVERY ADDRESS
                      </h3>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                        Select existing saved address or add a new one
                      </p>
                    </div>
                  </div>

                  {(user?.savedAddresses?.length > 0 || user?.address) && (
                    <button
                      type="button"
                      onClick={() => setStep('summary')}
                      style={{ background: 'transparent', border: 'none', color: '#ea580c', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Back to Order Summary
                    </button>
                  )}
                </div>

                {/* Delivery Mode: Store Pickup vs Courier */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
                  <div
                    onClick={() => setDeliveryType('store-pickup')}
                    style={{
                      border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      background: deliveryType === 'store-pickup' ? '#fff7ed' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={16} style={{ color: '#16a34a' }} />
                        Store Pickup
                      </span>
                      <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '9999px' }}>
                        FREE
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0 }}>
                      Collect at Poyanil Building, Kozhencherry.
                    </p>
                  </div>

                  <div
                    onClick={() => setDeliveryType('kerala-courier')}
                    style={{
                      border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      background: deliveryType === 'kerala-courier' ? '#fff7ed' : '#ffffff',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Truck size={16} style={{ color: '#0284c7' }} />
                        Express Courier
                      </span>
                      <span style={{ color: totalCourierFee === 0 ? '#16a34a' : '#ea580c', fontSize: '0.82rem', fontWeight: '800' }}>
                        {totalCourierFee === 0 ? 'FREE' : formatPrice(totalCourierFee)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0 0 6px' }}>
                      Fast delivery to your home or site across Kerala.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {COURIER_PARTNERS.map(cp => (
                        <div
                          key={cp.id}
                          title={cp.name}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <img
                            src={cp.logo}
                            alt={cp.name}
                            style={{ maxHeight: '14px', maxWidth: '60px', objectFit: 'contain' }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* If Store Pickup is Selected */}
                {deliveryType === 'store-pickup' && (
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                      <MapPin size={18} style={{ color: '#ea580c' }} />
                      <span>Pickup Counter Location</span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                      Variathu Power Tools Showroom & Service Clinic<br />
                      Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Kerala - 689641<br />
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Store Hours: 8:00 AM - 8:00 PM (Mon - Sat) • Phone: +91 94475 59333</span><br />
                      <a
                        href="https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', fontSize: '0.76rem', fontWeight: '700', textDecoration: 'none', marginTop: '3px' }}
                      >
                        📍 View on Google Maps &rarr;
                      </a>
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep('summary')}
                      style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '12px 24px',
                        fontSize: '0.88rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                        width: 'fit-content'
                      }}
                    >
                      PICKUP FROM HERE ➔
                    </button>
                  </div>
                )}

                {/* If Courier is Selected: Saved Addresses List */}
                {deliveryType === 'kerala-courier' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {user?.savedAddresses && user.savedAddresses.length > 0 && !isAddingNewAddress && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                            Saved Addresses ({user.savedAddresses.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewAddress(true);
                              setDeliveryAddress({
                                name: user.name || '',
                                phone: user.phone || '',
                                pincode: '689641',
                                locality: '',
                                address: '',
                                city: 'Pathanamthitta',
                                district: 'Pathanamthitta',
                                state: 'Kerala',
                                landmark: '',
                                alternatePhone: '',
                                addressType: 'HOME'
                              });
                            }}
                            style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', fontSize: '0.78rem', fontWeight: '700', padding: '5px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Plus size={14} />
                            <span>+ Add New Address</span>
                          </button>
                        </div>

                        {user.savedAddresses.map((addr) => {
                          const isSelected = selectedAddressId === (addr.id || addr._id);
                          return (
                            <div
                              key={addr.id || addr._id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              style={{
                                border: isSelected ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                                borderRadius: '10px',
                                padding: '16px',
                                background: isSelected ? '#fff7ed' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input
                                    type="radio"
                                    name="selectedSavedAddress"
                                    checked={isSelected}
                                    onChange={() => handleSelectSavedAddress(addr)}
                                    style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                                  />
                                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                    {addr.addressType || 'HOME'}
                                  </span>
                                  <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                                    {addr.name}
                                  </strong>
                                  <span style={{ fontSize: '0.86rem', color: '#475569', fontWeight: '700' }}>
                                    {addr.phone}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSavedAddress(e, addr.id || addr._id)}
                                  title="Delete address"
                                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div style={{ fontSize: '0.84rem', color: '#475569', paddingLeft: '24px', lineHeight: '1.5' }}>
                                {addr.address}{addr.locality ? `, ${addr.locality}` : ''}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city || addr.district}, {addr.state || 'Kerala'} - <strong>{addr.pincode}</strong>
                              </div>

                              {isSelected && (
                                <div style={{ paddingLeft: '24px', marginTop: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => setStep('summary')}
                                    style={{
                                      background: '#dc2626',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '10px',
                                      padding: '10px 24px',
                                      fontSize: '0.88rem',
                                      fontWeight: '800',
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                                    }}
                                  >
                                    DELIVER HERE ➔
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Address Entry Form */}
                    {(!user?.savedAddresses || user.savedAddresses.length === 0 || isAddingNewAddress) && (
                      <form onSubmit={handleSaveAndDeliver} style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                            ADD A NEW ADDRESS
                          </span>
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLocating}
                            style={{
                              background: '#0f172a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '7px 14px',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <Navigation size={13} />
                            <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
                          </button>
                        </div>

                        {/* Name & 10-Digit Mobile */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Name *</label>
                            <input
                              type="text"
                              required
                              name="name"
                              value={deliveryAddress.name}
                              onChange={handleDeliveryAddressChange}
                              placeholder="Recipient Name"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>10-digit mobile number *</label>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              name="phone"
                              value={deliveryAddress.phone}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                              placeholder="Delivery Mobile"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>
                        </div>

                        {/* Pincode & Locality */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Pincode (6 Digits) *</label>
                            <input
                              type="text"
                              required
                              maxLength={6}
                              name="pincode"
                              value={deliveryAddress.pincode}
                              onChange={handleDeliveryAddressChange}
                              placeholder="e.g. 689641"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                            {pincodeCheck?.serviceable === true && (
                              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                                ✓ Kerala Courier Serviceable ({pincodeCheck.district})
                              </span>
                            )}
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Locality *</label>
                            <input
                              type="text"
                              required
                              name="locality"
                              value={deliveryAddress.locality}
                              onChange={handleDeliveryAddressChange}
                              placeholder="e.g. Nirannukala Road"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>
                        </div>

                        {/* Address (Area and Street) */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Address (Area and Street) *</label>
                          <textarea
                            rows={2}
                            required
                            name="address"
                            value={deliveryAddress.address}
                            onChange={handleDeliveryAddressChange}
                            placeholder="House No., Building Name, Street"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                          />
                        </div>

                        {/* City/District & State */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>City / District / Town *</label>
                            <input
                              type="text"
                              required
                              name="city"
                              value={deliveryAddress.city || deliveryAddress.district}
                              onChange={handleDeliveryAddressChange}
                              placeholder="e.g. Pathanamthitta"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>State *</label>
                            <input
                              type="text"
                              required
                              name="state"
                              value={deliveryAddress.state || 'Kerala'}
                              onChange={handleDeliveryAddressChange}
                              placeholder="Kerala"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>
                        </div>

                        {/* Landmark & Alternate Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Landmark (Optional)</label>
                            <input
                              type="text"
                              name="landmark"
                              value={deliveryAddress.landmark}
                              onChange={handleDeliveryAddressChange}
                              placeholder="e.g. Near Temple"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Alternate Phone (Optional)</label>
                            <input
                              type="tel"
                              name="alternatePhone"
                              maxLength={10}
                              value={deliveryAddress.alternatePhone}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, alternatePhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                              placeholder="e.g. 9995855774"
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>
                        </div>

                        {/* Address Type: HOME vs WORK */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Address Type</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="addressType"
                                value="HOME"
                                checked={deliveryAddress.addressType === 'HOME'}
                                onChange={() => setDeliveryAddress(prev => ({ ...prev, addressType: 'HOME' }))}
                                style={{ accentColor: '#ea580c' }}
                              />
                              <span>Home (All day delivery)</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name="addressType"
                                value="WORK"
                                checked={deliveryAddress.addressType === 'WORK'}
                                onChange={() => setDeliveryAddress(prev => ({ ...prev, addressType: 'WORK' }))}
                                style={{ accentColor: '#ea580c' }}
                              />
                              <span>Work (Delivery between 10 AM - 5 PM)</span>
                            </label>
                          </div>
                        </div>

                        {/* Save Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                          <button
                            type="submit"
                            disabled={isSavingAddress}
                            style={{
                              background: '#dc2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '13px 28px',
                              fontSize: '0.88rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSavingAddress ? 'SAVING...' : 'SAVE AND DELIVER HERE ➔'}
                          </button>

                          {user?.savedAddresses && user.savedAddresses.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingNewAddress(false);
                                setStep('summary');
                              }}
                              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.86rem', fontWeight: '700', cursor: 'pointer', padding: '10px 16px' }}
                            >
                              CANCEL
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW C: STEP === 'summary' (ORDER SUMMARY - IMAGE 1 STYLE)   */}
            {/* ============================================================ */}
            {step === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* 1. DELIVERY MODE SELECTOR (DOORSTEP COURIER VS STORE PICKUP) */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={15} style={{ color: '#ea580c' }} />
                      <span>Select Delivery Method:</span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: deliveryType === 'kerala-courier' ? '#ea580c' : '#16a34a', fontWeight: '700' }}>
                      {deliveryType === 'kerala-courier' ? 'Doorstep Courier' : 'Store Pickup'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Option 1: Doorstep Courier Delivery */}
                    <div
                      onClick={() => setDeliveryType('kerala-courier')}
                      style={{
                        border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: deliveryType === 'kerala-courier' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: deliveryType === 'kerala-courier' ? '0 2px 8px rgba(234, 88, 12, 0.08)' : 'none'
                      }}
                      id="opt-checkout-courier"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: deliveryType === 'kerala-courier' ? '5px solid #ea580c' : '2px solid #cbd5e1',
                          background: '#ffffff',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>Doorstep Courier Delivery</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                              Kerala
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            Fast parcel dispatch to your address
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                            {COURIER_PARTNERS.map(cp => (
                              <div
                                key={cp.id}
                                title={cp.name}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  height: '20px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                              >
                                <img
                                  src={cp.logo}
                                  alt={cp.name}
                                  style={{ maxHeight: '14px', maxWidth: '55px', objectFit: 'contain' }}
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span style={{ color: totalCourierFee === 0 ? '#16a34a' : '#ea580c', fontSize: '0.92rem', fontWeight: '800', flexShrink: 0 }}>
                        {totalCourierFee === 0 ? 'FREE' : formatPrice(totalCourierFee)}
                      </span>
                    </div>

                    {/* Option 2: Store Pickup */}
                    <div
                      onClick={() => setDeliveryType('store-pickup')}
                      style={{
                        border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        background: deliveryType === 'store-pickup' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        boxShadow: deliveryType === 'store-pickup' ? '0 2px 8px rgba(234, 88, 12, 0.08)' : 'none'
                      }}
                      id="opt-checkout-pickup"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: deliveryType === 'store-pickup' ? '5px solid #ea580c' : '2px solid #cbd5e1',
                          background: '#ffffff',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span>Store Pickup</span>
                            <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: '0.68rem', fontWeight: '800', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                              Kozhencherry
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                            Direct handover at Poyanil Building Showroom
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: '0.74rem', fontWeight: '800', padding: '3px 10px', borderRadius: '9999px', flexShrink: 0 }}>
                        FREE
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. DELIVER TO / PICKUP DETAILS CARD */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Header Row: Label & Change Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} style={{ color: '#ea580c' }} />
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {deliveryType === 'store-pickup' ? 'Collect From:' : 'Deliver To:'}
                      </span>
                    </div>

                    {deliveryType === 'kerala-courier' ? (
                      <button
                        type="button"
                        onClick={handleOpenAddressModal}
                        id="btn-checkout-change-address"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Edit3 size={12} style={{ color: '#ea580c' }} />
                        <span>Change</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryType('kerala-courier');
                          handleOpenAddressModal();
                        }}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          color: '#0f172a',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Switch to Courier
                      </button>
                    )}
                  </div>

                  {/* Customer Name & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.96rem', color: '#0f172a', fontWeight: '800' }}>
                      {deliveryType === 'store-pickup' ? (user?.name || 'Customer') : (deliveryAddress.name || user?.name || 'Customer')}
                    </strong>
                    <span style={{
                      background: deliveryType === 'store-pickup' ? '#ecfdf5' : '#f1f5f9',
                      color: deliveryType === 'store-pickup' ? '#16a34a' : '#475569',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {deliveryType === 'store-pickup' ? 'STORE PICKUP' : (deliveryAddress.addressType || 'HOME')}
                    </span>
                  </div>

                  {/* Address Body */}
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.45' }}>
                    {deliveryType === 'store-pickup' ? (
                      'Variathu Power Tools Showroom, Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Kerala - 689641'
                    ) : (
                      <>
                        {deliveryAddress.address}
                        {deliveryAddress.locality ? `, ${deliveryAddress.locality}` : ''}
                        {deliveryAddress.landmark ? `, Near ${deliveryAddress.landmark}` : ''}, {deliveryAddress.city || deliveryAddress.district || 'Pathanamthitta'}, {deliveryAddress.state || 'Kerala'} - <strong>{deliveryAddress.pincode}</strong>
                      </>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={13} style={{ color: '#64748b' }} />
                    <span>{deliveryType === 'store-pickup' ? '+91 94475 59333 (Showroom Helpline)' : (deliveryAddress.phone || user?.phone)}</span>
                  </div>
                </div>

                {/* 3. BOTTOM BAR: TERMS, TOTAL & CONTINUE BUTTON */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Price & Summary Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Amount:
                      </span>
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                        {formatPrice(finalTotal)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700', display: 'block' }}>
                        {deliveryType === 'store-pickup'
                          ? 'Free Store Pickup'
                          : (deliveryFee === 0 ? 'Free Delivery' : `Includes ${formatPrice(deliveryFee)} Courier`)}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {checkoutItems.reduce((s, i) => s + i.quantity, 0)} Item(s)
                      </span>
                    </div>
                  </div>

                  {/* Full Width Continue Button */}
                  <button
                    type="button"
                    onClick={handleContinueFromSummary}
                    style={{
                      width: '100%',
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px 20px',
                      fontSize: '0.95rem',
                      fontWeight: '800',
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    id="btn-flipkart-continue-to-payment"
                  >
                    <span>CONTINUE TO PAYMENT</span>
                    <ArrowRight size={18} />
                  </button>

                  {/* Terms disclaimer */}
                  <p style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    margin: 0,
                    lineHeight: '1.4',
                    textAlign: 'center'
                  }}>
                    By continuing with the order, you confirm that you are above 18 years of age, and you agree to the Variathu Power Tools Terms of Use and Privacy Policy.
                  </p>
                </div>

              </div>
            )}

            {/* ============================================================ */}
            {/* VIEW D: STEP === 'payment' (PAYMENT METHOD & CONFIRMATION)   */}
            {/* ============================================================ */}
            {step === 'payment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {/* Collapsed Step 1 Address Bar */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#16a34a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      ✓
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        1. DELIVERY ADDRESS
                      </span>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {deliveryType === 'store-pickup' ? 'Poyanil Building Store Pickup' : `${deliveryAddress.name}, ${deliveryAddress.city || deliveryAddress.district} - ${deliveryAddress.pincode}`}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddressModal}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* Collapsed Step 2 Order Summary Bar */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#16a34a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}>
                      ✓
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                        2. ORDER SUMMARY
                      </span>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: '700',
                        color: '#0f172a',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {checkoutItems.reduce((s, i) => s + i.quantity, 0)} Item(s) • Total {formatPrice(finalTotal)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('summary')}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      color: '#0f172a',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Change
                  </button>
                </div>

                {/* Expanded Step 3 Payment Options */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  padding: '18px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#ea580c',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.82rem',
                      flexShrink: 0
                    }}>
                      3
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.01em' }}>
                        PAYMENT OPTIONS
                      </h3>
                      <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0' }}>
                        Select your preferred payment mode
                      </p>
                    </div>
                  </div>

                  {/* Payment Options Radio Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                    {/* Razorpay Online */}
                    <div
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        border: paymentMethod === 'razorpay' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'razorpay' ? '#fffaf5' : '#ffffff',
                        transition: 'all 0.15s ease',
                        boxShadow: paymentMethod === 'razorpay' ? '0 2px 8px rgba(234, 88, 12, 0.08)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: paymentMethod === 'razorpay' ? '5px solid #ea580c' : '2px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }} />
                          <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                            ⚡ Razorpay Online
                          </span>
                        </div>
                        <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: '0.68rem', fontWeight: '800', padding: '2px 8px', borderRadius: '9999px', flexShrink: 0 }}>
                          Recommended
                        </span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, paddingLeft: '28px', lineHeight: '1.4' }}>
                        UPI (GPay, PhonePe, Paytm), Cards, NetBanking. Instant digital receipt.
                      </p>
                    </div>

                    {/* Cash on Delivery / Counter */}
                    <div
                      onClick={() => setPaymentMethod('cash')}
                      style={{
                        border: paymentMethod === 'cash' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'cash' ? '#fffaf5' : '#ffffff',
                        transition: 'all 0.15s ease',
                        boxShadow: paymentMethod === 'cash' ? '0 2px 8px rgba(234, 88, 12, 0.08)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: paymentMethod === 'cash' ? '5px solid #ea580c' : '2px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0,
                            transition: 'all 0.15s ease'
                          }} />
                          <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                            💵 {deliveryType === 'store-pickup' ? 'Pay at Counter' : 'Cash on Delivery (COD)'}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, paddingLeft: '28px', lineHeight: '1.4' }}>
                        {deliveryType === 'store-pickup' ? 'Pay at Poyanil Building during equipment pickup.' : 'Pay cash to courier partner upon delivery.'}
                      </p>
                    </div>
                  </div>

                  {/* Promo Coupon Box */}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px', letterSpacing: '0.04em' }}>
                      Have a Promo Coupon?
                    </span>

                    {activeCoupon ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '10px 14px' }}>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#065f46', letterSpacing: '0.05em' }}>
                            {activeCoupon.code}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.74rem', color: '#047857' }}>
                            {activeCoupon.description || `${activeCoupon.discountValue}% discount applied`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCoupon()}
                          style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="ENTER COUPON CODE"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', outline: 'none' }}
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !couponInput.trim()}
                          style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '0.84rem', fontWeight: '700', cursor: 'pointer', flexShrink: 0 }}
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Primary Account Notification Reminder */}
                  <div style={{ fontSize: '0.76rem', color: '#0369a1', background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd', lineHeight: '1.45' }}>
                    📱 <strong>Account Notice:</strong> WhatsApp order receipt and live dispatch updates will be sent to primary number <strong>+91 {user?.phone}</strong>.
                  </div>

                  {/* Slide to Confirm & Place Order (Swipe Interaction - White Theme) */}
                  <div style={{ marginTop: '4px', width: '100%' }}>
                    <SlideCommit
                      label={
                        isProcessingPayment
                          ? 'Processing Payment...'
                          : isSubmitting
                            ? 'Placing Order...'
                            : deliveryType === 'store-pickup'
                              ? `Slide to Confirm • ${formatPrice(finalTotal)}  ›››`
                              : paymentMethod === 'razorpay'
                                ? `Slide to Pay • ${formatPrice(finalTotal)}  ›››`
                                : `Slide to Confirm Order • ${formatPrice(finalTotal)}  ›››`
                      }
                      doneLabel={paymentMethod === 'razorpay' ? 'Payment Verified' : 'Order Placed!'}
                      errorLabel="Payment Failed / Retry"
                      onConfirm={handleSubmitOrder}
                      onDone={() => console.log('Order processed')}
                      onError={(reason) => console.log('Order error:', reason)}
                      trackColor="#ffffff"
                      trackBorder="2px solid #0f172a"
                      trackShadow="0 2px 8px rgba(15, 23, 42, 0.08), inset 0 1px 2px rgba(15, 23, 42, 0.02)"
                      handleColor="#dc2626"
                      handleBorder="2.5px solid #ffffff"
                      handleShadow="0 4px 14px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(220, 38, 38, 0.4)"
                      textColor="#0f172a"
                      iconColor="#ffffff"
                      trailColor="linear-gradient(90deg, #f87171 0%, #dc2626 100%)"
                      successColor="#16a34a"
                      dangerColor="#dc2626"
                      width="100%"
                      height={54}
                      radius={27}
                      speed={55}
                      returnBounce={0.38}
                      landingDip={0.026}
                      holdMs={1500}
                      disabled={isSubmitting || isProcessingPayment}
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      </div>

      {/* ADDRESS SELECTION & MANAGEMENT MODAL (Matches screenshot 2 and user requirements) */}
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
            zIndex: 9999
          }}
          className="checkout-addr-modal-overlay"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="checkout-addr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="checkout-addr-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
                  {addressModalView === 'form'
                    ? (editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address')
                    : 'Select Delivery Address'}
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {addressModalView === 'form'
                    ? 'Synced to your customer account for rapid express checkout.'
                    : `Saved addresses on your verified account (+91 ${user?.phone || loginForm.phone || ''})`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  flexShrink: 0
                }}
                title="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Error Banner */}
            {modalError && (
              <div style={{ margin: '14px 18px 0', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', color: '#991b1b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Body: LIST VIEW */}
            {addressModalView === 'list' && (
              <div className="checkout-addr-modal-body">
                <div className="checkout-addr-subbar">
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Saved Addresses ({user?.savedAddresses?.length || (user?.address ? 1 : 0)})
                  </span>
                  <button
                    type="button"
                    onClick={handleStartAddAddressInModal}
                    style={{
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#c2410c',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                    id="btn-modal-add-new-address"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Store Pickup Showroom Option */}
                <div
                  onClick={() => {
                    setDeliveryType('store-pickup');
                    setShowAddressModal(false);
                  }}
                  className={`checkout-pickup-card ${deliveryType === 'store-pickup' ? 'selected' : ''}`}
                >
                  <div className="checkout-pickup-card-top">
                    <div className="checkout-pickup-card-tags">
                      <input
                        type="radio"
                        name="modalSelectedAddressOrPickup"
                        checked={deliveryType === 'store-pickup'}
                        onChange={() => {
                          setDeliveryType('store-pickup');
                          setShowAddressModal(false);
                        }}
                        style={{ accentColor: '#ea580c', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                      />
                      <span style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        STORE PICKUP
                      </span>
                    </div>
                    <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                      FREE
                    </span>
                  </div>

                  <div className="checkout-pickup-title">
                    Direct Pickup at Kozhencherry Showroom
                  </div>

                  <div className="checkout-pickup-address">
                    Variathu Power Tools Showroom, Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Kerala - <strong>689641</strong>
                  </div>

                  <div className="checkout-pickup-footer">
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Helpline: +91 94475 59333 • Direct counter collection
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeliveryType('store-pickup');
                        setShowAddressModal(false);
                      }}
                      style={{
                        background: deliveryType === 'store-pickup' ? '#dc2626' : '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      {deliveryType === 'store-pickup' ? 'PICKUP HERE ➔' : 'Select Store Pickup'}
                    </button>
                  </div>
                </div>

                {/* List of Saved Addresses */}
                {(() => {
                  const addresses = (user?.savedAddresses && user.savedAddresses.length > 0)
                    ? user.savedAddresses
                    : (user?.address ? [{
                        id: 'default-acc-addr',
                        name: user.name || 'Customer',
                        phone: user.phone,
                        address: user.address,
                        district: user.district || 'Pathanamthitta',
                        state: user.state || 'Kerala',
                        pincode: user.pincode || '689641',
                        locality: user.locality || '',
                        landmark: user.landmark || '',
                        addressType: 'HOME',
                        isDefault: true
                      }] : []);

                  if (addresses.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        <MapPin size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 14px' }}>
                          No delivery addresses saved on this account yet.
                        </p>
                        <button
                          type="button"
                          onClick={handleStartAddAddressInModal}
                          style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            padding: '11px 22px',
                            borderRadius: '8px',
                            fontSize: '0.86rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)'
                          }}
                        >
                          + Add First Address
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {addresses.map((addr) => {
                        const addrId = addr.id || addr._id;
                        const isSelected = selectedAddressId === addrId;
                        const isDefault = Boolean(addr.isDefault);

                        return (
                          <div
                            key={addrId}
                            onClick={() => setSelectedAddressId(addrId)}
                            className={`checkout-addr-card ${isSelected ? 'selected' : ''}`}
                          >
                            {/* Row 1: Badges on Left, Action buttons on Right */}
                            <div className="checkout-addr-card-top">
                              <div className="checkout-addr-card-tags">
                                <input
                                  type="radio"
                                  name="modalSelectedAddress"
                                  checked={isSelected}
                                  onChange={() => setSelectedAddressId(addrId)}
                                  style={{ accentColor: '#ea580c', cursor: 'pointer', width: '16px', height: '16px', flexShrink: 0 }}
                                />
                                <span style={{
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  fontSize: '0.7rem',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em'
                                }}>
                                  {addr.addressType || 'HOME'}
                                </span>
                                {isDefault && (
                                  <span style={{
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    fontSize: '0.68rem',
                                    fontWeight: '800',
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    ✓ DEFAULT
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons: Edit / Delete */}
                              <div className="checkout-addr-card-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditAddressInModal(addr)}
                                  style={{
                                    background: '#fff7ed',
                                    border: '1px solid #fed7aa',
                                    color: '#c2410c',
                                    fontSize: '0.76rem',
                                    fontWeight: '700',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Edit address"
                                >
                                  <Edit3 size={12} />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleModalDeleteAddress(e, addrId)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Delete address"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* Row 2: Customer Name & Phone */}
                            <div className="checkout-addr-recipient-row">
                              <strong style={{ fontSize: '0.94rem', color: '#0f172a' }}>
                                {addr.name}
                              </strong>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '700' }}>
                                +91 {addr.phone}
                              </span>
                            </div>

                            {/* Row 3: Address Text */}
                            <div className="checkout-addr-text-row">
                              {addr.address}{addr.locality ? `, ${addr.locality}` : ''}{addr.landmark ? `, Near ${addr.landmark}` : ''}, {addr.city || addr.district}, {addr.state || 'Kerala'} - <strong>{addr.pincode}</strong>
                            </div>

                            {/* Row 4: Card Footer (Mark as Default on Left, Deliver Here on Right) */}
                            <div className="checkout-addr-card-footer">
                              <div>
                                {!isDefault && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleModalSetDefault(addrId);
                                    }}
                                    className="checkout-addr-btn-default"
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: '#ea580c',
                                      fontSize: '0.78rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      padding: 0
                                    }}
                                  >
                                    Mark as Default
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectAndDeliverFromModal(addr);
                                }}
                                className={`checkout-addr-btn-deliver ${isSelected ? 'selected' : ''}`}
                                style={{
                                  background: '#dc2626',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 20px',
                                  fontSize: '0.84rem',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  boxShadow: isSelected ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
                                }}
                              >
                                {isSelected ? 'DELIVER HERE ➔' : 'Select & Deliver'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Body: FORM VIEW (ADD / EDIT ADDRESS) */}
            {addressModalView === 'form' && (
              <form onSubmit={handleModalSaveAddress} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setAddressModalView('list')}
                    style={{ background: 'transparent', border: 'none', color: '#ea580c', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    ← Back to Saved Addresses
                  </button>

                  <button
                    type="button"
                    onClick={handleModalUseCurrentLocation}
                    disabled={modalIsLocating}
                    style={{
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Navigation size={13} />
                    <span>{modalIsLocating ? 'Locating...' : 'Use my current location'}</span>
                  </button>
                </div>

                {/* Name & 10-Digit Mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={modalAddressForm.name}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, name: e.target.value })}
                      placeholder="Recipient Full Name"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>10-Digit Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={modalAddressForm.phone}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                      placeholder="Delivery Mobile"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Pincode & Locality */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Pincode (6 Digits) *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={modalAddressForm.pincode}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                      placeholder="e.g. 689641"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                    {modalPincodeCheck?.serviceable === true && (
                      <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                        ✓ Kerala Courier Serviceable ({modalPincodeCheck.district})
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Locality / Area *</label>
                    <input
                      type="text"
                      required
                      value={modalAddressForm.locality}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, locality: e.target.value })}
                      placeholder="e.g. Nirannukala Road"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Address (Area and Street) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Address (House / Building / Street) *</label>
                  <textarea
                    rows={2}
                    required
                    value={modalAddressForm.address}
                    onChange={(e) => setModalAddressForm({ ...modalAddressForm, address: e.target.value })}
                    placeholder="House name, Building, Street address"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* City / District & State */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>City / District *</label>
                    <input
                      type="text"
                      required
                      value={modalAddressForm.city || modalAddressForm.district}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, city: e.target.value, district: e.target.value })}
                      placeholder="Pathanamthitta"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>State *</label>
                    <input
                      type="text"
                      required
                      value={modalAddressForm.state || 'Kerala'}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, state: e.target.value })}
                      placeholder="Kerala"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Landmark & Alternate Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Landmark (Optional)</label>
                    <input
                      type="text"
                      value={modalAddressForm.landmark}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, landmark: e.target.value })}
                      placeholder="e.g. Near Temple / Waiting shed"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Alternate Phone (Optional)</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={modalAddressForm.alternatePhone}
                      onChange={(e) => setModalAddressForm({ ...modalAddressForm, alternatePhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                      placeholder="Alternate Mobile"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Address Type: Radio buttons for HOME or WORK */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Address Type</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="modalAddressType"
                        value="HOME"
                        checked={modalAddressForm.addressType === 'HOME'}
                        onChange={() => setModalAddressForm({ ...modalAddressForm, addressType: 'HOME' })}
                        style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                      />
                      <span>Home (All day delivery)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#0f172a', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="modalAddressType"
                        value="WORK"
                        checked={modalAddressForm.addressType === 'WORK'}
                        onChange={() => setModalAddressForm({ ...modalAddressForm, addressType: 'WORK' })}
                        style={{ accentColor: '#ea580c', cursor: 'pointer' }}
                      />
                      <span>Work (Delivery between 10 AM - 5 PM)</span>
                    </label>
                  </div>
                </div>

                {/* Set as Default Address Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="modal-check-default-address"
                    checked={modalAddressForm.isDefault}
                    onChange={(e) => setModalAddressForm({ ...modalAddressForm, isDefault: e.target.checked })}
                    style={{ accentColor: '#ea580c', width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="modal-check-default-address" style={{ fontSize: '0.82rem', color: '#334155', fontWeight: '600', cursor: 'pointer' }}>
                    Set as my default delivery address
                  </label>
                </div>

                {/* Modal Form Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAddressModalView('list')}
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #cbd5e1',
                      color: '#475569',
                      fontSize: '0.86rem',
                      fontWeight: '700',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={modalIsSaving}
                    style={{
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 28px',
                      fontSize: '0.88rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {modalIsSaving ? 'SAVING...' : 'SAVE & DELIVER HERE ➔'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
