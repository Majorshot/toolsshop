import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Grid, ShoppingCart, Info, User, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export const MobileBottomNav = () => {
  const { totalItemsCount } = useCart();
  const { isLoggedIn, isStoreOwner } = useAuth();

  const accountPath = !isLoggedIn ? '/login' : (isStoreOwner ? '/admin' : '/account');
  const accountLabel = !isLoggedIn ? 'Login' : (isStoreOwner ? 'Store' : 'Orders');

  return (
    <div className="mobile-bottom-nav">
      <NavLink
        to="/"
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-home"
        end
      >
        <Home size={20} />
        <span>Home</span>
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
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-shop"
      >
        <Grid size={20} />
        <span>Shop</span>
      </NavLink>

      <NavLink
        to="/cart"
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
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-about"
      >
        <Info size={20} />
        <span>About</span>
      </NavLink>

      <NavLink
        to={accountPath}
        className={({ isActive }) => `nav-bottom-item ${isActive ? 'active' : ''}`}
        id="mobile-nav-account"
      >
        {isStoreOwner ? <ShieldCheck size={20} /> : <User size={20} />}
        <span>{accountLabel}</span>
      </NavLink>
    </div>
  );
};
