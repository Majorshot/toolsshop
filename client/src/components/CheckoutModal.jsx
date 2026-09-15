import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle, MapPin, Truck, ShieldCheck, AlertCircle, ArrowRight,
  User, Lock, Mail, Phone, MessageCircle, FileText, CheckCircle2, ChevronRight, Edit3
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

export const CheckoutModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, login, logout, updateUser } = useAuth();
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
    totalCourierFee,
    deliveryType,
    setDeliveryType,
    finalTotal
  } = useCart();

  // Progressive 3-Step Checkout Flow
  // Step 1: Account / Sign In
  // Step 2: Delivery Address & Shipping Mode
  // Step 3: Order Summary, Coupon & Payment
  const isCustomerLoggedIn = isLoggedIn && user && user.role === 'customer';
  const [step, setStep] = useState(isCustomerLoggedIn ? 2 : 1);

  // Form State
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

  // Inline Step 1 Login State for new/returning customer
  const [loginForm, setLoginForm] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);

  // Coupon inline input in Step 3
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState(null);

  // Sync user profile data when user logs in or updates
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

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1: Inline Login / Account Setup (Customer Account Model)
  const handleAccountLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!loginForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanEmail = loginForm.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address for receiving your order confirmation and GST tax invoice.');
      return;
    }

    setLoginLoading(true);
    try {
      const authenticatedUser = await login(
        'customer',
        cleanPhone,
        '',
        loginForm.name.trim(),
        { email: cleanEmail }
      );

      setFormData(prev => ({
        ...prev,
        name: authenticatedUser.name || loginForm.name.trim(),
        phone: authenticatedUser.phone || cleanPhone,
        email: authenticatedUser.email || cleanEmail,
        address: authenticatedUser.address || prev.address,
        landmark: authenticatedUser.landmark || prev.landmark,
        district: authenticatedUser.district || prev.district,
        pincode: authenticatedUser.pincode || prev.pincode
      }));

      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Could not verify account. Please check your details.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2: Validate Address & Proceed to Payment
  const handleAddressProceed = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (deliveryType === 'kerala-courier') {
      if (!formData.address.trim()) {
        setErrorMsg('Please enter your complete doorstep delivery address.');
        return;
      }
      if (!formData.pincode.trim() || formData.pincode.trim().length !== 6) {
        setErrorMsg('Please enter a valid 6-digit Kerala postal pincode.');
        return;
      }
    }

    // Auto-update customer profile in MongoDB with the latest address
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
    text += `Delivery: ${order.deliveryType === 'store-pickup' ? 'Store Pickup (Poyanil Building)' : 'Courier (' + order.customer?.district + ')'}\n`;
    text += `Payment: ${order.paymentMethod} (${order.paymentStatus || 'CONFIRMED'})\n`;
    if (order.pickupOtp) text += `Pickup OTP: *${order.pickupOtp}*\n`;
    text += `\n*TOTAL: ${formatPrice(order.totalAmount)}*\n`;
    text += `Please confirm processing for Variathu Power Tools, Kozhencherry.`;
    return `https://wa.me/919447123456?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9998, padding: '16px 10px', overflowY: 'auto' }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: 'auto',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/Logo.jpeg"
              alt="Variathu Power Tools"
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                {completedOrder ? 'Order Confirmed!' : 'Express Checkout'}
              </strong>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Official Variathu Power Tools Express Checkout
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* COMPLETED ORDER CELEBRATION VIEW */}
        {completedOrder ? (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: '#dcfce7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#16a34a',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Order Placed Successfully!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px' }}>
              Order Reference: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{completedOrder.id}</strong>
            </p>

            {/* Resend Automated Email Alert */}
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#1e40af',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <Mail size={18} />
              <span>
                An official order confirmation & warranty receipt has been dispatched to <strong>{completedOrder.customer?.email || formData.email}</strong> via Resend.
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
              <button
                type="button"
                className="btn-hero-clean"
                onClick={() => {
                  onClose();
                  navigate('/account');
                }}
                style={{ justifyContent: 'center', padding: '12px', width: '100%' }}
              >
                <FileText size={16} />
                <span>View Order & GST Tax Invoice</span>
              </button>

              <a
                href={getWhatsAppInvoiceUrl(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-clean"
                style={{ justifyContent: 'center', background: '#16a34a', textDecoration: 'none', padding: '12px', width: '100%' }}
              >
                <MessageCircle size={16} />
                <span>Send Order Receipt to WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', color: '#475569', fontWeight: '700', fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP CHECKOUT FORM */
          <div style={{ padding: '20px 24px' }}>
            {/* Steps Progress Indicator */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '20px',
                background: '#f8fafc',
                padding: '6px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: isCustomerLoggedIn ? '#dcfce7' : (step === 1 ? '#0f172a' : '#ffffff'),
                  color: isCustomerLoggedIn ? '#15803d' : (step === 1 ? '#ffffff' : '#64748b'),
                  fontWeight: '700',
                  fontSize: '0.78rem'
                }}
              >
                <span>{isCustomerLoggedIn ? '✓ 1. Account' : '1. Sign In'}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: step === 2 ? '#0f172a' : (step > 2 ? '#dcfce7' : '#ffffff'),
                  color: step === 2 ? '#ffffff' : (step > 2 ? '#15803d' : '#64748b'),
                  fontWeight: '700',
                  fontSize: '0.78rem'
                }}
              >
                <span>{step > 2 ? '✓ 2. Address' : '2. Address'}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px',
                  borderRadius: '6px',
                  background: step === 3 ? '#0f172a' : '#ffffff',
                  color: step === 3 ? '#ffffff' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.78rem'
                }}
              >
                <span>3. Payment</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* STEP 1: ACCOUNT / SIGN IN */}
            {/* ========================================================= */}
            <div style={{ marginBottom: '18px' }}>
              {isCustomerLoggedIn ? (
                /* Collapsed / Verified Account Card */
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem' }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        1. Customer Account Verified
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                        {user.name} <span style={{ color: '#475569', fontWeight: '500' }}>(+91 {user.phone}{user.email ? ` • ${user.email}` : ''})</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => logout()}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Account
                  </button>
                </div>
              ) : (
                /* Expanded Step 1 Form */
                <div style={{ border: '1.5px solid #0f172a', borderRadius: '12px', padding: '18px 20px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Lock size={18} style={{ color: '#ea580c' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#0f172a', fontWeight: '800' }}>
                      Step 1: Sign in to place your order
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 16px' }}>
                    Orders, GST invoices, and authorized warranties are linked to your official account.
                  </p>

                  <form onSubmit={handleAccountLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', outline: 'none' }}
                          id="checkout-step1-name"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                          Mobile Number *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="tel"
                            required
                            placeholder="10-digit mobile"
                            value={loginForm.phone}
                            onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', outline: 'none' }}
                            id="checkout-step1-phone"
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                          Email Address * (For GST Invoice)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={loginForm.email}
                            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', outline: 'none' }}
                            id="checkout-step1-email"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="btn-hero-clean"
                      style={{ justifyContent: 'center', width: '100%', padding: '12px', marginTop: '6px' }}
                      id="checkout-step1-continue-btn"
                    >
                      <span>{loginLoading ? 'Verifying...' : 'Continue to Delivery Address'}</span>
                      <ArrowRight size={17} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* STEP 2: DELIVERY ADDRESS & FULFILLMENT MODE               */}
            {/* ========================================================= */}
            <div style={{ marginBottom: '18px' }}>
              {step > 2 ? (
                /* Collapsed Step 2 Summary */
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.85rem' }}>
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        2. Delivery Address & Mode Confirmed
                      </div>
                      <div style={{ fontSize: '0.84rem', fontWeight: '600', color: '#0f172a' }}>
                        {deliveryType === 'store-pickup'
                          ? '🏢 Store Counter Pickup • Poyanil Building, Kozhencherry'
                          : `${formData.address}, ${formData.district} - ${formData.pincode}`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Edit
                  </button>
                </div>
              ) : step === 2 ? (
                /* Expanded Step 2 Form */
                <div style={{ border: '1.5px solid #0f172a', borderRadius: '12px', padding: '18px 20px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <MapPin size={18} style={{ color: '#ea580c' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#0f172a', fontWeight: '800' }}>
                      Step 2: Select Fulfillment & Delivery Address
                    </h4>
                  </div>

                  {/* Delivery Preference Toggles */}
                  <div className="checkout-options-grid" style={{ marginBottom: '14px' }}>
                    <div
                      onClick={() => setDeliveryType('store-pickup')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        background: deliveryType === 'store-pickup' ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                      id="checkout-delivery-store"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '800', fontSize: '0.86rem' }}>
                          <MapPin size={16} style={{ color: '#ea580c' }} />
                          <span>Store Counter Pickup</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                          FREE
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Poyanil Building, Kozhencherry (Ready in 2h)
                      </span>
                    </div>

                    <div
                      onClick={() => setDeliveryType('kerala-courier')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                        background: deliveryType === 'kerala-courier' ? '#fff7ed' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                      id="checkout-delivery-courier"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '800', fontSize: '0.86rem' }}>
                          <Truck size={16} style={{ color: '#0284c7' }} />
                          <span>Express Courier</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: '800', background: (totalCourierFee || 0) === 0 ? '#dcfce7' : '#ffedd5', color: (totalCourierFee || 0) === 0 ? '#15803d' : '#ea580c', padding: '2px 6px', borderRadius: '4px' }}>
                          {(totalCourierFee || 0) === 0 ? 'FREE' : formatPrice(totalCourierFee || 0)}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        DTDC / Professional / Delhivery across Kerala
                      </span>
                    </div>
                  </div>

                  {/* Address Inputs (shown if courier or editable) */}
                  {deliveryType === 'kerala-courier' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                          Doorstep Delivery Address *
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          placeholder="House / Building name, street or ward"
                          value={formData.address}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem' }}
                          id="checkout-input-address"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                            Nearby Landmark (Optional)
                          </label>
                          <input
                            type="text"
                            name="landmark"
                            placeholder="e.g. Near St Thomas HSS"
                            value={formData.landmark}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem' }}
                            id="checkout-input-landmark"
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                            Kerala District *
                          </label>
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', background: '#fff' }}
                            id="checkout-select-district"
                          >
                            {KERALA_DISTRICTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                          Postal Pincode (6 digits) *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          maxLength={6}
                          required
                          placeholder="e.g. 689641"
                          value={formData.pincode}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', fontFamily: 'monospace' }}
                          id="checkout-input-pincode"
                        />
                        {pincodeCheck && !pincodeCheck.checking && (
                          <div style={{ fontSize: '0.74rem', color: pincodeCheck.serviceable ? '#16a34a' : '#dc2626', marginTop: '4px', fontWeight: '600' }}>
                            {pincodeCheck.serviceable ? `✓ Verified Serviceable (${pincodeCheck.city || 'Kerala'})` : '⚠️ Courier might have delayed dispatch to this pincode'}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                      📍 <strong>Pickup Location:</strong> Variathu Power Tools Counter, Poyanil Building, Poyanil Junction, Kozhencherry-689641.<br />
                      A 4-digit pickup OTP will be generated on confirmation for instant handover.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddressProceed}
                    className="btn-hero-clean"
                    style={{ justifyContent: 'center', width: '100%', padding: '12px' }}
                    id="checkout-step2-proceed-btn"
                  >
                    <span>Continue to Order Summary & Payment</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              ) : (
                /* Dimmed / Pending Step 2 Card */
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '14px 18px', color: '#94a3b8', fontSize: '0.84rem', fontWeight: '700' }}>
                  2. DELIVERY ADDRESS (Complete Step 1 to unlock)
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* STEP 3: ORDER SUMMARY, COUPON & PAYMENT                   */}
            {/* ========================================================= */}
            <div>
              {step === 3 ? (
                <div style={{ border: '1.5px solid #0f172a', borderRadius: '12px', padding: '18px 20px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <ShieldCheck size={18} style={{ color: '#ea580c' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#0f172a', fontWeight: '800' }}>
                      Step 3: Order Summary, Coupon & Payment
                    </h4>
                  </div>

                  {/* Order Items Preview */}
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0', marginBottom: '14px', maxHeight: '140px', overflowY: 'auto' }}>
                    {cart.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: idx < cart.length - 1 ? '1px solid #e2e8f0' : 'none', fontSize: '0.82rem' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{it.name}</strong>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>x{it.quantity}</span>
                        </div>
                        <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{formatPrice(it.price * it.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Promo Coupon Form (Single-Use per Customer Account) */}
                  <div style={{ marginBottom: '14px' }}>
                    {activeCoupon ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#15803d', fontWeight: '700' }}>
                          ✓ Coupon applied: <strong>{activeCoupon.code}</strong> (-{formatPrice(discountAmount)})
                        </span>
                        <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#dc2626', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Promo Coupon (1 use per account)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', textTransform: 'uppercase' }}
                          id="checkout-coupon-input"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading}
                          style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}
                        >
                          {couponLoading ? 'Checking...' : 'Apply'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Calculations */}
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b' }}>Subtotal:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{formatPrice(subtotal)}</strong>
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', marginBottom: '4px' }}>
                        <span>Account Discount:</span>
                        <strong style={{ fontFamily: 'monospace' }}>-{formatPrice(discountAmount)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Delivery Fee ({deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier'}):</span>
                      <span style={{ color: deliveryFee === 0 ? '#16a34a' : '#0f172a', fontWeight: '700', fontFamily: 'monospace' }}>
                        {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '6px', fontSize: '1rem', fontWeight: '800' }}>
                      <span style={{ color: '#0f172a' }}>Total Amount:</span>
                      <span style={{ color: '#dc2626', fontFamily: 'monospace' }}>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.76rem', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                      Choose Payment Method:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div
                        onClick={() => setFormData({ ...formData, paymentMethod: 'razorpay' })}
                        style={{
                          border: formData.paymentMethod === 'razorpay' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                          background: formData.paymentMethod === 'razorpay' ? '#fff7ed' : '#ffffff',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>⚡ Razorpay Online</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>UPI, Cards, NetBanking</span>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                        style={{
                          border: formData.paymentMethod === 'cash' ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                          background: formData.paymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer'
                        }}
                      >
                        <strong style={{ fontSize: '0.84rem', color: '#0f172a', display: 'block' }}>💵 Cash / Counter</strong>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {deliveryType === 'store-pickup' ? 'Pay at store counter' : 'Cash on Delivery (COD)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Order Button */}
                  <button
                    type="button"
                    disabled={isSubmitting || isProcessingPayment}
                    onClick={handleSubmitOrder}
                    className="btn-hero-clean"
                    style={{ justifyContent: 'center', width: '100%', padding: '14px', fontSize: '0.98rem' }}
                    id="checkout-submit-order-btn"
                  >
                    <span>{isSubmitting || isProcessingPayment ? 'Securing Order...' : `Place Order • ${formatPrice(finalTotal)}`}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              ) : (
                /* Dimmed Step 3 */
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '14px 18px', color: '#94a3b8', fontSize: '0.84rem', fontWeight: '700' }}>
                  3. ORDER SUMMARY & PAYMENT (Complete Step 2 to unlock)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
