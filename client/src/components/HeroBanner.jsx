import React from 'react';
import { ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Wrench, Zap } from 'lucide-react';

export const HeroBanner = ({ onExploreClick }) => {
  return (
    <section className="hero-wrapper">
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-pill">
            <Zap size={14} /> Authorized Heavy Duty Dealer • Kozhencherry
          </div>

          <h2 className="hero-title">
            Top Tier Power Tools. <span>Unstoppable</span> Performance.
          </h2>

          <p className="hero-desc">
            Your trusted destination for genuine Bosch, Makita, DeWalt & Dongcheng in Pathanamthitta district. Direct from <strong>Poyanil Junction, Kozhencherry</strong> with official warranty, spares & service.
          </p>

          <div className="hero-features-row">
            <div className="hero-feature-item">
              <CheckCircle2 size={14} /> 100% Genuine Brands
            </div>
            <div className="hero-feature-item">
              <ShieldCheck size={14} /> Official Warranty
            </div>
            <div className="hero-feature-item">
              <Wrench size={14} /> In-House Tool Service
            </div>
            <div className="hero-feature-item">
              <CheckCircle2 size={14} /> Store Pickup
            </div>
          </div>

          <div className="hero-cta-group">
            <button
              className="btn-hero-primary"
              onClick={onExploreClick}
              id="hero-explore-btn"
            >
              <span>Explore Catalog</span>
              <ArrowRight size={17} />
            </button>

            <a
              href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20want%20to%20know%20about%20your%20current%20offers%20on%20power%20tools."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hero-whatsapp"
              id="hero-whatsapp-btn"
            >
              <MessageCircle size={18} />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Visual Badge Card on Desktop */}
        <div
          style={{
            display: 'none',
            flexDirection: 'column',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 98, 0, 0.25)',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '280px',
            backdropFilter: 'blur(10px)'
          }}
          className="d-md-flex"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 98, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6200' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700' }}>Local Warranty Care</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Fast replacement & repairs in Kozhencherry</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4ff' }}>
              <Zap size={24} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700' }}>Kerala-wide Courier</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Speed post & door delivery available</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <Wrench size={24} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700' }}>Original Spare Parts</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Carbon brushes, gears, armatures</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
