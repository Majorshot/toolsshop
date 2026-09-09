import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('vpt_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState('store-pickup'); // 'store-pickup' or 'kerala-courier'
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // percentage or info
  const [activeCoupon, setActiveCoupon] = useState(null); // { code, discountType, discountValue, description }
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    localStorage.setItem('vpt_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.removeItem('vpt_redeemed_coupons');
    } catch {}
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const addToCart = (product, quantity = 1) => {
    const availableStock = typeof product.stock === 'number' ? product.stock : 999;
    if (availableStock <= 0) {
      showToast(`Sorry, "${product.name.slice(0, 24)}" is currently out of stock!`);
      return false;
    }

    let cappedNotice = false;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const currentQty = existing.quantity || 0;
        if (currentQty >= availableStock) {
          cappedNotice = true;
          return prev;
        }
        const nextQty = Math.min(currentQty + quantity, availableStock);
        if (currentQty + quantity > availableStock) {
          cappedNotice = true;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: nextQty, stock: availableStock }
            : item
        );
      }
      const initialQty = Math.min(quantity, availableStock);
      if (quantity > availableStock) {
        cappedNotice = true;
      }
      return [...prev, { ...product, quantity: initialQty, stock: availableStock }];
    });

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
    setCart(prev =>
      prev.map(item => {
        if (item.id !== productId) return item;
        const availableStock = typeof item.stock === 'number' ? item.stock : 999;
        if (quantity > availableStock) {
          showToast(`Only ${availableStock} unit(s) available in stock.`);
          return { ...item, quantity: availableStock };
        }
        return { ...item, quantity };
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    showToast("Item removed from cart");
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setAppliedDiscount(0);
    setActiveCoupon(null);
  };

  const applyCoupon = async (code, phone = '') => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      showToast("Please enter a coupon code");
      return { success: false, message: "Please enter a coupon code" };
    }

    try {
      const currentSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);
      const res = await api.validateCoupon(cleanCode, currentSubtotal, cleanPhone);

      if (res && res.valid) {
        setActiveCoupon({
          ...res.coupon,
          requiresPhone: Boolean(res.requiresPhone),
          verifiedPhone: res.requiresPhone ? '' : cleanPhone
        });
        setAppliedDiscount(res.coupon.discountType === 'flat' ? res.coupon.discountValue : res.coupon.discountValue);
        setCouponCode(cleanCode);

        if (res.requiresPhone) {
          showToast(`📱 Please enter your mobile number to verify this single-use coupon.`);
          return { success: true, requiresPhone: true, message: "Please enter your 10-digit mobile number to verify this single-use offer." };
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

  const verifyCouponWithPhone = async (phone, { silent = false } = {}) => {
    if (!activeCoupon) return { valid: true };
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      if (!silent) showToast("Enter valid 10-digit mobile number");
      return { valid: false, message: "Enter valid 10-digit mobile number" };
    }

    // If already verified for this exact phone number, prevent duplicate calls and toast spam
    if (activeCoupon.verifiedPhone === cleanPhone && !activeCoupon.requiresPhone) {
      return { valid: true };
    }

    try {
      const res = await api.validateCoupon(activeCoupon.code, subtotal, cleanPhone);
      if (res && res.valid) {
        setActiveCoupon(prev => ({
          ...prev,
          requiresPhone: false,
          verifiedPhone: cleanPhone
        }));
        if (!silent) {
          showToast(`✅ Verified! Coupon "${activeCoupon.code}" applied for +91 ${cleanPhone}`);
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
        showToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext) || {};
