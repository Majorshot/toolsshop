import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  MapPin,
  Phone,
  ShieldCheck,
  MessageCircle,
  Menu,
  X,
  Home,
  Grid,
  Info,
  ChevronRight,
  User,
  LogOut,
  Mail
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({
  onOpenStoreModal,
  onOpenAdminModal,
  storeInfo
}) => {
  const { totalItemsCount } = useCart();
  const { user, isLoggedIn, isStoreOwner, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="main-site-header">
      {/* Top Quick Contact Bar: Phone & Email */}
      <div className="top-contact-strip">
        <div className="container">
          <div className="top-contact-inner">
            <div className="top-contact-left">
              <span className="top-contact-location">
                <MapPin size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>Poyanil Junction, Kozhencherry, Kerala</span>
              </span>
            </div>

            <div className="top-contact-right">
              <a href="tel:+919447123456" className="top-contact-item" title="Call Store">
                <Phone size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>+91 94471 23456</span>
              </a>
              <span className="top-contact-sep">•</span>
              <a href="mailto:variathupowertools@gmail.com" className="top-contact-item" title="Email Store">
                <Mail size={11} style={{ color: 'var(--brand-primary)' }} />
                <span>variathupowertools@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Minimal Unified Navbar */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-inner">
            {/* Left side: Hamburger Button (Mobile) + Brand Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-mobile-menu"
                onClick={() => setIsMobileMenuOpen(true)}
                title="Open Navigation Menu"
                id="btn-open-mobile-drawer"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="brand-logo-wrap" onClick={closeMenu}>
                <img
                  src="/logo.jpg"
                  alt="Variathu Power Tools Logo"
                  className="brand-logo-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="brand-text">
                  <h1>VARIATHU <span>POWER TOOLS</span></h1>
                  <p>
                    <MapPin size={11} style={{ color: 'var(--brand-primary)' }} />
                    Kozhencherry, Pathanamthitta
                  </p>
                </div>
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
                      onClick={() => { logout(); navigate('/'); }}
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

      {/* Slide-out Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={closeMenu}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.98rem' }}>
                  VARIATHU <span style={{ color: 'var(--brand-primary)' }}>POWER TOOLS</span>
                </span>
              </div>
              <button
                onClick={closeMenu}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                aria-label="Close Navigation"
              >
                <X size={20} />
              </button>
            </div>

            {/* Login / Profile Card in Drawer */}
            <div style={{ padding: '14px 16px 6px' }}>
              {isLoggedIn ? (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Link
                    to={isStoreOwner ? '/admin' : '/account'}
                    onClick={closeMenu}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isStoreOwner ? '#0f172a' : 'var(--brand-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'block' }}>{user.name}</strong>
                      <span style={{ fontSize: '0.74rem', color: 'var(--brand-primary)', fontWeight: '700' }}>
                        {isStoreOwner ? 'Store Owner (Admin)' : 'Customer (View Orders)'}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={() => { logout(); closeMenu(); navigate('/'); }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px' }}
                    title="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: '700',
                    fontSize: '0.88rem'
                  }}
                  id="mobile-drawer-login-btn"
                >
                  <User size={17} style={{ color: 'var(--brand-primary)' }} />
                  <span>Sign In (Customer & Store)</span>
                </Link>
              )}
            </div>

            {/* Navigation Links */}
            <div className="mobile-drawer-links">
              <NavLink
                to="/"
                className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
                end
              >
                <Home size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>Home Page</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
              </NavLink>

              <NavLink
                to="/shop"
                className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <Grid size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>Shop Equipment</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
              </NavLink>

              <NavLink
                to="/about"
                className={({ isActive }) => `mobile-drawer-link ${isActive ? 'active' : ''}`}
                onClick={closeMenu}
              >
                <Info size={18} style={{ color: 'var(--brand-primary)' }} />
                <span>About & Workshop</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#94a3b8' }} />
              </NavLink>
            </div>

            {/* Drawer Footer Contact */}
            <div className="mobile-drawer-footer">
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>
                📍 Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="tel:+919447123456"
                  className="btn-hero-secondary"
                  style={{ justifyContent: 'center', fontSize: '0.84rem', padding: '9px' }}
                >
                  <Phone size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span>Call +91 94471 23456</span>
                </a>

                <a
                  href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools%20Kozhencherry,%20I%20have%20an%20inquiry."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-hero-clean"
                  style={{ justifyContent: 'center', background: '#16a34a', fontSize: '0.84rem', padding: '9px' }}
                >
                  <MessageCircle size={14} />
                  <span>WhatsApp Direct</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
