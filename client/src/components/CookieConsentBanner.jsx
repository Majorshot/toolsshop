import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, ChevronRight } from 'lucide-react';

export const CookieConsentBanner = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('vpt_cookie_consent');
      if (!consent) {
        // Delay slightly for smooth entrance after initial page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // In case localStorage is blocked
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('vpt_cookie_consent', JSON.stringify({
        type: 'all',
        timestamp: Date.now()
      }));
    } catch {}
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem('vpt_cookie_consent', JSON.stringify({
        type: 'essential',
        timestamp: Date.now()
      }));
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      className="cookie-consent-bar"
      role="region"
      aria-label="Cookie and Privacy Consent"
      style={{
        position: 'fixed',
        bottom: '80px', // Sits cleanly above mobile navigation bar
        left: '16px',
        right: '16px',
        maxWidth: '540px',
        margin: '0 auto',
        zIndex: 9999,
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08)',
        padding: '18px 20px',
        animation: 'slideUpBounce 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: '1px solid #fee2e2'
          }}
        >
          <Cookie size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h4
              style={{
                margin: 0,
                fontSize: '0.94rem',
                fontWeight: '800',
                color: '#0f172a',
                lineHeight: 1.2
              }}
            >
              Your Privacy & Cookie Choices
            </h4>

            <button
              type="button"
              onClick={handleEssentialOnly}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>

          <p
            style={{
              margin: '0 0 12px',
              fontSize: '0.82rem',
              color: '#475569',
              lineHeight: 1.5
            }}
          >
            We use secure local storage and cookies to maintain your shopping cart, enable instant OTP logins, and coordinate courier delivery.{' '}
            <button
              type="button"
              onClick={() => onOpenPrivacy && onOpenPrivacy('privacy')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: '#dc2626',
                fontWeight: '600',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit'
              }}
            >
              Learn how we protect your data
            </button>.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                transition: 'opacity 0.2s ease'
              }}
              id="btn-cookie-accept-all"
            >
              Accept All
            </button>

            <button
              type="button"
              onClick={handleEssentialOnly}
              style={{
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              id="btn-cookie-essential-only"
            >
              Essential Only
            </button>

            <button
              type="button"
              onClick={() => onOpenPrivacy && onOpenPrivacy('cookies')}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                padding: '6px 8px',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                marginLeft: 'auto'
              }}
            >
              <span>Preferences</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CookieConsentBanner;
