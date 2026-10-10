import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  LogOut,
  Mail
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from './SpringModal';

export const Navbar = ({
  onOpenStoreModal,
  onOpenAdminModal,
  storeInfo
}) => {
  const { totalItemsCount } = useCart();
  const { user, isLoggedIn, isStoreOwner, logout } = useAuth();
  const { confirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const navigate = useNavigate();

  const handleNavLogout = () => {
    confirm({
      title: "Sign Out?",
      description: isStoreOwner
        ? "Are you sure you want to sign out of the Store Owner Portal?"
        : "Are you sure you want to sign out of your account?",
      confirmText: "Sign Out",
      cancelText: "Cancel",
      variant: "danger",
      iconType: "logout",
      onConfirm: () => {
        logout();
        navigate('/');
      }
    });
  };

  return (
    <header className="main-site-header">
      {/* Top Quick Contact Bar: Phone & Email */}
      <div className="top-contact-strip">
        <div className="container">
          <div className="top-contact-inner">
            <div className="top-contact-left">
              <a
                href="https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8"
                target="_blank"
                rel="noopener noreferrer"
                className="top-contact-location"
                style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                title="View on Google Maps"
              >
                <MapPin size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>Poyanil Junction, Kozhencherry, Kerala</span>
              </a>
            </div>

            <div className="top-contact-right">
              <a href="tel:+919447559333" className="top-contact-item" title="Call Store">
                <Phone size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>+91 94475 59333</span>
              </a>
              <span className="top-contact-sep">•</span>
              <a href="mailto:variathupowertoolskzy@gmail.com" className="top-contact-item" title="Email Store">
                <Mail size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>variathupowertoolskzy@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Minimal Unified Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-inner">
            {/* Left side: Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link to="/" className="brand-logo-wrap" title="Variathu Power Tools">
                <img
                  src="/Logo.jpeg"
                  alt="Variathu Power Tools"
                  className="brand-logo-banner"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="nav-links-desktop">
              <NavLink
                to="/"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                end
              >
                Home
              </NavLink>

              <NavLink
                to="/shop"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('shop_last_product_id');
                    sessionStorage.removeItem('shop_scroll_pos');
                    sessionStorage.removeItem('shop_brand_filter');
                    sessionStorage.removeItem('shop_category_filter');
                    sessionStorage.removeItem('shop_power_filter');
                    sessionStorage.removeItem('shop_price_filter');
                    sessionStorage.removeItem('shop_minPrice_filter');
                    sessionStorage.removeItem('shop_maxPrice_filter');
                    sessionStorage.removeItem('shop_inStock_filter');
                  } catch (e) {}
                }}
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                Shop Equipment
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                About & Workshop
              </NavLink>
            </div>

            {/* Right side: Only Essential Actions (Search, Account/Portal, Cart) */}
            <div className="nav-actions">
              {/* Quick Search Button */}
              <Link
                to="/shop"
                className="btn-icon"
                title="Search Tools Catalog"
                id="nav-search-icon-btn"
              >
                <Search size={18} />
              </Link>

              {/* Login / User / Portal (Desktop only - mobile uses bottom bar and menu drawer) */}
              <div className="nav-auth-desktop-wrap">
                {isLoggedIn ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link
                      to={isStoreOwner ? '/admin' : '/account'}
                      className={isStoreOwner ? 'nav-portal-pill' : 'nav-user-pill'}
                      id="top-account-btn"
                      title={isStoreOwner ? 'Store Owner Dashboard' : 'My Account & Orders'}
                    >
                      {isStoreOwner ? <ShieldCheck size={14} /> : <User size={14} />}
                      <span>{isStoreOwner ? 'Portal' : (user.name?.split(' ')[0] || 'Account')}</span>
                    </Link>

                    <button
                      onClick={handleNavLogout}
                      className="btn-logout-subtle"
                      title="Sign Out"
                      id="top-logout-btn"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="nav-login-btn"
                    id="top-login-btn"
                  >
                    <User size={15} />
                    <span>Login</span>
                  </Link>
                )}
              </div>

              {/* Shopping Cart Link -> Full Cart Page */}
              <Link
                to="/cart"
                className="btn-icon"
                title="Shopping Cart"
                id="nav-cart-btn"
                style={{ position: 'relative' }}
              >
                <ShoppingCart size={18} />
                {totalItemsCount > 0 && (
                  <span className="badge-counter animate-fade-in">
                    {totalItemsCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
