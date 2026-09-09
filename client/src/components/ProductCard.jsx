import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, MessageCircle, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProductCard = ({ product, onSelectProduct }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/product/${product.id || product._id}`);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }
    addToCart(product);
  };

  const formatPrice = (num) => {
    return '₹' + num.toLocaleString('en-IN');
  };

  const getWhatsAppLink = (e) => {
    e.stopPropagation();
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI want to inquire about:\n*${product.name}*\nPrice: ${formatPrice(product.price)}\nBrand: ${product.brand}\nIs this in stock for pickup at Poyanil Building?`
    );
    return `https://wa.me/919447123456?text=${text}`;
  };

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
      id={`product-card-${product.id}`}
      style={{ cursor: 'pointer' }}
    >
      {/* Product Image Wrap */}
      <div className="card-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="card-img"
          loading="lazy"
        />

        {product.badge && (
          <span className="card-badge">
            {product.badge}
          </span>
        )}

        {product.discount && (
          <span className="card-discount-badge">
            {product.discount}
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body">
        <span className="card-brand">{product.brand}</span>

        <h4 className="card-title" title={product.name}>
          {product.name}
        </h4>

        {/* Rating */}
        <div className="card-rating-row">
          <div className="card-rating-stars">
            <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
            <span style={{ fontWeight: 700, marginLeft: 4 }}>{product.rating}</span>
          </div>
          <span className="card-reviews-count">({product.reviewsCount})</span>

          {product.cordless && (
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.68rem', color: '#00d4ff', fontWeight: '700' }}>
              <Zap size={11} /> Cordless
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="card-price-row">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="price-original">{formatPrice(product.originalPrice)}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="card-action-row">
          <button
            className="btn-card-add"
            onClick={handleAddToCart}
            title="Add tool to cart"
            id={`btn-add-${product.id}`}
          >
            <ShoppingCart size={15} />
            <span>Add</span>
          </button>

          <a
            href={getWhatsAppLink({ stopPropagation: () => {} })}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-card-whatsapp"
            title="Order directly on WhatsApp"
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
