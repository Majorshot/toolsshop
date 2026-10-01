import React, { useState } from 'react';
import { resolveCourierPartner } from '../utils/courierPartners';

/**
 * CourierLogo
 * Displays official high-resolution delivery service logo image with graceful fallback.
 */
export const CourierLogo = ({
  partner,
  size = 'md',
  showName = false,
  bordered = true,
  style = {},
  imgStyle = {},
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  const cfg = resolveCourierPartner(partner);

  const sizeHeights = {
    xs: { boxHeight: '22px', imgHeight: '16px', maxW: '60px', fontSize: '0.62rem' },
    sm: { boxHeight: '28px', imgHeight: '20px', maxW: '85px', fontSize: '0.68rem' },
    md: { boxHeight: '36px', imgHeight: '26px', maxW: '115px', fontSize: '0.74rem' },
    lg: { boxHeight: '44px', imgHeight: '32px', maxW: '140px', fontSize: '0.82rem' }
  };

  const dim = sizeHeights[size] || sizeHeights.md;

  return (
    <div
      className={`courier-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        ...style
      }}
      title={cfg.name}
    >
      <div
        style={{
          height: dim.boxHeight,
          minWidth: dim.boxHeight,
          padding: '2px 8px',
          background: '#ffffff',
          borderRadius: '8px',
          border: bordered ? '1px solid #e2e8f0' : 'none',
          boxShadow: bordered ? '0 1px 3px rgba(0, 0, 0, 0.04)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        {!hasError && cfg.logo ? (
          <img
            src={cfg.logo}
            alt={cfg.name}
            onError={() => setHasError(true)}
            style={{
              height: dim.imgHeight,
              maxWidth: dim.maxW,
              objectFit: 'contain',
              display: 'block',
              ...imgStyle
            }}
          />
        ) : (
          <span
            style={{
              fontSize: dim.fontSize,
              fontWeight: '900',
              color: cfg.color || '#ea580c',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}
          >
            {cfg.badge || cfg.shortName || 'EXPRESS'}
          </span>
        )}
      </div>

      {showName && (
        <span
          style={{
            fontSize: dim.fontSize,
            fontWeight: '700',
            color: '#1e293b',
            whiteSpace: 'nowrap'
          }}
        >
          {cfg.name}
        </span>
      )}
    </div>
  );
};

export default CourierLogo;
