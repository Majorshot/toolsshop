import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Phone, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedContent from '../components/AnimatedContent';

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

    // Customer validation: Name & Mobile number are both mandatory
    if (activeTab === 'customer') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!identifier.trim()) {
        setError('Please enter your 10-digit mobile number');
        return;
      }
    } else {
      if (!identifier.trim()) {
        setError('Please enter your store admin email');
        return;
      }
      if (!password) {
        setError('Please enter your password');
        return;
      }
    }

    setLoading(true);

    try {
      const user = await login(activeTab, identifier.trim(), password, name.trim());
      if (user.role === 'store') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '36px 0 60px', display: 'flex', justifyContent: 'center' }}>
      <AnimatedContent distance={30} delay={0.05} style={{ width: '100%', maxWidth: '460px' }}>
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
            <div style={{ marginBottom: '16px' }}>
              <img
                src="/Logo.jpeg"
                alt="Variathu Power Tools"
                style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
              />
            </div>
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
              {activeTab === 'customer' ? 'Customer Portal' : 'Store Owner Portal'}
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
              {activeTab === 'customer'
                ? 'Track equipment orders, download GST invoices & verify warranty'
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

          {/* Official Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeTab === 'customer' ? (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      id="customer-name-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Mobile Number *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      required
                      placeholder="Enter 10-digit mobile number (e.g. 9847123456)"
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
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Quick access to all your orders linked to this mobile number
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                    Store Admin Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      required
                      placeholder="Enter store email"
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
                    Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="password"
                      required
                      placeholder="Enter store password"
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
              <span>{loading ? 'Verifying...' : activeTab === 'customer' ? 'Sign In & View Orders' : 'Access Store Manager'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </AnimatedContent>
    </div>
  );
};

export default LoginPage;
