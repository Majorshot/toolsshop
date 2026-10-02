import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Wrench,
  Package,
  Phone,
  MessageCircle,
  Navigation,
  Sparkles,
  BatteryCharging,
  Disc,
  Hammer,
  Wind,
  Grid,
  Zap,
  Tag,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import AnimatedContent from '../components/AnimatedContent';
import CourierLogo from '../components/CourierLogo';
import { COURIER_PARTNERS } from '../utils/courierPartners';
import { api } from '../services/api';

// Helper to assign a relevant icon to any dynamic category
const getCategoryIcon = (catId = '', catName = '') => {
  const str = `${catId} ${catName}`.toLowerCase();
  if (str.includes('washer') || str.includes('blower')) return Wind;
  if (str.includes('grind') || str.includes('cutter')) return Disc;
  if (str.includes('hammer') || str.includes('drill')) return Hammer;
  if (str.includes('cordless') || str.includes('battery')) return BatteryCharging;
  if (str.includes('wood') || str.includes('saw') || str.includes('plane')) return Wrench;
  if (str.includes('weld')) return Zap;
  return Sparkles;
};

const DEFAULT_CATEGORIES = [
  { id: 'cordless', name: 'Cordless Tools' },
  { id: 'grinders-cutters', name: 'Grinders & Cutters' },
  { id: 'hammers', name: 'Hammer Drills' },
  { id: 'woodworking', name: 'Woodworking' },
  { id: 'washers-blowers', name: 'Washers & Blowers' }
];

