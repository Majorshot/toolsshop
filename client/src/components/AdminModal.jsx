import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ShieldCheck, ShoppingBag, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const AdminModal = ({ onClose, onProductUpdated }) => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'new-product'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // New product form
  const [form, setForm] = useState({
    name: '',
    brand: 'Bosch',
    category: 'cordless',
    price: '',
    originalPrice: '',
    stock: 10,
    deliveryCost: 120,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
    description: '',
    cordless: false,
    badge: 'New Arrival',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [taxonomy, setTaxonomy] = useState({
    brands: ['Bosch', 'Makita', 'DeWalt', 'Dongcheng', 'HiKOKI', 'Stanley', 'iBELL', 'TOMAHAWK'],
    categories: []
  });

  useEffect(() => {
    loadOrders();
    api.getTaxonomy().then(res => {
      if (res && res.brands) {
        setTaxonomy({
          brands: res.brands || [],
          categories: res.categories || []
        });
      }
    }).catch(err => console.error("AdminModal taxonomy error:", err));
  }, []);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const rawImgs = Array.isArray(form.images) ? form.images : [form.image];
      const cleanedImages = rawImgs.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean);
      const primaryImage = cleanedImages[0] || form.image || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80';

      const payload = {
        ...form,
        image: primaryImage,
        images: cleanedImages.length > 0 ? cleanedImages : [primaryImage],
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        deliveryCost: Number(form.deliveryCost || 0),
        rating: 5.0,
        reviewsCount: 1,
        specs: {
          power: form.cordless ? "18V / 20V Max" : "750 Watts",
          warranty: "1 Year Official Warranty"
        }
      };

      await api.createProduct(payload);
      setSuccessMsg('Product added successfully to Variathu Power Tools catalog!');
      setForm({
        name: '',
        brand: 'Bosch',
        category: 'cordless',
        price: '',
        originalPrice: '',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'],
        description: '',
        cordless: false,
        badge: 'New Arrival',
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (num) => '₹' + Number(num).toLocaleString('en-IN');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: '#ea580c' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Shop Manager Portal</h3>
              <p style={{ fontSize: '0.72rem', color: '#64748b' }}>Variathu Power Tools • Kozhencherry</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'orders' ? '2px solid #ea580c' : 'none',
              color: activeTab === 'orders' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShoppingBag size={16} />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('new-product')}
            style={{
              flex: 1,
              padding: '14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'new-product' ? '2px solid #ea580c' : 'none',
              color: activeTab === 'new-product' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '0.86rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} />
            <span>Add New Tool</span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'orders' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
                  Orders placed online or via store counter
                </span>
                <button
                  onClick={loadOrders}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ea580c',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {loadingOrders ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading orders...</div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  No orders recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#0f172a', fontSize: '0.94rem' }}>{order.id}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '8px' }}>
                            {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={{ color: '#ea580c', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                          {formatPrice(order.totalAmount)}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.84rem', color: '#334155', marginBottom: '6px' }}>
                        Customer: <strong>{order.customer?.name}</strong> • {order.customer?.phone}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '10px' }}>
                        Delivery: <strong style={{ color: '#0284c7' }}>{order.deliveryType}</strong> | Payment: <strong>{order.paymentMethod}</strong>
                      </div>

                      {/* Items */}
                      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                        {order.items?.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                            <span>• {item.name} (x{item.quantity})</span>
                            <span style={{ color: '#64748b' }}>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* New Product Form */
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {successMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                  Tool Title & Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bosch GBH 2-26 DRE Rotary Hammer"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Brand</label>
                  <select
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  >
                    {(taxonomy.brands || []).map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  >
                    {taxonomy.categories && taxonomy.categories.length > 0 ? (
                      taxonomy.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="cordless">Cordless Tools</option>
                        <option value="grinders-cutters">Grinders & Cutters</option>
                        <option value="hammers">Hammer Drills</option>
                        <option value="woodworking">Woodworking</option>
                        <option value="washers-blowers">Washers & Blowers</option>
                        <option value="accessories">Accessories & Bits</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="3450"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Original MRP (₹)</label>
                  <input
                    type="number"
                    placeholder="4200"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Stock Units</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Delivery Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Free"
                    value={form.deliveryCost}
                    onChange={(e) => setForm({ ...form, deliveryCost: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '4px 0 10px' }}>
                💡 <em>Enter 0 for Free Courier Delivery, or custom fee for heavy equipment.</em>
              </p>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600' }}>
                    Product Images (Multiple URLs)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(form.images) ? form.images : [form.image || ''];
                      setForm({ ...form, images: [...cur, ''] });
                    }}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.76rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    id="btn-adminmodal-add-image"
                  >
                    <Plus size={13} />
                    <span>+ Add Image Link</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(Array.isArray(form.images) && form.images.length > 0 ? form.images : [form.image || '']).map((imgUrl, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: '800', 
                          color: idx === 0 ? '#dc2626' : '#64748b', 
                          width: '55px', 
                          flexShrink: 0 
                        }}
                      >
                        {idx === 0 ? 'Main *' : `Image ${idx + 1}`}
                      </span>

                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={imgUrl}
                        onChange={(e) => {
                          const cur = Array.isArray(form.images) ? [...form.images] : [form.image || ''];
                          cur[idx] = e.target.value;
                          setForm({ 
                            ...form, 
                            images: cur, 
                            image: cur[0] || '' 
                          });
                        }}
                        style={{ flex: 1, padding: '8px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                      />

                      {imgUrl && imgUrl.startsWith('http') && (
                        <img 
                          src={imgUrl} 
                          alt="preview" 
                          style={{ width: '34px', height: '34px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}

                      {(Array.isArray(form.images) ? form.images.length : 1) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Array.isArray(form.images) ? [...form.images] : [form.image || ''];
                            const next = cur.filter((_, i) => i !== idx);
                            setForm({ 
                              ...form, 
                              images: next.length > 0 ? next : [''],
                              image: next[0] || ''
                            });
                          }}
                          style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Remove image link"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Short Description</label>
                <textarea
                  rows={3}
                  placeholder="Tool features, applications, durability..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="cordless-check"
                  checked={form.cordless}
                  onChange={(e) => setForm({ ...form, cordless: e.target.checked })}
                />
                <label htmlFor="cordless-check" style={{ fontSize: '0.82rem', color: '#334155' }}>
                  Is this a Cordless (Battery Operated) Tool?
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-hero-clean"
                style={{ justifyContent: 'center', marginTop: '6px' }}
              >
                <span>{isSubmitting ? 'Saving...' : 'Add Tool to Catalog'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
