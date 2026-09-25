import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, token, isLoggedIn } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('vpt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Track whether the page was initially loaded while already authenticated
  const wasLoggedInAtMount = useRef(Boolean(token));
  const isInitialMountRef = useRef(true);
  const activeUserKeyRef = useRef(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState(() => {
    try {
      const saved = localStorage.getItem('vpt_delivery_type');
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
      localStorage.setItem('vpt_delivery_type', deliveryType);
    } catch {}
  }, [deliveryType]);

  // Sync Cart with Backend on Customer Login vs Session Resume (Flipkart / Amazon style)
  useEffect(() => {
    let isCancelled = false;

    async function initializeOrSyncCart() {
      if (token && isCustomer) {
        const userKey = String(user?.id || user?.phone || '');
        if (activeUserKeyRef.current === userKey) return;
        activeUserKeyRef.current = userKey;

        // CASE 1: Page Refresh / Session Resume
        // If the user was ALREADY logged in when this page mounted, DO NOT merge guest cart!
        // Simply fetch their cloud cart from MongoDB Atlas so it is guaranteed 100% in sync.
        if (wasLoggedInAtMount.current && isInitialMountRef.current) {
          isInitialMountRef.current = false;
          try {
            const cloudRes = await api.getCustomerCart();
            if (!isCancelled && cloudRes && cloudRes.success && Array.isArray(cloudRes.cart)) {
              setCart(cloudRes.cart);
              try {
                localStorage.setItem('vpt_cart', JSON.stringify(cloudRes.cart));
              } catch {}
            }
          } catch (err) {
            console.warn('Could not fetch cloud cart on session resume:', err);
          }
          return;
        }

        // CASE 2: Fresh Login Transition (Guest -> Logged In)
        // User was browsing as a guest without a token and just signed in / verified OTP.
        isInitialMountRef.current = false;
        try {
          if (cart && cart.length > 0) {
            // Merge guest cart with account cart
            const syncRes = await api.syncCustomerCart(cart);
            if (!isCancelled && syncRes && syncRes.success && Array.isArray(syncRes.cart)) {
              setCart(syncRes.cart);
              try {
                localStorage.setItem('vpt_cart', JSON.stringify(syncRes.cart));
              } catch {}
            }
          } else {
            // Guest had no items, retrieve whatever account already has
            const cloudRes = await api.getCustomerCart();
            if (!isCancelled && cloudRes && cloudRes.success && Array.isArray(cloudRes.cart)) {
              setCart(cloudRes.cart);
              try {
                localStorage.setItem('vpt_cart', JSON.stringify(cloudRes.cart));
              } catch {}
            }
          }
        } catch (err) {
          console.warn('Customer cart sync error on login:', err);
        }
      } else if (!token) {
        // User is logged out
        activeUserKeyRef.current = null;
        wasLoggedInAtMount.current = false;
        isInitialMountRef.current = false;
      }
    }

    initializeOrSyncCart();

    return () => {
      isCancelled = true;
    };
  }, [token, isCustomer, user?.id, user?.phone]);

  // Keep localStorage continuously updated
  useEffect(() => {
    try {
      localStorage.setItem('vpt_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.removeItem('vpt_redeemed_coupons');
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
    const availableStock = typeof product.stock === 'number' ? product.stock : 999;
    if (availableStock <= 0) {
      showToast(`Sorry, "${product.name.slice(0, 24)}" is currently out of stock!`);
      return false;
    }

    let cappedNotice = false;
    let computedCart = [];

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const currentQty = existing.quantity || 0;
        if (currentQty >= availableStock) {
          cappedNotice = true;
          computedCart = prev;
          return prev;
        }
        const nextQty = Math.min(currentQty + quantity, availableStock);
        if (currentQty + quantity > availableStock) {
          cappedNotice = true;
        }
        computedCart = prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: nextQty, stock: availableStock }
            : item
        );
        return computedCart;
      }
      const initialQty = Math.min(quantity, availableStock);
      if (quantity > availableStock) {
        cappedNotice = true;
      }
      computedCart = [...prev, { ...product, quantity: initialQty, stock: availableStock }];
      return computedCart;
    });

    try {
      localStorage.setItem('vpt_cart', JSON.stringify(computedCart));
    } catch {}

    if (token && isCustomer) {
      api.saveCustomerCart(computedCart).catch(() => {});
    }

    if (cappedNotice) {
      showToast(`Stock limit reached! Max ${availableStock} unit(s) available.`);
    } else {
      showToast(`Added "${product.name.slice(0, 24)}..." to cart!`);
    }
    return true;
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    let computedCart = [];
    setCart(prev => {
      computedCart = prev.map(item => {
        if (item.id !== productId) return item;
        const availableStock = typeof item.stock === 'number' ? item.stock : 999;
        if (quantity > availableStock) {
          showToast(`Only ${availableStock} unit(s) available in stock.`);
          return { ...item, quantity: availableStock };
        }
        return { ...item, quantity };
      });
      return computedCart;
    });

    try {
      localStorage.setItem('vpt_cart', JSON.stringify(computedCart));
    } catch {}

    if (token && isCustomer) {
      api.saveCustomerCart(computedCart).catch(() => {});
    }
  };

  const removeFromCart = (productId) => {
    let computedCart = [];
    setCart(prev => {
      computedCart = prev.filter(item => item.id !== productId);
      return computedCart;
    });

    try {
      localStorage.setItem('vpt_cart', JSON.stringify(computedCart));
    } catch {}

    showToast("Item removed from cart");

    if (token && isCustomer) {
      api.saveCustomerCart(computedCart).catch(() => {});
    }
  };

  const clearCart = () => {
    setCart([]);
    try {
      localStorage.removeItem('vpt_cart');
    } catch {}
    setCouponCode('');
    setAppliedDiscount(0);
    setActiveCoupon(null);
    if (token && isCustomer) {
      api.clearCustomerCart().catch(() => {});
    }
  };

  const applyCoupon = async (code, userIdent = '') => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast("Please enter a coupon code");
      return { success: false, message: "Please enter a coupon code" };
    }

    try {
      const currentSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const userPayload = typeof userIdent === 'object'
        ? userIdent
        : { phone: (userIdent || '').replace(/[^0-9]/g, '').slice(-10) };

      const res = await api.validateCoupon(cleanCode, currentSubtotal, userPayload);

      if (res && res.valid) {
        setActiveCoupon({
          ...res.coupon,
          requiresPhone: Boolean(res.requiresPhone),
          verifiedPhone: res.requiresPhone ? '' : (userPayload.phone || '')
        });
        setAppliedDiscount(res.coupon.discountType === 'flat' ? res.coupon.discountValue : res.coupon.discountValue);
        setCouponCode(cleanCode);

        if (res.requiresPhone) {
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

  const verifyCouponWithPhone = async (userIdent, { silent = false } = {}) => {
    if (!activeCoupon) return { valid: true };
    const userPayload = typeof userIdent === 'object'
      ? userIdent
      : { phone: (userIdent || '').replace(/[^0-9]/g, '').slice(-10) };

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
      const res = await api.validateCoupon(activeCoupon.code, subtotal, userPayload);
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

  // Auto-validate minimum order amount if cart subtotal changes
  useEffect(() => {
    if (cart.length === 0 && activeCoupon) {
      setActiveCoupon(null);
      setCouponCode('');
      setAppliedDiscount(0);
    }
  }, [cart.length, activeCoupon]);

  // Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.discountType === 'flat') {
      discountAmount = Math.min(subtotal, Number(activeCoupon.discountValue) || 0);
    } else {
      discountAmount = Math.round((subtotal * (Number(activeCoupon.discountValue) || 0)) / 100);
    }
  }

  const totalCourierFee = cart.reduce((sum, item) => {
    const itemFee = typeof item.deliveryCost === 'number' ? item.deliveryCost : 120;
    return sum + (itemFee * (item.quantity || 1));
  }, 0);
  const deliveryFee = deliveryType === 'kerala-courier' ? totalCourierFee : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

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
