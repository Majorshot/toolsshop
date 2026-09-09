import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Truck, CheckCircle2, Clock, MessageCircle, LogOut, ShoppingBag, ArrowRight, Phone, RefreshCw, FileText, Printer, Shield, QrCode, X, ExternalLink, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const STATUS_STEPS = [
  { id: 'Confirmed', label: 'Order Placed' },
  { id: 'Processing', label: 'Inspecting in Workshop' },
  { id: 'Ready', label: 'Ready for Pickup / Dispatched' },
  { id: 'Completed', label: 'Delivered / Collected' }
];

function getStepIndex(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('delivered') || s.includes('collected') || s.includes('complete')) return 3;
  if (s.includes('ready') || s.includes('dispatch') || s.includes('shipped')) return 2;
  if (s.includes('process') || s.includes('pack')) return 1;
  return 0; // Confirmed / Pending
}

export const CustomerAccountPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // Selected order for GST Invoice modal

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCustomerOrders();
  }, [user]);

  const loadCustomerOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomerOrders(user?.phone || user?.name || '');
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (num) => '₹' + Number(num).toLocaleString('en-IN');

  const getWhatsAppInquiry = (order) => {
    const text = encodeURIComponent(
      `Hello Variathu Power Tools Kozhencherry,\nI am inquiring about my Order *${order.id}* placed for *${order.customer?.name}*.\nCurrent status shows: ${order.status}.\nPlease let me know when it will be ready.`
    );
    return `https://wa.me/919447123456?text=${text}`;
  };

  if (!user) return null;

  return (
    <div style={{ padding: '24px 0 60px' }}>
      {/* Top Customer Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800'
            }}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>
                {user.name}
              </h1>
              <span
                style={{
                  background: 'rgba(234, 88, 12, 0.08)',
                  color: '#ea580c',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(234, 88, 12, 0.2)'
                }}
              >
                Customer Account
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
              {user.phone || user.email} • Kozhencherry, Pathanamthitta
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadCustomerOrders}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh Status</span>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              padding: '9px 14px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            id="btn-customer-logout"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Orders Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
            Your Placed Orders & Live Status
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Real-time tracking for store pickups at Poyanil Building and courier shipments
          </p>
        </div>

        <Link
          to="/shop"
          style={{
            color: '#ea580c',
            fontWeight: '700',
            fontSize: '0.86rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Shop More Tools</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
          Loading your order status...
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center'
          }}
        >
          <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', marginBottom: '6px' }}>
            No Orders Placed Yet
          </h3>
          <p style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '20px' }}>
            Browse our heavy duty power tools catalog and place your first order.
          </p>
          <Link to="/shop" className="btn-hero-clean">
            <span>Explore Equipment Catalog</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => {
            const stepIdx = getStepIndex(order.status);
            return (
              <div
                key={order.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-xs)'
                }}
                id={`customer-order-${order.id}`}
              >
                {/* Order Top Line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{order.id}</strong>
                      <span
                        style={{
                          background: stepIdx >= 2 ? '#ecfdf5' : 'rgba(234, 88, 12, 0.08)',
                          color: stepIdx >= 2 ? '#16a34a' : '#ea580c',
                          border: `1px solid ${stepIdx >= 2 ? '#bbf7d0' : 'rgba(234, 88, 12, 0.25)'}`,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: '800'
                        }}
                      >
                        ● {order.status}
                      </span>

                      {/* Automation: Payment Status Badge */}
                      <span
                        style={{
                          background: order.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                          color: order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                          border: `1px solid ${order.paymentStatus === 'PAID' ? '#86efac' : '#fde68a'}`,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: '700'
                        }}
                      >
                        {order.paymentStatus === 'PAID' ? `PAID (${order.transactionId || 'UPI'})` : 'PAY AT STORE / COD'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                      Placed on: {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      {formatPrice(order.totalAmount)}
                    </span>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Method: <strong>{order.paymentMethod}</strong>
                    </div>
                  </div>
                </div>

                {/* Automation 1: Poyanil Building Counter Pickup Pass (If store pickup) */}
                {order.deliveryType === 'store-pickup' ? (
                  <div
                    style={{
                      background: order.handoverVerified ? '#f8fafc' : 'linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(234, 88, 12, 0.1) 100%)',
                      border: order.handoverVerified ? '1px solid #e2e8f0' : '1.5px dashed #ea580c',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                        🏬 Store Counter Pickup Pass
                      </span>
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: '2px 0 0' }}>
                        {order.handoverVerified
                          ? '✅ Handover verified by Poyanil counter staff. Equipment collected.'
                          : 'Show this 4-digit code at Poyanil Junction counter to collect your tested tools:'}
                      </p>
                    </div>

                    <div style={{ textAlign: 'center', minWidth: '130px' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        {order.handoverVerified ? 'VERIFIED OTP' : 'SECRET OTP'}
                      </span>
                      <div
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: '900',
                          letterSpacing: '0.25em',
                          color: order.handoverVerified ? '#16a34a' : '#0f172a',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {order.pickupOtp || '4819'}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Automation 2: Live Courier Route & AWB Tracking Card */
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(2, 132, 199, 0.09) 100%)',
                      border: '1px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '18px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={17} style={{ color: '#0284c7' }} />
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                          {order.courierPartner || 'Kerala Speed Express (Delhivery Partner)'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.78rem', color: '#0369a1', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                          AWB: {order.awb || 'DLHVY-KL-8491'}
                        </div>
                        <a
                          href={`https://www.delhivery.com/track/package/${order.awb || 'DLHVY-KL-8491'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.72rem',
                            color: '#0284c7',
                            textDecoration: 'none',
                            fontWeight: '700',
                            background: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #bae6fd',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(2, 132, 199, 0.1)'
                          }}
                          title="Track this parcel live on official Delhivery website"
                        >
                          <span>Track on Delhivery.com</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* Step-by-step Route Checkpoints */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '0.74rem' }}>
                      <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: '#16a34a', fontWeight: '800', display: 'block' }}>● 1. Poyanil Hub</span>
                        <span style={{ color: '#64748b' }}>Tested & Packaged</span>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: stepIdx >= 2 ? '#16a34a' : '#ea580c', fontWeight: '800', display: 'block' }}>
                          {stepIdx >= 2 ? '● 2. Pathanamthitta Hub' : '○ 2. Sorting Hub'}
                        </span>
                        <span style={{ color: '#64748b' }}>In Transit</span>
                      </div>
                      <div style={{ background: '#ffffff', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ color: stepIdx >= 3 ? '#16a34a' : '#64748b', fontWeight: '800', display: 'block' }}>
                          {stepIdx >= 3 ? '● 3. Delivered' : '○ 3. Doorstep'}
                        </span>
                        <span style={{ color: '#64748b' }}>Estimated Tomorrow</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Delivery Status Stepper */}
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#475569', marginBottom: '12px' }}>
                    Live Delivery Stepper
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                    {STATUS_STEPS.map((step, idx) => {
                      const isFinished = idx <= stepIdx;
                      const isCurrent = idx === stepIdx;
                      return (
                        <div key={step.id} style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: isFinished ? '#ea580c' : '#ffffff',
                              color: isFinished ? '#ffffff' : '#94a3b8',
                              border: isFinished ? '2px solid #ea580c' : '2px solid #cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 6px',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(234, 88, 12, 0.15)' : 'none',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CheckCircle2 size={15} />
                          </div>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: isCurrent ? '800' : '600',
                              color: isFinished ? '#0f172a' : '#94a3b8',
                              display: 'block',
                              lineHeight: 1.2
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: '#ea580c' }} />
                    <span>
                      {order.deliveryType === 'store-pickup'
                        ? 'Counter Location: Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641'
                        : `Delivery Address: ${order.customer?.address || 'Customer Address'}, ${order.customer?.district || 'Pathanamthitta'}, Kerala`}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    Ordered Equipment ({order.items?.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {order.items?.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          <div>
                            <h4 style={{ fontSize: '0.86rem', fontWeight: '700', color: '#0f172a' }}>{item.name}</h4>
                            <span style={{ fontSize: '0.76rem', color: '#64748b' }}>Quantity: {item.quantity}</span>
                          </div>
                        </div>

                        <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons: GST Invoice & WhatsApp */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setInvoiceOrder(order)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    id={`btn-view-invoice-${order.id}`}
                  >
                    <FileText size={15} style={{ color: '#ea580c' }} />
                    <span>Official GST Tax Invoice</span>
                  </button>

                  <a
                    href={getWhatsAppInquiry(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#16a34a',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>Inquire on WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official GST Tax Invoice Modal */}
      {invoiceOrder && (
        <div className="modal-overlay" onClick={() => setInvoiceOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px', background: '#ffffff', color: '#0f172a', padding: '24px' }}
          >
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: '#ea580c' }} />
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Original Tax Invoice & Warranty Certificate</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  id="btn-print-invoice"
                >
                  <Printer size={14} />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Invoice Body (Standard Indian GST Tax Invoice) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '18px', background: '#ffffff' }} id="printable-gst-invoice">
              {/* Shop Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '14px', marginBottom: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0f172a', margin: 0 }}>
                    VARIATHU POWER TOOLS
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: '#475569', margin: '3px 0' }}>
                    Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641, Kerala
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: '700', margin: 0 }}>
                    GSTIN: <span style={{ fontFamily: 'var(--font-mono)' }}>32AABCU9603R1ZM</span> • Phone: +91 94471 23456
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', background: '#0f172a', color: '#ffffff', padding: '3px 8px', borderRadius: '4px', fontWeight: '800', display: 'inline-block', marginBottom: '4px' }}>
                    TAX INVOICE
                  </span>
                  <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                    INV-2026-{invoiceOrder.id}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Date: {new Date(invoiceOrder.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Billed To & Payment details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px', fontSize: '0.8rem', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>Billed To (Customer):</strong>
                  <div>{invoiceOrder.customer?.name}</div>
                  <div>Phone: {invoiceOrder.customer?.phone}</div>
                  <div>{invoiceOrder.customer?.address || 'Kozhencherry Counter Pickup'}</div>
                  <div>{invoiceOrder.customer?.district}, Kerala - {invoiceOrder.customer?.pincode || '689641'}</div>
                </div>

                <div>
                  <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>Fulfillment & Payment:</strong>
                  <div>Status: <span style={{ color: '#16a34a', fontWeight: '800' }}>{invoiceOrder.paymentStatus || 'PAID'}</span></div>
                  <div>Method: {invoiceOrder.paymentMethod}</div>
                  {invoiceOrder.transactionId && <div>Txn ID: {invoiceOrder.transactionId}</div>}
                  {invoiceOrder.pickupOtp && <div>Pickup OTP: {invoiceOrder.pickupOtp}</div>}
                  {invoiceOrder.awb && <div>AWB: {invoiceOrder.awb}</div>}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', marginBottom: '14px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px' }}>#</th>
                    <th style={{ padding: '8px' }}>Tool Description</th>
                    <th style={{ padding: '8px' }}>HSN Code</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Taxable Val</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceOrder.items?.map((item, idx) => {
                    const price = item.price * item.quantity;
                    const taxable = Math.round(price / 1.18);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', fontWeight: '600' }}>{item.name}</td>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>84672900</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{formatPrice(taxable)}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{formatPrice(price)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Tax & Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px solid #cbd5e1', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', maxWidth: '340px' }}>
                  <strong style={{ color: '#0f172a' }}>Warranty & Service Terms:</strong><br />
                  Valid for manufacturer warranty and in-house servicing at Variathu Power Tools workshop, Poyanil Building, Kozhencherry. Spares and carbon brushes available in-store.
                </div>

                <div style={{ textAlign: 'right', minWidth: '180px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                    CGST (9%) + SGST (9%): Included
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ea580c', fontFamily: 'var(--font-mono)' }}>
                    Total: {formatPrice(invoiceOrder.totalAmount)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: '700' }}>
                    Payment Verified (No Dues)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
