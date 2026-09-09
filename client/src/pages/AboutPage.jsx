import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Clock, Wrench, ShieldCheck, CheckCircle2, Navigation, Package, Award } from 'lucide-react';

export const AboutPage = () => {
  const [serviceModel, setServiceModel] = useState('');
  const [serviceIssue, setServiceIssue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI would like to request repair/service for:\nTool Model: ${serviceModel}\nProblem: ${serviceIssue}\nPlease let me know when I can bring it to Poyanil Building.`
    );
    window.open(`https://wa.me/919447123456?text=${text}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div style={{ padding: '16px 0 48px' }}>
      {/* About Header */}
      <section className="about-hero">
        <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          About Variathu Power Tools
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginTop: '6px', marginBottom: '14px' }}>
          Powering Kerala's Builders, Fabricators & Craftsmen
        </h1>
        <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.7, maxWidth: '720px', margin: '0 auto' }}>
          Located at <strong>Poyanil Junction, Kozhencherry</strong>, Variathu Power Tools is a premier destination for heavy duty industrial tools, precision machinery, authentic spare parts, and authorized warranty servicing across Pathanamthitta district.
        </p>
      </section>

      {/* Heritage & Values Grid */}
      <section style={{ marginBottom: '40px' }}>
        <div className="about-features-grid">
          <div className="about-feature-card">
            <div className="about-feature-icon">
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Authorized Dealership
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
              We deal exclusively in 100% original, brand-new equipment from trusted global manufacturers: <strong>Bosch, Makita, DeWalt, Dongcheng, and HiKOKI</strong>. Every purchase is backed by manufacturer warranty certificates.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
              <Wrench size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              In-House Service Clinic
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
              Unlike retail stores that send tools away for weeks, our Kozhencherry workshop provides swift on-site maintenance, genuine armature rewinding, switch replacements, and authentic carbon brushes.
            </p>
          </div>

          <div className="about-feature-card">
            <div className="about-feature-icon" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
              <Package size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Contractor Support
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.6 }}>
              We partner with local electrical contractors, plumbers, carpenters, and construction crews in Pathanamthitta and neighboring districts, offering bulk project supply and emergency loaner units.
            </p>
          </div>
        </div>
      </section>

      {/* Kozhencherry Shop Details & Map Section */}
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '36px 28px',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#ea580c', background: 'rgba(234,88,12,0.08)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: '700', marginBottom: '12px' }}>
              <MapPin size={13} /> Kozhencherry Landmark
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
              Variathu Power Tools
            </h2>

            <div style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
              <p><strong>Poyanil Building</strong></p>
              <p>Near St Thomas Higher Secondary School Ground</p>
              <p>Poyanil Junction, Kozhencherry</p>
              <p>Pathanamthitta District, Kerala - 689641</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.86rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#ea580c' }} />
                <span><strong>Hours:</strong> Mon - Sat: 8:30 AM - 7:30 PM (Sunday Closed)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} style={{ color: '#ea580c' }} />
                <span><strong>Phone:</strong> +91 94471 23456</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href="tel:+919447123456"
                className="btn-hero-secondary"
                style={{ fontSize: '0.86rem', padding: '10px 18px' }}
              >
                <Phone size={15} style={{ color: '#ea580c' }} />
                <span>Call Store</span>
              </a>

              <a
                href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20would%20like%20to%20connect%20with%20your%20team."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-hero-secondary"
                style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a', fontSize: '0.86rem', padding: '10px 18px' }}
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
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

          {/* Workshop Service Inquiry Form */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '24px'
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
              Service & Repair Inquiry
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '16px' }}>
              Need an armature replacement, carbon brushes, or repair estimate? Submit details directly to our Kozhencherry workshop.
            </p>

            {submitted ? (
              <div style={{ color: '#16a34a', fontSize: '0.86rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Request generated! Opening WhatsApp...
              </div>
            ) : (
              <form onSubmit={handleServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  required
                  placeholder="Tool model (e.g. Bosch GDC 120 Marble Cutter)"
                  value={serviceModel}
                  onChange={(e) => setServiceModel(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />

                <textarea
                  rows={3}
                  required
                  placeholder="Issue details (e.g. motor sparks, unusual sound, broken cord)"
                  value={serviceIssue}
                  onChange={(e) => setServiceIssue(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />

                <button
                  type="submit"
                  className="btn-hero-clean"
                  style={{ justifyContent: 'center', padding: '11px', fontSize: '0.86rem' }}
                >
                  <MessageCircle size={16} />
                  <span>Send Request to Workshop</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
