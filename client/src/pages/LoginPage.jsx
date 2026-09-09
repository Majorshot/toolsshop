import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, CheckCircle2, Lock, Phone, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'store'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(activeTab, identifier, password, name);
      if (user.role === 'store') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomer = () => {
    setActiveTab('customer');
    setName('Raju Thomas');
    setIdentifier('+91 98471 88990');
    setTimeout(() => {
      login('customer', '+91 98471 88990', '', 'Raju Thomas')
        .then(() => navigate('/account'))
        .catch(err => setError(err.message));
    }, 100);
  };

  const handleQuickStoreOwner = () => {
    setActiveTab('store');
    setIdentifier('admin@variathupowertools.com');
    setPassword('admin123');
    setTimeout(() => {
      login('store', 'admin@variathupowertools.com', 'admin123', '')
        .then(() => navigate('/admin'))
        .catch(err => setError(err.message));
    }, 100);
  };

  return (
    <div style={{ padding: '36px 0 60px', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}
          >
            {activeTab === 'customer' ? <User size={26} /> : <ShieldCheck size={26} />}
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            {activeTab === 'customer' ? 'Customer Sign In' : 'Store Owner Portal'}
          </h1>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            {activeTab === 'customer'
              ? 'Track your tool orders and live delivery status'
              : 'Manage equipment inventory, prices, stock & customer orders'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: '#f8fafc',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            marginBottom: '22px'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('customer'); setError(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'customer' ? '#ffffff' : 'transparent',
              color: activeTab === 'customer' ? '#ea580c' : '#64748b',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'customer' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease'
            }}
            id="tab-customer-login"
          >
            <User size={15} />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('store'); setError(''); }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'store' ? '#ffffff' : 'transparent',
              color: activeTab === 'store' ? '#ea580c' : '#64748b',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: activeTab === 'store' ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s ease'
            }}
            id="tab-store-login"
          >
            <ShieldCheck size={15} />
            <span>Store Owner</span>
          </button>
        </div>

        {/* Quick Demo Login Helpers */}
        <div style={{ marginBottom: '20px' }}>
          {activeTab === 'customer' ? (
            <button
              type="button"
              onClick={handleQuickCustomer}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(234, 88, 12, 0.3)',
                borderRadius: '8px',
                color: '#ea580c',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              id="btn-demo-customer"
            >
              <Sparkles size={14} />
              <span>1-Click Demo: Login as Raju Thomas (+91 98471 88990)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickStoreOwner}
              style={{
                width: '100%',
                padding: '10px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              id="btn-demo-store-owner"
            >
              <Sparkles size={14} />
              <span>1-Click Demo: Login as Store Owner</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {activeTab === 'customer' ? (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raju Thomas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                  id="customer-name-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Phone Number or Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="+91 98471 88990"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    id="customer-phone-input"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Store Admin Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    required
                    placeholder="admin@variathupowertools.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    id="store-email-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 36px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      color: '#0f172a',
                      fontSize: '0.88rem',
                      outline: 'none'
                    }}
                    id="store-password-input"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-hero-clean"
            style={{ justifyContent: 'center', width: '100%', padding: '12px', marginTop: '6px' }}
            id="btn-submit-login"
          >
            <span>{loading ? 'Authenticating...' : activeTab === 'customer' ? 'Sign In & View Orders' : 'Access Store Manager'}</span>
            <ArrowRight size={17} />
          </button>
        </form>
      </div>
    </div>
  );
};
