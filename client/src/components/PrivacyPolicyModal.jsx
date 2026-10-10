import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, FileText, Cookie, X, Lock, CheckCircle2, Truck, Phone, Mail, Building, HelpCircle } from 'lucide-react';

export const PrivacyPolicyModal = ({ isOpen, onClose, initialTab = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '88vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dbeafe'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2
                id="privacy-modal-title"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.2
                }}
              >
                Privacy, Terms & Consent
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                Variathu Power Tools • Kozhencherry, Kerala
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'background 0.2s ease'
            }}
            title="Close"
            id="btn-close-privacy-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 16px',
            overflowX: 'auto'
          }}
          className="no-scrollbar"
        >
          {[
            { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
            { id: 'terms', label: 'Terms of Use', icon: FileText },
            { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
            { id: 'grievance', label: 'Store & Grievance', icon: Building }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isSelected ? '2.5px solid #dc2626' : '2.5px solid transparent',
                  color: isSelected ? '#dc2626' : '#64748b',
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            color: '#334155'
          }}
        >
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <Lock size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ margin: '0 0 4px', color: '#166534', fontWeight: '700', fontSize: '0.92rem' }}>
                    100% Privacy Guarantee
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#14532d' }}>
                    Variathu Power Tools adheres strictly to the <strong>Digital Personal Data Protection Act, 2023 (DPDP)</strong> and the Information Technology Act. We never sell, rent, or trade your personal data with third-party advertisers.
                  </p>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  1. Information We Collect
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  When you browse our catalog, register an account, or place an order, we collect:
                </p>
                <ul style={{ margin: '0 0 12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li><strong>Account Identifiers:</strong> Your full name, mobile phone number, and optional email address.</li>
                  <li><strong>Delivery Address:</strong> Doorstep address, building/house name, landmark, town/district, state, and 6-digit postal pincode.</li>
                  <li><strong>Session & Cart Keys:</strong> Local browser storage tokens to keep you logged in and preserve items in your active shopping cart.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  2. Purpose of Data Processing
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  We process customer personal data strictly for lawful e-commerce fulfillment purposes:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      <Truck size={16} style={{ color: '#2563eb' }} />
                      <span>Doorstep Delivery</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Routing and dispatching power tools and accessories via verified logistics partners.
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      <FileText size={16} style={{ color: '#059669' }} />
                      <span>GST Tax Invoices</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Generating statutory GST Tax Invoices and warranty certificates required under Indian law.
                    </span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                      <Phone size={16} style={{ color: '#16a34a' }} />
                      <span>Order Alerts & Tracking</span>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Sending live WhatsApp / SMS order updates, AWB tracking numbers, and delivery status alerts.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  3. Logistics & Third-Party Sharing
                </h3>
                <p style={{ margin: '0 0 10px' }}>
                  To deliver equipment to your doorstep across Kerala and India, your shipping address and recipient phone number are shared solely with our authorized courier partners:
                </p>
                <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  📦 <strong>Integrated Courier Partners:</strong> Delhivery, DTDC Express, The Professional Couriers, and Alleppey Parcel Service (APS). These partners use your contact details solely for package transit and delivery coordination.
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  4. Your Rights (Customer Dashboard)
                </h3>
                <p style={{ margin: 0 }}>
                  You have full autonomy over your personal data. At any time, you can log in to your <strong>Customer Dashboard</strong> to edit your name, update your phone/email (verified via OTP), and add or delete saved delivery addresses.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF USE */}
          {activeTab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  1. Authorized Dealership & Genuine Products
                </h3>
                <p style={{ margin: 0 }}>
                  Variathu Power Tools is an authorized sales dealership and official service workshop clinic based in Kozhencherry, Kerala. All power tools, spare parts, and accessories sold through this platform are 100% genuine and sourced directly from certified brand distributors.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  2. Pricing & GST Billing
                </h3>
                <p style={{ margin: 0 }}>
                  All prices listed on the platform are in Indian Rupees (₹ INR) and inclusive of statutory Goods and Services Tax (GST). An official GST Tax Invoice containing our store's GSTIN and product HSN codes is issued for every completed purchase.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  3. Order Fulfillment & Delivery Modes
                </h3>
                <ul style={{ margin: '0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>
                    <strong>Store Counter Pickup:</strong> You can select pickup at our Poyanil Building workshop in Kozhencherry. You can inspect equipment in person, test motor performance, and receive hands-on safety instructions before taking delivery.
                  </li>
                  <li>
                    <strong>Express Courier Delivery:</strong> Dispatched within 24 hours of order confirmation. Transit times vary from 1 to 4 business days depending on delivery location.
                  </li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  4. No Return &amp; No Cancellation Policy
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#475569', lineHeight: '1.5' }}>
                  <p style={{ margin: 0 }}>
                    Please note our store policy regarding orders, cancellations, and returns:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>
                      <strong>No Cancellation:</strong> Once an order is placed and confirmed, customer cancellations are not accepted. There is no cancellation option for customers once ordered.
                    </li>
                    <li>
                      <strong>No Returns:</strong> All equipment, machinery, power tools, and accessories sales are final. We do not accept returns, exchanges, or refunds once purchased.
                    </li>
                    <li>
                      <strong>Manufacturer Brand Warranty:</strong> All equipment is 100% genuine and covered by official manufacturer brand warranty. Any servicing, technical faults, or repairs are supported through authorized brand service networks and our machinery workshop clinic at Poyanil Building, Kozhencherry.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COOKIE POLICY */}
          {activeTab === 'cookies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  What are Cookies & Local Storage?
                </h3>
                <p style={{ margin: 0 }}>
                  Cookies and modern browser Local Storage are small, secure text records saved on your device by your web browser. They enable essential features like remembering what is in your shopping cart while you browse different tool categories.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 10px' }}>
                  Types of Storage We Use
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
                      <strong style={{ color: '#0f172a' }}>Essential Operational Storage (Strictly Necessary)</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                      Stores session authentication tokens (<code>vpt_token</code>), current cart items (<code>vpt_cart</code>), and user credentials so you do not have to re-enter your credentials on every page navigation. These cannot be disabled.
                    </p>
                  </div>

                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} style={{ color: '#2563eb' }} />
                      <strong style={{ color: '#0f172a' }}>Performance & Stability Storage</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                      Helps detect code updates and auto-refreshes outdated bundles so you never experience blank white screens during active browsing.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
                  Managing Your Storage
                </h3>
                <p style={{ margin: 0 }}>
                  You can clear your local storage and cookies at any time via your browser settings (Settings &gt; Privacy & Security &gt; Clear Browsing Data). Note that clearing essential storage will log you out and reset your shopping cart.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: STORE GRIEVANCE & CONTACT */}
          {activeTab === 'grievance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', margin: '0 0 12px' }}>
                  Data Protection & Customer Grievance Contact
                </h3>
                <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: '#64748b' }}>
                  Under the Consumer Protection (E-Commerce) Rules and DPDP Act, for any privacy inquiries, data deletion requests, or order grievances, please contact our nodal office directly:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building size={16} style={{ color: '#dc2626' }} />
                    <span><strong>Entity:</strong> Variathu Power Tools</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={16} style={{ color: '#16a34a' }} />
                    <span><strong>Phone / WhatsApp:</strong> <a href="tel:+919447559333" style={{ color: '#0f172a', textDecoration: 'none' }}>+91 94475 59333</a></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} style={{ color: '#2563eb' }} />
                    <span><strong>Official Email:</strong> <a href="mailto:variathupowertoolskzy@gmail.com" style={{ color: '#0f172a', textDecoration: 'none' }}>variathupowertoolskzy@gmail.com</a></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>📍</span>
                    <span><strong>Physical Address:</strong> Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry, Pathanamthitta District, Kerala - 689641</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>
                Last updated: October 2026 • Compliant with DPDP Act, 2023 & Consumer Protection Rules
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff'
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            🔒 Safe & Secure E-Commerce
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.88rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            id="btn-dismiss-privacy-modal"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PrivacyPolicyModal;
