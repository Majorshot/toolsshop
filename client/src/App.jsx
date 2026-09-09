import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { AboutPage } from './pages/AboutPage';
import { CartPage } from './pages/CartPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { StoreInfoModal } from './components/StoreInfoModal';
import { AdminModal } from './components/AdminModal';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { StoreDashboardPage } from './pages/StoreDashboardPage';
import { api } from './services/api';
import { CheckCircle, MessageCircle } from 'lucide-react';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const MainApp = () => {
  const { toastMessage } = useCart() || {};
  const navigate = useNavigate();

  // Products & Filter States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Store information
  const [storeInfo, setStoreInfo] = useState(null);

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts({
        category: activeCategory,
        brand: activeBrand,
        search: searchQuery,
        sortBy
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Could not load power tools. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeCategory, activeBrand, searchQuery, sortBy]);

  useEffect(() => {
    api.getStoreInfo()
      .then(res => setStoreInfo(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="app-layout">
      <ScrollToTop />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '84px',
            right: '24px',
            zIndex: 999,
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid var(--brand-primary)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <CheckCircle size={17} style={{ color: 'var(--brand-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        onOpenStoreModal={() => setIsStoreModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        storeInfo={storeInfo}
      />

      {/* Routes Container */}
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={products}
                onSelectProduct={(p) => navigate(`/product/${p.id || p._id}`)}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                products={products}
                loading={loading}
                error={error}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                activeBrand={activeBrand}
                setActiveBrand={setActiveBrand}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onSelectProduct={(p) => navigate(`/product/${p.id || p._id}`)}
              />
            }
          />
          <Route
            path="/product/:id"
            element={<ProductDetailPage />}
          />
          <Route
            path="/about"
            element={<AboutPage />}
          />
          <Route
            path="/cart"
            element={<CartPage onOpenCheckout={() => setIsCheckoutOpen(true)} />}
          />
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/account"
            element={<CustomerAccountPage />}
          />
          <Route
            path="/admin"
            element={<StoreDashboardPage onProductUpdated={loadProducts} />}
          />
        </Routes>
      </div>

      {/* Floating Speed-Dial WhatsApp Button */}
      <a
        href="https://wa.me/919447123456?text=Hello%20Variathu%20Power%20Tools,%20I%20need%20assistance%20with%20power%20tools%20in%20Kozhencherry."
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 140,
          background: '#16a34a',
          color: '#ffffff',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(22, 163, 74, 0.4)',
          textDecoration: 'none',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title="Chat on WhatsApp with Variathu Power Tools"
        id="floating-whatsapp-btn"
      >
        <MessageCircle size={28} />
      </a>

      {/* Minimal Clean Footer */}
      <footer className="main-footer-clean">
        <div className="container">
          <div className="footer-clean-grid">
            <div className="footer-clean-col">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/logo.jpg"
                  alt="Logo"
                  style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                VARIATHU POWER TOOLS
              </h4>
              <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '12px', maxWidth: '420px', fontSize: '0.86rem' }}>
                Authorized dealership and repair center for professional power tools, high pressure washers, and genuine accessories in Kozhencherry, Pathanamthitta district, Kerala.
              </p>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                📍 Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641
              </p>
            </div>

            <div className="footer-clean-col">
              <h4>Quick Navigation</h4>
              <ul>
                <li><Link to="/">Home Page</Link></li>
                <li><Link to="/shop">Shop Power Tools</Link></li>
                <li><Link to="/about">About & Workshop Clinic</Link></li>
                <li><a href="#shop" onClick={() => setIsStoreModalOpen(true)}>Store Hours & Location</a></li>
              </ul>
            </div>

            <div className="footer-clean-col">
              <h4>Direct Contact</h4>
              <ul>
                <li><a href="tel:+919447123456">📞 +91 94471 23456</a></li>
                <li><a href="https://wa.me/919447123456" target="_blank" rel="noopener noreferrer">💬 WhatsApp Support</a></li>
                <li><span style={{ color: '#64748b' }}>✉️ variathupowertools@gmail.com</span></li>
                <li><span style={{ color: '#64748b' }}>🕒 Mon - Sat: 8:30 AM - 7:30 PM</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-clean-bottom">
            © {new Date().getFullYear()} Variathu Power Tools. Poyanil Building, Poyanil Junction, Kozhencherry, Kerala. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Cart Drawer */}
      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      {/* Store Info & Location Modal */}
      {isStoreModalOpen && (
        <StoreInfoModal
          onClose={() => setIsStoreModalOpen(false)}
          storeInfo={storeInfo}
        />
      )}

      {/* Admin Portal Modal */}
      {isAdminModalOpen && (
        <AdminModal
          onClose={() => setIsAdminModalOpen(false)}
          onProductUpdated={loadProducts}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
