import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, MessageCircle, Tag, ShoppingBag, MapPin, Truck, Phone, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ onOpenCheckout }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
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
  const [verifyPhoneDrawerInput, setVerifyPhoneDrawerInput] = useState('');

  React.useEffect(() => {
    if (activeCoupon?.verifiedPhone) {
      setVerifyPhoneDrawerInput(activeCoupon.verifiedPhone);
    }
  }, [activeCoupon?.verifiedPhone]);

  if (!isCartOpen) return null;

  const formatPrice = (num) => '₹' + num.toLocaleString('en-IN');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    applyCoupon(inputCoupon);
  };

  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    onOpenCheckout();
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

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234,88,12,0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
              Your Tools Cart ({cart.length})
            </h3>
          </div>
          <button
            className="btn-close-modal"
            onClick={() => setIsCartOpen(false)}
            title="Close cart"
            id="close-cart-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cart Content */}
        {cart.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px',
              textAlign: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(234, 88, 12, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ea580c'
              }}
            >
              <ShoppingBag size={34} />
            </div>
            <h4 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>
              Your cart is empty
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '280px' }}>
              Explore our equipment catalog and add tools to your cart.
            </p>
            <button
              className="btn-hero-clean"
              onClick={() => setIsCartOpen(false)}
              style={{ marginTop: '8px' }}
            >
              Browse Equipment
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-card">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-thumb"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="cart-item-info">
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {item.brand}
                      </span>
                      <h5 className="cart-item-title" style={{ color: '#0f172a', fontWeight: '700' }}>
                        {item.name}
                      </h5>
                      <div style={{ fontSize: '0.68rem', color: '#0284c7', marginTop: '2px', fontWeight: '600' }}>
                        🚚 {item.deliveryCost === 0 ? <span style={{ color: '#16a34a', fontWeight: '800' }}>Free Delivery</span> : `Courier: ₹${item.deliveryCost ?? 120}/unit`}
                      </div>
                    </div>

                    <div className="cart-quantity-row">
                      <span className="cart-item-price" style={{ color: '#ea580c', fontWeight: '800' }}>
                        {formatPrice(item.price * item.quantity)}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="qty-counter">
                          <button
                            className="btn-qty"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            title="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="qty-value" style={{ color: '#0f172a' }}>{item.quantity}</span>
                          <button
                            className="btn-qty"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.stock ?? 999)}
                            title={item.quantity >= (item.stock ?? 999) ? `Only ${item.stock} in stock` : "Increase quantity"}
                            style={{
                              opacity: item.quantity >= (item.stock ?? 999) ? 0.4 : 1,
                              cursor: item.quantity >= (item.stock ?? 999) ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          className="btn-remove-item"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {item.quantity >= (item.stock ?? 999) && (
                        <div style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: '700', textAlign: 'right', marginTop: '2px' }}>
                          Max limit ({item.stock ?? 1} unit)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Type Option */}
            <div style={{ padding: '12px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.74rem', color: '#475569', marginBottom: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Delivery Preference
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType('store-pickup')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: deliveryType === 'store-pickup' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: deliveryType === 'store-pickup' ? '#ffffff' : '#f1f5f9',
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    boxShadow: deliveryType === 'store-pickup' ? '0 2px 8px rgba(234,88,12,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} style={{ color: '#ea580c' }} />
                    <span>Store Pickup</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '800' }}>FREE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('kerala-courier')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: deliveryType === 'kerala-courier' ? '2px solid #ea580c' : '1px solid #cbd5e1',
                    background: deliveryType === 'kerala-courier' ? '#ffffff' : '#f1f5f9',
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    boxShadow: deliveryType === 'kerala-courier' ? '0 2px 8px rgba(234,88,12,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Truck size={15} style={{ color: '#0284c7' }} />
                    <span>Courier</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: (totalCourierFee || 0) === 0 ? '#16a34a' : '#ea580c', fontWeight: '800' }}>
                    {(totalCourierFee || 0) === 0 ? 'FREE' : formatPrice(totalCourierFee || 0)}
                  </span>
                </button>
              </div>
            </div>

            {/* Coupon Code Section */}
            {activeCoupon ? (
              <>
                <div
                  style={{
                    margin: '10px 18px',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={15} style={{ color: '#16a34a' }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '800', color: '#15803d', fontSize: '0.84rem' }}>
                          {activeCoupon.code}
                        </span>
                        <span style={{ fontSize: '0.68rem', background: '#bbf7d0', color: '#166534', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                          {activeCoupon.discountType === 'flat' ? `₹${activeCoupon.discountValue} OFF` : `${activeCoupon.discountValue}% OFF`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeCoupon}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                    title="Remove coupon"
                  >
                    <X size={12} />
                    <span>Remove</span>
                  </button>
                </div>

                {activeCoupon.requiresPhone && (
                  <div style={{ margin: '0 18px 10px', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#854d0e', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={12} style={{ color: '#ea580c' }} />
                      <span>Single-use: Enter 10-digit mobile number:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="tel"
                        maxLength="10"
                        placeholder="Phone (10 digits)"
                        value={verifyPhoneDrawerInput}
                        onChange={(e) => setVerifyPhoneDrawerInput(e.target.value.replace(/[^0-9]/g, ''))}
                        style={{
                          flex: 1,
                          height: '32px',
                          padding: '0 8px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#0f172a'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => verifyCouponWithPhone(verifyPhoneDrawerInput)}
                        style={{
                          padding: '0 10px',
                          background: '#ea580c',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}

                {activeCoupon.verifiedPhone && (
                  <div style={{ margin: '0 18px 8px', fontSize: '0.7rem', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} />
                    <span>Verified for +91 {activeCoupon.verifiedPhone}</span>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ padding: '12px 18px', background: '#ffffff', display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Enter promo coupon code"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0 10px 0 34px',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      fontWeight: '600',
                      outline: 'none'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#0f172a',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0 16px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </form>
            )}

            {/* Cart Summary & Action */}
            <div className="cart-summary-box">
              <div className="summary-row">
                <span style={{ color: '#475569', fontWeight: '500' }}>Subtotal</span>
                <span style={{ color: '#0f172a', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal)}</span>
              </div>

              {discountAmount > 0 && activeCoupon && (
                <div className="summary-row" style={{ color: '#16a34a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>
                      Discount ({activeCoupon.code} • {activeCoupon.discountType === 'flat' ? `₹${activeCoupon.discountValue}` : `${activeCoupon.discountValue}%`})
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.72rem',
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800' }}>-{formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span style={{ color: '#475569' }}>
                  Delivery ({deliveryType === 'store-pickup' ? 'Store Pickup' : 'Courier'})
                </span>
                <span style={{ color: deliveryFee === 0 ? '#16a34a' : '#0f172a', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                  {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                </span>
              </div>

              <div className="summary-row summary-total">
                <span style={{ color: '#0f172a', fontWeight: '800' }}>Grand Total</span>
                <span className="total-amount" style={{ color: '#ea580c', fontWeight: '800', fontSize: '1.4rem' }}>
                  {formatPrice(finalTotal)}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-hero-clean"
                  onClick={handleProceedCheckout}
                  style={{ justifyContent: 'center', width: '100%', padding: '13px' }}
                  id="cart-proceed-checkout-btn"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={17} />
                </button>

                <a
                  href={getWhatsAppCartUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hero-clean"
                  style={{ justifyContent: 'center', width: '100%', background: '#16a34a', textDecoration: 'none', padding: '13px' }}
                  id="cart-whatsapp-order-btn"
                >
                  <MessageCircle size={18} />
                  <span>Send Order on WhatsApp</span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
