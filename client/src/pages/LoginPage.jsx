import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ArrowRight, Lock, Phone, Mail, AlertCircle, UserPlus, LogIn, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedContent from '../components/AnimatedContent';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'store'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setIdentifier('');
    setPassword('');
    setName('');
    setEmail('');
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (activeTab === 'store') {
      if (!identifier.trim()) { setError('Please enter your store admin email'); return; }
      if (!password) { setError('Please enter your password'); return; }
    } else if (authMode === 'login') {
      if (!identifier.trim()) { setError('Please enter your 10-digit mobile number'); return; }
    } else {
      // Register validations
      if (!name.trim()) { setError('Please enter your full name'); return; }
      if (!identifier.trim() || identifier.trim().length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
      if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address'); return; }
    }

    setLoading(true);

    try {
      if (activeTab === 'store') {
        const user = await login('store', identifier.trim(), password);
        navigate('/admin');
      } else if (authMode === 'login') {
        const user = await login('customer', identifier.trim());
        navigate('/account');
      } else {
        // Register
        const user = await register({
          name: name.trim(),
          phone: identifier.trim(),
          email: email.trim()
        });
        navigate('/account');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    color: '#0f172a',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  };

  const inputFocusStyle = {
    borderColor: '#ea580c',
    boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)'
  };

  const iconStyle = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8'
  };

  return (
    <div style={{
      padding: '40px 16px 80px',
      display: 'flex',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 180px)'
    }}>
      <AnimatedContent distance={30} delay={0.05} style={{ width: '100%', maxWidth: '480px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)'
          }}
        >
          {/* Header with gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '28px 28px 24px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: 'rgba(234, 88, 12, 0.1)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: -30,
              left: -15,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(234, 88, 12, 0.06)',
              pointerEvents: 'none'
            }} />

            <img
              src="/Logo.jpeg"
              alt="Variathu Power Tools"
              style={{ height: '36px', width: 'auto', objectFit: 'contain', marginBottom: '14px' }}
            />

            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: activeTab === 'store'
                ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                : authMode === 'register'
                  ? 'linear-gradient(135deg, #ea580c, #dc2626)'
                  : 'linear-gradient(135deg, #ea580c, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              {activeTab === 'store'
                ? <ShieldCheck size={24} color="#fff" />
                : authMode === 'register'
                  ? <UserPlus size={24} color="#fff" />
                  : <LogIn size={24} color="#fff" />
              }
            </div>

            <h1 style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              color: '#ffffff',
              letterSpacing: '-0.02em',
              marginBottom: '4px'
            }}>
              {activeTab === 'store'
                ? 'Store Owner Portal'
                : authMode === 'register'
                  ? 'Create Your Account'
                  : 'Welcome Back'
              }
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
              {activeTab === 'store'
                ? 'Manage inventory, orders & business analytics'
                : authMode === 'register'
                  ? 'Sign up to track orders, download GST invoices & more'
                  : 'Sign in with your mobile number to continue'
              }
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px 28px' }}>
            {/* Role Tab Switcher */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={() => { setActiveTab('customer'); setAuthMode('login'); resetForm(); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
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
                  boxShadow: activeTab === 'customer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                id="tab-customer-login"
              >
                <User size={15} />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('store'); resetForm(); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === 'store' ? '#ffffff' : 'transparent',
                  color: activeTab === 'store' ? '#7c3aed' : '#64748b',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: activeTab === 'store' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                id="tab-store-login"
              >
                <ShieldCheck size={15} />
                <span>Store Owner</span>
              </button>
            </div>

            {/* Login/Register Toggle (Customer only) */}
            {activeTab === 'customer' && (
              <div style={{
                display: 'flex',
                background: '#fff7ed',
                borderRadius: '10px',
                padding: '3px',
                marginBottom: '20px',
                border: '1px solid #fed7aa'
              }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authMode === 'login' ? '#ea580c' : 'transparent',
                    color: authMode === 'login' ? '#ffffff' : '#9a3412',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LogIn size={14} />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setError(''); setSuccessMsg(''); }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: authMode === 'register' ? '#ea580c' : 'transparent',
                    color: authMode === 'register' ? '#ffffff' : '#9a3412',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <UserPlus size={14} />
                  Register
                </button>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  animation: 'fadeIn 0.2s ease'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMsg && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#16a34a',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTab === 'customer' ? (
                <>
                  {/* Register: Name field */}
                  {authMode === 'register' && (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={16} style={iconStyle} />
                        <input
                          type="text"
                          required
                          placeholder="Enter your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                          style={inputStyle}
                          id="customer-name-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mobile Number (both login & register) */}
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Mobile Number *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={iconStyle} />
                      <input
                        type="tel"
                        required
                        placeholder="Enter 10-digit mobile number"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        style={inputStyle}
                        id="customer-phone-input"
                        maxLength={10}
                      />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                      {authMode === 'login'
                        ? 'Enter the mobile number linked to your account'
                        : 'This will be your login identifier'
                      }
                    </span>
                  </div>

                  {/* Register: Email field */}
                  {authMode === 'register' && (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Email Address *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={iconStyle} />
                        <input
                          type="email"
                          required
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                          onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                          style={inputStyle}
                          id="customer-email-input"
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                        Order confirmations & GST invoices will be sent here
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Store Admin Email *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={iconStyle} />
                      <input
                        type="email"
                        required
                        placeholder="Enter store admin email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        style={inputStyle}
                        id="store-email-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={iconStyle} />
                      <input
                        type="password"
                        required
                        placeholder="Enter store password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                        style={inputStyle}
                        id="store-password-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  marginTop: '4px',
                  border: 'none',
                  borderRadius: '12px',
                  background: activeTab === 'store'
                    ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
                    : 'linear-gradient(135deg, #ea580c, #dc2626)',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.92rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.25)',
                  transition: 'all 0.2s ease',
                  transform: 'translateY(0)'
                }}
                onMouseEnter={(e) => { if (!loading) { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.35)'; }}}
                onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 14px rgba(234, 88, 12, 0.25)'; }}
                id="btn-submit-login"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : activeTab === 'store' ? (
                  <>
                    <ShieldCheck size={17} />
                    <span>Access Store Dashboard</span>
                  </>
                ) : authMode === 'register' ? (
                  <>
                    <UserPlus size={17} />
                    <span>Create Account</span>
                  </>
                ) : (
                  <>
                    <LogIn size={17} />
                    <span>Sign In</span>
                  </>
                )}
                <ArrowRight size={16} />
              </button>
            </form>

            {/* Bottom Toggle Link */}
            {activeTab === 'customer' && (
              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                paddingTop: '18px',
                borderTop: '1px solid #f1f5f9'
              }}>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                  {authMode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('register'); setError(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ea580c',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px'
                        }}
                      >
                        Register here
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => { setAuthMode('login'); setError(''); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ea580c',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '0.84rem',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px'
                        }}
                      >
                        Sign in here
                      </button>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Security Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '16px',
              padding: '10px',
              background: '#f8fafc',
              borderRadius: '8px'
            }}>
              <Lock size={12} color="#94a3b8" />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Secured by Variathu Power Tools • Your data is safe with us
              </span>
            </div>
          </div>
        </div>
      </AnimatedContent>
    </div>
  );
};

export default LoginPage;
