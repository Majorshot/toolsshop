import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ShoppingCart, MessageCircle, ShieldCheck, Wrench, CheckCircle, CheckCircle2, 
  Package, Truck, Zap, ArrowLeft, ChevronRight, ChevronLeft, Share2, Award, 
  RotateCcw, MapPin, Check, Heart, Eye, Sparkles, Layers, Maximize2, ZoomIn, ZoomOut, Camera, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // Full Screen Lightbox & Mobile Slider state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [fullScreenIdx, setFullScreenIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const mobileSliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

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

  // Live in-cart quantity
  const cartItem = cart?.find(
    item => item.id === product?.id ||
            item.id === id ||
            String(item._id) === String(product?._id) ||
            String(item.id) === String(id)
  );
  const inCartQty = cartItem ? cartItem.quantity : 0;

  // Sync quantity with in-cart count when product is in cart
  useEffect(() => {
    if (inCartQty > 0) {
      setQuantity(inCartQty);
    }
  }, [inCartQty]);

  const handleIncreaseQty = () => {
    if (isOutOfStock) return;
    const targetQty = Math.min(maxStock, quantity + 1);
    if (targetQty === quantity) return;
    setQuantity(targetQty);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    if (inCartQty > 0 && product) {
      updateQuantity(product.id || id, targetQty);
    }
  };

  const handleDecreaseQty = () => {
    if (isOutOfStock) return;
    if (quantity <= 1) {
      if (inCartQty > 0 && product) {
        removeFromCart(product.id || id);
        setQuantity(1);
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
      }
      return;
    }
    const targetQty = quantity - 1;
    setQuantity(targetQty);
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
    if (inCartQty > 0 && product) {
      updateQuantity(product.id || id, targetQty);
    }
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    if (inCartQty > 0) {
      navigate('/cart');
      return;
    }
    const safeQty = Math.max(1, Math.min(quantity, maxStock));
    addToCart(product, safeQty);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    if (inCartQty === 0) {
      const safeQty = Math.max(1, Math.min(quantity, maxStock));
      addToCart(product, safeQty);
    }
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

  const rawGallery = Array.isArray(product?.images) && product.images.length > 0
    ? product.images.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean)
    : (product?.image ? [product.image] : []);
  const galleryImages = rawGallery.length > 0 
    ? rawGallery 
    : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'];

  const openFullScreen = (index = 0) => {
    setFullScreenIdx(index);
    setIsZoomed(false);
    setIsFullScreenOpen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreenOpen(false);
    setIsZoomed(false);
  };

  const nextFullScreenImage = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setFullScreenIdx((prev) => (prev + 1) % galleryImages.length);
  };

  const prevFullScreenImage = (e) => {
    if (e) e.stopPropagation();
    setIsZoomed(false);
    setFullScreenIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // Keyboard navigation & body scroll lock for full screen modal
  useEffect(() => {
    if (isFullScreenOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') closeFullScreen();
        if (e.key === 'ArrowRight') nextFullScreenImage();
        if (e.key === 'ArrowLeft') prevFullScreenImage();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isFullScreenOpen, galleryImages.length]);

  // Handle scroll on mobile swipe slider to update active indicator
  const handleMobileSliderScroll = () => {
    if (!mobileSliderRef.current) return;
    const { scrollLeft, clientWidth } = mobileSliderRef.current;
    if (clientWidth > 0) {
      const newIdx = Math.round(scrollLeft / clientWidth);
      if (newIdx !== activeImgIdx && newIdx >= 0 && newIdx < galleryImages.length) {
        setActiveImgIdx(newIdx);
      }
    }
  };

  // Scroll mobile slider programmatically when dot/thumbnail tapped
  const scrollToSlide = (idx) => {
    setActiveImgIdx(idx);
    if (mobileSliderRef.current) {
      const clientWidth = mobileSliderRef.current.clientWidth;
      mobileSliderRef.current.scrollTo({
        left: idx * clientWidth,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextFullScreenImage();
      } else {
        prevFullScreenImage();
      }
    }
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
      <div className="product-detail-card">
        {/* ================= LEFT COLUMN: PRODUCT GALLERY ================= */}
        <div className="product-gallery-col">
          {/* 1. MOBILE SWIPEABLE CAROUSEL (Amazon & Flipkart Style on Mobile) */}
          <div className="mobile-product-gallery">
            <div className="mobile-slider-wrapper">
              <div
                className="mobile-slider-track no-scrollbar"
                ref={mobileSliderRef}
                onScroll={handleMobileSliderScroll}
              >
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="mobile-slide-item"
                    onClick={() => openFullScreen(idx)}
                    title="Tap to view full screen"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="mobile-slide-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Badges on mobile slider */}
              {product.cordless && (
                <span className="gallery-badge-cordless">
                  <Zap size={11} /> Cordless 20V
                </span>
              )}

              {/* Action button on mobile slider */}
              <div className="gallery-top-right-actions">
                <button
                  type="button"
                  onClick={() => openFullScreen(activeImgIdx)}
                  className="gallery-action-circle-btn"
                  title="View full screen"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Image counter pill (Amazon/Flipkart style) */}
              <div className="mobile-gallery-counter-pill">
                <Camera size={11} />
                <span>{activeImgIdx + 1} / {galleryImages.length}</span>
              </div>
            </div>

            {/* Pagination dots (Flipkart style) */}
            {galleryImages.length > 1 && (
              <div className="mobile-gallery-dots">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    className={`mobile-slider-dot ${activeImgIdx === idx ? 'active' : ''}`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Tap to expand hint */}
            <div
              className="tap-to-expand-hint"
              onClick={() => openFullScreen(activeImgIdx)}
            >
              <Maximize2 size={12} />
              <span>Tap image to view full screen</span>
            </div>
          </div>

          {/* 2. DESKTOP GALLERY (Flipkart Vertical Strip + Stage Preview on >= 768px) */}
          <div className="desktop-product-gallery">
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row-reverse' }}>
              {/* Main Stage Image */}
              <div
                className="desktop-main-stage"
                onClick={() => openFullScreen(activeImgIdx)}
                title="Click to view full screen"
              >
                <img
                  src={galleryImages[activeImgIdx] || product.image}
                  alt={product.name}
                  id="main-product-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                {/* Badges */}
                {product.cordless && (
                  <span className="gallery-badge-cordless">
                    <Zap size={12} /> Cordless 20V XR
                  </span>
                )}

                {/* Top action button */}
                <div className="gallery-top-right-actions">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openFullScreen(activeImgIdx); }}
                    className="gallery-action-circle-btn"
                    title="View full screen"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>

                <div className="desktop-expand-badge">
                  <Maximize2 size={12} />
                  <span>Click to zoom</span>
                </div>
              </div>

              {/* Thumbnail Strip (Flipkart style on left) */}
              {galleryImages.length > 1 && (
                <div className="desktop-thumbnails-strip">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImgIdx(idx)}
                      onMouseEnter={() => setActiveImgIdx(idx)}
                      className={`desktop-thumb-btn ${activeImgIdx === idx ? 'active' : ''}`}
                      title={`View photo ${idx + 1}`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
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
            {/* Quantity Selector & Live Cart Sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: '700' }}>Quantity:</span>
                <div className="qty-counter">
                  <button
                    className="btn-qty"
                    onClick={handleDecreaseQty}
                    disabled={(quantity <= 1 && inCartQty === 0) || isOutOfStock}
                    style={{
                      width: '34px',
                      height: '34px',
                      fontSize: '1.1rem',
                      cursor: ((quantity <= 1 && inCartQty === 0) || isOutOfStock) ? 'not-allowed' : 'pointer'
                    }}
                    title={inCartQty > 0 && quantity <= 1 ? "Remove from cart" : "Decrease quantity"}
                    id="btn-pdp-qty-minus"
                  >
                    -
                  </button>
                  <span className="qty-value" style={{ minWidth: '36px', textAlign: 'center', fontWeight: '800' }}>
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    className="btn-qty"
                    onClick={handleIncreaseQty}
                    disabled={quantity >= maxStock || isOutOfStock}
                    style={{
                      width: '34px',
                      height: '34px',
                      fontSize: '1.1rem',
                      cursor: (quantity >= maxStock || isOutOfStock) ? 'not-allowed' : 'pointer',
                      opacity: (quantity >= maxStock || isOutOfStock) ? 0.4 : 1
                    }}
                    title={quantity >= maxStock ? `Only ${maxStock} in stock` : 'Increase quantity'}
                    id="btn-pdp-qty-plus"
                  >
                    +
                  </button>
                </div>
              </div>

              <span style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Subtotal: <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{formatPrice(product.price * (isOutOfStock ? 0 : quantity))}</strong>
              </span>

              {inCartQty > 0 && (
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#16a34a',
                    fontWeight: '800',
                    background: '#f0fdf4',
                    border: '1.5px solid #86efac',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Currently in your cart"
                  id="pdp-in-cart-status"
                >
                  <CheckCircle size={13} />
                  <span>{inCartQty} in Cart (Live)</span>
                </span>
              )}

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
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  background: inCartQty > 0 ? '#16a34a' : undefined,
                  borderColor: inCartQty > 0 ? '#16a34a' : undefined
                }}
                id="btn-pdp-add-cart"
              >
                {inCartQty > 0 ? (
                  <>
                    <CheckCircle size={18} />
                    <span>In Cart ({inCartQty}) • View Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                  </>
                )}
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

      {/* ================= FULL SCREEN IMAGE VIEWER MODAL (LIGHTBOX) ================= */}
      {isFullScreenOpen && (
        <div
          className="fullscreen-image-modal-overlay"
          onClick={closeFullScreen}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div className="fullscreen-modal-header" onClick={(e) => e.stopPropagation()}>
            <div className="fullscreen-header-title">
              <span className="fullscreen-brand">{product.brand}</span>
              <span className="fullscreen-prod-name">{product.name}</span>
            </div>

            <div className="fullscreen-header-controls">
              <span className="fullscreen-counter">
                {fullScreenIdx + 1} / {galleryImages.length}
              </span>

              <button
                type="button"
                className="fullscreen-ctrl-btn"
                onClick={() => setIsZoomed(!isZoomed)}
                title={isZoomed ? "Reset Zoom" : "Zoom In"}
              >
                {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              </button>

              <button
                type="button"
                className="fullscreen-close-btn"
                onClick={closeFullScreen}
                title="Close Fullscreen (Esc)"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Main Stage Image in Full Screen */}
          <div
            className="fullscreen-stage-container"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeFullScreen();
            }}
          >
            {galleryImages.length > 1 && (
              <button
                type="button"
                className="fullscreen-nav-arrow fullscreen-nav-prev"
                onClick={prevFullScreenImage}
                title="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            <div
              className={`fullscreen-img-wrapper ${isZoomed ? 'zoomed' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
              title={isZoomed ? "Click to reset zoom" : "Click to zoom in"}
            >
              <img
                src={galleryImages[fullScreenIdx]}
                alt={`${product.name} full view`}
                className="fullscreen-active-img"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {galleryImages.length > 1 && (
              <button
                type="button"
                className="fullscreen-nav-arrow fullscreen-nav-next"
                onClick={nextFullScreenImage}
                title="Next image"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="fullscreen-bottom-strip no-scrollbar" onClick={(e) => e.stopPropagation()}>
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsZoomed(false);
                    setFullScreenIdx(idx);
                  }}
                  className={`fullscreen-strip-thumb ${fullScreenIdx === idx ? 'active' : ''}`}
                  title={`View photo ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

