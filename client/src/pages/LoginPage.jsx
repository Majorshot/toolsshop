import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, ArrowRight, Lock, Phone, Mail, AlertCircle,
  UserPlus, LogIn, CheckCircle2, Sparkles, Eye, EyeOff, Store, ChevronRight, Check,
  KeyRound, RefreshCw, Edit3, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnimatedContent from '../components/AnimatedContent';
import CodeSlots from '../components/CodeSlots';

export const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('customer'); // 'customer' or 'store'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Customer Step: 'input' (Step 1: Phone/Details) or 'otp' (Step 2: 6-Digit OTP)
  const [customerStep, setCustomerStep] = useState('input');
  const [otpCode, setOtpCode] = useState('');
  const [otpStatus, setOtpStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [devOtp, setDevOtp] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Form Fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [focusedField, setFocusedField] = useState(null);

  const { login, sendOtp, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const resetForm = () => {
    setIdentifier('');
    setPassword('');
    setName('');
    setEmail('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
    setCustomerStep('input');
    setOtpCode('');
    setOtpStatus('idle');
    setDevOtp('');
    setMaskedDestination('');
    setResendCountdown(0);
  };

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setCustomerStep('input');
    setOtpCode('');
    setOtpStatus('idle');
    setDevOtp('');
    setError('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleAutoFillOtp = (code) => {
    const clean = String(code).replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(clean);
    setOtpStatus('idle');
    setError('');
  };

  // Step 1: Send OTP to Customer
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (authMode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid email address for order invoices and OTP.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await sendOtp({
        phone: cleanPhone,
        purpose: authMode,
        name: name.trim(),
        email: email.trim()
      });

      setCustomerStep('otp');
      setMaskedDestination(res.maskedDestination || `+91 ${cleanPhone}`);
      setDevOtp(res.devOtp || '');
      setResendCountdown(30);
      setSuccessMsg(res.message || 'Verification OTP sent successfully!');
      setOtpCode('');
      setOtpStatus('idle');
    } catch (err) {
      setError(err.message || 'Failed to dispatch security OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
      const res = await resendOtp({
        phone: cleanPhone,
        purpose: authMode
      });
      setDevOtp(res.devOtp || '');
      setResendCountdown(30);
      setSuccessMsg('A new verification code has been dispatched.');
      setOtpCode('');
      setOtpStatus('idle');
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Sign In / Register
  const handleVerifyOtp = async (e, directCode) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const enteredOtp = (typeof directCode === 'string' ? directCode : otpCode).replace(/[^0-9]/g, '').trim();
    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      setOtpStatus('error');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = identifier.replace(/[^0-9]/g, '').slice(-10);
      await verifyOtp({
        phone: cleanPhone,
        otp: enteredOtp,
        purpose: authMode
      });
      setOtpStatus('success');
      setTimeout(() => {
        navigate('/account');
      }, 700);
    } catch (err) {
      setOtpStatus('error');
      setError(err.message || 'Verification failed. Please check the code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  // Store Manager Login (Password credentials - unaffected by Resend test limits)
  const handleStoreAdminLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setError('Please enter your store admin email.');
      return;
    }
    if (!password) {
      setError('Please enter your administrator password.');
      return;
    }

    setLoading(true);

    try {
      await login('store', identifier.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid store credentials. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
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
        <div className="login-auth-card">

          {/* Top Header Section */}
          <div className="login-card-header">
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
              ) : customerStep === 'otp' ? (
                <>
                  <KeyRound size={12} />
                  <span>Live Security OTP Verification</span>
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
                : customerStep === 'otp'
                  ? 'Verify Security Code'
                  : authMode === 'register'
                    ? 'Create Customer Account'
                    : 'Customer Sign In'
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
                : customerStep === 'otp'
                  ? `Enter the 6-digit OTP sent to ${maskedDestination}`
                  : authMode === 'register'
                    ? 'Register with your mobile to receive instant OTP verification'
                    : 'Enter your 10-digit mobile number to receive a secure OTP'
              }
            </p>
          </div>

          {/* Form Content Area */}
          <div className="login-card-body">
            
            {/* Customer Mode: Sliding Segmented Control (Only in Input Step) */}
            {activeTab === 'customer' && customerStep === 'input' && (
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
                  <span>Sign In (OTP)</span>
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
                gap: '10px'
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

            {/* ======================================================== */}
            {/* VIEW A: STORE ADMIN LOGIN (Password-Based)                */}
            {/* ======================================================== */}
            {activeTab === 'store' && (
              <form onSubmit={handleStoreAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                    Admin Email Address <span style={{ color: '#4f46e5' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
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
                  </div>
                </div>

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
                    Security Password <span style={{ color: '#4f46e5' }}>*</span>
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

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
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
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                    marginTop: '8px',
                    opacity: loading ? 0.75 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  id="btn-admin-submit"
                >
                  {loading ? <span>Signing In...</span> : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ======================================================== */}
            {/* VIEW B1: CUSTOMER STEP 1 - PHONE & DETAILS INPUT          */}
            {/* ======================================================== */}
            {activeTab === 'customer' && customerStep === 'input' && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Registration: Full Name */}
                {authMode === 'register' && (
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

                {/* Customer Phone input with +91 badge */}
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
                    Mobile Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  
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
                      placeholder="94475 59333"
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

                  {authMode === 'login' && (
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Shield size={12} color="#16a34a" />
                      <span>We'll send a 6-digit one-time password (OTP) to your phone & email</span>
                    </div>
                  )}
                </div>

                {/* Registration: Email Address */}
                {authMode === 'register' && (
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
                      Email Address (for Invoices & Security OTP) <span style={{ color: '#dc2626' }}>*</span>
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

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                    marginTop: '8px',
                    opacity: loading ? 0.75 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  id="btn-send-otp"
                >
                  {loading ? (
                    <span>Sending Verification Code...</span>
                  ) : (
                    <>
                      <KeyRound size={17} />
                      <span>
                        {authMode === 'register' ? 'Send OTP & Register' : 'Send Verification OTP'}
                      </span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

              </form>
            )}

            {/* ======================================================== */}
            {/* VIEW B2: CUSTOMER STEP 2 - 6-DIGIT OTP VERIFICATION      */}
            {/* ======================================================== */}
            {activeTab === 'customer' && customerStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                
                {/* Destination info pill with edit action */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#334155' }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>Sent to: <strong>+91 {identifier.replace(/[^0-9]/g, '').slice(-10)}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerStep('input');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                    id="btn-change-phone"
                  >
                    <Edit3 size={13} />
                    <span>Change</span>
                  </button>
                </div>

                {/* Instant 1-Click Developer/Sandbox Test OTP Banner */}
                {devOtp && (
                  <div
                    onClick={() => handleAutoFillOtp(devOtp)}
                    title="Click to automatically paste OTP"
                    style={{
                      background: '#fffbeb',
                      border: '1.5px dashed #f59e0b',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    id="pill-dev-otp"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>⚡</span>
                      <span style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>
                        Sandbox Test OTP: <strong style={{ letterSpacing: '2px', fontSize: '0.92rem', color: '#78350f', fontFamily: 'monospace' }}>{devOtp}</strong>
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      color: '#b45309',
                      fontWeight: '800',
                      textDecoration: 'underline',
                      background: '#fef3c7',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      Auto-Fill ↵
                    </span>
                  </div>
                )}

                {/* 6-Digit OTP Box Grid using CodeSlots */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#475569',
                    textAlign: 'center',
                    marginBottom: '12px'
                  }}>
                    Enter 6-Digit Verification Code
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '4px 0 14px' }}>
                    <CodeSlots
                      length={6}
                      value={otpCode}
                      status={otpStatus}
                      onChange={(code) => {
                        setOtpCode(code);
                        if (otpStatus !== 'idle') setOtpStatus('idle');
                        if (error) setError('');
                      }}
                      onComplete={async (code) => {
                        await handleVerifyOtp(null, code);
                      }}
                      accentColor="#f5f5f5"
                      inkColor="#f5f5f5"
                      slotColor="#27272a"
                      digitColor="#18181b"
                      dangerColor="#ff3b30"
                      slotSize={44}
                      gap={8}
                      radius={12}
                      bounce={0.2}
                      settle={0.3}
                      rise={8}
                      cascade={20}
                      mask={false}
                      caret
                      outcome="accept"
                      disabled={loading || otpStatus === 'success'}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Verify Action Button */}
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6 || otpStatus === 'success'}
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    background: otpStatus === 'success' ? '#16a34a' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.92rem',
                    fontWeight: '700',
                    cursor: (loading || otpCode.length !== 6 || otpStatus === 'success') ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)',
                    opacity: (loading || otpCode.length !== 6) ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  id="btn-verify-otp"
                >
                  {loading ? (
                    <span>Verifying Code...</span>
                  ) : otpStatus === 'success' ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Verified! Signing in...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Verify &amp; Continue</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {/* Resend OTP & Back controls */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  fontSize: '0.82rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerStep('input');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back</span>
                  </button>

                  <div>
                    {resendCountdown > 0 ? (
                      <span style={{ color: '#94a3b8', fontWeight: '500' }}>
                        Resend OTP in <strong style={{ color: '#0f172a' }}>{resendCountdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                        id="btn-resend-otp"
                      >
                        <RefreshCw size={13} className={loading ? 'spin-slow' : ''} />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </div>

              </form>
            )}

            {/* Bottom Quick Switch Link */}
            {activeTab === 'customer' && customerStep === 'input' && (
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
              <ShieldCheck size={12} color="#0284c7" />
              <span>Instant OTP</span>
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
          <a href="tel:+919447559333" style={{ color: '#0f172a', fontWeight: '700', textDecoration: 'none' }}>
            +91 94475 59333
          </a>
        </div>

      </AnimatedContent>
    </div>
  );
};

export default LoginPage;
