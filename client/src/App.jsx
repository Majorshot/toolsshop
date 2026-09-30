import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate, useNavigationType } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { AboutPage } from './pages/AboutPage';
import { CartPage } from './pages/CartPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { StoreInfoModal } from './components/StoreInfoModal';
import { AdminModal } from './components/AdminModal';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { CustomerAccountPage } from './pages/CustomerAccountPage';
import { StoreDashboardPage } from './pages/StoreDashboardPage';
import { api } from './services/api';
import { CheckCircle, MessageCircle } from 'lucide-react';
import AnimatedContent from './components/AnimatedContent';
import SlideInNotifications from './components/SlideInNotifications';
import { ConfirmationProvider } from './components/SpringModal';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Scroll to top on route change ONLY for fresh forward navigation (PUSH)
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // When returning via browser back button or history navigation (POP),
    // preserve previous reading position instead of forcefully jumping to top
    if (navType === 'POP') {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    try {
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 100);
    } catch {}
  }, [pathname, navType]);
  return null;
}

// Protected Route Guard for Store Dashboard (/admin)
function ProtectedAdminRoute({ children }) {
  const { isLoggedIn, isStoreOwner } = useAuth();
  if (!isLoggedIn || !isStoreOwner) {
    return <Navigate to="/login?portal=admin" replace />;
  }
  return children;
}

