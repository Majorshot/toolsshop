import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, MessageCircle, Zap, ShieldCheck, Plus, Minus, Ban,
  Sparkles, Flame, Wrench, Award, Tag, Image as ImageIcon
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// Helper to style highlight badges into attractive storefront pills
export const getBadgeConfig = (badge) => {
  if (!badge || typeof badge !== 'string' || !badge.trim()) return null;
  const b = badge.toLowerCase().trim();
  if (b === 'none') return null;

  if (b.includes('best') || b.includes('seller') || b.includes('hot')) {
    return {
      icon: <Flame size={11} strokeWidth={2.5} />,
      label: 'Best Seller',
      pillStyle: { color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', fontWeight: '700' }
    };
  }
  if (b.includes('new') || b.includes('arrival')) {
    return {
      icon: <Sparkles size={11} strokeWidth={2.5} />,
      label: 'New Arrival',
      pillStyle: { color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', fontWeight: '700' }
    };
  }
  if (b.includes('heavy') || b.includes('duty')) {
    return {
      icon: <Wrench size={11} strokeWidth={2.5} />,
      label: 'Heavy Duty',
      pillStyle: { color: '#334155', background: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: '700' }
    };
  }
  if (b.includes('pro') || b.includes('choice') || b.includes('carpenter')) {
    return {
      icon: <Award size={11} strokeWidth={2.5} />,
      label: b.includes('carpenter') ? 'Carpenter Choice' : 'Pro Choice',
      pillStyle: { color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', fontWeight: '700' }
    };
  }
  if (b.includes('clearance') || b.includes('deal') || b.includes('offer')) {
    return {
      icon: <Tag size={11} strokeWidth={2.5} />,
      label: 'Clearance Deal',
      pillStyle: { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', fontWeight: '700' }
    };
  }
  if (b.includes('value') || b.includes('popular')) {
    return {
      icon: <Sparkles size={11} strokeWidth={2.5} />,
      label: 'Popular Value',
      pillStyle: { color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', fontWeight: '700' }
    };
  }
  return {
    icon: <Sparkles size={11} strokeWidth={2.5} />,
    label: badge,
    pillStyle: { color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', fontWeight: '700' }
  };
};

export const ProductCard = ({ product, onSelectProduct, isPreview = false }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const maxStock = typeof product?.stock === 'number' ? product.stock : 999;
  const isOutOfStock = maxStock <= 0 || product?.inStock === false;
  const isLowStock = !isOutOfStock && maxStock <= 2;

  const cartItem = cart?.find(item => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const badgeConfig = getBadgeConfig(product.badge);

  const handleCardClick = () => {
    if (isPreview) return;
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/product/${product.id || product._id}`);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isPreview || isOutOfStock) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    addToCart(product);
  };

  const formatPrice = (num) => {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  };

  const getWhatsAppLink = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (isPreview) return '#';
    const text = isOutOfStock
      ? encodeURIComponent(
          `Hello Variathu Power Tools Kozhencherry,\nI want to inquire about:\n*${product.name}*\nPrice: ${formatPrice(product.price)}\nBrand: ${product.brand}\nThis tool is currently Out of Stock online. When will new units arrive at Poyanil Building?`
        )
      : encodeURIComponent(
          `Hello Variathu Power Tools Kozhencherry,\nI want to inquire about:\n*${product.name}*\nPrice: ${formatPrice(product.price)}\nBrand: ${product.brand}\nIs this in stock for pickup at Poyanil Building?`
        );
    return `https://wa.me/919447559333?text=${text}`;
  };

  return (
    <div
      className={`product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}
      onClick={handleCardClick}
      id={`product-card-${product.id}`}
      style={{ cursor: isPreview ? 'default' : 'pointer' }}
    >
      {/* Product Image Wrap */}
      <div className={`card-image-wrap ${isOutOfStock ? 'is-out-of-stock' : ''}`}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className={`card-img ${isOutOfStock ? 'card-img-out-of-stock' : ''}`}
            loading="lazy"
            onError={(e) => { e.target.style.opacity = '0.3'; }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#94a3b8', width: '100%', height: '100%' }}>
            <ImageIcon size={38} strokeWidth={1.5} />
            <span style={{ fontSize: '0.72rem', fontWeight: '600' }}>No photo uploaded</span>
          </div>
        )}

        {/* Stock Badges (Out of Stock / Low Stock) */}
        {isOutOfStock ? (
          <span className="card-stock-badge out-of-stock" id={`badge-out-of-stock-${product.id}`}>
            <Ban size={11} strokeWidth={2.5} />
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="card-stock-badge low-stock" id={`badge-low-stock-${product.id}`}>
            Only {maxStock} Left
          </span>
        ) : null}

        {product.discount && !isOutOfStock && (
          <span className="card-discount-badge">
            {product.discount}
          </span>
        )}

        {isOutOfStock && (
          <div className="card-out-of-stock-banner">
            <span>Currently Unavailable</span>
          </div>
        )}

        {cartQty > 0 && !isOutOfStock && (
          <span className="card-in-cart-indicator" title={`${cartQty} in your shopping cart`}>
            <ShoppingCart size={11} /> {cartQty} in Cart
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body">
        <span className="card-brand">{product.brand}</span>

        <h4 className="card-title" title={product.name}>
          {product.name}
        </h4>

        {/* Feature / Highlight Badge & Warranty Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '4px 0 8px', minHeight: '18px', flexWrap: 'wrap' }}>
          {isOutOfStock ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '1px 7px', borderRadius: '4px', fontWeight: '800' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#ea580c', background: '#fff7ed', border: '1px solid #fed7aa', padding: '1px 7px', borderRadius: '4px', fontWeight: '800' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }} />
              Only {maxStock} unit{maxStock > 1 ? 's' : ''} left
            </span>
          ) : null}

          {/* Offer / Highlight Badge Pill (Best Seller, New Arrival, Pro Choice, etc.) */}
          {badgeConfig && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', ...badgeConfig.pillStyle }}>
              {badgeConfig.icon} {badgeConfig.label}
            </span>
          )}

          {/* Cordless Pill */}
          {product.cordless && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
              <Zap size={11} /> Cordless
            </span>
          )}

          {/* Official Warranty Pill */}
          {(!product.cordless || !badgeConfig) && product.specs?.warranty !== 'No Warranty' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
              <ShieldCheck size={11} /> {product.specs?.warranty || 'Official Warranty'}
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="card-price-row">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice && Number(product.originalPrice) > Number(product.price || 0) && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="card-action-row">
          {isOutOfStock ? (
            <button
              type="button"
              className="btn-card-add btn-card-out-of-stock"
              disabled
              title="This tool is currently out of stock"
              id={`btn-add-${product.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Ban size={14} />
              <span>Out of Stock</span>
            </button>
          ) : cartQty > 0 ? (
            <div
              className="btn-card-stepper"
              id={`btn-qty-stepper-${product.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn-card-stepper-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(20);
                  }
                  if (cartQty <= 1) {
                    removeFromCart(product.id);
                  } else {
                    updateQuantity(product.id, cartQty - 1);
                  }
                }}
                title="Decrease quantity"
                aria-label="Decrease quantity"
                id={`btn-stepper-minus-${product.id}`}
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>

              <span className="btn-card-stepper-val" title={`${cartQty} in cart`}>
                {cartQty}
              </span>

              <button
                type="button"
                className="btn-card-stepper-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(20);
                  }
                  addToCart(product, 1);
                }}
                disabled={cartQty >= maxStock}
                title={cartQty >= maxStock ? `Max stock (${maxStock}) reached` : "Increase quantity"}
                aria-label="Increase quantity"
                id={`btn-stepper-plus-${product.id}`}
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              className="btn-card-add"
              onClick={handleAddToCart}
              title="Add tool to cart"
              id={`btn-add-${product.id}`}
            >
              <ShoppingCart size={15} />
              <span>Add</span>
            </button>
          )}

          <a
            href={getWhatsAppLink({ stopPropagation: () => {} })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-card-whatsapp"
            title={isOutOfStock ? "Inquire about restocking on WhatsApp" : "Order directly on WhatsApp"}
            onClick={(e) => e.stopPropagation()}
            id={`btn-wa-${product.id}`}
          >
            <MessageCircle size={17} />
          </a>
        </div>
      </div>
    </div>
  );
};

