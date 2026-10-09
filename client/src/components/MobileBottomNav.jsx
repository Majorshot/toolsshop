import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Info, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSafeNavigate } from '../context/NavigationContext';

export const MobileBottomNav = () => {
  const { totalItemsCount } = useCart();
  const { isLoggedIn, isStoreOwner } = useAuth();
  const location = useLocation();
  const { startLoading } = useSafeNavigate();

  const lastTabClickRef = useRef(0);

  const accountPath = !isLoggedIn ? '/login' : (isStoreOwner ? '/admin' : '/account');
  const accountLabel = !isLoggedIn ? 'Login' : (isStoreOwner ? 'Store' : 'Orders');

  // Debounce & prevent duplicate history pushes for bottom nav
  const handleTabClick = (e, targetPath, onBeforeNav) => {
    const currentPath = location.pathname;

    // 1. If tapping current active tab, prevent navigation completely (no-op)
    if (currentPath === targetPath) {
      e.preventDefault();
      return;
    }

    // 2. Debounce rapid tapping across different tabs (within 350ms)
    const now = Date.now();
    if (now - lastTabClickRef.current < 350) {
      e.preventDefault();
      return;
    }
    lastTabClickRef.current = now;

    if (typeof onBeforeNav === 'function') {
      try {
        onBeforeNav();
      } catch (err) {}
    }

    // 3. Immediate visual feedback
    startLoading();
  };

  // Pre-warm lazy routes on initial touchstart
  const prefetchRoute = (path) => {
    try {
      if (path === '/cart') import('../pages/CartPage').catch(() => {});
      else if (path === '/about') import('../pages/AboutPage').catch(() => {});
      else if (path === '/login') import('../pages/LoginPage').catch(() => {});
      else if (path === '/account') import('../pages/CustomerAccountPage').catch(() => {});
      else if (path === '/admin') import('../pages/StoreDashboardPage').catch(() => {});
    } catch (e) {}
  };

  const handleShopCleanup = () => {
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
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        replace
        onClick={(e) => handleTabClick(e, '/')}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-home"
        end
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/shop"
        replace
        onClick={(e) => handleTabClick(e, '/shop', handleShopCleanup)}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-shop"
      >
        <Grid size={20} />
        <span>Shop</span>
      </NavLink>

      <NavLink
        to="/cart"
        replace
        onClick={(e) => handleTabClick(e, '/cart')}
        onTouchStart={() => prefetchRoute('/cart')}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-cart"
      >
        <ShoppingCart size={20} />
        <span>Cart</span>
        {totalItemsCount > 0 && (
          <span className="bottom-nav-badge animate-fade-in">
            {totalItemsCount}
          </span>
        )}
      </NavLink>

      <NavLink
        to="/about"
        replace
        onClick={(e) => handleTabClick(e, '/about')}
        onTouchStart={() => prefetchRoute('/about')}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-about"
      >
        <Info size={20} />
        <span>About</span>
      </NavLink>

      <NavLink
        to={accountPath}
        replace
        onClick={(e) => handleTabClick(e, accountPath)}
        onTouchStart={() => prefetchRoute(accountPath)}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-account"
      >
        {isStoreOwner ? <ShieldCheck size={20} /> : <User size={20} />}
        <span>{accountLabel}</span>
      </NavLink>
    </nav>
  );
};
