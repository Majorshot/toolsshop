import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, MapPin, Truck, ShieldCheck, AlertCircle, ArrowRight,
  User, Lock, Mail, Phone, MessageCircle, FileText, CheckCircle2, ChevronRight, Edit3,
  ShoppingBag, Shield, Check, Clock, Package, Building
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

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
  const { user, isLoggedIn, login, register, logout, updateUser } = useAuth();
  const {
    cart,
    clearCart,
    subtotal,
    discountAmount,
    activeCoupon,
    applyCoupon,
    removeCoupon,
    verifyCouponWithPhone,
    deliveryFee,
    deliveryType,
    setDeliveryType,
    finalTotal
  } = useCart();

  const isCustomerLoggedIn = isLoggedIn && user && user.role === 'customer';
  const [step, setStep] = useState(isCustomerLoggedIn ? 2 : 1);

  // Delivery & Customer Form State
  const [formData, setFormData] = useState({
    name: user?.name && !user.name.toLowerCase().includes('valued customer') ? user.name : '',
    phone: user?.phone || '',
    email: user?.email && !user.email.includes('valuedcustomer') ? user.email : '',
    address: user?.address || '',
    landmark: user?.landmark || '',
    district: user?.district || 'Pathanamthitta',
    pincode: user?.pincode || '689641',
    paymentMethod: 'razorpay' // 'razorpay' or 'cash'
  });

  // Inline Step 1 Login State
  const [loginForm, setLoginForm] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // Blinkit / Zepto Style Phone Lookup & Auto-Registration state
  const [phoneLookup, setPhoneLookup] = useState({
    checking: false,
    checkedPhone: '',
    exists: null,
    customerName: null,
    hasAddress: false
  });
  const [accountNotice, setAccountNotice] = useState(null);

  // Coupon inline input
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState(null);

  // Sync user profile data from AuthContext / Atlas
  useEffect(() => {
    if (isCustomerLoggedIn) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
        address: prev.address || user.address || '',
        landmark: prev.landmark || user.landmark || '',
        district: prev.district || user.district || 'Pathanamthitta',
        pincode: prev.pincode || user.pincode || '689641'
      }));
      setStep(prev => (prev === 1 ? 2 : prev));
    } else {
      setStep(1);
    }
  }, [user, isCustomerLoggedIn]);

  // Live Kerala Pincode Serviceability Check
  useEffect(() => {
    if (deliveryType === 'kerala-courier' && formData.pincode && formData.pincode.trim().length === 6) {
      const pin = formData.pincode.trim();
      let active = true;
      setPincodeCheck({ checking: true });
      api.checkShippingPincode(pin)
        .then(res => {
          if (active) {
            setPincodeCheck({
              checking: false,
              serviceable: res.serviceable,
              city: res.city || res.district,
              codAvailable: res.codAvailable,
              message: res.message
            });
          }
        })
        .catch(() => {
          if (active) setPincodeCheck(null);
        });
      return () => { active = false; };
    } else {
      setPincodeCheck(null);
    }
  }, [formData.pincode, deliveryType]);

  // Live Blinkit/Zepto Phone Existence Check
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
              hasAddress: !!res.hasAddress
            });
            // If existing customer and name was empty, auto-populate name
            if (res.exists && res.name && !loginForm.name.trim()) {
              setLoginForm(prev => ({ ...prev, name: res.name }));
            }
          }
        })
        .catch(() => {
          if (active) {
            setPhoneLookup({ checking: false, checkedPhone: clean, exists: null, customerName: null, hasAddress: false });
          }
        });
      return () => { active = false; };
    } else {
      setPhoneLookup({ checking: false, checkedPhone: '', exists: null, customerName: null, hasAddress: false });
    }
  }, [loginForm.phone]);

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1: Customer Account Sign-In / Register (Blinkit & Zepto Auto-Flow)
  const handleAccountLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setAccountNotice(null);

    if (!loginForm.name.trim()) {
      setErrorMsg('Please enter your full customer name.');
      return;
    }

    const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoginLoading(true);
    try {
      let loggedUser;
      try {
        // Attempt login first for existing customers
        loggedUser = await login(
          'customer',
          cleanPhone,
          null,
          loginForm.name.trim(),
          { email: loginForm.email.trim() }
        );
        setAccountNotice({
          type: 'existing',
          message: `Welcome back, ${loggedUser.name || loginForm.name.trim()}!`
        });
      } catch (loginErr) {
        // Blinkit / Zepto Flow: If no account found, register automatically on the spot!
        const errMsg = (loginErr.message || '').toLowerCase();
        const isNotFound = errMsg.includes('no account') || errMsg.includes('register first') || errMsg.includes('not found') || errMsg.includes('404');

        if (isNotFound) {
          const fallbackEmail = loginForm.email.trim() || `${cleanPhone}@customer.variathupowertools.com`;
          loggedUser = await register({
            name: loginForm.name.trim(),
            phone: cleanPhone,
            email: fallbackEmail
          });

          setAccountNotice({
            type: 'created',
            message: `🎉 Welcome to Variathu Power Tools! Your verified account has been created for +91 ${cleanPhone}.`
          });
        } else {
          throw loginErr;
        }
      }

      setFormData(prev => ({
        ...prev,
        name: loggedUser.name || loginForm.name.trim(),
        phone: loggedUser.phone || cleanPhone,
        email: loggedUser.email && !loggedUser.email.includes('@customer.variathupowertools.com') ? loggedUser.email : loginForm.email.trim(),
        address: loggedUser.address || prev.address,
        landmark: loggedUser.landmark || prev.landmark,
        district: loggedUser.district || prev.district,
        pincode: loggedUser.pincode || prev.pincode
      }));

      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate customer account.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2: Confirm Address and Proceed to Payment
  const handleProceedToPayment = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (deliveryType === 'kerala-courier') {
      if (!formData.address.trim()) {
        setErrorMsg('Please enter your delivery street / shop address.');
        return;
      }
      if (!formData.pincode || formData.pincode.trim().length !== 6) {
        setErrorMsg('Please enter a valid 6-digit Kerala postal pincode.');
        return;
      }
    }

    // Auto-sync customer profile in MongoDB Atlas with the latest address
    if (user && user.id) {
      api.updateCustomer(user.id, {
        address: formData.address,
        landmark: formData.landmark,
        district: formData.district,
        pincode: formData.pincode
      }).catch(err => console.warn('Could not auto-sync customer address:', err.message));
    }

    setStep(3);
  };

  // Inline Coupon Apply in Step 3
  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setErrorMsg('');
    try {
      const userIdent = {
        customerId: user?.id,
        phone: formData.phone || user?.phone,
        email: formData.email || user?.email
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

  // Step 3: Place Order & Payment Handling
  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!isCustomerLoggedIn) {
      setStep(1);
      setErrorMsg('Please sign in with your mobile number to complete your order.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setStep(1);
      setErrorMsg('Valid 10-digit mobile number is required.');
      return;
    }

    // Final anti-abuse check for single-use coupon
    if (activeCoupon && Number(activeCoupon.usageLimitPerUser) === 1) {
      const userIdent = {
        customerId: user?.id,
        phone: cleanPhone,
        email: formData.email || user?.email
      };
      const vRes = await verifyCouponWithPhone(userIdent, { silent: true });
      if (vRes && !vRes.valid) {
        setErrorMsg(vRes.message || 'This coupon has already been redeemed by your account.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const isPrepaid = formData.paymentMethod === 'razorpay';
      const orderPayload = {
        customerId: user?.id,
        customer: {
          name: formData.name.trim(),
          phone: cleanPhone,
          email: formData.email.trim(),
          address: formData.address || (deliveryType === 'store-pickup' ? 'Poyanil Building Store Pickup, Kozhencherry' : ''),
          landmark: formData.landmark,
          district: formData.district,
          pincode: formData.pincode
        },
        items: cart.map(item => ({
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
          setErrorMsg('Razorpay payment gateway could not be loaded. Please choose Cash / Counter Payment or check internet.');
          setIsSubmitting(false);
          return;
        }

        setIsProcessingPayment(true);

        const rzpOrderRes = await api.createRazorpayOrder(
          finalTotal,
          `rcpt_${Date.now().toString().slice(-6)}`,
          {
            customer_name: formData.name.trim(),
            customer_phone: cleanPhone,
            delivery_type: deliveryType
          }
        );

        const rzpOrder = rzpOrderRes.order;

        const options = {
          key: rzpOrderRes.keyId || 'rzp_test_TZQUSp5JtcBjMs',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'Variathu Power Tools',
          description: `Order #${rzpOrder.id} • ${formData.name.trim()}`,
          image: '/Logo.jpeg',
          order_id: rzpOrder.id,
          prefill: {
            name: formData.name.trim(),
            contact: cleanPhone,
            email: formData.email.trim()
          },
          notes: {
            customerId: String(user?.id || ''),
            address: formData.address || 'Poyanil Building, Kozhencherry, Kerala - 689641',
            district: formData.district || 'Pathanamthitta',
            pincode: formData.pincode || '689641'
          },
          theme: { color: '#ea580c' },
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

              setCompletedOrder(verifyRes.data);
              clearCart();
            } catch (vErr) {
              setErrorMsg(vErr.message || 'Payment verification failed.');
            } finally {
              setIsSubmitting(false);
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setErrorMsg(`Payment Failed: ${resp.error?.description || 'Transaction declined by bank'}`);
          setIsSubmitting(false);
          setIsProcessingPayment(false);
        });
        rzp.open();
        return;
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

      setCompletedOrder(result.data);
      clearCart();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  };

  const getWhatsAppInvoiceUrl = (order) => {
    let text = `*VARIATHU POWER TOOLS - ORDER CONFIRMATION*\n`;
    text += `Order ID: *${order.id}*\n`;
    text += `Customer: ${order.customer?.name} (${order.customer?.phone})\n`;
    text += `Delivery: ${order.deliveryType === 'store-pickup' ? 'Store Pickup (Poyanil Building)' : 'Courier (' + (order.customer?.district || 'Kerala') + ')'}\n`;
    text += `Payment: ${order.paymentMethod} (${order.paymentStatus || 'CONFIRMED'})\n`;
    if (order.pickupOtp) text += `Pickup OTP: *${order.pickupOtp}*\n`;
    text += `\n*TOTAL: ${formatPrice(order.totalAmount)}*\n`;
    text += `Please confirm processing for Variathu Power Tools, Kozhencherry.`;
    return `https://wa.me/919447123456?text=${encodeURIComponent(text)}`;
  };

  // IF ORDER COMPLETED: RENDER CELEBRATION CONFIRMATION PAGE
  if (completedOrder) {
    return (
      <div style={{ minHeight: '80vh', padding: '40px 16px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', background: '#ffffff', borderRadius: '20px', padding: '40px 28px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07)', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              background: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#16a34a',
              margin: '0 auto 20px'
            }}
          >
            <CheckCircle size={44} />
          </div>

          <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '0.78rem', fontWeight: '800', padding: '4px 12px', borderRadius: '9999px', border: '1px solid #bbf7d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Payment & Order Confirmed
          </span>

          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '12px 0 6px' }}>
            Thank You For Your Order!
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '0 0 24px' }}>
            Order ID: <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '1.05rem' }}>#{completedOrder.id}</strong>
          </p>

          {/* Resend Automated Email Banner */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '16px',
              color: '#1e40af',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              maxWidth: '560px',
              margin: '0 auto 24px'
            }}
          >
            <Mail size={22} style={{ flexShrink: 0 }} />
            <span style={{ textAlign: 'left' }}>
              An official order receipt, warranty copy, and GST breakdown has been sent to <strong>{completedOrder.customer?.email || formData.email || 'your registered email'}</strong> via Resend.
            </span>
          </div>

          {/* Key Order Details */}
          <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'left', marginBottom: '28px', maxWidth: '560px', margin: '0 auto 28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>Customer</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{completedOrder.customer?.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>+91 {completedOrder.customer?.phone}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>Fulfillment</span>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                  {completedOrder.deliveryType === 'store-pickup' ? 'Store Counter Pickup' : 'Courier Delivery'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {completedOrder.deliveryType === 'store-pickup' ? 'Poyanil Building, Kozhencherry' : (completedOrder.customer?.district || 'Kerala')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>Total Paid / Payable</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ea580c', fontFamily: 'monospace' }}>
                  {formatPrice(completedOrder.totalAmount)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600' }}>
                  {completedOrder.paymentMethod} • {completedOrder.paymentStatus || 'CONFIRMED'}
                </div>
              </div>
              {completedOrder.pickupOtp && (
                <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#92400e', fontWeight: '700' }}>Store Pickup OTP</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#b45309', letterSpacing: '2px', fontFamily: 'monospace' }}>
                    {completedOrder.pickupOtp}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
            <Link
              to="/account"
              className="btn-hero-clean"
              style={{ justifyContent: 'center', width: '100%', padding: '14px', fontSize: '0.95rem' }}
            >
              <Package size={18} />
              <span>Track Live Order & View GST Invoice</span>
            </Link>

            <a
              href={getWhatsAppInvoiceUrl(completedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-clean"
              style={{ justifyContent: 'center', width: '100%', background: '#16a34a', textDecoration: 'none', padding: '14px', fontSize: '0.95rem' }}
            >
              <MessageCircle size={18} />
              <span>Share Order with Shop on WhatsApp</span>
            </a>

            <Link
              to="/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: '#64748b',
                fontSize: '0.86rem',
                fontWeight: '600',
                textDecoration: 'none',
                marginTop: '8px'
              }}
            >
              <span>Back to Equipment Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // IF CART IS EMPTY: REDIRECT / PROMPT
  if (!cart || cart.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 16px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center', background: '#ffffff', borderRadius: '18px', padding: '40px 24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
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

  // MAIN CHECKOUT 2-COLUMN VIEW
  return (
    <div style={{ minHeight: '85vh', background: '#f8fafc', padding: '32px 16px 64px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="/Logo.jpeg"
              alt="Variathu Power Tools"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Express Checkout
              </h1>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '500' }}>
                Official Variathu Power Tools Account-Based Buying Portal
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '0.82rem', fontWeight: '700', background: '#ecfdf5', padding: '6px 14px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
            <ShieldCheck size={16} />
            <span>256-Bit SSL Encrypted • GST Compliant</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'flex-start' }}>

          {/* LEFT COLUMN: INTERACTIVE 3-STEP FLOW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* STEP 1 CARD: CUSTOMER ACCOUNT */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: step === 1 ? '2px solid #ea580c' : '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: step === 1 ? '0 10px 25px -5px rgba(234, 88, 12, 0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isCustomerLoggedIn ? '0' : '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCustomerLoggedIn ? '#16a34a' : '#ea580c',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.88rem'
                    }}
                  >
                    {isCustomerLoggedIn ? <Check size={18} /> : '1'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      1. Customer Account
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                      {isCustomerLoggedIn ? 'Verified customer profile' : 'Sign in with your mobile number to proceed'}
                    </p>
                  </div>
                </div>

                {isCustomerLoggedIn && (
                  <button
                    type="button"
                    onClick={() => logout()}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ea580c',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Switch Account
                  </button>
                )}
              </div>

              {/* Verified Account Summary (When Logged In) */}
              {isCustomerLoggedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {accountNotice && (
                    <div style={{ background: accountNotice.type === 'created' ? '#ecfdf5' : '#f0f9ff', border: accountNotice.type === 'created' ? '1px solid #a7f3d0' : '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', color: accountNotice.type === 'created' ? '#047857' : '#0369a1', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <CheckCircle2 size={16} />
                      <span>{accountNotice.message}</span>
                    </div>
                  )}
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                        Phone: <strong style={{ color: '#334155' }}>+91 {user.phone}</strong> {user.email && !user.email.includes('@customer.variathupowertools.com') ? `• ${user.email}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.8rem', fontWeight: '700' }}>
                      <CheckCircle2 size={16} />
                      <span>Verified Account</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Inline Login Form (When Not Logged In) */
                <form onSubmit={handleAccountLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '10px 14px', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.82rem', lineHeight: '1.4' }}>
                    Orders and single-use promo coupons are securely tied to verified customer accounts.
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                      Full Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thomas Varghese"
                      value={loginForm.name}
                      onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        10-Digit Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9847123456"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: phoneLookup.exists === false ? '1px solid #f59e0b' : phoneLookup.exists === true ? '1px solid #22c55e' : '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: phoneLookup.exists === true ? '#f0fdf4' : '#ffffff' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                        Email Address (Optional, for Resend Receipts)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. thomas@domain.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  {/* Blinkit / Zepto Live Account Status Indicator */}
                  {phoneLookup.checking && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', animation: 'pulse 1s infinite' }} />
                      <span>Checking customer account for +91 {phoneLookup.checkedPhone}...</span>
                    </div>
                  )}

                  {phoneLookup.exists === true && !phoneLookup.checking && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span>
                        Welcome back<strong>{phoneLookup.customerName ? `, ${phoneLookup.customerName}` : ''}</strong>! Your account and saved address will be loaded.
                      </span>
                    </div>
                  )}

                  {phoneLookup.exists === false && !phoneLookup.checking && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', color: '#92400e', fontSize: '0.82rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ color: '#78350f', display: 'block', marginBottom: '2px' }}>
                          No account found for +91 {phoneLookup.checkedPhone}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#92400e', lineHeight: '1.4' }}>
                          First time here? No problem! When you click <strong>Register & Continue</strong>, we'll instantly create your verified customer account so your warranty and order tracking are linked.
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="btn-hero-clean"
                    style={{ justifyContent: 'center', width: '100%', padding: '12px', marginTop: '6px' }}
                    id="btn-checkout-login-continue"
                  >
                    <span>
                      {loginLoading
                        ? (phoneLookup.exists === false ? 'Registering Account...' : 'Verifying Account...')
                        : (phoneLookup.exists === false
                            ? 'Register & Continue to Delivery'
                            : phoneLookup.exists === true
                              ? 'Sign In & Continue to Delivery'
                              : 'Continue to Delivery Details')}
                    </span>
                    {!loginLoading && <ArrowRight size={16} />}
                  </button>
                </form>
              )}
            </div>

            {/* STEP 2 CARD: DELIVERY FULFILLMENT & ADDRESS */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: step === 2 ? '2px solid #ea580c' : '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: step === 2 ? '0 10px 25px -5px rgba(234, 88, 12, 0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                opacity: isCustomerLoggedIn ? 1 : 0.6,
                pointerEvents: isCustomerLoggedIn ? 'auto' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: step > 2 ? '#16a34a' : (step === 2 ? '#ea580c' : '#94a3b8'),
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '0.88rem'
                    }}
                  >
                    {step > 2 ? <Check size={18} /> : '2'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      2. Delivery Mode & Address
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                      Choose between Store Counter Pickup or Express Courier across Kerala
                    </p>
                  </div>
                </div>

                {step > 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ea580c',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Step 2 Summary when on Step 3 */}
              {step > 2 ? (
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', fontSize: '0.88rem' }}>
                    {deliveryType === 'store-pickup' ? <Building size={16} style={{ color: '#ea580c' }} /> : <Truck size={16} style={{ color: '#ea580c' }} />}
                    <span>{deliveryType === 'store-pickup' ? 'Store Counter Pickup (FREE)' : 'Express Courier Delivery (₹120)'}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px' }}>
                    {deliveryType === 'store-pickup' ? (
                      'Poyanil Building, Poyanil Junction, Kozhencherry, Kerala - 689641'
                    ) : (
                      `${formData.address}${formData.landmark ? ', near ' + formData.landmark : ''}, ${formData.district} - ${formData.pincode}`
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2 Active Form */
                <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Delivery Mode Tabs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      onClick={() => setDeliveryType('store-pickup')}
                      style={{
                        border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        background: deliveryType === 'store-pickup' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>
                          Store Pickup
                        </span>
                        <span style={{ background: '#ecfdf5', color: '#16a34a', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '9999px' }}>
                          FREE
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        Collect at Poyanil Building, Kozhencherry. Instant handover with SMS OTP.
                      </p>
                    </div>

                    <div
                      onClick={() => setDeliveryType('kerala-courier')}
                      style={{
                        border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px',
                        cursor: 'pointer',
                        background: deliveryType === 'kerala-courier' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a' }}>
                          Express Courier
                        </span>
                        <span style={{ color: '#ea580c', fontSize: '0.82rem', fontWeight: '800' }}>
                          ₹120
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                        Dispatched via DTDC / Professional Courier / APS Cargo across Kerala.
                      </p>
                    </div>
                  </div>

                  {/* If Courier is selected: Address inputs */}
                  {deliveryType === 'kerala-courier' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>
                          Shipping Address (Saved to Account)
                        </span>
                        {user?.address && (
                          <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700' }}>
                            ✓ Pre-filled from Account
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                          House / Building / Shop Address *
                        </label>
                        <textarea
                          rows={2}
                          required
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="e.g. Shop No. 4, Market Road, Near Town Hall"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          name="landmark"
                          value={formData.landmark}
                          onChange={handleChange}
                          placeholder="e.g. Opposite Federal Bank / Near St. Thomas HSS"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                            District *
                          </label>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: '#ffffff', boxSizing: 'border-box' }}
                          >
                            {KERALA_DISTRICTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                            Kerala Pincode *
                          </label>
                          <input
                            type="text"
                            required
                            name="pincode"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                            placeholder="689641"
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      {/* Pincode Live Check Result */}
                      {pincodeCheck && (
                        <div style={{ fontSize: '0.78rem', color: pincodeCheck.serviceable ? '#16a34a' : '#b45309', fontWeight: '600', marginTop: '2px' }}>
                          {pincodeCheck.checking ? 'Verifying postal code serviceability...' : (
                            pincodeCheck.serviceable
                              ? `✓ Express shipping available to ${pincodeCheck.city || formData.district}`
                              : pincodeCheck.message || 'Custom carrier routing will be arranged.'
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-hero-clean"
                    style={{ justifyContent: 'center', width: '100%', padding: '12px' }}
                    id="btn-checkout-address-continue"
                  >
                    <span>Proceed to Order Review & Payment</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>

            {/* STEP 3 CARD: PAYMENT METHOD SELECTION */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: step === 3 ? '2px solid #ea580c' : '1px solid #e2e8f0',
                padding: '24px',
                boxShadow: step === 3 ? '0 10px 25px -5px rgba(234, 88, 12, 0.1)' : '0 4px 12px rgba(0,0,0,0.03)',
                opacity: step === 3 ? 1 : 0.6,
                pointerEvents: step === 3 ? 'auto' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: step === 3 ? '#ea580c' : '#94a3b8',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '0.88rem'
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    3. Payment & Final Confirmation
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                    Select your preferred payment mode
                  </p>
                </div>
              </div>

              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {/* Razorpay Online */}
                    <div
                      onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                      style={{
                        border: formData.paymentMethod === 'razorpay' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: formData.paymentMethod === 'razorpay' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                          ⚡ Razorpay Online
                        </span>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '9999px' }}>
                          Recommended
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                        UPI (GPay, PhonePe, Paytm), Debit / Credit Cards, NetBanking. Instant digital receipt.
                      </p>
                    </div>

                    {/* Cash on Delivery / Counter */}
                    <div
                      onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      style={{
                        border: formData.paymentMethod === 'cash' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: formData.paymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.92rem', color: '#0f172a' }}>
                          💵 {deliveryType === 'store-pickup' ? 'Pay at Counter' : 'Cash on Delivery (COD)'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                        {deliveryType === 'store-pickup' ? 'Pay at Poyanil Building during equipment pickup.' : 'Pay cash to courier partner upon delivery.'}
                      </p>
                    </div>
                  </div>

                  {/* Submit Order Button */}
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || isProcessingPayment}
                    className="btn-hero-clean"
                    style={{
                      justifyContent: 'center',
                      width: '100%',
                      padding: '16px',
                      fontSize: '1rem',
                      fontWeight: '800',
                      marginTop: '8px',
                      boxShadow: '0 10px 25px rgba(234, 88, 12, 0.3)'
                    }}
                    id="btn-checkout-place-order"
                  >
                    <Lock size={18} />
                    <span>
                      {isProcessingPayment
                        ? 'Processing Payment...'
                        : isSubmitting
                          ? 'Placing Order...'
                          : `Confirm & Place Order (${formatPrice(finalTotal)})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY ORDER REVIEW & PROMO COUPON */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '90px' }}>

            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
                </h3>
                <Link to="/cart" style={{ color: '#ea580c', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none' }}>
                  Edit Cart
                </Link>
              </div>

              {/* Itemized Tools List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px', paddingRight: '4px' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.image || '/Logo.jpeg'} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Coupon Box */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '8px' }}>
                  Promo Coupon (Account-Bound)
                </span>

                {activeCoupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px 12px' }}>
                    <div>
                      <span style={{ fontSize: '0.86rem', fontWeight: '800', color: '#065f46', letterSpacing: '0.05em' }}>
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
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', outline: 'none' }}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponInput.trim()}
                      style={{ background: '#0f172a', color: '#ffffff', border: 'none', padding: '9px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Equipment Subtotal:</span>
                  <span style={{ color: '#0f172a', fontWeight: '600' }}>{formatPrice(subtotal)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Fulfillment:</span>
                  <span style={{ color: deliveryType === 'store-pickup' ? '#16a34a' : '#0f172a', fontWeight: '600' }}>
                    {deliveryType === 'store-pickup' ? 'FREE (Pickup)' : formatPrice(deliveryFee)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '700' }}>
                    <span>Coupon Discount:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', borderTop: '2px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#ea580c', fontFamily: 'monospace' }}>{formatPrice(finalTotal)}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'right' }}>
                  Includes 18% GST (SGST 9% + CGST 9%)
                </span>
              </div>
            </div>

            {/* Store Guarantees */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <ShieldCheck size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span>100% Genuine Tools from Authorized Dealers</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <FileText size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span>Official GST Tax Invoice & Warranty Card</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#475569' }}>
                <Mail size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
                <span>Automated Resend Email Order Receipts</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