export const HomePage = ({ products = [], onSelectProduct }) => {
  const navigate = useNavigate();
  const featuredTools = products.slice(0, 8);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const categoryScrollRef = useRef(null);

  // Always reset scroll position to first card on mount and when categories/products update
  useEffect(() => {
    const resetScrollToFirst = () => {
      if (categoryScrollRef.current) {
        categoryScrollRef.current.scrollTo({ left: 0, behavior: 'instant' });
      }
    };

    resetScrollToFirst();
    const t1 = setTimeout(resetScrollToFirst, 50);
    const t2 = setTimeout(resetScrollToFirst, 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [categories, products.length]);

  // Fetch categories & brands that owner created/added in portal (dynamic backend taxonomy)
  useEffect(() => {
    api.getTaxonomy()
      .then(res => {
        if (res && res.categories) {
          // Exclude 'all' if present
          const valid = res.categories.filter(c => c.id !== 'all');
          if (valid.length > 0) {
            setCategories(valid);
          }
        }
        if (res && res.brands && res.brands.length > 0) {
          setBrands(res.brands);
        }
      })
      .catch(err => console.error("Error fetching portal taxonomy:", err));
  }, []);

  // Dynamic brands from backend taxonomy with fallback to catalog products
  const displayBrands = (brands && brands.length > 0)
    ? brands
    : Array.from(new Set((products || []).map(p => p.brand).filter(Boolean)));


  // Real products from backend for hero section (no hardcoded data)
  const heroProducts = (products && products.length > 0)
    ? products.filter(p => p.image).slice(0, 5)
    : [];

  // Auto-cycle through hero products every 4.8 seconds
  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % heroProducts.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const currentProduct = heroProducts[activeSlide % (heroProducts.length || 1)] || products[0];

  // Mobile Touch Swipe Handlers for Hero Carousel
  const heroTouchStartX = useRef(0);
  const heroTouchEndX = useRef(0);

  const handleHeroTouchStart = (e) => {
    heroTouchStartX.current = e.touches[0].clientX;
  };

  const handleHeroTouchMove = (e) => {
    heroTouchEndX.current = e.touches[0].clientX;
  };

  const handleHeroTouchEnd = () => {
    const diff = heroTouchStartX.current - heroTouchEndX.current;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        // Swiped left -> next slide
        setActiveSlide(prev => (prev + 1) % heroProducts.length);
      } else {
        // Swiped right -> prev slide
        setActiveSlide(prev => (prev - 1 + heroProducts.length) % heroProducts.length);
      }
    }
  };

  const handleScrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Prepare category cards data using real product images from backend,
  // ONLY including categories that actually have at least 1 product uploaded
  const categoryCardsData = useMemo(() => {
    if (!products || products.length === 0) return [];

    const result = [];
    const seenCatIds = new Set();

    // 1. First prioritize taxonomy categories that have at least 1 product
    (categories || []).forEach(cat => {
      const matchingProducts = products.filter(p => p.category === cat.id);
      if (matchingProducts.length > 0 && !seenCatIds.has(cat.id)) {
        seenCatIds.add(cat.id);
        const matchingProductWithImg = matchingProducts.find(p => p.image || p.images?.[0]) || matchingProducts[0];
        result.push({
          id: cat.id,
          name: cat.name || cat.id,
          image: matchingProductWithImg?.image || matchingProductWithImg?.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
          count: matchingProducts.length,
          icon: getCategoryIcon(cat.id, cat.name)
        });
      }
    });

    // 2. Also include any categories present in products that weren't in taxonomy
    products.forEach(p => {
      if (p.category && !seenCatIds.has(p.category)) {
        seenCatIds.add(p.category);
        const matchingProducts = products.filter(item => item.category === p.category);
        const matchingProductWithImg = matchingProducts.find(item => item.image || item.images?.[0]) || matchingProducts[0];
        const formattedName = p.category
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        result.push({
          id: p.category,
          name: formattedName,
          image: matchingProductWithImg?.image || matchingProductWithImg?.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
          count: matchingProducts.length,
          icon: getCategoryIcon(p.category, formattedName)
        });
      }
    });

    return result;
  }, [categories, products]);

  // Format long product names so hero title stays clean and never exceeds ~3 lines
  const formatHeroProductName = (name = '') => {
    if (!name) return '';
    return name.length > 82 ? `${name.slice(0, 79).trim()}...` : name;
  };

  return (
    <div className="home-page-root">
      {/* SECTION 1: Vibrant Commercial Ad Hero Banner */}
      {currentProduct && (
        <section
          className="hero-ad-banner"
          onTouchStart={handleHeroTouchStart}
          onTouchMove={handleHeroTouchMove}
          onTouchEnd={handleHeroTouchEnd}
        >
          {/* Ambient Lighting Flares */}
          <div className="hero-flare hero-flare-1" />
          <div className="hero-flare hero-flare-2" />

          <div className="hero-ad-container">
            {/* Top Ad Banner Header Bar */}
            <div className="hero-ad-header">
              <div className="hero-ad-top-pill">
                <Flame size={14} className="hero-ad-flame" />
                <span>VARIATHU POWER TOOLS • KOZHENCHERRY</span>
                <span className="hero-ad-dot">•</span>
                <span className="hero-ad-highlight">DIRECT STORE PRICING</span>
              </div>
              <h1 className="hero-ad-headline">
                Heavy Duty Power Tools at <span className="hero-highlight-yellow">Affordable Direct Prices</span>
              </h1>
              <p className="hero-ad-subtext">
                Authorized showroom for IBELL, Bosch, DongCheng & Makita. Delivering genuine equipment directly to your doorstep across Kerala!
              </p>
            </div>

            {/* Ad Content Grid: Left Product Deal Card, Right All Kerala Delivery & Affordable Price Showcase */}
            <div className="hero-ad-grid">
              {/* Product Deal Spotlight Card (Clean White Surface to avoid square image clash) */}
              <div className="hero-deal-card">
                <div className="hero-deal-card-header">
                  <div className="hero-deal-badge">
                    <span className="hero-deal-icon">⚡</span>
                    <span>TODAY'S SPECIAL DEAL</span>
                  </div>
                  {currentProduct.brand && (
                    <span className="hero-deal-brand">{currentProduct.brand.toUpperCase()}</span>
                  )}
                  {heroProducts.length > 1 && (
                    <span className="hero-deal-counter">{activeSlide + 1} / {heroProducts.length}</span>
                  )}
                </div>

                {/* Product Photo Stage */}
                <Link
                  to={`/product/${currentProduct.id || currentProduct._id}`}
                  className="hero-deal-img-link"
                  title={currentProduct.name}
                >
                  <img
                    src={currentProduct.image || currentProduct.images?.[0]}
                    alt={currentProduct.name}
                    className="hero-deal-img"
                    key={currentProduct.id || currentProduct._id}
                  />
                </Link>

                {/* Product Title */}
                <h2 className="hero-deal-title">
                  {currentProduct.name}
                </h2>

                {/* Affordable Price Block */}
                <div className="hero-deal-pricing">
                  <div className="hero-deal-prices">
                    <span className="hero-deal-price-current">
                      ₹{currentProduct.price?.toLocaleString('en-IN')}
                    </span>
                    {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                      <span className="hero-deal-price-mrp">
                        MRP ₹{currentProduct.originalPrice?.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price ? (
                    <span className="hero-deal-savings-tag">
                      SAVE ₹{(currentProduct.originalPrice - currentProduct.price).toLocaleString('en-IN')} (
                      {currentProduct.discount || `${Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)}% OFF`}
                      )
                    </span>
                  ) : (
                    <span className="hero-deal-direct-tag">
                      Affordable Direct Price
                    </span>
                  )}
                </div>

                {/* Fast Action Buttons */}
                <div className="hero-deal-actions">
                  <Link
                    to={`/product/${currentProduct.id || currentProduct._id}`}
                    className="hero-deal-btn-buy"
                    id="hero-buy-now-btn"
                  >
                    <ShoppingCart size={18} />
                    <span>BUY NOW</span>
                    <ArrowRight size={17} />
                  </Link>

                  <a
                    href={`https://wa.me/919447559333?text=${encodeURIComponent(`Hello Variathu Power Tools Kozhencherry, I want to purchase *${currentProduct.name}* (Special Offer: ₹${currentProduct.price}). Is this in stock for delivery?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-deal-btn-wa"
                    id="hero-whatsapp-btn"
                    title="Order on WhatsApp"
                  >
                    <MessageCircle size={18} />
                    <span>ORDER ON WHATSAPP</span>
                  </a>
                </div>

                {/* Deal Carousel Arrows & Dots */}
                {heroProducts.length > 1 && (
                  <div className="hero-deal-nav">
                    <button
                      type="button"
                      className="hero-deal-arrow"
                      onClick={() => setActiveSlide(prev => (prev - 1 + heroProducts.length) % heroProducts.length)}
                      aria-label="Previous Deal"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="hero-deal-dots">
                      {heroProducts.map((_, idx) => (
                        <button
                          key={idx}
                          className={`hero-deal-dot ${activeSlide === idx ? 'active' : ''}`}
                          onClick={() => setActiveSlide(idx)}
                          aria-label={`Deal ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      className="hero-deal-arrow"
                      onClick={() => setActiveSlide(prev => (prev + 1) % heroProducts.length)}
                      aria-label="Next Deal"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: All Kerala Delivery Box & Affordable Pricing Pillars */}
              <div className="hero-ad-sidebar">
                {/* 1. All Kerala Doorstep Delivery Box with Partner Logos */}
                <div className="hero-kerala-delivery-card">
                  <div className="hero-delivery-badge-row">
                    <div className="hero-delivery-icon-circle">
                      <Truck size={22} />
                    </div>
                    <div>
                      <div className="hero-delivery-lead">ALL KERALA DOORSTEP DELIVERY</div>
                      <div className="hero-delivery-sub">Express safe delivery across all 14 districts</div>
                    </div>
                  </div>

                  {/* Delivery Partner Logos Row */}
                  <div className="hero-delivery-partners-grid">
                    {COURIER_PARTNERS.map(partner => (
                      <div key={partner.id} className="hero-partner-badge" title={partner.tagline || partner.name}>
                        <CourierLogo partner={partner} size="sm" showName={false} bordered={false} />
                        <span className="hero-partner-label">{partner.shortName || partner.name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="hero-delivery-perks-list">
                    <div className="hero-delivery-perk">
                      <CheckCircle2 size={15} className="hero-check-icon" />
                      <span>Live Courier AWB Tracking Provided</span>
                    </div>
                    <div className="hero-delivery-perk">
                      <CheckCircle2 size={15} className="hero-check-icon" />
                      <span>Heavy Machinery & Parcel Transport</span>
                    </div>
                  </div>
                </div>

                {/* 2. Affordable Pricing & Genuine Guarantee Badges */}
                <div className="hero-ad-pillars">
                  <div className="hero-pillar-item">
                    <div className="hero-pillar-icon">💰</div>
                    <div className="hero-pillar-text">
                      <div className="hero-pillar-title">Affordable Pricing</div>
                      <div className="hero-pillar-desc">Direct showroom wholesale rates, no middleman markup</div>
                    </div>
                  </div>

                  <div className="hero-pillar-item">
                    <div className="hero-pillar-icon">🛡️</div>
                    <div className="hero-pillar-text">
                      <div className="hero-pillar-title">100% Genuine Tools</div>
                      <div className="hero-pillar-desc">Official Kerala GST Tax Invoice & manufacturer warranty</div>
                    </div>
                  </div>

                  <div className="hero-pillar-item">
                    <div className="hero-pillar-icon">📍</div>
                    <div className="hero-pillar-text">
                      <div className="hero-pillar-title">Direct Counter Pickup</div>
                      <div className="hero-pillar-desc">Poyanil Building, Kozhencherry — ready for instant trial</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Page Content Inside Container */}
      <div className="container">
        {/* SECTION 2: Horizontal Category Cards (Only shown when there are categories with products) */}
        {categoryCardsData.length > 0 && (
          <section className="categories-horizontal-section">
            <AnimatedContent distance={40} delay={0.08}>
              <div className="categories-header-row">
                <div>
                  <div className="categories-section-badge">
                    <Sparkles size={13} />
                    <span>AUTHORIZED CATEGORIES</span>
                  </div>
                  <h2 className="categories-section-title">
                    Shop by Category
                  </h2>
                  <p className="categories-section-sub">
                    Explore specialized power tool lines configured directly from our store catalog
                  </p>
                </div>

                <div className="categories-scroll-buttons">
                  <button
                    type="button"
                    className="btn-category-arrow"
                    onClick={() => handleScrollCategories('left')}
                    aria-label="Scroll Categories Left"
                    title="Previous Categories"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-category-arrow"
                    onClick={() => handleScrollCategories('right')}
                    aria-label="Scroll Categories Right"
                    title="Next Categories"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </AnimatedContent>

            {/* Horizontal Track with Full-Background Category Cards */}
            <AnimatedContent distance={50} delay={0.2}>
              <div className="categories-horizontal-track no-scrollbar" ref={categoryScrollRef}>
                {categoryCardsData.map(cat => (
                  <Link
                    key={cat.id}
                    to={`/shop?category=${cat.id}`}
                    className="category-full-card"
                    id={`cat-card-${cat.id}`}
                  >
                    {/* Product Image as Full Background */}
                    <img src={cat.image} alt={cat.name} className="cat-card-full-bg" />
                    <div className="cat-card-full-scrim" />

                    {/* Top Category Icon Badge */}
                    <div className="cat-card-top-badge">
                      <cat.icon size={16} />
                    </div>

                    {/* Bottom Overlay: Category Name & Button */}
                    <div className="cat-card-bottom-overlay">
                      <span className="cat-card-overlay-count">
                        {cat.count > 0 ? `${cat.count} ${cat.count === 1 ? 'Tool' : 'Tools'} in Catalog` : 'Authorized Category'}
                      </span>
                      <h3 className="cat-card-overlay-name">{cat.name}</h3>
                      <div className="cat-card-overlay-btn">
                        <span>Shop Now</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Final Card: View All Categories */}
                <Link
                  to="/shop"
                  className="category-full-card category-full-card-all"
                  id="cat-card-view-all"
                >
                  <div className="cat-card-all-bg-glow" />
                  <div className="cat-card-all-inner">
                    <div className="cat-card-all-icon">
                      <Grid size={26} />
                    </div>
                    <span className="cat-card-overlay-count" style={{ color: '#facc15' }}>
                      FULL SHOWROOM
                    </span>
                    <h3 className="cat-card-overlay-name" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                      View All Categories
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                      Browse our complete catalog of {products.length}+ power tools & genuine spares
                    </p>
                    <div className="cat-card-overlay-btn cat-card-all-btn">
                      <span>Open Full Shop</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </div>
            </AnimatedContent>
          </section>
        )}


        {/* Featured Bestsellers Section (Only shown when products exist) */}
        {featuredTools.length > 0 && (
          <section style={{ marginBottom: '48px' }}>
            <AnimatedContent distance={30} delay={0.08}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
                    Featured & Trending Equipment
                  </h2>
                  <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                    Handpicked professional tools favored by Kerala contractors and workshops
                  </p>
                </div>

                <Link
                  to="/shop"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    color: 'var(--brand-primary)',
                    textDecoration: 'none'
                  }}
                >
                  <span>View Full Catalog</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedContent>

            <div className="product-grid">
              {featuredTools.map((product, idx) => (
                <AnimatedContent
                  key={product.id || product._id || idx}
                  distance={40}
                  delay={idx * 0.06}
                  duration={0.7}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <ProductCard
                    product={product}
                    onSelectProduct={onSelectProduct}
                  />
                </AnimatedContent>
              ))}
            </div>

            <AnimatedContent distance={20} delay={0.15}>
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <Link to="/shop" className="btn-hero-secondary" style={{ padding: '12px 32px' }}>
                  <span>Explore All {products.length}+ Tools in Shop</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedContent>
          </section>
        )}

        {/* Why Choose Variathu */}
        <section style={{ marginBottom: '48px' }}>
          <AnimatedContent distance={30} delay={0.08}>
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 28px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                The Variathu Advantage
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
                Serving tradesmen, contractors, and DIY woodworkers across Pathanamthitta district
              </p>
            </div>
          </AnimatedContent>

          <div className="about-features-grid">
            <AnimatedContent distance={40} delay={0.1}>
              <div className="about-feature-card">
                <div className="about-feature-icon">
                  <ShieldCheck size={22} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  100% Genuine Guarantee
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Direct factory sourcing from Bosch India, Makita, and DeWalt. Every unit carries authentic serial numbers and official warranties.
                </p>
              </div>
            </AnimatedContent>

            <AnimatedContent distance={40} delay={0.2}>
              <div className="about-feature-card">
                <div className="about-feature-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                  <Wrench size={22} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  In-House Service Clinic
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  We do not outsource repairs. Our Poyanil Junction shop houses expert armature rewinding, switch replacements, and genuine carbon brushes.
                </p>
              </div>
            </AnimatedContent>

            <AnimatedContent distance={40} delay={0.3}>
              <div className="about-feature-card">
                <div className="about-feature-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
                  <Package size={22} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  Store Pickup & Delivery
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5 }}>
                  Pick up ready orders within 1 hour at Poyanil Building, Kozhencherry, or opt for speed courier delivery across all 14 Kerala districts.
                </p>
              </div>
            </AnimatedContent>
          </div>
        </section>

        {/* Kozhencherry Store Location Section */}
        <AnimatedContent distance={40} delay={0.1}>
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px 24px',
              marginBottom: '40px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.76rem', color: 'var(--brand-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Visit Our Shop in Kozhencherry
                </span>
                <div style={{ margin: '8px 0 10px' }}>
                  <img
                    src="/Logo.jpeg"
                    alt="Variathu Power Tools"
                    style={{ height: '36px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
                  />
                </div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, maxWidth: '520px' }}>
                  Poyanil Building, Near St Thomas Higher Secondary School Ground,<br />
                  Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                <a
                  href="tel:+919447559333"
                  className="btn-hero-secondary"
                  style={{ fontSize: '0.86rem', padding: '10px 18px' }}
                >
                  <Phone size={15} style={{ color: 'var(--brand-primary)' }} />
                  <span>Call +91 94475 59333</span>
                </a>

                <a
                  href="https://wa.me/919447559333?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20am%20heading%20to%20your%20shop%20at%20Poyanil%20Junction."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hero-secondary"
                  style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontSize: '0.86rem', padding: '10px 18px' }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Us</span>
                </a>

                <a
                  href="https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hero-clean"
                  style={{ fontSize: '0.86rem', padding: '10px 18px' }}
                >
                  <Navigation size={15} />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          </section>
        </AnimatedContent>
      </div>
    </div>
  );
};
