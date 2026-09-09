import React, { useState } from 'react';
import { X, Star, ShoppingCart, MessageCircle, ShieldCheck, Wrench, CheckCircle, Package, Truck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductDetailModal = ({ product, onClose }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const formatPrice = (num) => '₹' + num.toLocaleString('en-IN');

  const handleAddAndOpenCart = () => {
    addToCart(product, quantity);
    onClose();
    setIsCartOpen(true);
  };

  const getWhatsAppOrderUrl = () => {
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI would like to order:\n\n*${product.name}*\nBrand: ${product.brand}\nQuantity: ${quantity}\nTotal: ${formatPrice(product.price * quantity)}\n\nPlease let me know availability at Poyanil Building, Kozhencherry.`
    );
    return `https://wa.me/919447123456?text=${text}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.brand} • {product.category?.replace('-', ' ')}
            </span>
            <h3 style={{ fontSize: '1.15rem', marginTop: 2, color: '#0f172a' }}>
              Equipment Specifications
            </h3>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '28px' }}>
            {/* Left: Images */}
            <div>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {product.badge && (
                  <span className="card-badge" style={{ top: 12, left: 12 }}>
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Thumbnails if multiple */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Thumbnail"
                      onClick={() => setActiveImg(idx)}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: activeImg === idx ? '2px solid #ea580c' : '1px solid #e2e8f0'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Local Service Banner */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'rgba(234, 88, 12, 0.06)',
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <Wrench size={22} style={{ color: '#ea580c', flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                  <strong style={{ color: '#0f172a' }}>Variathu Service Guarantee:</strong> Backed by direct repair clinic and original spares at our Poyanil Junction workshop.
                </div>
              </div>
            </div>

            {/* Right: Info, Specs, Actions */}
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', lineHeight: 1.3, color: '#0f172a', marginBottom: '8px' }}>
                {product.name}
              </h2>

              {/* Rating & Stock */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', fontSize: '0.86rem' }}>
                  <Star size={15} fill="#d97706" stroke="#d97706" />
                  <span style={{ fontWeight: '700' }}>{product.rating}</span>
                  <span style={{ color: '#64748b' }}>({product.reviewsCount} reviews)</span>
                </div>

                <span style={{ color: '#16a34a', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> In Stock ({product.stock} units ready in Kozhencherry)
                </span>
              </div>

              {/* Pricing */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' }}>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.discount && (
                  <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                    {product.discount}
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                {product.description}
              </p>

              {/* Technical Specifications */}
              {product.specs && (
                <div style={{ marginBottom: '22px' }}>
                  <h4 style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Technical Specifications
                  </h4>
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden'
                    }}
                  >
                    {Object.entries(product.specs).map(([key, val], i) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          fontSize: '0.82rem',
                          background: i % 2 === 0 ? '#ffffff' : 'transparent',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <span style={{ color: '#64748b', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span style={{ color: '#0f172a', fontWeight: '600' }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Picker & Add to Cart */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                <div className="qty-counter" style={{ padding: '2px' }}>
                  <button
                    className="btn-qty"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: '32px', height: '32px' }}
                  >
                    -
                  </button>
                  <span className="qty-value" style={{ fontSize: '0.95rem', minWidth: '32px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    className="btn-qty"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ width: '32px', height: '32px' }}
                  >
                    +
                  </button>
                </div>

                <button
                  className="btn-hero-clean"
                  onClick={handleAddAndOpenCart}
                  style={{ flex: 1, justifyContent: 'center' }}
                  id="modal-add-to-cart-btn"
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart ({formatPrice(product.price * quantity)})</span>
                </button>
              </div>

              {/* Direct WhatsApp Ordering */}
              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
                style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}
                id="modal-order-whatsapp-btn"
              >
                <MessageCircle size={18} />
                <span>Instant Order via WhatsApp</span>
              </a>

              {/* Quick Perks */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={14} style={{ color: '#ea580c' }} /> Store Pickup
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Truck size={14} style={{ color: '#0284c7' }} /> Courier
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} style={{ color: '#16a34a' }} /> Original Guarantee
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
