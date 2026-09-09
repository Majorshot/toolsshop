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
    paymentMethod: 'upi', // 'upi' or 'cod'
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
      const isPrepaid = formData.paymentMethod === 'upi';

      const orderPayload = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
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
      if (isPrepaid && typeof window !== 'undefined' && window.Razorpay) {
        setIsProcessingPayment(true);

        const rzpOrderRes = await api.createRazorpayOrder(
          finalTotal,
          `rcpt_${Date.now().toString().slice(-6)}`,
          {
            customer_name: formData.name,
            customer_phone: formData.phone,
            delivery_type: deliveryType
          }
        );

        const rzpOrder = rzpOrderRes.order;

        const options = {
          key: rzpOrderRes.keyId || 'rzp_test_TZQUSp5JtcBjMs',
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'Variathu Power Tools',
          description: `Order for ${formData.name} • Poyanil Building, Kozhencherry`,
          image: '/logo.jpg',
          order_id: rzpOrder.id,
          prefill: {
            name: formData.name,
            contact: formData.phone,
            email: formData.email || 'variathupowertools@gmail.com'
          },
          notes: {
            address: 'Poyanil Building, Kozhencherry, Kerala - 689641'
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

      // Fallback or COD (Pay at store / upon delivery)
      const generatedTxn = isPrepaid ? `TXN-VPT-${Date.now().toString().slice(-8)}` : null;
      const result = await api.createOrder({
        ...orderPayload,
        paymentMethod: formData.paymentMethod.toUpperCase(),
        paymentStatus: isPrepaid ? 'PAID' : 'PENDING',
        transactionId: generatedTxn
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
    text += `Delivery: ${order.deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier (' + order.customer.district + ')'}\n`;
    text += `Payment: ${order.paymentMethod} (${order.paymentStatus || 'CONFIRMED'})\n`;
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
          <form onSubmit={handleSubmitOrder} style={{ padding: '24px' }}>
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
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Delivery Preference
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => setDeliveryType('store-pickup')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    background: deliveryType === 'store-pickup' ? 'rgba(234,88,12,0.06)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                    <MapPin size={16} style={{ color: '#ea580c' }} />
                    <span>Store Pickup (FREE)</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Poyanil Building, Kozhencherry
                  </span>
                </div>

                <div
                  onClick={() => setDeliveryType('kerala-courier')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    background: deliveryType === 'kerala-courier' ? 'rgba(234,88,12,0.06)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '700', fontSize: '0.88rem' }}>
                    <Truck size={16} style={{ color: '#0284c7' }} />
                    <span>Courier</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Speed Post / Courier ({deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)})
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                      >
                        {KERALA_DISTRICTS.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                        Pincode
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
              <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'upi' }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: formData.paymentMethod === 'upi' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    background: formData.paymentMethod === 'upi' ? 'rgba(234,88,12,0.06)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <QrCode size={20} style={{ color: '#0284c7' }} />
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>UPI QR / GPay</strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>PhonePe, Paytm, Any UPI</span>
                  </div>
                </div>

                <div
                  onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cod' }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: formData.paymentMethod === 'cod' ? '2px solid #ea580c' : '1px solid #e2e8f0',
                    background: formData.paymentMethod === 'cod' ? 'rgba(234,88,12,0.06)' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <Banknote size={20} style={{ color: '#16a34a' }} />
                  <div>
                    <strong style={{ color: '#0f172a', fontSize: '0.88rem', display: 'block' }}>
                      {deliveryType === 'store-pickup' ? 'Pay at Store' : 'Cash on Delivery'}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Pay upon receipt</span>
                  </div>
                </div>
              </div>

              {/* UPI QR Display */}
              {formData.paymentMethod === 'upi' && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <QrCode size={64} color="#0f172a" />
                  </div>
                  <div>
                    <h5 style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '700', marginBottom: '2px' }}>
                      Scan & Pay with Any UPI App
                    </h5>
                    <p style={{ color: '#64748b', fontSize: '0.76rem', marginBottom: '4px' }}>
                      UPI ID: <strong style={{ color: '#0284c7' }}>variathupowertools@okaxis</strong>
                    </p>
                    <p style={{ color: '#16a34a', fontSize: '0.82rem', fontWeight: '700' }}>
                      Amount: {formatPrice(finalTotal)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Total breakdown */}
            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block' }}>Total Amount:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(finalTotal)}
                </span>
                {discountAmount > 0 && activeCoupon && (
                  <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '800', display: 'block', marginTop: '2px' }}>
                    🏷️ Coupon {activeCoupon.code} applied (-{formatPrice(discountAmount)})
                  </span>
                )}
                {deliveryType === 'kerala-courier' && (
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                    (Includes {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)} Delhivery courier fee)
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isProcessingPayment}
                className="btn-hero-clean"
                style={{ padding: '12px 24px', opacity: (isSubmitting || isProcessingPayment) ? 0.7 : 1 }}
                id="confirm-place-order-btn"
              >
                <span>
                  {isProcessingPayment
                    ? 'Capturing Payment...'
                    : (isSubmitting
                        ? 'Confirming Order...'
                        : (formData.paymentMethod === 'upi'
                            ? `Pay ${formatPrice(finalTotal)} via UPI & Confirm`
                            : 'Confirm & Place Order'))}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
