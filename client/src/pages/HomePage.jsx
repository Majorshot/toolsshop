import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ShieldCheck, Wrench, Zap, Package, MapPin, Phone, MessageCircle, Navigation, Eye, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

const SHOWCASE_TOOLS = [
  {
    id: "vpt-003",
    name: "DeWalt DCD7781D2 20V Max Brushless Hammer Drill",
    brand: "DeWalt",
    price: 13999,
    originalPrice: 17500,
    tag: "PRO CONTRACTOR PICK",
    spec: "65 Nm Torque • 20V XR Brushless",
    image: "https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vpt-001",
    name: "Bosch GDC 120 Professional Marble Cutter",
    brand: "Bosch",
    price: 3850,
    originalPrice: 4700,
    tag: "BESTSELLER IN KERALA",
    spec: "1200W Power • 12,000 RPM",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vpt-002",
    name: "Makita HR2470 24mm Rotary Hammer (SDS-Plus)",
    brand: "Makita",
    price: 8490,
    originalPrice: 10200,
    tag: "HEAVY DUTY DRILLING",
    spec: "780W Motor • 2.4 Joules Impact",
    image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vpt-004",
    name: "Dongcheng DSM03-100A 4-Inch Angle Grinder",
    brand: "Dongcheng",
    price: 1950,
    originalPrice: 2400,
    tag: "FABRICATOR FAVORITE",
    spec: "710W • 13,000 RPM Copper Armature",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"
  }
];

export const HomePage = ({ products = [], onSelectProduct }) => {
  const navigate = useNavigate();
  const featuredTools = products.slice(0, 8);
  const [activeToolIdx, setActiveToolIdx] = useState(0);

  // Dynamically derive showcase tools from database products (fall back to SHOWCASE_TOOLS if loading)
  const showcaseTools = (products && products.length > 0)
    ? products.slice(0, 5).map(p => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice || Math.round(p.price * 1.2),
        tag: p.badge ? p.badge.toUpperCase() : "LIVE CATALOG ITEM",
        spec: p.specs?.power ? `${p.specs.power} • ${p.brand}` : (p.cordless ? "Cordless 20V XR" : "Heavy Duty"),
        image: p.image || "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80"
      }))
    : SHOWCASE_TOOLS;

  // Auto-cycle through showcase tools every 3.2 seconds
  useEffect(() => {
    if (showcaseTools.length === 0) return;
    const timer = setInterval(() => {
      setActiveToolIdx(prev => (prev + 1) % showcaseTools.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [showcaseTools.length]);

  const currentShowcaseTool = showcaseTools[activeToolIdx % showcaseTools.length] || showcaseTools[0] || SHOWCASE_TOOLS[0];

  const handleInspectShowcaseTool = () => {
    const fullProduct = products.find(p => p.id === currentShowcaseTool.id) || currentShowcaseTool;
    navigate(`/product/${fullProduct.id || fullProduct._id || currentShowcaseTool.id}`);
  };

  const formatPrice = (num) => '₹' + num.toLocaleString('en-IN');

  return (
    <div>
      {/* Hero Section with Animated Tool Showcase */}
      {/* Hero Section - Minimal Luxury Industrial Showroom */}
      <section className="hero-luxury-section">
        <div className="hero-luxury-container">
          {/* Subtle architectural ambient lighting & blueprint grid */}
          <div className="hero-luxury-glow" />
          <div className="hero-luxury-grid-overlay" />

          {/* Left Column: Refined Headline & Value Proposition */}
          <div className="hero-luxury-content">
            <div className="hero-luxury-eyebrow">
              <span className="hero-luxury-status-dot" />
              <span>Kozhencherry, Kerala • Authorized Industrial Dealership</span>
            </div>

            <h1 className="hero-luxury-title">
              Precision Engineering.<br />
              <span className="hero-luxury-highlight">Built for Masters.</span>
            </h1>

            <p className="hero-luxury-description">
              Direct factory authorization for Bosch, Makita, DeWalt & Dongcheng.
              Equipping Kerala's contractors with certified heavy-duty machinery,
              genuine spare parts, and dedicated in-house repair clinic support.
            </p>

            <div className="hero-luxury-actions">
              <Link to="/shop" className="btn-luxury-primary" id="home-explore-shop-btn">
                <span>Explore Collection</span>
                <ArrowRight size={17} />
              </Link>

              <Link to="/about" className="btn-luxury-secondary">
                <span>Workshop Clinic</span>
              </Link>
            </div>

            <div className="hero-luxury-trust">
              <div className="hero-luxury-trust-item">
                <span className="trust-bullet">•</span>
                <span>100% Genuine Machinery</span>
              </div>
              <div className="hero-luxury-trust-item">
                <span className="trust-bullet">•</span>
                <span>Full Factory Warranty</span>
              </div>
              <div className="hero-luxury-trust-item">
                <span className="trust-bullet">•</span>
                <span>In-House Service Clinic</span>
              </div>
            </div>
          </div>

          {/* Right Column: Flagship Tool Exhibition Showcase */}
          <div className="hero-luxury-stage">
            <div className="hero-luxury-stage-ambient" />

            <div
              className="hero-luxury-showcase-card"
              onClick={handleInspectShowcaseTool}
              role="button"
              tabIndex={0}
              title={`View ${currentShowcaseTool.name} specifications`}
              onKeyDown={(e) => e.key === 'Enter' && handleInspectShowcaseTool()}
            >
              <div className="hero-luxury-tag">
                <Sparkles size={12} />
                <span>{currentShowcaseTool.tag || 'FLAGSHIP SELECTION'}</span>
              </div>

              <div className="hero-luxury-img-wrapper">
                <img
                  key={currentShowcaseTool.id}
                  src={currentShowcaseTool.image}
                  alt={currentShowcaseTool.name}
                  className="hero-luxury-tool-img animate-fade-in"
                />
              </div>

              <div className="hero-luxury-meta-glass">
                <div className="hero-luxury-meta-header">
                  <span className="hero-luxury-brand">{currentShowcaseTool.brand}</span>
                  <span className="hero-luxury-spec">{currentShowcaseTool.spec}</span>
                </div>

                <h3 className="hero-luxury-tool-name" title={currentShowcaseTool.name}>
                  {currentShowcaseTool.name}
                </h3>

                <div className="hero-luxury-price-row">
                  <span className="hero-luxury-price">
                    {formatPrice(currentShowcaseTool.price)}
                  </span>
                  {currentShowcaseTool.originalPrice && (
                    <span className="hero-luxury-original-price">
                      {formatPrice(currentShowcaseTool.originalPrice)}
                    </span>
                  )}
                  <span className="hero-luxury-inspect-link">
                    <span>Inspect Specs</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </div>

            {/* Minimal Luxury Timeline Indicators */}
            <div className="hero-luxury-indicators">
              {showcaseTools.map((tool, idx) => (
                <button
                  key={tool.id || idx}
                  className={`hero-luxury-dash ${activeToolIdx === idx ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToolIdx(idx);
                  }}
                  aria-label={`Show ${tool.name}`}
                  title={tool.name}
                />
              ))}
            </div>
          </div>
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
  );
};
