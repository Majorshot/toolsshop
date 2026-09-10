import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, Tag, ShoppingBag, MapPin, Truck, CheckCircle2, ChevronRight, X, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartPage = ({ onOpenCheckout }) => {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discountAmount,
    appliedDiscount,
    activeCoupon,
    removeCoupon,
    verifyCouponWithPhone,
    deliveryFee,
    totalCourierFee,
    deliveryType,
    setDeliveryType,
    couponCode,
    setCouponCode,
    applyCoupon,
    finalTotal
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    if (activeCoupon?.verifiedPhone) {
      setVerifyPhoneInput(activeCoupon.verifiedPhone);
    }
  }, [activeCoupon?.verifiedPhone]);

  const formatPrice = (num) => '₹' + num.toLocaleString('en-IN');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    applyCoupon(inputCoupon);
  };

  const getWhatsAppCartUrl = () => {
    let text = `*VARIATHU POWER TOOLS - KOZHENCHERRY*\nOrder Inquiry:\n\n`;
    cart.forEach((item, index) => {
      text += `${index + 1}. *${item.name}* (x${item.quantity}) - ${formatPrice(item.price * item.quantity)}\n`;
    });
    text += `\nSubtotal: ${formatPrice(subtotal)}`;
    if (discountAmount > 0) text += `\nDiscount: -${formatPrice(discountAmount)}`;
    text += `\nDelivery: ${deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier'}`;
    text += `\n*Grand Total: ${formatPrice(finalTotal)}*\n\nPlease confirm availability for Variathu Power Tools.`;

    return `https://wa.me/919447123456?text=${encodeURIComponent(text)}`;
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '48px 24px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(234, 88, 12, 0.08)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShoppingBag size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
            Looks like you haven't added any heavy-duty power tools to your cart yet.
          </p>
          <Link to="/shop" className="btn-hero-clean">
            <span>Browse Equipment Catalog</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      {/* Breadcrumb */}
      <div className="cart-breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={14} />
        <Link to="/shop">Shop</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: '700' }}>Shopping Cart</span>
      </div>

      <h1 className="cart-page-title">
        Equipment Shopping Cart ({cart.length} item{cart.length > 1 ? 's' : ''})
      </h1>

      <div className="cart-page-grid">
        {/* Left: Cart Items List */}
        <div className="cart-items-container">
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item-card" id={`cart-item-${item.id}`}>
                {/* Top Section: Image & Product Details */}
                <div className="cart-item-top-row">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-thumbnail"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />

                  <div className="cart-item-details">
                    <span className="cart-item-brand">
                      {item.brand}
                    </span>
                    <h3 className="cart-item-title">
                      {item.name}
                    </h3>
                    <div className="cart-item-pricing-meta">
                      <span className="cart-item-unit-price">
                        Unit Price: <strong>{formatPrice(item.price)}</strong>
                      </span>
                      <span className="cart-item-courier-tag">
                        🚚 Courier: {item.deliveryCost === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : <strong>₹{item.deliveryCost ?? 120}/unit</strong>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Stepper & Remove on Left, Line Total on Right */}
                <div className="cart-item-bottom-bar">
                  <div className="cart-item-actions-left">
                    <div className="cart-item-stepper">
                      <button
                        type="button"
                        className="cart-stepper-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        title="Decrease quantity"
                        aria-label="Decrease quantity"
                        id={`btn-cart-minus-${item.id}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-stepper-val">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-stepper-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= (item.stock ?? 999)}
                        title={item.quantity >= (item.stock ?? 999) ? `Only ${item.stock} in stock` : "Increase quantity"}
                        aria-label="Increase quantity"
                        id={`btn-cart-plus-${item.id}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="cart-item-remove-btn"
                      title="Remove item from cart"
                      id={`btn-cart-remove-${item.id}`}
                    >
                      <Trash2 size={15} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="cart-item-total-wrap">
                    <div className="cart-item-total-price">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                    {item.quantity >= (item.stock ?? 999) && (
                      <span className="cart-item-max-stock-tag">
                        Max stock ({item.stock ?? 1} unit{item.stock > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-items-footer-links">
            <Link to="/shop" className="cart-continue-btn">
              ← Continue Shopping
            </Link>
            <button
              type="button"
              onClick={clearCart}
              className="cart-clear-btn"
              id="btn-clear-cart"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="cart-summary-card">
          <h2 className="cart-summary-heading">
            Order Summary
          </h2>

          {/* Delivery Options */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              Select Delivery Preference
            </span>
            <div className="cart-delivery-selector">
              <div
                onClick={() => setDeliveryType('store-pickup')}
                className={`cart-delivery-pill ${deliveryType === 'store-pickup' ? 'active' : 'inactive'}`}
              >
                <div className="cart-delivery-pill-header">
                  <MapPin size={15} style={{ color: '#ea580c' }} />
                  <span>Store Pickup</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '800' }}>FREE</span>
              </div>

              <div
                onClick={() => setDeliveryType('kerala-courier')}
                className={`cart-delivery-pill ${deliveryType === 'kerala-courier' ? 'active' : 'inactive'}`}
              >
                <div className="cart-delivery-pill-header">
                  <Truck size={15} style={{ color: '#0284c7' }} />
                  <span>Courier</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: (totalCourierFee || 0) === 0 ? '#16a34a' : '#ea580c', fontWeight: '800' }}>
                  {(totalCourierFee || 0) === 0 ? 'FREE' : formatPrice(totalCourierFee || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Coupon Section */}
          {activeCoupon ? (
            <>
              <div
                id="active-coupon-card"
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a'
                  }}
                >
                  <Tag size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                      {activeCoupon.code}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: '#bbf7d0', color: '#166534', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                      {activeCoupon.discountType === 'flat' ? `₹${activeCoupon.discountValue} FLAT OFF` : `${activeCoupon.discountValue}% OFF`}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '600' }}>
                    Coupon applied successfully
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-remove-coupon"
                onClick={removeCoupon}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fca5a5',
                  color: '#dc2626',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
                }}
                title="Remove this coupon"
              >
                <X size={13} />
                <span>Remove</span>
              </button>
            </div>

            {/* Single-Use Phone Verification Prompt */}
            {activeCoupon.requiresPhone && (
              <div
                style={{
                  background: '#fefce8',
                  border: '1px solid #fde047',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '0.78rem', color: '#854d0e', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: '#ea580c' }} />
                  <span>Single-use offer: Enter your 10-digit mobile number to lock in discount:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="tel"
                    maxLength="10"
                    placeholder="Enter 10-digit phone (e.g. 9447123456)"
                    value={verifyPhoneInput}
                    onChange={(e) => setVerifyPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '0.84rem',
                      fontWeight: '700',
                      color: '#0f172a',
                      letterSpacing: '0.05em'
                    }}
                    id="input-verify-phone"
                  />
                  <button
                    type="button"
                    onClick={() => verifyCouponWithPhone(verifyPhoneInput)}
                    style={{
                      padding: '0 16px',
                      background: '#ea580c',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                    id="btn-verify-coupon-phone"
                  >
                    Verify Phone
                  </button>
                </div>
              </div>
            )}

            {activeCoupon.verifiedPhone && (
              <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Verified for +91 {activeCoupon.verifiedPhone} (Single-use promotion applied)</span>
              </div>
            )}
          </>
          ) : (
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Tag size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Enter promo coupon code"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value)}
                  style={{
                    width: '100%',
                    height: '40px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '0 10px 0 34px',
                    color: '#0f172a',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                  id="cart-coupon-input"
                />
              </div>
              <button
                type="submit"
                id="cart-coupon-apply-btn"
                style={{
                  background: '#0f172a',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '0 18px',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </form>
          )}

          {/* Calculations */}
          <div className="cart-calc-box">
            <div className="cart-calc-row">
              <span>Subtotal</span>
              <span style={{ color: '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && activeCoupon && (
              <div className="cart-calc-row" style={{ color: '#16a34a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>
                    Discount ({activeCoupon.code} • {activeCoupon.discountType === 'flat' ? `₹${activeCoupon.discountValue} OFF` : `${activeCoupon.discountValue}% OFF`})
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                    title="Remove coupon"
                  >
                    (Remove)
                  </button>
                </div>
                <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="cart-calc-row">
              <span>Delivery Fee ({deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier'})</span>
              <span style={{ color: deliveryFee === 0 ? '#16a34a' : '#0f172a', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </span>
            </div>

            <div className="cart-calc-total-row">
              <span style={{ color: '#0f172a' }}>Total Amount</span>
              <span style={{ color: '#ea580c', fontFamily: 'var(--font-mono)' }}>{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <div className="cart-actions-column">
            <button
              className="btn-hero-clean"
              onClick={onOpenCheckout}
              style={{ justifyContent: 'center', width: '100%', padding: '14px', fontSize: '0.96rem' }}
              id="btn-cart-checkout"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </button>

            <a
              href={getWhatsAppCartUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-clean"
              style={{ justifyContent: 'center', width: '100%', background: '#16a34a', textDecoration: 'none', padding: '14px', fontSize: '0.96rem' }}
              id="btn-cart-whatsapp"
            >
              <MessageCircle size={18} />
              <span>Send Order on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
