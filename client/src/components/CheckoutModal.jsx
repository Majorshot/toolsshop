import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, MapPin, Truck, QrCode, Banknote, ShieldCheck, MessageCircle, AlertCircle, ArrowRight, FileText, Smartphone } from 'lucide-react';
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
  const { user } = useAuth();
  const {
    cart,
    clearCart,
    subtotal,
    discountAmount,
    activeCoupon,
    removeCoupon,
    verifyCouponWithPhone,
    recordDeviceCouponRedemption,
    deliveryFee,
    totalCourierFee,
    deliveryType,
    setDeliveryType,
    finalTotal
  } = useCart();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    landmark: '',
    district: 'Pathanamthitta',
    pincode: '689641',
    paymentMethod: 'razorpay', // 'razorpay' (Online) or 'cash' (Pay at store / COD)
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pincodeCheck, setPincodeCheck] = useState(null);

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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  // Live Phone Verification for Single-Use Coupons
  const activeCouponCode = activeCoupon?.code;
  const activeCouponVerifiedPhone = activeCoupon?.verifiedPhone;
  const activeCouponUsageLimit = activeCoupon?.usageLimitPerUser;

  useEffect(() => {
    if (activeCouponCode && activeCouponUsageLimit === 1 && formData.phone) {
      const clean = formData.phone.replace(/[^0-9]/g, '').slice(-10);
      if (clean.length === 10 && clean !== activeCouponVerifiedPhone) {
        verifyCouponWithPhone(clean, { silent: true }).then(res => {
          if (res && !res.valid) {
            setErrorMsg(res.message || 'This coupon has already been redeemed by this phone number.');
          } else {
            setErrorMsg('');
          }
        });
      }
    }
  }, [formData.phone, activeCouponCode, activeCouponVerifiedPhone, activeCouponUsageLimit]);

  const formatPrice = (num) => '₹' + num.toLocaleString('en-IN');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Please enter your full name and contact phone number.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (activeCoupon && activeCoupon.usageLimitPerUser === 1) {
      const vRes = await verifyCouponWithPhone(cleanPhone, { silent: true });
      if (vRes && !vRes.valid) {
        setErrorMsg(vRes.message || 'This coupon has already been redeemed by this phone number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const isPrepaid = formData.paymentMethod === 'razorpay' || formData.paymentMethod === 'upi';

      const orderPayload = {
        customer: {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address || (deliveryType === 'store-pickup' ? 'Poyanil Building Store Pickup' : ''),
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
        couponCode: activeCoupon?.code || null,
        discountAmount: discountAmount || 0
      };

      // LIVE RAZORPAY CHECKOUT MODAL
      if (isPrepaid) {
        if (typeof window === 'undefined' || !window.Razorpay) {
          setErrorMsg('Razorpay payment gateway could not be loaded. Please check your network connection or choose Cash Payment.');
          setIsSubmitting(false);
          return;
        }

        setIsProcessingPayment(true);

        const rzpOrderRes = await api.createRazorpayOrder(
          finalTotal,
          `rcpt_${Date.now().toString().slice(-6)}`,
          {
            customer_name: formData.name.trim(),
            customer_phone: formData.phone.trim(),
            delivery_type: deliveryType
          }
        );

        const rzpOrder = rzpOrderRes.order;

        const options = {
          key: rzpOrderRes.keyId || 'rzp_test_TZQUSp5JtcBjMs',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'Variathu Power Tools',
          description: `Order for ${formData.name.trim()} • Poyanil Building, Kozhencherry`,
          image: '/logo.jpg',
          order_id: rzpOrder.id,
          prefill: {
            name: formData.name.trim(),
            contact: formData.phone.trim(),
            email: formData.email.trim() || 'variathupowertools@gmail.com'
          },
          notes: {
            address: formData.address || 'Poyanil Building, Kozhencherry, Kerala - 689641',
            district: formData.district || 'Pathanamthitta',
            pincode: formData.pincode || '689641'
          },
          theme: {
            color: '#ea580c'
          },
          handler: async function (response) {
            // Cryptographic HMAC Verification on Backend
            try {
              setIsProcessingPayment(true);
              const verifyRes = await api.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderPayload
              });

              try {
                confetti({
                  particleCount: 80,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              } catch {}

              setCompletedOrder(verifyRes.data);
              clearCart();
            } catch (vErr) {
              setErrorMsg(vErr.message || 'Payment signature verification failed.');
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

      // Cash Payment (Pay at store counter OR Cash on Delivery)
      const cashMethod = deliveryType === 'store-pickup' ? 'PAY_AT_STORE' : 'COD';
      const result = await api.createOrder({
        ...orderPayload,
        paymentMethod: cashMethod,
        paymentStatus: 'PENDING',
        transactionId: null
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
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
    text += `Customer: ${order.customer.name} (${order.customer.phone})\n`;
    text += `Delivery: ${order.deliveryType === 'store-pickup' ? 'Store Pickup (Poyanil Building)' : 'Courier (' + order.customer.district + ')'}\n`;
    const payTitle = order.paymentMethod === 'RAZORPAY_UPI'
      ? 'Razorpay Online (Verified)'
      : (order.paymentMethod === 'PAY_AT_STORE' ? 'Pay at Store Counter' : 'Cash on Delivery (COD)');
    text += `Payment: ${payTitle} (${order.paymentStatus || 'CONFIRMED'})\n`;
    if (order.transactionId) text += `Transaction ID: ${order.transactionId}\n`;
    if (order.pickupOtp) text += `Pickup OTP: *${order.pickupOtp}*\n`;
    if (order.awb) text += `Courier AWB: *${order.awb}*\n`;
    text += `\n*ITEMS:*\n`;
    order.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} x${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
    });
    text += `\n*TOTAL AMOUNT: ${formatPrice(order.totalAmount)}*\n\n`;
    text += `Please confirm processing for Variathu Power Tools, Kozhencherry.`;

    return `https://wa.me/919447123456?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
              {completedOrder ? 'Order Confirmed & Verified!' : 'Complete Your Order'}
            </h3>
            <span style={{ fontSize: '0.76rem', color: '#ea580c', fontWeight: '600' }}>
              Variathu Power Tools • Kozhencherry, Kerala
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Completed State */}
        {completedOrder ? (
          <div style={{ padding: '28px 24px', textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                border: '2px solid #bbf7d0'
              }}
            >
              <CheckCircle size={32} />
            </div>

            <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '800', marginBottom: '4px' }}>
              Order Confirmed & Processing!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.86rem', marginBottom: '16px' }}>
              Order ID: <strong style={{ color: '#ea580c' }}>{completedOrder.id}</strong>
            </p>

            {/* Automation: Payment Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: completedOrder.paymentStatus === 'PAID' ? '#ecfdf5' : '#f8fafc',
                color: completedOrder.paymentStatus === 'PAID' ? '#15803d' : '#475569',
                border: completedOrder.paymentStatus === 'PAID' ? '1px solid #86efac' : '1px solid #cbd5e1',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '0.78rem',
                fontWeight: '700',
                marginBottom: '18px'
              }}
            >
              <CheckCircle size={14} />
              <span>
                {completedOrder.paymentStatus === 'PAID'
                  ? `PAYMENT VERIFIED • ${completedOrder.paymentMethod} (${completedOrder.transactionId || 'CAPTURED'})`
                  : `PAYMENT PENDING • Pay upon Store Collection / Delivery`}
              </span>
            </div>

            {/* Automation: Store Pickup Pass (OTP) OR Courier AWB Card */}
            {completedOrder.deliveryType === 'store-pickup' ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.05) 0%, rgba(234, 88, 12, 0.12) 100%)',
                  border: '1.5px dashed #ea580c',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                  🏬 Store Counter Pickup Pass
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0f172a', letterSpacing: '0.25em', fontFamily: 'var(--font-mono)', margin: '6px 0' }}>
                  {completedOrder.pickupOtp || '4819'}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  Show this 4-digit code at <strong>Poyanil Junction counter</strong> to collect your tested equipment.
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(2, 132, 199, 0.12) 100%)',
                  border: '1.5px dashed #0284c7',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '18px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                  🚚 Courier Dispatch AWB
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)', margin: '4px 0' }}>
                  {completedOrder.awb || 'DLHVY-KL-8491'}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0 }}>
                  Carrier: <strong>Kerala Speed Express (Delhivery Partner)</strong> • Expected: Tomorrow by 5 PM
                </p>
              </div>
            )}

            {/* Order summary breakdown */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 18px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '0.84rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Total Paid:</span>
                <span style={{ color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(completedOrder.totalAmount)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Delivery Mode:</span>
                <span style={{ color: '#0284c7', fontWeight: '600' }}>
                  {completedOrder.deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier (' + completedOrder.customer.district + ')'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Pickup Point:</span>
                <span style={{ color: '#0f172a' }}>Poyanil Junction, Kozhencherry</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => {
                  onClose();
                  navigate('/account');
                }}
                className="btn-hero-clean"
                style={{ justifyContent: 'center' }}
                id="order-view-tracking-btn"
              >
                <span>Track Live Order & View GST Invoice</span>
                <ArrowRight size={16} />
              </button>

              <a
                href={getWhatsAppInvoiceUrl(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-clean"
                style={{ justifyContent: 'center', background: '#16a34a' }}
                id="order-confirm-whatsapp-btn"
              >
                <MessageCircle size={18} />
                <span>Send Order & Invoice to WhatsApp</span>
              </a>

              <button
                className="btn-hero-secondary"
                onClick={onClose}
                style={{ justifyContent: 'center' }}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmitOrder} className="checkout-modal-form">
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

            {/* Delivery Preference */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Delivery Preference
              </label>
              <div className="checkout-options-grid">
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
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  id="checkout-delivery-store"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                      <MapPin size={16} style={{ color: '#ea580c' }} />
                      <span>Store Pickup</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                      FREE
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Poyanil Building, Kozhencherry
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
                    gap: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  id="checkout-delivery-courier"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                      <Truck size={16} style={{ color: '#0284c7' }} />
                      <span>Courier Delivery</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: '800', background: (totalCourierFee || 0) === 0 ? '#dcfce7' : '#ffedd5', color: (totalCourierFee || 0) === 0 ? '#15803d' : '#ea580c', padding: '2px 6px', borderRadius: '4px' }}>
                      {(totalCourierFee || 0) === 0 ? 'FREE' : formatPrice(totalCourierFee || 0)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Express Doorstep Delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div className="checkout-form-grid-2">
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Mathew Varghese"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                    id="checkout-input-name"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 98470 XXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                    id="checkout-input-phone"
                  />
                </div>
              </div>

              {deliveryType === 'kerala-courier' && (
                <>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                      Delivery Address / House Name *
                    </label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="e.g. Thekkethil House, Kozhencherry East"
                      value={formData.address}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#0f172a',
                        fontSize: '0.86rem',
                        outline: 'none'
                      }}
                      id="checkout-input-address"
                    />
                  </div>

                  <div className="checkout-form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                        Kerala District
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '0.86rem',
                          outline: 'none'
                        }}
                        id="checkout-select-district"
                      >
                        {KERALA_DISTRICTS.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                        Pincode (6-digit)
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        placeholder="689641"
                        value={formData.pincode}
                        onChange={handleChange}
                        maxLength={6}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontSize: '0.86rem',
                          outline: 'none'
                        }}
                        id="checkout-input-pincode"
                      />
                      {pincodeCheck && (
                        <div style={{ marginTop: '6px', fontSize: '0.74rem' }}>
                          {pincodeCheck.checking ? (
                            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              Checking Delhivery Express serviceability...
                            </span>
                          ) : pincodeCheck.serviceable ? (
                            <span style={{ color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✅ Delhivery Serviceable {pincodeCheck.city ? `(${pincodeCheck.city})` : ''} • Express Doorstep Courier
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: '700' }}>
                              ⚠️ {pincodeCheck.message || 'Pincode outside standard Delhivery zones'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Payment Method
              </label>
              
              <div className="checkout-options-grid" style={{ marginBottom: '12px' }}>
                {/* Option 1: Razorpay Online */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'razorpay' }))}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '10px',
                    border: formData.paymentMethod === 'razorpay' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                    background: formData.paymentMethod === 'razorpay' ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  id="payment-method-razorpay"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: formData.paymentMethod === 'razorpay' ? '#ea580c' : '#f1f5f9',
                        color: formData.paymentMethod === 'razorpay' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShieldCheck size={16} />
                      </div>
                      <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>Razorpay Online</strong>
                    </div>
                    {formData.paymentMethod === 'razorpay' && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ea580c' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
                    UPI (GPay, PhonePe, Paytm), Cards & NetBanking
                  </div>
                </div>

                {/* Option 2: Cash (Pay at Store or COD) */}
                <div
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '10px',
                    border: formData.paymentMethod === 'cash' ? '2px solid #ea580c' : '1.5px solid #e2e8f0',
                    background: formData.paymentMethod === 'cash' ? '#fff7ed' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    position: 'relative',
                    transition: 'all 0.2s ease'
                  }}
                  id="payment-method-cash"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: formData.paymentMethod === 'cash' ? '#16a34a' : '#f1f5f9',
                        color: formData.paymentMethod === 'cash' ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Banknote size={16} />
                      </div>
                      <strong style={{ color: '#0f172a', fontSize: '0.88rem' }}>
                        {deliveryType === 'store-pickup' ? 'Pay at Store' : 'Cash on Delivery'}
                      </strong>
                    </div>
                    {formData.paymentMethod === 'cash' && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
                    {deliveryType === 'store-pickup' ? 'Pay upon counter collection' : 'Pay in cash upon doorstep receipt'}
                  </div>
                </div>
              </div>

              {/* Informational Callout for selected payment method (Clean, zero fake QR) */}
              {formData.paymentMethod === 'razorpay' ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                  id="razorpay-info-badge"
                >
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#059669',
                      borderRadius: '8px',
                      padding: '6px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a' }}>
                        Official Razorpay Secure Checkout
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        100% SECURE
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      Pay instantly via <strong>Google Pay, PhonePe, Paytm, BHIM UPI</strong>, Credit/Debit Cards, or 50+ NetBanking options. Complete with automated digital receipt.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                  id="cash-info-badge"
                >
                  <div
                    style={{
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      color: '#d97706',
                      borderRadius: '8px',
                      padding: '6px',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Banknote size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a' }}>
                        {deliveryType === 'store-pickup' ? 'Pay at Kozhencherry Store Counter' : 'Cash on Delivery (COD)'}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: '800', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>
                        NO ADVANCE PAYMENT
                      </span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                      {deliveryType === 'store-pickup'
                        ? 'Inspect your equipment in person at Poyanil Building, Kozhencherry. Pay via cash or UPI at the counter.'
                        : 'Pay the exact order amount in cash to the Delhivery express courier agent upon doorstep delivery.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Price Breakdown */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Items Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span style={{ color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && activeCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: '#16a34a' }}>
                  <span>Coupon Discount ({activeCoupon.code})</span>
                  <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Delivery ({deliveryType === 'store-pickup' ? 'Store Pickup' : 'Express Courier'})</span>
                <span style={{ color: deliveryFee === 0 ? '#16a34a' : '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>

              <div
                style={{
                  borderTop: '1px dashed #cbd5e1',
                  paddingTop: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>Total Payable Amount</span>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isProcessingPayment}
              className="btn-hero-clean"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.96rem',
                justifyContent: 'center',
                borderRadius: '10px',
                opacity: (isSubmitting || isProcessingPayment) ? 0.7 : 1,
                background: formData.paymentMethod === 'razorpay' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#0f172a',
                boxShadow: formData.paymentMethod === 'razorpay' ? '0 4px 14px rgba(234, 88, 12, 0.35)' : '0 4px 14px rgba(15, 23, 42, 0.25)'
              }}
              id="confirm-place-order-btn"
            >
              {isProcessingPayment ? (
                <span>Opening Secure Razorpay Portal...</span>
              ) : isSubmitting ? (
                <span>Processing Order...</span>
              ) : formData.paymentMethod === 'razorpay' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} />
                  <span>Pay {formatPrice(finalTotal)} via Razorpay</span>
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  <span>
                    {deliveryType === 'store-pickup'
                      ? `Confirm Store Pickup • ${formatPrice(finalTotal)}`
                      : `Place COD Order • ${formatPrice(finalTotal)}`}
                  </span>
                </span>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck size={14} style={{ color: '#16a34a' }} />
              <span>100% Verified Order • Variathu Power Tools, Kozhencherry</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
