import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
  Tag
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
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

export const HomePage = ({ products = [], onSelectProduct }) => {
  const navigate = useNavigate();
  const featuredTools = products.slice(0, 8);
  const [categories, setCategories] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const categoryScrollRef = useRef(null);

  // Fetch categories that owner created/added in portal (same taxonomy as ShopPage filter)
  useEffect(() => {
    api.getTaxonomy()
      .then(res => {
        if (res && res.categories) {
          // Exclude 'all' if present, and show only 4-5 categories as requested
          const valid = res.categories.filter(c => c.id !== 'all');
          setCategories(valid.slice(0, 5));
        }
      })
      .catch(err => console.error("Error fetching portal taxonomy:", err));
  }, []);

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

  const handleScrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      categoryScrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  // Prepare category cards data using real product images from backend
  const categoryCardsData = categories.map(cat => {
    const matchingProduct = products.find(p => p.category === cat.id && (p.image || p.images?.[0]));
    const count = products.filter(p => p.category === cat.id).length;
    const IconComponent = getCategoryIcon(cat.id, cat.name);
    return {
      id: cat.id,
      name: cat.name,
      image: matchingProduct?.image || matchingProduct?.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
      count,
      icon: IconComponent
    };
  });

  // Format long product names so hero title stays clean and never exceeds ~3 lines
  const formatHeroProductName = (name = '') => {
    if (!name) return '';
    return name.length > 82 ? `${name.slice(0, 79).trim()}...` : name;
  };

  return (
    <div className="home-page-root">
      {/* SECTION 1: Full Widescreen Real Product Banner from Backend */}
      {currentProduct && (
        <section className="hero-widescreen-section">
          <div className="hero-widescreen-slider">
            {heroProducts.map((p, idx) => (
              <div
                key={p.id || p._id || idx}
                className={`hero-widescreen-slide ${activeSlide === idx ? 'active' : ''}`}
              >
                <div className="hero-widescreen-img-wrap">
                  <img
                    src={p.image || p.images?.[0]}
                    alt={p.name}
                    className="hero-widescreen-img"
                  />
                </div>
                <div className="hero-widescreen-scrim" />
              </div>
            ))}

            {/* Left 50% Content on Solid Black Side */}
            <div className="hero-widescreen-left-content">
              <h1 className="hero-widescreen-title" title={currentProduct.name}>
                {formatHeroProductName(currentProduct.name)}
              </h1>

              <p className="hero-widescreen-subtext">
                {currentProduct.description
                  ? (currentProduct.description.length > 155 ? currentProduct.description.slice(0, 155) + '...' : currentProduct.description)
                  : 'Certified heavy-duty machinery with official factory warranty & dedicated in-house clinic repair support.'}
              </p>

              <div className="hero-widescreen-actions">
                <Link to="/shop" className="hero-widescreen-cta-btn" id="home-widescreen-open-shop-btn">
                  <span>Open Shop Page</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to={`/product/${currentProduct.id || currentProduct._id}`}
                  className="hero-inspect-product-btn"
                  id="home-inspect-current-tool-btn"
                >
                  <span>View • ₹{currentProduct.price?.toLocaleString('en-IN')}</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Bottom-Right / Slide Controls & Live Product Preview */}
            {heroProducts.length > 1 && (
              <div className="hero-widescreen-controls">
                <div className="hero-widescreen-dots">
                  {heroProducts.map((p, idx) => (
                    <button
                      key={p.id || p._id || idx}
                      className={`hero-widescreen-dot-btn ${activeSlide === idx ? 'active' : ''}`}
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      title={p.name}
                    />
                  ))}
                </div>

                <div className="hero-widescreen-slide-preview">
                  <span className="hero-widescreen-slide-tag">
                    {currentProduct.brand} • ₹{currentProduct.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="hero-widescreen-slide-title">
                    {currentProduct.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Page Content Inside Container */}
      <div className="container">
        {/* SECTION 2: Horizontal Category Cards (Full Image Background + Bottom Name & Button) */}
        <section className="categories-horizontal-section">
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

          {/* Horizontal Track with Full-Background Category Cards */}
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
                    {cat.count > 0 ? `${cat.count} Tools in Catalog` : 'Authorized Category'}
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
        </section>

        {/* Brand Partners Marquee */}
        <section className="brand-strip-clean">
          <span className="brand-strip-title">Authorized Brand Partners</span>
          <div className="brand-names-row">
            <Link to="/shop?brand=bosch" className="brand-name-item">BOSCH</Link>
            <Link to="/shop?brand=makita" className="brand-name-item">MAKITA</Link>
            <Link to="/shop?brand=dewalt" className="brand-name-item">DEWALT</Link>
            <Link to="/shop?brand=dongcheng" className="brand-name-item">DONGCHENG</Link>
            <Link to="/shop?brand=hikoki" className="brand-name-item">HiKOKI</Link>
            <Link to="/shop?brand=stanley" className="brand-name-item">STANLEY</Link>
          </div>
        </section>

        {/* Featured Bestsellers Section */}
        <section style={{ marginBottom: '48px' }}>
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

          <div className="product-grid">
            {featuredTools.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/shop" className="btn-hero-secondary" style={{ padding: '12px 32px' }}>
              <span>Explore All {products.length}+ Tools in Shop</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Why Choose Variathu */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              The Variathu Advantage
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
              Serving tradesmen, contractors, and DIY woodworkers across Pathanamthitta district
            </p>
          </div>

          <div className="about-features-grid">
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
          </div>
        </section>

        {/* Kozhencherry Store Location Section */}
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', marginTop: '4px', marginBottom: '8px' }}>
                Variathu Power Tools
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, maxWidth: '520px' }}>
                Poyanil Building, Near St Thomas Higher Secondary School Ground,<br />
                Poyanil Junction, Kozhencherry, Pathanamthitta-689641, Kerala.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="tel:+919447123456"
                className="btn-hero-secondary"
                style={{ fontSize: '0.86rem', padding: '10px 18px' }}
              >
                <Phone size={15} style={{ color: 'var(--brand-primary)' }} />
                <span>Call +91 94471 23456</span>
              </a>

              <a
                href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20am%20heading%20to%20your%20shop%20at%20Poyanil%20Junction."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontSize: '0.86rem', padding: '10px 18px' }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="https://maps.google.com/?q=Poyanil+Junction+Kozhencherry+Pathanamthitta"
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
      </div>
    </div>
  );
};