const MainApp = () => {
  const { toastMessage } = useCart() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // All Catalog Products (Unfiltered base for HomePage, Catalog counts and Shop)
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeBrand, setActiveBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  // Modals
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Store information
  const [storeInfo, setStoreInfo] = useState(null);

  // Load all products for the store (unfiltered base) with auto-retry
  const loadProducts = async (retryCount = 0, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.getProducts();
      setAllProducts(res.data || []);
      setError(null);
      // Also refresh store info if needed
      api.getStoreInfo()
        .then(sRes => { if (sRes?.data) setStoreInfo(sRes.data); })
        .catch(() => {});
    } catch (err) {
      console.error('Failed to load products from backend:', err);
      if (retryCount < 3) {
        setError(`Connecting to database... (retrying ${retryCount + 1}/3)`);
        setTimeout(() => {
          loadProducts(retryCount + 1, silent);
        }, 2500);
      } else {
        setError('Could not connect to equipment server. Please ensure backend is running on port 5000.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Real-time multi-tab & admin sync via BroadcastChannel
  useEffect(() => {
    let bc = null;
    try {
      bc = new BroadcastChannel('vpt_inventory_channel');
      bc.onmessage = (event) => {
        const data = event?.data;
        if (data?.type === 'PRODUCT_DELETED') {
          const delId = data.productId;
          const customId = data.customId;
          const mongoId = data.mongoId;
          setAllProducts(prev => prev.filter(p => {
            if (delId && (p.id === delId || p._id === delId)) return false;
            if (customId && (p.id === customId || p._id === customId)) return false;
            if (mongoId && (p.id === mongoId || p._id === mongoId)) return false;
            return true;
          }));
        } else if (data?.type === 'PRODUCT_ADDED' && data.product) {
          setAllProducts(prev => [data.product, ...prev.filter(p => (p.id || p._id) !== (data.product.id || data.product._id))]);
        } else if (data?.type === 'PRODUCT_UPDATED' && data.product) {
          const updId = data.product.id || data.product._id;
          setAllProducts(prev => prev.map(p => (p.id === updId || p._id === updId) ? { ...p, ...data.product } : p));
        }
        loadProducts(0, true);
      };
    } catch (e) {}
    return () => {
      if (bc) bc.close();
    };
  }, []);

  useEffect(() => {
    api.getStoreInfo()
      .then(res => setStoreInfo(res.data))
      .catch(err => console.error(err));
  }, []);

  // 24/7 Render Keep-Alive: Client heartbeat pings backend every 10 minutes
  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      api.pingKeepAlive().catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(heartbeatTimer);
  }, []);

  return (
    <div className="app-layout">
      <ScrollToTop />

      {/* Animated Slide-In Notifications */}
      <SlideInNotifications />

      {/* Navbar (Hidden on Admin Portal) */}
      {!isAdminRoute && (
        <Navbar
          onOpenStoreModal={() => setIsStoreModalOpen(true)}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          storeInfo={storeInfo}
        />
      )}

      {/* Backend Disconnection Banner */}
      {error && !loading && (
        <div
          style={{
            background: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            position: 'sticky',
            top: isAdminRoute ? '0px' : '72px',
            zIndex: 90
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => loadProducts(0)}
            style={{
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Routes Content */}
      <main className="app-main-content">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={allProducts}
                onSelectProduct={(p) => navigate(`/product/${p.id || p._id}`)}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <div className="container">
                <ShopPage
                  products={allProducts}
                  loading={loading}
                  error={error}
                  onRetry={() => loadProducts(0)}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  activeBrand={activeBrand}
                  setActiveBrand={setActiveBrand}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortBy={sortBy}
                  onSelectProduct={(p) => {
                    const key = p.id || p._id;
                    try {
                      if (key) sessionStorage.setItem('shop_last_product_id', String(key));
                      sessionStorage.setItem('shop_scroll_pos', String(window.scrollY || window.pageYOffset || 0));
                    } catch (e) {}
                    navigate(`/product/${key}`);
                  }}
                />
              </div>
            }
          />
          <Route
            path="/product/:id"
            element={<div className="container"><ProductDetailPage /></div>}
          />
          <Route
            path="/about"
            element={<div className="container"><AboutPage /></div>}
          />
          <Route
            path="/cart"
            element={<div className="container"><CartPage /></div>}
          />
          <Route
            path="/checkout"
            element={<CheckoutPage />}
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
            path="/customer"
            element={<Navigate to="/account" replace />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <StoreDashboardPage onProductUpdated={() => loadProducts(0, true)} />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>

      {/* Floating Speed-Dial WhatsApp Button (Hidden on Admin Portal) */}
      {!isAdminRoute && (
        <a
          href="https://wa.me/919447559333?text=Hello%20Variathu%20Power%20Tools,%20I%20need%20assistance%20with%20power%20tools%20in%20Kozhencherry."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            zIndex: 1001,
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
      )}

      {/* Minimal Clean Footer (Hidden on Admin Portal) */}
      {!isAdminRoute && (
        <footer className="main-footer-clean">
          <div className="container">
            <div className="footer-clean-grid">
              <div className="footer-clean-col">
                <div style={{ marginBottom: '14px' }}>
                  <img
                    src="/Logo.jpeg"
                    alt="Variathu Power Tools"
                    style={{ height: '36px', width: 'auto', objectFit: 'contain', borderRadius: '4px' }}
                  />
                </div>
                <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '12px', maxWidth: '420px', fontSize: '0.86rem' }}>
                  Authorized dealership and repair center for professional power tools, high pressure washers, and genuine accessories in Kozhencherry, Pathanamthitta district, Kerala.
                </p>
                <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  <a
                    href="https://maps.app.goo.gl/YXTeLEdnMQkeNWjK8"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    title="Open in Google Maps"
                  >
                    📍 Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641
                  </a>
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
                  <li><a href="tel:+919447559333">📞 +91 94475 59333</a></li>
                  <li><a href="https://wa.me/919447559333" target="_blank" rel="noopener noreferrer">💬 WhatsApp Support</a></li>
                  <li><span style={{ color: '#64748b' }}>✉️ variathupowertools@gmail.com</span></li>
                  <li><span style={{ color: '#64748b' }}>🕒 Mon - Sat: 8:00 AM - 8:00 PM</span></li>
                </ul>
              </div>
            </div>

            <div className="footer-clean-bottom">
              © {new Date().getFullYear()} Variathu Power Tools. Poyanil Building, Poyanil Junction, Kozhencherry, Kerala. All rights reserved.
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Navigation (Hidden on Admin Portal) */}
      {!isAdminRoute && <MobileBottomNav />}





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
          <ConfirmationProvider>
            <MainApp />
          </ConfirmationProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
