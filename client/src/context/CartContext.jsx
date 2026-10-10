import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { safeLocalStorage, safeSessionStorage } from '../utils/safeStorage';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, token, isLoggedIn } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [cart, setCart] = useState(() => {
    try {
      const saved = safeLocalStorage.getItem('vpt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const activeUserKeyRef = useRef(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState(() => {
    try {
      const saved = safeLocalStorage.getItem('vpt_delivery_type');
      return saved === 'store-pickup' ? 'store-pickup' : 'kerala-courier';
    } catch {
      return 'kerala-courier';
    }
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage or info
  const [activeCoupon, setActiveCoupon] = useState(null); // { code, discountType, discountValue, description }
  const [toastMessage, setToastMessage] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      safeLocalStorage.setItem('vpt_delivery_type', deliveryType);
    } catch {}
  }, [deliveryType]);

  // Helper to merge local and cloud carts cleanly without dropping any items
  const mergeCarts = (cartA = [], cartB = []) => {
    const map = new Map();
    for (const item of (cartA || [])) {
      const id = String(item.id || item._id || '');
      if (id) map.set(id, { ...item, id });
    }
    for (const item of (cartB || [])) {
      const id = String(item.id || item._id || '');
      if (id) {
        if (map.has(id)) {
          const existing = map.get(id);
          const maxStock = typeof existing.stock === 'number' ? existing.stock : (typeof item.stock === 'number' ? item.stock : 999);
          const mergedQty = Math.min(Math.max(existing.quantity || 1, item.quantity || 1), maxStock);
          map.set(id, { ...existing, ...item, id, quantity: mergedQty });
        } else {
          map.set(id, { ...item, id });
        }
      }
    }
    return Array.from(map.values());
  };

  // Sync Cart with Backend on Customer Login vs Session Resume (Flipkart / Amazon style)
  useEffect(() => {
    let isCancelled = false;

    async function initializeOrSyncCart() {
      if (token && isCustomer) {
        const userKey = String(user?.id || user?.phone || '');
        if (activeUserKeyRef.current === userKey) return;
        activeUserKeyRef.current = userKey;

        try {
          const cloudRes = await api.getCustomerCart();
          if (!isCancelled && cloudRes && cloudRes.success) {
            const cloudCart = Array.isArray(cloudRes.cart) ? cloudRes.cart : [];
            const localCart = cartRef.current || [];

            if (cloudCart.length > 0 && localCart.length > 0) {
              // Both have items: merge them so nothing is lost!
              const merged = mergeCarts(cloudCart, localCart);
              cartRef.current = merged;
              setCart(merged);
              try { safeLocalStorage.setItem('vpt_cart', JSON.stringify(merged)); } catch {}
              api.saveCustomerCart(merged).catch(() => {});
            } else if (cloudCart.length > 0 && localCart.length === 0) {
              // Cloud has items, local was empty: restore cloud cart
              cartRef.current = cloudCart;
              setCart(cloudCart);
              try { safeLocalStorage.setItem('vpt_cart', JSON.stringify(cloudCart)); } catch {}
            } else if (localCart.length > 0 && cloudCart.length === 0) {
              // Local cart has items, cloud was empty: keep local and sync to cloud
              api.saveCustomerCart(localCart).catch(() => {});
            }
          }
        } catch (err) {
          console.warn('Customer cart sync notice:', err);
        }
      } else if (!token) {
        activeUserKeyRef.current = null;
      }
    }

    initializeOrSyncCart();

    return () => {
      isCancelled = true;
    };
  }, [token, isCustomer, user?.id, user?.phone]);

  // Keep localStorage continuously updated whenever cart changes
  useEffect(() => {
    try {
      safeLocalStorage.setItem('vpt_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      safeLocalStorage.removeItem('vpt_redeemed_coupons');
    } catch {}
  }, []);

  const removeNotif = (id) => {
    setNotifications((pv) => pv.filter((n) => n.id !== id));
  };

  const showToast = (message, explicitType) => {
    setToastMessage(message);
    let type = explicitType || 'brand';
    if (!explicitType && typeof message === 'string') {
      if (message.includes('✅') || message.includes('🎉')) {
        type = 'success';
      } else if (
        message.includes('⚠️') ||
        message.toLowerCase().includes('sorry') ||
        message.toLowerCase().includes('limit') ||
        message.toLowerCase().includes('invalid')
      ) {
        type = 'warning';
      } else {
        type = 'brand';
      }
    }

    const newNotif = {
      id: Date.now() + Math.random(),
      text: message,
      type
    };
    setNotifications((pv) => [newNotif, ...pv]);

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const addToCart = (product, quantity = 1) => {
    if (!product) return false;
    const availableStock = typeof product.stock === 'number' ? product.stock : 999;
    if (availableStock <= 0) {
      showToast(`Sorry, "${(product.name || '').slice(0, 24)}" is currently out of stock!`);
      return false;
    }

    const prodId = String(product.id || product._id || '');
    if (!prodId) return false;

    let cappedNotice = false;
    const prev = cartRef.current || [];
    const existingIndex = prev.findIndex(item => String(item.id || item._id) === prodId);

    let nextCart;
    if (existingIndex > -1) {
      const existing = prev[existingIndex];
      const currentQty = existing.quantity || 0;
      if (currentQty >= availableStock) {
        showToast(`Stock limit reached! Max ${availableStock} unit(s) available.`);
        return false;
      }
      const nextQty = Math.min(currentQty + quantity, availableStock);
      if (currentQty + quantity > availableStock) {
        cappedNotice = true;
      }
      nextCart = prev.map((item, idx) =>
        idx === existingIndex
          ? { ...item, ...product, id: prodId, quantity: nextQty, stock: availableStock }
          : item
      );
    } else {
      const initialQty = Math.min(quantity, availableStock);
      if (quantity > availableStock) {
        cappedNotice = true;
      }
      nextCart = [...prev, { ...product, id: prodId, quantity: initialQty, stock: availableStock }];
    }

    cartRef.current = nextCart;
    setCart(nextCart);

    try {
      safeLocalStorage.setItem('vpt_cart', JSON.stringify(nextCart));
    } catch {}

    if (token && isCustomer) {
      api.saveCustomerCart(nextCart).catch(() => {});
    }

    if (cappedNotice) {
      showToast(`Stock limit reached! Max ${availableStock} unit(s) available.`);
    } else {
      showToast(`Added "${(product.name || '').slice(0, 24)}..." to cart!`);
    }
    return true;
  };

  const updateQuantity = (productId, quantity) => {
    const cleanId = String(productId);
    if (quantity <= 0) {
      removeFromCart(cleanId);
      return;
    }
    const prev = cartRef.current || [];
    const nextCart = prev.map(item => {
      if (String(item.id || item._id) !== cleanId) return item;
      const availableStock = typeof item.stock === 'number' ? item.stock : 999;
      if (quantity > availableStock) {
        showToast(`Only ${availableStock} unit(s) available in stock.`);
        return { ...item, quantity: availableStock };
      }
      return { ...item, quantity };
    });

    cartRef.current = nextCart;
    setCart(nextCart);

    try {
      safeLocalStorage.setItem('vpt_cart', JSON.stringify(nextCart));
    } catch {}

    if (token && isCustomer) {
      api.saveCustomerCart(nextCart).catch(() => {});
    }
  };

  const removeFromCart = (productId) => {
    const cleanId = String(productId);
    const prev = cartRef.current || [];
    const nextCart = prev.filter(item => String(item.id || item._id) !== cleanId);

    cartRef.current = nextCart;
    setCart(nextCart);

    try {
      safeLocalStorage.setItem('vpt_cart', JSON.stringify(nextCart));
    } catch {}

    showToast("Item removed from cart");

    if (token && isCustomer) {
      api.saveCustomerCart(nextCart).catch(() => {});
    }
  };

  const clearCart = () => {
    cartRef.current = [];
    setCart([]);
    try {
      safeLocalStorage.removeItem('vpt_cart');
    } catch {}
    setCouponCode('');
    setAppliedDiscount(0);
    setActiveCoupon(null);
    if (token && isCustomer) {
      api.clearCustomerCart().catch(() => {});
    }
  };

  // Get active checkout subtotal (custom passed-in subtotal, current cart subtotal, or direct "Buy Now" subtotal)
  const getCheckoutSubtotal = (customSubtotal = null) => {
    if (customSubtotal !== null && customSubtotal !== undefined && !isNaN(Number(customSubtotal))) {
      return Number(customSubtotal);
    }
    const cartSum = (cartRef.current || cart || []).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    if (cartSum > 0) return cartSum;

    try {
      const bn = safeSessionStorage.getItem('vpt_buy_now');
      if (bn) {
        const parsed = JSON.parse(bn);
        if (parsed && typeof parsed === 'object') {
          const itemPrice = Number(parsed.price || 0);
          const itemQty = Number(parsed.quantity || 1);
          if (itemPrice > 0) {
            return itemPrice * itemQty;
          }
        }
      }
    } catch {}

    return 0;
  };

  // Helper to extract complete user identity (merges currently logged in user context)
  const getEffectiveUserIdent = (userIdent = null) => {
    const defaultCustomerId = user?.id || user?._id || null;
    const defaultPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    const defaultEmail = (user?.email || '').trim().toLowerCase();

    if (userIdent && typeof userIdent === 'object') {
      return {
        customerId: userIdent.customerId || userIdent.id || userIdent._id || defaultCustomerId,
        phone: (userIdent.phone || userIdent.customerPhone || defaultPhone || '').replace(/[^0-9]/g, '').slice(-10),
        email: (userIdent.email || defaultEmail || '').trim().toLowerCase()
      };
    }

    const explicitPhone = (typeof userIdent === 'string' && userIdent.trim().length > 0)
      ? userIdent.replace(/[^0-9]/g, '').slice(-10)
      : '';

    return {
      customerId: defaultCustomerId,
      phone: explicitPhone || defaultPhone || '',
      email: defaultEmail || ''
    };
  };

  const applyCoupon = async (code, userIdent = '', customSubtotal = null) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast("Please enter a coupon code");
      return { success: false, message: "Please enter a coupon code" };
    }

    try {
      const effectiveSubtotal = getCheckoutSubtotal(customSubtotal);
      const userPayload = getEffectiveUserIdent(userIdent);

      const res = await api.validateCoupon(cleanCode, effectiveSubtotal, userPayload);

      if (res && res.valid) {
        // If customer is already signed in (has customerId or valid 10-digit phone), treat as verified immediately
        const isAlreadyIdentified = Boolean(userPayload.customerId || (userPayload.phone && userPayload.phone.length === 10));
        const requiresPhone = Boolean(res.requiresPhone) && !isAlreadyIdentified;
        const verifiedPhone = isAlreadyIdentified ? (userPayload.phone || '') : (res.requiresPhone ? '' : (userPayload.phone || ''));

        setActiveCoupon({
          ...res.coupon,
          requiresPhone,
          verifiedPhone
        });
        setAppliedDiscount(res.coupon.discountType === 'flat' ? res.coupon.discountValue : res.coupon.discountValue);
        setCouponCode(cleanCode);

        if (requiresPhone) {
          showToast(`📱 Please sign in or enter your mobile number to verify this single-use coupon.`);
          return { success: true, requiresPhone: true, message: "Please sign in to verify this single-use offer for your account." };
        } else {
          showToast(res.message || `🎉 Coupon "${cleanCode}" applied!`);
          return { success: true, message: res.message };
        }
      } else {
        setActiveCoupon(null);
        setAppliedDiscount(0);
        showToast(res?.message || "Invalid coupon code");
        return { success: false, message: res?.message || "Invalid coupon code" };
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      setActiveCoupon(null);
      setAppliedDiscount(0);
      showToast("Invalid or expired coupon code");
      return { success: false, message: "Invalid or expired coupon code" };
    }
  };

  const verifyCouponWithPhone = async (userIdent, { silent = false, customSubtotal = null } = {}) => {
    if (!activeCoupon) return { valid: true };
    const userPayload = getEffectiveUserIdent(userIdent);

    const cleanPhone = userPayload.phone || '';
    if (!userPayload.customerId && cleanPhone.length !== 10) {
      if (!silent) showToast("Sign in or enter valid 10-digit mobile number");
      return { valid: false, message: "Enter valid 10-digit mobile number" };
    }

    // If already verified for this exact phone number or account, prevent duplicate calls
    if (activeCoupon.verifiedPhone === cleanPhone && !activeCoupon.requiresPhone) {
      return { valid: true };
    }

    try {
      const effectiveSubtotal = getCheckoutSubtotal(customSubtotal);
      const res = await api.validateCoupon(activeCoupon.code, effectiveSubtotal, userPayload);
      if (res && res.valid) {
        setActiveCoupon(prev => ({
          ...prev,
          requiresPhone: false,
          verifiedPhone: cleanPhone
        }));
        if (!silent) {
          showToast(`✅ Verified! Coupon "${activeCoupon.code}" applied for your account`);
        }
        return { valid: true };
      } else {
        removeCoupon();
        if (!silent) {
          showToast(res?.message || "Coupon is not valid for this phone number");
        }
        return { valid: false, message: res?.message || "Coupon is not valid for this phone number" };
      }
    } catch (err) {
      if (!silent) {
        showToast(err.message || "Failed to verify phone number");
      }
      return { valid: false, message: err.message };
    }
  };

  const recordDeviceCouponRedemption = () => {
    // Deprecated: Coupon restrictions are strictly verified by phone number
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    setCouponCode('');
    setAppliedDiscount(0);
    showToast("Coupon removed");
  };

  // Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const effectiveSubtotalForDiscount = subtotal > 0 ? subtotal : getCheckoutSubtotal();
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountType === 'flat') {
      discountAmount = Math.min(effectiveSubtotalForDiscount, Number(activeCoupon.discountValue) || 0);
    } else {
      discountAmount = Math.round((effectiveSubtotalForDiscount * (Number(activeCoupon.discountValue) || 0)) / 100);
    }
  }

  const totalCourierFee = cart.reduce((sum, item) => {
    const itemFee = typeof item.deliveryCost === 'number' ? item.deliveryCost : 120;
    return sum + (itemFee * (item.quantity || 1));
  }, 0);
  const deliveryFee = deliveryType === 'kerala-courier' ? totalCourierFee : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Auto-validate minimum order amount if checkout subtotal changes
  useEffect(() => {
    let hasBuyNow = false;
    let buyNowSubtotal = 0;
    try {
      const bn = safeSessionStorage.getItem('vpt_buy_now');
      if (bn) {
        const parsed = JSON.parse(bn);
        if (parsed && typeof parsed === 'object') {
          hasBuyNow = true;
          buyNowSubtotal = Number(parsed.price || 0) * Number(parsed.quantity || 1);
        }
      }
    } catch {}

    const effectiveSubtotal = (cart.length === 0 && hasBuyNow) ? buyNowSubtotal : subtotal;

    if (cart.length === 0 && !hasBuyNow && activeCoupon) {
      setActiveCoupon(null);
      setCouponCode('');
      setAppliedDiscount(0);
    } else if (activeCoupon && activeCoupon.minOrderAmount && effectiveSubtotal > 0 && effectiveSubtotal < activeCoupon.minOrderAmount) {
      setActiveCoupon(null);
      setCouponCode('');
      setAppliedDiscount(0);
      showToast(`Coupon removed: Order subtotal fell below ₹${activeCoupon.minOrderAmount.toLocaleString('en-IN')}`);
    }
  }, [cart.length, subtotal, activeCoupon]);

  // Auto-verify single-use coupon if user is logged in or logs in
  useEffect(() => {
    if (activeCoupon && activeCoupon.requiresPhone && user) {
      const userPayload = getEffectiveUserIdent();
      if (userPayload.customerId || (userPayload.phone && userPayload.phone.length === 10)) {
        setActiveCoupon(prev => ({
          ...prev,
          requiresPhone: false,
          verifiedPhone: userPayload.phone || prev?.verifiedPhone || ''
        }));
      }
    }
  }, [user, activeCoupon?.code, activeCoupon?.requiresPhone]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal,
        discountAmount,
        appliedDiscount,
        activeCoupon,
        deliveryFee,
        totalCourierFee,
        deliveryType,
        setDeliveryType,
        couponCode,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        verifyCouponWithPhone,
        getCheckoutSubtotal,
        recordDeviceCouponRedemption,
        finalTotal,
        toastMessage,
        notifications,
        removeNotif,
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext) || {};
