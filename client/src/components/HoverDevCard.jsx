import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * HoverDevCard - Animated Card Component
 * Features sliding gradient background on hover, rotated giant watermark background icon,
 * smooth color transition for foreground icon, typography, badge, and interactive action footer.
 */
export const HoverDevCard = ({
  title,
  subtitle,
  Icon,
  onClick,
  href,
  badge,
  badgeBg,
  badgeColor,
  iconColor,
  iconBg,
  gradient,
  actionText,
  actionColor,
  id,
  className = '',
  style = {}
}) => {
  const isLink = Boolean(href);
  const Tag = isLink ? 'a' : 'div';

  return (
    <Tag
      id={id}
      href={href}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`hover-dev-card ${className}`}
      style={{
        cursor: onClick || href ? 'pointer' : 'default',
        ...style
      }}
    >
      {/* Sliding Background Gradient */}
      <div
        className="hover-dev-card-bg"
        style={gradient ? { background: gradient } : undefined}
      />

      {/* Giant Watermark Background Icon */}
      {Icon && (
        <Icon
          size={116}
          strokeWidth={1.3}
          className="hover-dev-card-watermark"
          aria-hidden="true"
        />
      )}

      {/* Top Header Row: Icon + Badge */}
      <div className="hover-dev-card-header">
        <div
          className="hover-dev-card-icon-wrap"
          style={iconBg ? { background: iconBg } : undefined}
        >
          {Icon && (
            <Icon
              size={22}
              strokeWidth={2}
              className="hover-dev-card-icon"
              style={iconColor ? { color: iconColor } : undefined}
            />
          )}
        </div>
        {badge && (
          <span
            className="hover-dev-card-badge"
            style={badgeBg || badgeColor ? { background: badgeBg, color: badgeColor } : undefined}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="hover-dev-card-body">
        <h4 className="hover-dev-card-title">{title}</h4>
        <p className="hover-dev-card-subtitle">{subtitle}</p>
      </div>

      {/* Action Footer */}
      {actionText && (
        <div
          className="hover-dev-card-action"
          style={actionColor ? { color: actionColor } : undefined}
        >
          <span>{actionText}</span>
          <ArrowRight size={14} className="hover-dev-card-arrow" />
        </div>
      )}
    </Tag>
  );
};

export default HoverDevCard;
