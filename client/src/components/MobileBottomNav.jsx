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
