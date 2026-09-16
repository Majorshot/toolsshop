import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, MapPin, Truck, ShieldCheck, AlertCircle, ArrowRight,
  User, Lock, Mail, Phone, MessageCircle, FileText, CheckCircle2, ChevronRight, Edit3,
  ShoppingBag, Shield, Check, Clock, Package, Building, Plus, Navigation, Home, Briefcase, Trash2
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

  // Coupon inline input
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // State flags
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState(null);

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
      } else {
        // Initialize with account info as baseline
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
      }
      setStep(prev => (prev === 1 ? 2 : prev));
    } else {
      setStep(1);
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
            // Auto-complete City/District & State!
            if (res.serviceable) {
              setDeliveryAddress(prev => ({
                ...prev,
                city: res.city || res.district || prev.city,
                district: res.district || prev.district,
                state: res.state || 'Kerala',
                // If locality hint exists and locality is blank, auto-fill locality hint!
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
  const handleDeleteSavedAddress = async (e, addressId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this saved address from your account?")) return;
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
  };

  // Step 1: Customer Account Sign-In / Register (Main Account Identifier)
  const handleAccountLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setAccountNotice(null);

    const cleanPhone = loginForm.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoginLoading(true);
    try {
      let loggedUser;
      try {
        loggedUser = await login(
          'customer',
          cleanPhone,
          null,
          loginForm.name.trim() || phoneLookup.customerName || 'Valued Customer',
          { email: loginForm.email.trim() }
        );
        setAccountNotice({
          type: 'existing',
          message: `Welcome back, ${loggedUser.name || phoneLookup.customerName || 'Customer'}!`
        });
      } catch (loginErr) {
        const errMsg = (loginErr.message || '').toLowerCase();
        const isNotFound = errMsg.includes('no account') || errMsg.includes('register first') || errMsg.includes('not found') || errMsg.includes('404');

        if (isNotFound) {
          if (!loginForm.name.trim()) {
            setErrorMsg('Please enter your full customer name to create your account.');
            setLoginLoading(false);
            return;
          }
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

      setStep(2);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to authenticate customer account.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 2: Save Delivery Address & Proceed to Payment
  const handleSaveAndDeliver = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (deliveryType === 'store-pickup') {
      setStep(3);
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
      setStep(3);
    } catch (err) {
      console.warn("Save address notice:", err.message);
      setIsAddingNewAddress(false);
      setStep(3);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Step 2: Confirm Address and Proceed to Payment
  const handleProceedToPayment = (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (deliveryType === 'kerala-courier') {
      if (!deliveryAddress.address?.trim()) {
        setErrorMsg('Please enter your delivery street / shop address.');
        return;
      }
      if (!deliveryAddress.pincode || deliveryAddress.pincode.trim().length !== 6) {
        setErrorMsg('Please enter a valid 6-digit Kerala postal pincode.');
        return;
      }
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

  // Step 3: Place Order & Payment Handling
  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!isCustomerLoggedIn) {
      setStep(1);
      setErrorMsg('Please sign in with your mobile number to complete your order.');
      return;
    }

    const cleanAccountPhone = (user?.phone || '').replace(/[^0-9]/g, '').slice(-10);
    if (cleanAccountPhone.length !== 10) {
      setStep(1);
      setErrorMsg('Valid 10-digit mobile number is required on customer account.');
      return;
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
        setErrorMsg(vRes.message || 'This coupon has already been redeemed by your account.');
        return;
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
          phone: cleanAccountPhone, // Main account phone (all notifications & receipts go here!)
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
          image: '/Logo.jpeg',
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
    text += `Account: ${order.customer?.name} (+91 ${order.customer?.phone})\n`;
    if (order.customer?.recipientName && order.customer.recipientName !== order.customer.name) {
      text += `Consignee: ${order.customer.recipientName} (+91 ${order.customer?.recipientPhone})\n`;
    }
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
              An official order receipt, warranty copy, and GST breakdown has been sent to <strong>{completedOrder.customer?.email || user?.email || 'your registered email'}</strong> via Resend.
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                  {accountNotice && (
                    <div style={{ background: accountNotice.type === 'created' ? '#ecfdf5' : '#f0f9ff', border: accountNotice.type === 'created' ? '1px solid #a7f3d0' : '1px solid #bae6fd', borderRadius: '8px', padding: '10px 14px', color: accountNotice.type === 'created' ? '#047857' : '#0369a1', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                      <CheckCircle2 size={16} />
                      <span>{accountNotice.message}</span>
                    </div>
                  )}
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.96rem', fontWeight: '800', color: '#0f172a' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '3px' }}>
                        Primary Mobile: <strong style={{ color: '#0f172a' }}>+91 {user.phone}</strong> {user.email && !user.email.includes('@customer.variathupowertools.com') ? `• ${user.email}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.82rem', fontWeight: '700', background: '#ecfdf5', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 size={15} />
                      <span>Verified Account</span>
                    </div>
                  </div>

                  {step === 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="btn-hero-clean"
                      style={{ justifyContent: 'center', width: '100%', padding: '12px', marginTop: '4px' }}
                    >
                      <span>Continue to Delivery Address</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                /* Inline Login Form (When Not Logged In) */
                <form onSubmit={handleAccountLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#fff7ed', borderRadius: '8px', padding: '10px 14px', border: '1px solid #fed7aa', color: '#9a3412', fontSize: '0.82rem', lineHeight: '1.4' }}>
                    Orders, payment receipts, and delivery tracking are tied to your primary mobile account.
                  </div>

                  {/* Primary Mobile Number Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                      10-Digit Mobile Number (Account ID) *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', border: phoneLookup.exists === true ? '2px solid #22c55e' : phoneLookup.exists === false ? '2px solid #f59e0b' : '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden', background: '#ffffff', transition: 'all 0.2s ease' }}>
                      <span style={{ padding: '12px 14px', background: '#f8fafc', color: '#475569', fontWeight: '800', fontSize: '0.9rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={loginForm.phone}
                        onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                        style={{ flex: 1, padding: '12px 14px', border: 'none', fontSize: '0.95rem', fontWeight: '700', outline: 'none', color: '#0f172a' }}
                        id="input-account-phone"
                      />
                    </div>
                  </div>

                  {/* Checking indicator */}
                  {phoneLookup.checking && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c', animation: 'pulse 1s infinite' }} />
                      <span>Checking customer profile for +91 {phoneLookup.checkedPhone}...</span>
                    </div>
                  )}

                  {/* Existing Customer: Show Details Card Right Below & 1-Click Continue */}
                  {phoneLookup.exists === true && !phoneLookup.checking && (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '800', fontSize: '0.86rem' }}>
                        <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                        <span>Existing Customer Account Found</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                        <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Customer Name</span>
                          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{phoneLookup.customerName || 'Valued Customer'}</div>
                        </div>
                        <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Account Mobile</span>
                          <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>+91 {phoneLookup.checkedPhone}</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#166534', margin: '2px 0 0' }}>
                        Welcome back! Your verified customer profile and saved delivery addresses will be loaded.
                      </p>
                    </div>
                  )}

                  {/* New Customer: Show Name & Email Inputs */}
                  {phoneLookup.exists === false && !phoneLookup.checking && (
                    <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: '800', fontSize: '0.86rem' }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>New Customer Account for +91 {phoneLookup.checkedPhone}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#92400e', margin: 0, lineHeight: '1.4' }}>
                        Enter your name below. All delivery addresses, invoices, and tracking will be saved to this mobile number account.
                      </p>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Midhun Mohan"
                          value={loginForm.name}
                          onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                          Email Address (Optional, for Resend Receipts)
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. midhun@gmail.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                          style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    type="submit"
                    disabled={loginLoading || (phoneLookup.exists === false && !loginForm.name.trim()) || loginForm.phone.length !== 10}
                    className="btn-hero-clean"
                    style={{ justifyContent: 'center', width: '100%', padding: '13px', marginTop: '4px', opacity: (loginForm.phone.length === 10) ? 1 : 0.6 }}
                    id="btn-checkout-login-continue"
                  >
                    <span>
                      {loginLoading
                        ? (phoneLookup.exists === false ? 'Creating Account...' : 'Signing In...')
                        : (phoneLookup.exists === false
                            ? 'Register & Continue to Delivery'
                            : phoneLookup.exists === true
                              ? 'Sign In & Continue to Delivery'
                              : 'Enter 10-Digit Mobile to Continue')}
                    </span>
                    {!loginLoading && <ArrowRight size={16} />}
                  </button>
                </form>
              )}
            </div>

            {/* STEP 2 CARD: DELIVERY FULFILLMENT & ADDRESS (FLIPKART ARCHITECTURE) */}
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
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#ea580c',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Step 2 Summary when on Step 3 */}
              {step > 2 ? (
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                    {deliveryType === 'store-pickup' ? <Building size={16} style={{ color: '#ea580c' }} /> : <Truck size={16} style={{ color: '#ea580c' }} />}
                    <span>{deliveryType === 'store-pickup' ? 'Store Counter Pickup (FREE)' : 'Express Courier Delivery (₹120)'}</span>
                    {deliveryType === 'kerala-courier' && (
                      <span style={{ background: '#e2e8f0', color: '#334155', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {deliveryAddress.addressType || 'HOME'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                    {deliveryType === 'store-pickup' ? (
                      'Poyanil Building, Poyanil Junction, Kozhencherry, Kerala - 689641'
                    ) : (
                      <>
                        <strong>{deliveryAddress.name}</strong> • 📞 +91 {deliveryAddress.phone}<br />
                        {deliveryAddress.address}{deliveryAddress.locality ? `, ${deliveryAddress.locality}` : ''}{deliveryAddress.landmark ? `, near ${deliveryAddress.landmark}` : ''}, {deliveryAddress.city || deliveryAddress.district}, {deliveryAddress.state || 'Kerala'} - <strong>{deliveryAddress.pincode}</strong>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2 Active Mode Selector & Address Manager */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Delivery Mode Tabs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div
                      onClick={() => setDeliveryType('store-pickup')}
                      style={{
                        border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        background: deliveryType === 'store-pickup' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={16} style={{ color: '#ea580c' }} />
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
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        background: deliveryType === 'kerala-courier' ? '#fff7ed' : '#ffffff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Truck size={16} style={{ color: '#ea580c' }} />
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

                  {/* If Store Pickup is Selected */}
                  {deliveryType === 'store-pickup' && (
                    <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                        <MapPin size={18} style={{ color: '#ea580c' }} />
                        <span>Pickup Counter Address</span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#475569', margin: 0, lineHeight: '1.5' }}>
                        Variathu Power Tools Showroom & Service Clinic<br />
                        Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Kerala - 689641<br />
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Store Hours: 9:00 AM - 7:30 PM (Mon - Sat) • Phone: +91 94473 05613</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="btn-hero-clean"
                        style={{ justifyContent: 'center', width: '100%', padding: '12px', marginTop: '6px' }}
                      >
                        <span>Continue to Payment</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {/* If Express Courier is Selected: Flipkart Architecture */}
                  {deliveryType === 'kerala-courier' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Saved Addresses List (Flipkart Style) */}
                      {user?.savedAddresses && user.savedAddresses.length > 0 && !isAddingNewAddress && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Saved Delivery Addresses ({user.savedAddresses.length})
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
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
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
                                  border: isSelected ? '2px solid #2874f0' : '1px solid #e2e8f0',
                                  borderRadius: '12px',
                                  padding: '16px',
                                  background: isSelected ? '#f8faff' : '#ffffff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
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
                                      style={{ accentColor: '#2874f0', cursor: 'pointer' }}
                                    />
                                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', fontWeight: '800', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                      {addr.addressType || 'HOME'}
                                    </span>
                                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>
                                      {addr.name}
                                    </strong>
                                    <span style={{ fontSize: '0.86rem', color: '#334155', fontWeight: '700' }}>
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
                                  {addr.alternatePhone && (
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                      Alternate Phone: {addr.alternatePhone}
                                    </div>
                                  )}
                                </div>

                                {isSelected && (
                                  <div style={{ paddingLeft: '24px', marginTop: '6px' }}>
                                    <button
                                      type="button"
                                      onClick={() => setStep(3)}
                                      style={{
                                        background: '#fb641b',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '10px 24px',
                                        fontSize: '0.88rem',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(251, 100, 27, 0.3)'
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

                      {/* Add / Edit Address Form (Flipkart Style Screenshot Match) */}
                      {(isAddingNewAddress || !user?.savedAddresses || user.savedAddresses.length === 0) && (
                        <form onSubmit={handleSaveAndDeliver} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '14px', border: '1.5px solid #cbd5e1' }}>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Add / Edit Delivery Address
                            </span>

                            {/* Flipkart 'Use my current location' Button */}
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              disabled={isLocating}
                              style={{
                                background: '#2874f0',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 2px 6px rgba(40, 116, 240, 0.25)'
                              }}
                            >
                              <Navigation size={14} />
                              <span>{isLocating ? 'Locating via GPS...' : 'Use my current location'}</span>
                            </button>
                          </div>

                          {/* Row 1: Recipient Name & 10-digit mobile number */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                Recipient Name *
                              </label>
                              <input
                                type="text"
                                required
                                name="name"
                                value={deliveryAddress.name}
                                onChange={handleDeliveryAddressChange}
                                placeholder="e.g. Midhun Mohan"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                10-digit mobile number *
                              </label>
                              <input
                                type="tel"
                                required
                                name="phone"
                                maxLength={10}
                                value={deliveryAddress.phone}
                                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                                placeholder="e.g. 6238270613"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>
                          </div>

                          {/* Row 2: Pincode & Locality */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                Pincode (Auto-completes District & State) *
                              </label>
                              <input
                                type="text"
                                required
                                name="pincode"
                                maxLength={6}
                                value={deliveryAddress.pincode}
                                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))}
                                placeholder="e.g. 689642"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: pincodeCheck?.serviceable ? '2px solid #22c55e' : '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                              {pincodeCheck && (
                                <div style={{ fontSize: '0.75rem', color: pincodeCheck.serviceable ? '#16a34a' : '#b45309', fontWeight: '700', marginTop: '3px' }}>
                                  {pincodeCheck.checking ? 'Checking postal code serviceability...' : (
                                    pincodeCheck.serviceable
                                      ? `✓ Express Delivery Available to ${pincodeCheck.city || deliveryAddress.district}`
                                      : (pincodeCheck.message || 'Custom courier routing enabled.')
                                  )}
                                </div>
                              )}
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                Locality *
                              </label>
                              <input
                                type="text"
                                required
                                name="locality"
                                value={deliveryAddress.locality}
                                onChange={handleDeliveryAddressChange}
                                placeholder="e.g. Nirannukala-Adiyani Road, Naranganam"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>
                          </div>

                          {/* Row 3: Address (Area and Street) */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                              Address (Area and Street) *
                            </label>
                            <textarea
                              rows={2}
                              required
                              name="address"
                              value={deliveryAddress.address}
                              onChange={handleDeliveryAddressChange}
                              placeholder="e.g. Poovanunniikkunnathil, Nerunnukala padi"
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                            />
                          </div>

                          {/* Row 4: City/District/Town & State */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                City / District / Town *
                              </label>
                              <input
                                type="text"
                                required
                                name="city"
                                value={deliveryAddress.city || deliveryAddress.district}
                                onChange={handleDeliveryAddressChange}
                                placeholder="e.g. Pathanamthitta"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                State *
                              </label>
                              <input
                                type="text"
                                required
                                name="state"
                                value={deliveryAddress.state || 'Kerala'}
                                onChange={handleDeliveryAddressChange}
                                placeholder="Kerala"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>
                          </div>

                          {/* Row 5: Landmark (Optional) & Alternate Phone (Optional) */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                Landmark (Optional)
                              </label>
                              <input
                                type="text"
                                name="landmark"
                                value={deliveryAddress.landmark}
                                onChange={handleDeliveryAddressChange}
                                placeholder="e.g. Near NSS Karayogam / Temple"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                                Alternate Phone (Optional)
                              </label>
                              <input
                                type="tel"
                                name="alternatePhone"
                                maxLength={10}
                                value={deliveryAddress.alternatePhone}
                                onChange={(e) => setDeliveryAddress(prev => ({ ...prev, alternatePhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                                placeholder="e.g. 9995855774"
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box', background: '#ffffff' }}
                              />
                            </div>
                          </div>

                          {/* Row 6: Address Type Radio Buttons */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                              Address Type
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="addressType"
                                  value="HOME"
                                  checked={deliveryAddress.addressType === 'HOME'}
                                  onChange={() => setDeliveryAddress(prev => ({ ...prev, addressType: 'HOME' }))}
                                  style={{ accentColor: '#2874f0' }}
                                />
                                <span>Home (All day delivery)</span>
                              </label>

                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer' }}>
                                <input
                                  type="radio"
                                  name="addressType"
                                  value="WORK"
                                  checked={deliveryAddress.addressType === 'WORK'}
                                  onChange={() => setDeliveryAddress(prev => ({ ...prev, addressType: 'WORK' }))}
                                  style={{ accentColor: '#2874f0' }}
                                />
                                <span>Work (Delivery between 10 AM - 5 PM)</span>
                              </label>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <button
                              type="submit"
                              disabled={isSavingAddress}
                              style={{
                                background: '#fb641b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '12px 28px',
                                fontSize: '0.9rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(251, 100, 27, 0.3)'
                              }}
                            >
                              {isSavingAddress ? 'SAVING...' : 'SAVE AND DELIVER HERE ➔'}
                            </button>

                            {user?.savedAddresses && user.savedAddresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setIsAddingNewAddress(false)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#2874f0',
                                  fontSize: '0.88rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  padding: '12px 16px'
                                }}
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* Delivery & Account Notification Summary */}
                  <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                      📦 <strong>Deliver To:</strong> {deliveryType === 'store-pickup' ? 'Poyanil Building Store Pickup' : `${deliveryAddress.name} (+91 ${deliveryAddress.phone})`}
                    </div>
                    {deliveryType === 'kerala-courier' && (
                      <div style={{ fontSize: '0.8rem', color: '#475569', paddingLeft: '22px' }}>
                        {deliveryAddress.address}, {deliveryAddress.locality ? `${deliveryAddress.locality}, ` : ''}{deliveryAddress.city || deliveryAddress.district}, {deliveryAddress.state || 'Kerala'} - {deliveryAddress.pincode}
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: '#0369a1', background: '#f0f9ff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bae6fd', marginTop: '4px' }}>
                      📱 <strong>Primary Account (+91 {user?.phone}):</strong> Payment confirmation, WhatsApp invoice, and courier tracking will be sent directly to your registered number.
                    </div>
                  </div>

                  {/* Payment Options Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {/* Razorpay Online */}
                    <div
                      onClick={() => setPaymentMethod('razorpay')}
                      style={{
                        border: paymentMethod === 'razorpay' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'razorpay' ? '#fff7ed' : '#ffffff',
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
                      onClick={() => setPaymentMethod('cash')}
                      style={{
                        border: paymentMethod === 'cash' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '16px',
                        cursor: 'pointer',
                        background: paymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
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
