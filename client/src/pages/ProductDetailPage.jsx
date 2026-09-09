import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ShoppingCart, MessageCircle, ShieldCheck, Wrench, CheckCircle2, 
  Package, Truck, Zap, ArrowLeft, ChevronRight, Share2, Award, 
  RotateCcw, MapPin, Check, Heart, Eye, Sparkles, Layers
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch current product and related products
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setActiveImgIdx(0);
    setQuantity(1);

    async function loadData() {
      try {
        const res = await api.getProduct(id);
        const currentProd = res.data;
        if (!isMounted) return;
        setProduct(currentProd);
        const initialStock = typeof currentProd?.stock === 'number' ? currentProd.stock : 999;
        setQuantity(initialStock <= 0 ? 0 : 1);

        // Fetch related products from same category
        if (currentProd?.category) {
          const relatedRes = await api.getProducts({ category: currentProd.category });
          if (isMounted) {
            const others = (relatedRes.data || []).filter(p => p.id !== currentProd.id && String(p._id) !== String(currentProd._id));
            setRelatedProducts(others);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Product not found or failed to load.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatPrice = (num) => '₹' + Number(num || 0).toLocaleString('en-IN');
  const maxStock = typeof product?.stock === 'number' ? product.stock : 999;
  const isOutOfStock = maxStock <= 0;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    const safeQty = Math.max(1, Math.min(quantity, maxStock));
    addToCart(product, safeQty);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    const safeQty = Math.max(1, Math.min(quantity, maxStock));
    addToCart(product, safeQty);
    navigate('/cart');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getWhatsAppOrderUrl = () => {
    if (!product) return '#';
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI would like to purchase:\n\n*${product.name}*\nBrand: ${product.brand}\nQuantity: ${quantity}\nTotal Amount: ${formatPrice(product.price * quantity)}\n\nPlease confirm stock availability at Poyanil Building, Kozhencherry.`
    );
    return `https://wa.me/919447123456?text=${text}`;
  };

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#ea580c',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 18px'
          }}
        />
        <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Loading Equipment Details...</h3>
        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>Retrieving live inventory, pricing, and specifications from database</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px 24px' }}>
          <Package size={48} style={{ color: '#94a3b8', margin: '0 auto 16px', display: 'block' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Product Not Found</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>
            The power tool you are looking for might have been moved, renamed, or is currently out of stock in our Kozhencherry workshop.
          </p>
          <Link to="/shop" className="btn-hero-clean" style={{ display: 'inline-flex', padding: '10px 24px' }}>
            <ArrowLeft size={16} />
            <span>Return to Equipment Catalog</span>
          </Link>
        </div>
      </div>
    );
  }

  const rawGallery = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean)
    : (product.image ? [product.image] : []);
  const galleryImages = rawGallery.length > 0 
    ? rawGallery 
    : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'];
  const discountAmount = product.originalPrice && product.originalPrice > product.price 
    ? product.originalPrice - product.price 
    : 0;

  const categoryLabel = product.category ? product.category.replace(/-/g, ' ') : 'Equipment';

  return (
    <div style={{ padding: '16px 0 70px' }}>
      {/* Amazon / Flipkart Style Breadcrumbs Bar */}
      <nav 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '0.82rem', 
          color: '#64748b', 
          marginBottom: '20px', 
          flexWrap: 'wrap' 
        }}
        aria-label="Breadcrumb"
      >
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>Home</Link>
        <ChevronRight size={13} style={{ color: '#94a3b8' }} />
        <Link to="/shop" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>Catalog</Link>
        <ChevronRight size={13} style={{ color: '#94a3b8' }} />
        <Link 
          to={`/shop?category=${encodeURIComponent(product.category || '')}`} 
          style={{ color: '#64748b', textDecoration: 'none', textTransform: 'capitalize', fontWeight: '500' }}
        >
          {categoryLabel}
        </Link>
        <ChevronRight size={13} style={{ color: '#94a3b8' }} />
        <span style={{ color: '#0f172a', fontWeight: '700', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.name}
        </span>
      </nav>

      {/* Main E-Commerce Product Layout: Two Columns (Amazon / Flipkart Style) */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '36px',
          alignItems: 'flex-start',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-xs)',
          marginBottom: '48px'
        }}
      >
        {/* ================= LEFT COLUMN: PRODUCT GALLERY ================= */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'row-reverse' }}>
            {/* Main Stage Image */}
            <div
              style={{
                flex: 1,
                aspectRatio: '1 / 1',
                borderRadius: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <img
                src={galleryImages[activeImgIdx] || product.image}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '16px',
                  transition: 'transform 0.3s ease'
                }}
                id="main-product-image"
              />

              {/* Badges */}
              {product.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  {product.badge}
                </span>
              )}

              {product.cordless && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    background: 'rgba(2, 132, 199, 0.95)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Zap size={12} /> Cordless 20V XR
                </span>
              )}

              {/* Share button */}
              <button
                onClick={handleShare}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-xs)'
                }}
                title="Share link"
              >
                {copiedLink ? <Check size={16} style={{ color: '#16a34a' }} /> : <Share2 size={16} />}
              </button>
            </div>

            {/* Thumbnail Strip (Flipkart style on left) */}
            {galleryImages.length > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  width: '68px',
                  flexShrink: 0
                }}
              >
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImgIdx(idx)}
                    onMouseEnter={() => setActiveImgIdx(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      border: activeImgIdx === idx ? '2px solid var(--brand-primary)' : '1px solid #e2e8f0',
                      background: '#ffffff',
                      padding: '4px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: activeImgIdx === idx ? '0 0 0 2px var(--brand-border)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    title={`View photo ${idx + 1}`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`View thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PRODUCT INFO & BUY BOX ================= */}
        <div>
          {/* Brand & Store Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
            <Link 
              to={`/shop?brand=${encodeURIComponent(product.brand?.toLowerCase() || '')}`}
              style={{
                color: '#0284c7',
                fontSize: '0.84rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>Brand: {product.brand}</span>
              <ChevronRight size={13} />
            </Link>

            <span 
              style={{ 
                background: '#f1f5f9', 
                color: '#475569', 
                fontSize: '0.72rem', 
                fontWeight: '700', 
                padding: '2px 8px', 
                borderRadius: '9999px',
                border: '1px solid #e2e8f0'
              }}
            >
              SKU: {product.id}
            </span>
          </div>

          {/* Title */}
          <h1 
            style={{ 
              fontSize: 'clamp(1.3rem, 2.2vw, 1.75rem)', 
              fontWeight: '800', 
              color: '#0f172a', 
              lineHeight: 1.35, 
              marginBottom: '12px' 
            }}
          >
            {product.name}
          </h1>

          {/* Verification Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span 
              style={{ 
                fontSize: '0.76rem', 
                color: '#15803d', 
                background: '#f0fdf4', 
                border: '1px solid #bbf7d0', 
                padding: '3px 10px', 
                borderRadius: '6px', 
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Check size={13} /> 100% Genuine Kerala Stock
            </span>
          </div>

          {/* Price Box (Amazon / Flipkart Style) */}
          <div 
            style={{ 
              borderTop: '1px solid #f1f5f9', 
              borderBottom: '1px solid #f1f5f9', 
              padding: '16px 0', 
              marginBottom: '20px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', flexWrap: 'wrap' }}>
              <span 
                style={{ 
                  fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', 
                  fontWeight: '900', 
                  color: '#0f172a', 
                  fontFamily: 'var(--font-mono)' 
                }}
              >
                {formatPrice(product.price)}
              </span>

              {product.originalPrice && product.originalPrice > product.price && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.96rem', color: '#94a3b8', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                    M.R.P.: {formatPrice(product.originalPrice)}
                  </span>

                  <span 
                    style={{ 
                      background: '#ecfdf5', 
                      color: '#15803d', 
                      border: '1px solid #86efac', 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      fontSize: '0.78rem', 
                      fontWeight: '800' 
                    }}
                  >
                    {product.discount || `${Math.round((discountAmount / product.originalPrice) * 100)}% OFF`}
                  </span>
                </div>
              )}
            </div>

            {discountAmount > 0 && (
              <p style={{ color: '#16a34a', fontSize: '0.84rem', fontWeight: '700', margin: '4px 0 0' }}>
                You save: {formatPrice(discountAmount)} ({Math.round((discountAmount / product.originalPrice) * 100)}%)
              </p>
            )}

            <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '4px 0 0' }}>
              Inclusive of all taxes • Official GST Tax Invoice provided
            </p>
          </div>

          {/* Real-Time Stock & Store Location Info */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: isOutOfStock ? '#dc2626' : (maxStock === 1 ? '#ea580c' : '#16a34a') 
                }} 
              />
              <strong 
                style={{ 
                  color: isOutOfStock ? '#dc2626' : (maxStock === 1 ? '#dc2626' : '#16a34a'), 
                  fontSize: '0.92rem' 
                }}
              >
                {isOutOfStock 
                  ? 'Out of Stock (Currently Unavailable)' 
                  : (maxStock === 1 
                      ? '⚠️ Only 1 unit left in stock - order soon!' 
                      : `In Stock (${maxStock} units available)`
                    )}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.84rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} style={{ color: 'var(--brand-primary)' }} />
                <span>
                  <strong>Pickup Ready Today:</strong> Poyanil Building, Kozhencherry (Counter Handover with OTP)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={15} style={{ color: '#0284c7' }} />
                <span>
                  <strong>Doorstep Courier:</strong>{' '}
                  {product.deliveryCost === 0 ? (
                    <span style={{ color: '#16a34a', fontWeight: '800' }}>FREE Delivery</span>
                  ) : (
                    <span><strong>₹{product.deliveryCost ?? 120}</strong> delivery fee</span>
                  )}{' '}
                  (Delhivery Partner • Speed delivery across Kerala)
                </span>
              </div>
            </div>
          </div>

          {/* Action Box (Amazon / Flipkart Style Buy Buttons) */}
          <div 
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '26px' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#0f172a' }}>Quantity:</label>
              <div className="qty-counter" style={{ background: '#ffffff', opacity: isOutOfStock ? 0.5 : 1 }}>
                <button
                  className="btn-qty"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  style={{
                    width: '34px',
                    height: '34px',
                    fontSize: '1.1rem',
                    cursor: (quantity <= 1 || isOutOfStock) ? 'not-allowed' : 'pointer'
                  }}
                  title="Decrease quantity"
                >
                  -
                </button>
                <span className="qty-value" style={{ minWidth: '36px', textAlign: 'center', fontWeight: '800' }}>
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  className="btn-qty"
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  disabled={quantity >= maxStock || isOutOfStock}
                  style={{
                    width: '34px',
                    height: '34px',
                    fontSize: '1.1rem',
                    cursor: (quantity >= maxStock || isOutOfStock) ? 'not-allowed' : 'pointer',
                    opacity: (quantity >= maxStock || isOutOfStock) ? 0.4 : 1
                  }}
                  title={quantity >= maxStock ? `Only ${maxStock} in stock` : 'Increase quantity'}
                >
                  +
                </button>
              </div>

              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Subtotal: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{formatPrice(product.price * (isOutOfStock ? 0 : quantity))}</strong>
              </span>

              {quantity >= maxStock && !isOutOfStock && (
                <span style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: '700', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '4px' }}>
                  Max limit reached ({maxStock} in stock)
                </span>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              <button
                className="btn-hero-clean"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  padding: '12px 18px',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  opacity: isOutOfStock ? 0.5 : 1,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                }}
                id="btn-pdp-add-cart"
              >
                <ShoppingCart size={18} />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                style={{
                  background: isOutOfStock ? '#94a3b8' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  padding: '12px 18px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'opacity 0.2s ease',
                  opacity: isOutOfStock ? 0.5 : 1
                }}
                id="btn-pdp-buy-now"
              >
                <Zap size={18} style={{ color: '#fbbf24' }} />
                <span>{isOutOfStock ? 'Unavailable' : 'Buy Now'}</span>
              </button>
            </div>

            {/* WhatsApp Instant Order Button */}
            {!isOutOfStock && (
              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '100%',
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  color: '#166534',
                  borderRadius: '10px',
                  padding: '10px',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                id="btn-pdp-whatsapp"
              >
                <MessageCircle size={18} style={{ color: '#16a34a' }} />
                <span>Instant WhatsApp Order ({formatPrice(product.price * quantity)})</span>
              </a>
            )}

            {/* Trust Badges */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px', textAlign: 'center' }}>
              <div>
                <ShieldCheck size={18} style={{ color: '#16a34a', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block' }}>100% Genuine</span>
              </div>
              <div>
                <RotateCcw size={18} style={{ color: '#0284c7', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block' }}>Workshop Tested</span>
              </div>
              <div>
                <Award size={18} style={{ color: '#eab308', margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: '700', display: 'block' }}>Official Warranty</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Product Overview
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: 0 }}>
              {product.description}
            </p>
          </div>

          {/* Features Highlights Bullet Points */}
          {product.features && product.features.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
                Key Highlights & Features
              </h3>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {product.features.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    <CheckCircle2 size={16} style={{ color: '#ea580c', flexShrink: 0, marginTop: 2 }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Specifications Removed for Clean Layout */}
        </div>
      </div>

      {/* ================= BOTTOM SECTION: RELATED PRODUCTS IN CATEGORY ================= */}
      <section style={{ marginTop: '54px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ea580c', fontWeight: '800', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={14} /> Similar Equipment in this Category
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginTop: '2px' }}>
              Related {categoryLabel} Tools
            </h2>
          </div>

          <Link
            to={`/shop?category=${encodeURIComponent(product.category || '')}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.86rem',
              fontWeight: '700',
              color: '#ea580c',
              textDecoration: 'none'
            }}
          >
            <span>View All in {categoryLabel}</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {relatedProducts.length === 0 ? (
          <div 
            style={{ 
              background: '#f8fafc', 
              border: '1px dashed #cbd5e1', 
              borderRadius: '14px', 
              padding: '36px 20px', 
              textAlign: 'center',
              color: '#64748b' 
            }}
          >
            <Package size={32} style={{ color: '#94a3b8', margin: '0 auto 10px', display: 'block' }} />
            <p style={{ margin: 0, fontWeight: '600' }}>This is the premier model in this category.</p>
            <Link to="/shop" style={{ color: '#ea580c', fontSize: '0.86rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
              Explore full equipment catalog →
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {relatedProducts.slice(0, 4).map((relProd) => (
              <ProductCard
                key={relProd.id || relProd._id}
                product={relProd}
                onSelectProduct={(p) => navigate(`/product/${p.id || p._id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
