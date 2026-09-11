import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Truck, CheckCircle2, Clock, MessageCircle, LogOut, ShoppingBag, ArrowRight, Phone, RefreshCw, FileText, Printer, Shield, QrCode, X, ExternalLink, Navigation, Copy, Check, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const resolveCourierPartner = (courierName = '') => {
  const c = (courierName || '').toLowerCase();
  if (c.includes('alep') || c.includes('allep') || c.includes('aps')) {
    return {
      name: 'Alleppey Parcel Service (APS Cargo)',
      badge: 'APS',
      color: '#059669',
      trackingUrl: 'https://www.apscargo.com/index'
    };
  }
  if (c.includes('delh')) {
    return {
      name: 'Delhivery',
      badge: 'DELHIVERY',
      color: '#d97706',
      trackingUrl: 'https://www.delhivery.com/'
    };
  }
  if (c.includes('prof') || c.includes('tpc')) {
    return {
      name: 'The Professional Couriers',
      badge: 'TPC',
      color: '#0284c7',
      trackingUrl: 'https://www.tpcindia.com/'
    };
  }
  return {
    name: 'DTDC Express',
    badge: 'DTDC',
    color: '#dc2626',
    trackingUrl: 'https://www.dtdc.com/track-your-shipment/'
  };
};

export const CustomerAccountPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedAwb, setCopiedAwb] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // Selected order for GST Invoice modal
  const [customerCancelOrder, setCustomerCancelOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);

  // Determine if cancel should be instant or request-based
  const isCancelOrderDispatched = (order) => {
    return Boolean(order?.awb && String(order.awb).trim() !== '') || (order?.status || '').toLowerCase().includes('dispatch');
  };

  const handleConfirmCustomerCancel = async () => {
    if (!customerCancelOrder) return;
    setCancellingOrder(true);
    try {
      if (isCancelOrderDispatched(customerCancelOrder)) {
        // Dispatched order → submit cancellation request
        const res = await api.requestCancellation(customerCancelOrder.id, {
          reason: 'Customer requested cancellation from account dashboard'
        });
        setCustomerCancelOrder(null);
        setCancelFeedback(res.message || 'Cancellation request submitted. Awaiting store approval.');
        setTimeout(() => setCancelFeedback(null), 8000);
      } else {
        // Non-dispatched order → instant cancel
        const res = await api.cancelOrder(customerCancelOrder.id, {
          reason: 'Customer cancelled from account dashboard',
          cancelledBy: 'customer'
        });
        setCustomerCancelOrder(null);
        setCancelFeedback(res.message || 'Order cancelled successfully.');
        setTimeout(() => setCancelFeedback(null), 6000);
      }
      loadCustomerOrders();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setCancellingOrder(false);
    }
  };

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
      const fetchedOrders = res.data || [];
      setOrders(fetchedOrders);

      // Auto-sync real customer name and email from MongoDB Atlas past orders
      if (fetchedOrders.length > 0 && updateUser) {
        const orderWithRealName = fetchedOrders.find(
          o => o.customer?.name && o.customer.name.trim() !== '' && !o.customer.name.toLowerCase().includes('valued customer')
        );
        if (orderWithRealName && orderWithRealName.customer?.name) {
          const realName = orderWithRealName.customer.name.trim();
          const realEmail = (orderWithRealName.customer.email || '').trim();
          if (user?.name !== realName || user?.name === 'Valued Customer') {
            updateUser({
              name: realName,
              ...(realEmail && !realEmail.includes('valuedcustomer') ? { email: realEmail } : {})
            });
          }
        }
      }
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
            const isCancelled = (order.status || '').toLowerCase().includes('cancel') || order.paymentStatus === 'REFUNDED';
            const isPickup = order.deliveryType === 'store-pickup';
            const isDispatched = Boolean(order.awb && String(order.awb).trim() !== '') || (order.status || '').toLowerCase().includes('dispatch');
            const courierCfg = resolveCourierPartner(order.courierPartner);

            // Compute top badge text and colors
            const hasPendingCancelRequest = Boolean(order.cancellationRequested && order.status !== 'Cancelled');

            let statusBadgeText = 'Order Placed • Processing at Shop';
            let statusBadgeBg = 'rgba(234, 88, 12, 0.08)';
            let statusBadgeColor = '#ea580c';
            let statusBadgeBorder = 'rgba(234, 88, 12, 0.25)';

            if (isCancelled) {
              statusBadgeText = order.paymentStatus === 'REFUNDED' ? 'Cancelled & Refunded' : 'Order Cancelled';
              statusBadgeBg = '#fef2f2';
              statusBadgeColor = '#dc2626';
              statusBadgeBorder = '#fecaca';
            } else if (hasPendingCancelRequest) {
              statusBadgeText = 'Cancellation Requested • Awaiting Approval';
              statusBadgeBg = '#fffbeb';
              statusBadgeColor = '#b45309';
              statusBadgeBorder = '#fde68a';
            } else if (isPickup) {
              if (order.handoverVerified || (order.status || '').toLowerCase().includes('completed')) {
                statusBadgeText = 'Handover Completed';
                statusBadgeBg = '#ecfdf5';
                statusBadgeColor = '#16a34a';
                statusBadgeBorder = '#bbf7d0';
              } else if ((order.status || '').toLowerCase().includes('ready')) {
                statusBadgeText = 'Ready for Store Pickup';
                statusBadgeBg = '#eff6ff';
                statusBadgeColor = '#0284c7';
                statusBadgeBorder = '#bae6fd';
              }
            } else {
              if (isDispatched) {
                statusBadgeText = 'Dispatched via Courier';
                statusBadgeBg = '#ecfdf5';
                statusBadgeColor = '#16a34a';
                statusBadgeBorder = '#bbf7d0';
              }
            }

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
                          background: statusBadgeBg,
                          color: statusBadgeColor,
                          border: `1px solid ${statusBadgeBorder}`,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: '800'
                        }}
                      >
                        ● {statusBadgeText}
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        style={{
                          background: order.paymentStatus === 'REFUNDED' ? '#f0fdf4' : order.paymentStatus === 'PAID' ? '#ecfdf5' : '#fffbeb',
                          color: order.paymentStatus === 'REFUNDED' ? '#059669' : order.paymentStatus === 'PAID' ? '#15803d' : '#b45309',
                          border: `1px solid ${order.paymentStatus === 'REFUNDED' ? '#a7f3d0' : order.paymentStatus === 'PAID' ? '#86efac' : '#fde68a'}`,
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: '800'
                        }}
                      >
                        {order.paymentStatus === 'REFUNDED'
                          ? `REFUNDED (${order.refundId || 'UPI'})`
                          : order.paymentStatus === 'PAID'
                          ? `PAID (${order.transactionId || 'UPI'})`
                          : 'PAY AT STORE / COD'}
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

                {/* Section A: Cancelled Order View */}
                {isCancelled ? (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      marginBottom: '18px'
                    }}
                    id={`order-cancelled-box-${order.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                          Order Status • Cancelled
                        </span>
                        <strong style={{ fontSize: '0.98rem', color: '#991b1b' }}>
                          {order.paymentStatus === 'REFUNDED' ? 'Order Cancelled & Full Refund Processed' : 'Order Cancelled'}
                        </strong>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.84rem', color: '#7f1d1d', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {order.paymentStatus === 'REFUNDED' ? (
                        <>
                          Your order has been cancelled. An automatic full refund of <strong>{formatPrice(order.totalAmount)}</strong> was initiated to your original payment method. Depending on your bank/UPI app, it will reflect within 1-2 business days.
                        </>
                      ) : (
                        'This order has been cancelled. No payment was charged.'
                      )}
                    </p>

                    {order.refundId && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#047857', background: '#ecfdf5', padding: '5px 10px', borderRadius: '6px', border: '1px solid #a7f3d0', fontFamily: 'var(--font-mono)', fontWeight: '700', marginBottom: '6px' }}>
                        <span>⚡ Refund Reference ID: {order.refundId}</span>
                      </div>
                    )}

                    {order.cancelledAt && (
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Cancelled on: {new Date(order.cancelledAt).toLocaleDateString()} at {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ) : isPickup ? (
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
                      <p style={{ fontSize: '0.82rem', color: '#475569', margin: '2px 0 6px' }}>
                        {order.handoverVerified
                          ? '✅ Handover verified by Poyanil counter staff. Equipment collected.'
                          : 'Show this 4-digit code at Poyanil Junction counter to collect your tested tools:'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: '#64748b' }}>
                        <MapPin size={12} style={{ color: '#ea580c' }} />
                        <span>Poyanil Building, Near St Thomas HSS Ground, Poyanil Junction, Kozhencherry-689641</span>
                      </div>
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
                        {order.pickupOtp}
                      </div>
                    </div>
                  </div>
                ) : !isDispatched ? (
                  /* Section B - State 1: Order Placed & Processing at Shop */
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.04) 0%, rgba(234, 88, 12, 0.09) 100%)',
                      border: '1.5px dashed #ea580c',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      marginBottom: '18px'
                    }}
                    id={`order-processing-box-${order.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                          Step 1 of 2 • Order Status
                        </span>
                        <strong style={{ fontSize: '0.98rem', color: '#0f172a' }}>
                          Order Placed • Processing at Shop
                        </strong>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Our workshop technicians at <strong>Poyanil Building, Kozhencherry</strong> are inspecting, testing, and packaging your power tools. Once handed over to the courier partner, your official AWB consignment number and live tracking button will appear right here.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <MapPin size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
                      <span>
                        Destination: <strong>{order.customer?.address || 'Customer Address'}, {order.customer?.district || 'Pathanamthitta'}, Kerala {order.customer?.pincode ? `• PIN: ${order.customer.pincode}` : ''}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Section B - State 2: Dispatched via Courier (Delivery Details) */
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(2, 132, 199, 0.09) 100%)',
                      border: '1.5px solid #bae6fd',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      marginBottom: '18px'
                    }}
                    id={`order-dispatched-box-${order.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            minWidth: '36px',
                            height: '32px',
                            padding: '0 8px',
                            borderRadius: '8px',
                            background: courierCfg.color,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '0.75rem',
                            letterSpacing: '-0.02em',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                          }}
                        >
                          {courierCfg.badge}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Step 2 of 2 • Delivery Details
                            </span>
                          </div>
                          <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                            {courierCfg.name}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Dispatched from Poyanil Building, Kozhencherry, Kerala
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '0.86rem', color: '#0369a1', fontFamily: 'var(--font-mono)', fontWeight: '800', background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                          AWB: {order.awb}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.awb);
                            setCopiedAwb(order.id);
                            setTimeout(() => setCopiedAwb(null), 2000);
                          }}
                          style={{
                            fontSize: '0.76rem',
                            color: copiedAwb === order.id ? '#15803d' : '#334155',
                            background: copiedAwb === order.id ? '#dcfce7' : '#ffffff',
                            border: `1px solid ${copiedAwb === order.id ? '#86efac' : '#cbd5e1'}`,
                            padding: '7px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: '700'
                          }}
                          title="Copy AWB Consignment Code"
                          id={`btn-copy-awb-${order.id}`}
                        >
                          {copiedAwb === order.id ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedAwb === order.id ? 'Copied!' : 'Copy AWB'}</span>
                        </button>

                        <a
                          href={courierCfg.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.76rem',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontWeight: '800',
                            background: courierCfg.color,
                            padding: '7px 14px',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                          }}
                          title={`Track live on official ${courierCfg.name} portal`}
                          id={`btn-track-courier-${order.id}`}
                        >
                          <span>Track on {courierCfg.badge} Website</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    <div style={{ background: '#ffffff', borderRadius: '8px', padding: '10px 14px', border: '1px solid #e0f2fe', fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: '600' }}>
                        <Truck size={14} />
                        <span>Live parcel transit movement is tracked directly on the official courier portal using your AWB number above.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                        <MapPin size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
                        <span>
                          Delivery Destination: <strong>{order.customer?.address || 'Customer Address'}, {order.customer?.district || 'Pathanamthitta'}, Kerala {order.customer?.pincode ? `• PIN: ${order.customer.pincode}` : ''}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Requested Banner */}
                {hasPendingCancelRequest && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(245, 158, 11, 0.12) 100%)',
                      border: '1.5px solid #fde68a',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#92400e', display: 'block' }}>
                        Cancellation Request Submitted
                      </strong>
                      <p style={{ fontSize: '0.8rem', color: '#78350f', margin: '2px 0 0', lineHeight: 1.5 }}>
                        Your cancellation request is being reviewed by the store manager at Variathu Power Tools. You'll see the updated status here once it's processed. If approved, a full refund will be initiated automatically.
                      </p>
                      {order.cancellationRequestedAt && (
                        <span style={{ fontSize: '0.72rem', color: '#a16207', display: 'block', marginTop: '4px' }}>
                          Requested on: {new Date(order.cancellationRequestedAt).toLocaleDateString()} at {new Date(order.cancellationRequestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

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

                {/* Bottom Action Buttons: GST Invoice & WhatsApp & Cancel Order */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Cancel / Request Cancellation button */}
                  {!isCancelled && !hasPendingCancelRequest && (
                    <button
                      type="button"
                      onClick={() => setCustomerCancelOrder(order)}
                      style={{
                        background: isDispatched ? '#fffbeb' : '#ffffff',
                        border: `1px solid ${isDispatched ? '#fde68a' : '#fecaca'}`,
                        color: isDispatched ? '#b45309' : '#dc2626',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title={isDispatched ? 'Request cancellation for dispatched order (requires store approval)' : 'Cancel order and get immediate automatic refund if paid online'}
                      id={`btn-customer-cancel-${order.id}`}
                    >
                      {isDispatched ? <AlertCircle size={15} /> : <XCircle size={15} />}
                      <span>{isDispatched ? 'Request Cancellation' : 'Cancel Order'}</span>
                    </button>
                  )}

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
      {/* Customer Cancel / Request Cancellation Modal */}
      {customerCancelOrder && (
        <div className="modal-overlay" onClick={() => !cancellingOrder && setCustomerCancelOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px', textAlign: 'left' }}
            id="modal-customer-cancel-order"
          >
            {(() => {
              const isDispatchedModal = isCancelOrderDispatched(customerCancelOrder);
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isDispatchedModal ? '#fef3c7' : '#fee2e2', color: isDispatchedModal ? '#b45309' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isDispatchedModal ? <AlertCircle size={22} /> : <XCircle size={22} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        {isDispatchedModal ? 'Request Cancellation' : 'Cancel Order'} {customerCancelOrder.id}?
                      </h3>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Total Amount: {formatPrice(customerCancelOrder.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {isDispatchedModal ? (
                    <>
                      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.84rem', color: '#92400e' }}>
                        <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span>📦 Order Already Dispatched</span>
                        </div>
                        This order has been dispatched via courier <strong>(AWB: {customerCancelOrder.awb})</strong>. Since it's already in transit, your cancellation request will be sent to the store manager for review.
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                        The store manager at Variathu Power Tools will review your request and coordinate with the courier partner. If approved, a full refund will be processed automatically.
                      </p>
                    </>
                  ) : (
                    <>
                      {customerCancelOrder.paymentStatus === 'PAID' ? (
                        <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.84rem', color: '#166534' }}>
                          <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span>⚡ Instant Online Refund Guaranteed</span>
                          </div>
                          Because you paid online via Razorpay/UPI, a <strong>full refund of {formatPrice(customerCancelOrder.totalAmount)}</strong> will be automatically refunded to your original payment account.
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '16px' }}>
                          Are you sure you want to cancel this order? This will cancel your equipment reservation at our Poyanil Building counter.
                        </p>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setCustomerCancelOrder(null)}
                      disabled={cancellingOrder}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Keep Order
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmCustomerCancel}
                      disabled={cancellingOrder}
                      style={{
                        background: isDispatchedModal ? '#b45309' : '#dc2626',
                        border: 'none',
                        color: '#ffffff',
                        padding: '9px 18px',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: isDispatchedModal ? '0 2px 8px rgba(180, 83, 9, 0.25)' : '0 2px 8px rgba(220, 38, 38, 0.25)'
                      }}
                      id="btn-confirm-customer-cancel"
                    >
                      {cancellingOrder
                        ? (isDispatchedModal ? 'Submitting Request...' : 'Processing Refund...')
                        : (isDispatchedModal ? 'Submit Cancellation Request' : 'Yes, Cancel & Refund')}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cancellation Feedback Toast */}
      {cancelFeedback && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontSize: '0.86rem',
            fontWeight: '600',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <span>{cancelFeedback}</span>
        </div>
      )}
    </div>
  );
};
