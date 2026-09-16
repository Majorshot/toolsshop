import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, ArrowRight, Lock, Phone, Mail, AlertCircle,
  UserPlus, LogIn, CheckCircle2, Sparkles, Eye, EyeOff, Store, ChevronRight, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedContent from '../components/AnimatedContent';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'store'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [focusedField, setFocusedField] = useState(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setIdentifier('');
    setPassword('');
    setName('');
    setEmail('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (activeTab === 'store') {
      if (!identifier.trim()) { setError('Please enter your store admin email.'); return; }
      if (!password) { setError('Please enter your administrator password.'); return; }
    } else if (authMode === 'login') {
      const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else {
      // Register validations
      if (!name.trim()) { setError('Please enter your full name.'); return; }
      const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
      if (!cleanPhone || cleanPhone.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    setLoading(true);

    try {
      if (activeTab === 'store') {
        await login('store', identifier.trim(), password);
        navigate('/admin');
      } else if (authMode === 'login') {
        const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
        await login('customer', cleanPhone);
        navigate('/account');
      } else {
        // Register new customer account
        const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
        await register({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim()
        });
        navigate('/account');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 160px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px 64px',
      position: 'relative',
      background: 'radial-gradient(ellipse at 50% 10%, rgba(220, 38, 38, 0.05) 0%, rgba(248, 250, 252, 0.95) 70%)'
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '350px',
        background: activeTab === 'store'
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <AnimatedContent distance={24} delay={0.05} style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        
        {/* Main Minimalist Auth Card */}
        <div style={{
          width: '100%',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(226, 232, 240, 0.85)',
          boxShadow: '0 20px 45px -15px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.02)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>

          {/* Top Header Section */}
          <div style={{
            padding: '32px 32px 24px',
            textAlign: 'center',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)'
          }}>
            {/* Real Logo Image */}
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
              <img
                src="/Logo.jpeg"
                alt="Variathu Power Tools"
                style={{
                  height: '38px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>

            {/* Badge pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: activeTab === 'store' ? '#eef2ff' : '#fef2f2',
              border: activeTab === 'store' ? '1px solid #e0e7ff' : '1px solid #fee2e2',
              color: activeTab === 'store' ? '#4f46e5' : '#dc2626',
              fontSize: '0.72rem',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              {activeTab === 'store' ? (
                <>
                  <ShieldCheck size={12} />
                  <span>Store Administration Portal</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Kozhencherry, Kerala &bull; Est. 2005</span>
                </>
              )}
            </div>

            <h1 style={{
              fontSize: '1.35rem',
              fontWeight: '800',
              color: '#0f172a',
              letterSpacing: '-0.025em',
              margin: '0 0 6px'
            }}>
              {activeTab === 'store'
                ? 'Store Manager Sign In'
                : authMode === 'register'
                  ? 'Create Customer Account'
                  : 'Welcome Back'
              }
            </h1>

            <p style={{
              fontSize: '0.84rem',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.45
            }}>
              {activeTab === 'store'
                ? 'Sign in to access inventory, orders & accounting analytics'
                : authMode === 'register'
                  ? 'Join Variathu to track equipment orders & GST invoices'
                  : 'Enter your 10-digit mobile number to access your account'
              }
            </p>
          </div>

          {/* Form Content Area */}
          <div style={{ padding: '24px 32px 30px' }}>
            
            {/* Customer Mode: Sliding Segmented Control */}
            {activeTab === 'customer' && (
              <div style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: '#f1f5f9',
                padding: '4px',
                borderRadius: '14px',
                marginBottom: '22px'
              }}>
                {/* Sliding indicator pill */}
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  left: authMode === 'login' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                  height: 'calc(100% - 8px)',
                  background: '#ffffff',
                  borderRadius: '11px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
                  transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 0
                }} />

                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '9px 12px',
                    borderRadius: '11px',
                    border: 'none',
                    background: 'transparent',
                    color: authMode === 'login' ? '#0f172a' : '#64748b',
                    fontWeight: authMode === 'login' ? '700' : '600',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'color 0.2s ease'
                  }}
                  id="tab-sign-in"
                >
                  <LogIn size={15} color={authMode === 'login' ? '#dc2626' : '#64748b'} />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '9px 12px',
                    borderRadius: '11px',
                    border: 'none',
                    background: 'transparent',
                    color: authMode === 'register' ? '#0f172a' : '#64748b',
                    fontWeight: authMode === 'register' ? '700' : '600',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'color 0.2s ease'
                  }}
                  id="tab-create-account"
                >
                  <UserPlus size={15} color={authMode === 'register' ? '#dc2626' : '#64748b'} />
                  <span>New Customer</span>
                </button>
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                animation: 'slideDown 0.25s ease'
              }}>
                <AlertCircle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.83rem', color: '#991b1b', lineHeight: 1.45, fontWeight: '500' }}>
                  {error}
                </div>
              </div>
            )}

            {/* Success Message Box */}
            {successMsg && (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <CheckCircle2 size={17} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.83rem', color: '#166534', lineHeight: 1.45, fontWeight: '500' }}>
                  {successMsg}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* REGISTER FIELD: Full Name */}
              {activeTab === 'customer' && authMode === 'register' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px'
                  }}>
                    Full Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: focusedField === 'name' ? '#dc2626' : '#94a3b8',
                      transition: 'color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <User size={17} />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Thomas Mathew"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="name"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#ffffff',
                        border: focusedField === 'name' ? '1.5px solid #dc2626' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxShadow: focusedField === 'name' ? '0 0 0 4px rgba(220, 38, 38, 0.08)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      id="input-full-name"
                    />
                  </div>
                </div>
              )}

              {/* CUSTOMER PHONE / ADMIN EMAIL FIELD */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#475569',
                  marginBottom: '6px'
                }}>
                  {activeTab === 'store' ? 'Admin Email Address' : 'Mobile Number'} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                
                <div style={{ position: 'relative' }}>
                  {activeTab === 'store' ? (
                    <>
                      <div style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: focusedField === 'identifier' ? '#4f46e5' : '#94a3b8',
                        transition: 'color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <Mail size={17} />
                      </div>
                      <input
                        type="email"
                        placeholder="admin@variathupowertools.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        onFocus={() => setFocusedField('identifier')}
                        onBlur={() => setFocusedField(null)}
                        autoComplete="email"
                        style={{
                          width: '100%',
                          padding: '12px 14px 12px 42px',
                          background: '#ffffff',
                          border: focusedField === 'identifier' ? '1.5px solid #4f46e5' : '1.5px solid #e2e8f0',
                          borderRadius: '12px',
                          color: '#0f172a',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxShadow: focusedField === 'identifier' ? '0 0 0 4px rgba(79, 70, 229, 0.08)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        id="input-admin-email"
                      />
                    </>
                  ) : (
                    /* Customer Phone input with integrated +91 Badge */
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: focusedField === 'phone' ? '1.5px solid #dc2626' : '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: focusedField === 'phone' ? '0 0 0 4px rgba(220, 38, 38, 0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <div style={{
                        padding: '11px 12px 11px 14px',
                        background: '#f8fafc',
                        borderRight: '1px solid #e2e8f0',
                        color: '#334155',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        userSelect: 'none'
                      }}>
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="94471 23456"
                        value={identifier}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setIdentifier(val);
                        }}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        autoComplete="tel"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: 'none',
                          outline: 'none',
                          color: '#0f172a',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          letterSpacing: '0.04em'
                        }}
                        id="input-mobile-number"
                      />
                    </div>
                  )}
                </div>
                
                {activeTab === 'customer' && authMode === 'login' && (
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} color="#16a34a" />
                    <span>Existing customers can sign in instantly without password</span>
                  </div>
                )}
              </div>

              {/* REGISTER FIELD: Email Address */}
              {activeTab === 'customer' && authMode === 'register' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px'
                  }}>
                    Email Address (for Invoices &amp; Updates) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: focusedField === 'email' ? '#dc2626' : '#94a3b8',
                      transition: 'color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Mail size={17} />
                    </div>
                    <input
                      type="email"
                      placeholder="e.g. customer@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="email"
                      style={{
                        width: '100%',
                        padding: '12px 14px 12px 42px',
                        background: '#ffffff',
                        border: focusedField === 'email' ? '1.5px solid #dc2626' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(220, 38, 38, 0.08)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      id="input-customer-email"
                    />
                  </div>
                </div>
              )}

              {/* STORE ADMIN PASSWORD FIELD */}
              {activeTab === 'store' && (
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    marginBottom: '6px'
                  }}>
                    Security Password <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: focusedField === 'password' ? '#4f46e5' : '#94a3b8',
                      transition: 'color 0.2s ease',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Lock size={17} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 42px',
                        background: '#ffffff',
                        border: focusedField === 'password' ? '1.5px solid #4f46e5' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(79, 70, 229, 0.08)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                      id="input-admin-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  background: activeTab === 'store'
                    ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)'
                    : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: activeTab === 'store'
                    ? '0 4px 14px rgba(79, 70, 229, 0.3)'
                    : '0 4px 14px rgba(220, 38, 38, 0.25)',
                  marginTop: '8px',
                  opacity: loading ? 0.75 : 1,
                  transition: 'all 0.2s ease'
                }}
                id="btn-auth-submit"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {activeTab === 'store'
                        ? 'Sign In to Dashboard'
                        : authMode === 'register'
                          ? 'Complete Registration'
                          : 'Sign In to Account'
                      }
                    </span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>

            {/* Bottom Quick Switch Link */}
            {activeTab === 'customer' && (
              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                {authMode === 'login' ? (
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    New to Variathu Power Tools?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('register')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      id="link-register"
                    >
                      Create account here
                    </button>
                  </p>
                ) : (
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => handleModeSwitch('login')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      id="link-login"
                    >
                      Sign in here
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '24px 0 18px',
              color: '#cbd5e1'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>
                {activeTab === 'customer' ? 'Store Staff' : 'Customer Area'}
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Discreet Portal Switcher */}
            {activeTab === 'customer' ? (
              <button
                type="button"
                onClick={() => handleTabSwitch('store')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '11px',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                id="btn-switch-store-admin"
              >
                <Store size={14} color="#64748b" />
                <span>Store Owner &amp; Staff Login</span>
                <ChevronRight size={13} color="#94a3b8" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleTabSwitch('customer')}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '11px',
                  color: '#475569',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                id="btn-switch-customer"
              >
                <User size={14} color="#64748b" />
                <span>&larr; Return to Customer Login</span>
              </button>
            )}

          </div>

          {/* Minimalist Trust Features Strip */}
          <div style={{
            background: '#fafbfc',
            borderTop: '1px solid #f1f5f9',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            fontSize: '0.74rem',
            color: '#64748b',
            fontWeight: '600'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lock size={12} color="#16a34a" />
              <span>256-Bit SSL</span>
            </div>
            <div style={{ width: '3px', height: '3px', background: '#cbd5e1', borderRadius: '50%' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} color="#0284c7" />
              <span>Instant Access</span>
            </div>
            <div style={{ width: '3px', height: '3px', background: '#cbd5e1', borderRadius: '50%' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={12} color="#ea580c" />
              <span>Kerala GST</span>
            </div>
          </div>

        </div>

        {/* Helpline note */}
        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '0.78rem',
          color: '#64748b'
        }}>
          Need help? Call our Kozhencherry workshop:{' '}
          <a href="tel:+919447123456" style={{ color: '#0f172a', fontWeight: '700', textDecoration: 'none' }}>
            +91 94471 23456
          </a>
        </div>

      </AnimatedContent>
    </div>
  );
};

export default LoginPage;
