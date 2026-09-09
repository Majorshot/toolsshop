import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, MessageCircle, Zap, ShieldCheck } from 'lucide-react';
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

        {/* Feature Tag (Star rating removed per user request) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 8px', minHeight: '18px' }}>
          {product.cordless ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
              <Zap size={11} /> Cordless
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
              <ShieldCheck size={11} /> Official Warranty
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
