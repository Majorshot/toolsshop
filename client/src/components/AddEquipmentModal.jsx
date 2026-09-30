import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Plus, Trash2, ShieldCheck, Upload, Image as ImageIcon,
  Zap, Check, Battery, Truck, Percent, Eye, Wrench, Shield,
  Loader2, CloudUpload
} from 'lucide-react';
import GlideSelect from './GlideSelect';
import { useConfirm } from './SpringModal';
import { ProductCard } from './ProductCard';
import { api } from '../services/api';
import './AddEquipmentModal.css';

const BADGE_OPTIONS = [
  { id: '', label: 'None' },
  { id: 'New Arrival', label: '✨ New Arrival' },
  { id: 'Best Seller', label: '🔥 Best Seller' },
  { id: 'Heavy Duty', label: '⚡ Heavy Duty' },
  { id: 'Pro Choice', label: '👑 Pro Choice' },
  { id: 'Clearance Deal', label: '🏷️ Clearance Deal' }
];

const WARRANTY_OPTIONS = [
  '6 Months Warranty',
  '1 Year Official Warranty',
  '2 Years Heavy Duty Warranty',
  '3 Years Pro Warranty',
  'No Warranty'
];

export const AddEquipmentModal = ({
  isOpen,
  onClose,
  editingProduct,
  taxonomy,
  onSaveProduct,
  // Inline brand / category creation
  showAddBrandInline,
  setShowAddBrandInline,
  newBrandInput,
  setNewBrandInput,
  handleAddBrandInline,
  isAddingBrand,
  showAddCatInline,
  setShowAddCatInline,
  newCatNameInput,
  setNewCatNameInput,
  handleAddCategoryInline,
  isAddingCat
}) => {
  const { confirm } = useConfirm();
  const fileInputRef = useRef(null);

  // Clean production form state
  const [form, setForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    originalPrice: '',
    stock: 10,
    deliveryCost: 0,
    image: '',
    images: [],
    description: '',
    cordless: false,
    badge: '',
    specs: {
      power: '',
      voltage: '',
      warranty: '1 Year Official Warranty'
    }
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Accidental Click-Outside Protection State
  const [shakeModal, setShakeModal] = useState(false);
  const [showOutsideClickTip, setShowOutsideClickTip] = useState(false);
  const tipTimeoutRef = useRef(null);

  // Initialize or Reset Form when modal opens or editingProduct changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingProduct) {
      // Editing existing real MongoDB product
      const existingImages = Array.isArray(editingProduct.images) && editingProduct.images.length > 0
        ? editingProduct.images.filter(Boolean)
        : (editingProduct.image ? [editingProduct.image] : []);

      setForm({
        name: editingProduct.name || '',
        brand: editingProduct.brand || (taxonomy.brands?.[0] || 'Bosch'),
        category: editingProduct.category || (taxonomy.categories?.[0]?.id || 'cordless'),
        price: editingProduct.price !== undefined ? editingProduct.price : '',
        originalPrice: editingProduct.originalPrice || '',
        stock: editingProduct.stock !== undefined ? editingProduct.stock : 10,
        deliveryCost: editingProduct.deliveryCost !== undefined ? editingProduct.deliveryCost : 0,
        image: editingProduct.image || existingImages[0] || '',
        images: existingImages,
        description: editingProduct.description || '',
        cordless: Boolean(editingProduct.cordless),
        badge: editingProduct.badge || '',
        specs: {
          power: editingProduct.specs?.power || '',
          voltage: editingProduct.specs?.voltage || '',
          warranty: editingProduct.specs?.warranty || '1 Year Official Warranty'
        }
      });
    } else {
      // Adding new equipment - start clean
      const defaultBrand = taxonomy.brands?.[0] || 'Bosch';
      const defaultCat = taxonomy.categories?.[0]?.id || (taxonomy.categories?.[0]?.name?.toLowerCase() || 'cordless');

      setForm({
        name: '',
        brand: defaultBrand,
        category: defaultCat,
        price: '',
        originalPrice: '',
        stock: 10,
        deliveryCost: 0,
        image: '',
        images: [],
        description: '',
        cordless: false,
        badge: '',
        specs: {
          power: '',
          voltage: '',
          warranty: '1 Year Official Warranty'
        }
      });
    }
  }, [isOpen, editingProduct, taxonomy]);

  // Outside click: PREVENT CLOSING, show tactile protective shake + tooltip
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShakeModal(true);
      setShowOutsideClickTip(true);

      if (tipTimeoutRef.current) clearTimeout(tipTimeoutRef.current);
      tipTimeoutRef.current = setTimeout(() => {
        setShakeModal(false);
        setShowOutsideClickTip(false);
      }, 2000);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, form, editingProduct]);

  // Check if form has unsaved modifications
  const isFormDirty = useMemo(() => {
    if (!editingProduct) {
      return Boolean(form.name.trim() || form.price || form.description.trim() || form.images.length > 0);
    }
    return (
      form.name !== (editingProduct.name || '') ||
      String(form.price) !== String(editingProduct.price || '') ||
      String(form.originalPrice || '') !== String(editingProduct.originalPrice || '') ||
      Number(form.stock) !== Number(editingProduct.stock || 0) ||
      form.brand !== editingProduct.brand ||
      form.category !== editingProduct.category
    );
  }, [form, editingProduct]);

  // Close safely with confirmation if dirty
  const handleAttemptClose = () => {
    if (isSubmitting) return;

    if (isFormDirty) {
      confirm({
        title: "Discard Equipment Details?",
        description: "You have unsaved changes in this equipment form. If you close now, your entered details will be lost.",
        confirmText: "Discard & Exit",
        cancelText: "Keep Editing",
        variant: "danger",
        onConfirm: () => {
          onClose();
        }
      });
    } else {
      onClose();
    }
  };

  // Toggle Cordless with sensible specs hints
  const handleToggleCordless = (checked) => {
    setForm(prev => ({
      ...prev,
      cordless: checked,
      specs: {
        ...prev.specs,
        power: checked
          ? (prev.specs.power === '850 Watts' ? '20V XR Brushless' : prev.specs.power)
          : (prev.specs.power === '20V XR Brushless' ? '850 Watts' : prev.specs.power),
        voltage: checked
          ? (prev.specs.voltage === '230V / 50Hz' ? '20V Max Li-Ion' : prev.specs.voltage)
          : (prev.specs.voltage === '20V Max Li-Ion' ? '230V / 50Hz' : prev.specs.voltage)
      }
    }));
  };

  // Image File Compression via HTML5 Canvas (Instant client-side compression)
  const processImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          resolve(dataUrl);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file input upload with Cloudinary CDN integration
  const handleFilesUpload = async (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!validFiles.length) return;

    setIsUploadingPhotos(true);
    setUploadError('');
    try {
      // 1. Client-side canvas preprocessing (downscale to max 900px to ensure ultra-fast upload)
      const compressedList = await Promise.all(validFiles.map(processImageFile));

      // 2. Upload to Cloudinary CDN via server API
      const res = await api.uploadImages(compressedList);
      const uploadedUrls = res?.urls || (res?.url ? [res.url] : []);

      if (!uploadedUrls.length) {
        throw new Error('No image URLs returned from Cloudinary');
      }

      setForm(prev => {
        const currentImgs = (Array.isArray(prev.images) ? prev.images : [prev.image]).filter(Boolean);
        const nextImgs = [...currentImgs, ...uploadedUrls];
        return {
          ...prev,
          images: nextImgs,
          image: nextImgs[0] || ''
        };
      });
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setUploadError(err.message || 'Image upload to Cloudinary failed');
      alert(`Cloudinary Notice: ${err.message || 'Could not upload to Cloudinary'}`);
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Drag and Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Add Manual URL
  const handleAddManualUrl = () => {
    const clean = newImageUrl.trim();
    if (!clean) return;
    setForm(prev => {
      const currentImgs = (Array.isArray(prev.images) ? prev.images : [prev.image]).filter(Boolean);
      const nextImgs = [...currentImgs, clean];
      return {
        ...prev,
        images: nextImgs,
        image: nextImgs[0] || ''
      };
    });
    setNewImageUrl('');
  };

  // Set Cover Photo
  const handleSetCoverPhoto = (idx) => {
    setForm(prev => {
      const cur = [...(prev.images || [])];
      const [chosen] = cur.splice(idx, 1);
      const nextImgs = [chosen, ...cur];
      return {
        ...prev,
        images: nextImgs,
        image: chosen
      };
    });
  };

  // Delete Image
  const handleDeletePhoto = (idx) => {
    setForm(prev => {
      const cur = [...(prev.images || [])];
      cur.splice(idx, 1);
      return {
        ...prev,
        images: cur,
        image: cur[0] || ''
      };
    });
  };

  // Calculate discount percentage and savings
  const discountStats = useMemo(() => {
    const p = Number(form.price);
    const m = Number(form.originalPrice);
    if (!p || !m || m <= p) return null;
    const savings = m - p;
    const percent = Math.round((savings / m) * 100);
    return { savings, percent };
  }, [form.price, form.originalPrice]);

  // Memoized Live Storefront Product Model for Pixel-Perfect Preview
  const previewProduct = useMemo(() => {
    const rawImgs = Array.isArray(form.images) ? form.images : (form.image ? [form.image] : []);
    const primaryImg = rawImgs[0] || form.image || '';

    return {
      id: editingProduct?.id || editingProduct?._id || 'preview-tool',
      name: form.name.trim() || 'Equipment Name & Model',
      brand: form.brand || (taxonomy.brands?.[0] || 'Bosch'),
      category: form.category || (taxonomy.categories?.[0]?.id || 'cordless'),
      price: Number(form.price) || 0,
      originalPrice: form.originalPrice && Number(form.originalPrice) > Number(form.price || 0)
        ? Number(form.originalPrice)
        : undefined,
      discount: discountStats ? `${discountStats.percent}% OFF` : undefined,
      stock: Number(form.stock || 0),
      inStock: Number(form.stock || 0) > 0,
      cordless: Boolean(form.cordless),
      badge: form.badge || '',
      image: primaryImg,
      specs: {
        power: form.specs?.power || '',
        voltage: form.specs?.voltage || '',
        warranty: form.specs?.warranty || '1 Year Official Warranty'
      },
      deliveryCost: Number(form.deliveryCost || 0)
    };
  }, [form, discountStats, editingProduct, taxonomy]);

  // Quick Stock Adjustment
  const adjustStock = (delta) => {
    setForm(prev => ({
      ...prev,
      stock: Math.max(0, Number(prev.stock || 0) + delta)
    }));
  };

  // Form Submission
  const handleSubmit = async (shouldAddAnother = false) => {
    if (!form.name.trim()) {
      alert('Please enter equipment name & model');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      alert('Please enter a valid selling price');
      return;
    }

    setIsSubmitting(true);
    try {
      const rawImgs = Array.isArray(form.images) ? form.images : (form.image ? [form.image] : []);
      const cleanedImages = rawImgs.map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean);
      const primaryImage = cleanedImages[0] || form.image || '';

      const discountTag = discountStats ? `${discountStats.percent}% OFF` : undefined;

      const payload = {
        name: form.name.trim(),
        brand: form.brand || (taxonomy.brands?.[0] || 'Bosch'),
        category: form.category || (taxonomy.categories?.[0]?.id || 'cordless'),
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        discount: discountTag,
        stock: Number(form.stock || 0),
        deliveryCost: Number(form.deliveryCost || 0),
        image: primaryImage,
        images: cleanedImages.length > 0 ? cleanedImages : (primaryImage ? [primaryImage] : []),
        description: form.description || '',
        cordless: Boolean(form.cordless),
        badge: form.badge || '',
        specs: {
          power: form.specs?.power || '',
          voltage: form.specs?.voltage || '',
          warranty: form.specs?.warranty || '1 Year Official Warranty'
        }
      };

      await onSaveProduct(payload, editingProduct, shouldAddAnother);

      if (shouldAddAnother) {
        // Reset form for next item, retaining brand & category
        setForm(prev => ({
          name: '',
          brand: prev.brand,
          category: prev.category,
          price: '',
          originalPrice: '',
          stock: 10,
          deliveryCost: 0,
          image: '',
          images: [],
          description: '',
          cordless: false,
          badge: '',
          specs: {
            power: '',
            voltage: '',
            warranty: '1 Year Official Warranty'
          }
        }));
      } else {
        onClose();
      }
    } catch (err) {
      alert(`Could not save product: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="eq-modal-overlay"
      onClick={handleOverlayClick}
      id="add-equipment-modal-overlay"
    >
      {/* Protected indicator banner when user clicks outside */}
      {showOutsideClickTip && (
        <div className="eq-backdrop-tip">
          <ShieldCheck size={16} />
          <span>Accidental close prevented! Use ✕ or Discard to exit.</span>
        </div>
      )}

      {/* Main Modal Dialog */}
      <div
        className={`eq-modal-dialog ${shakeModal ? 'shake-gentle' : ''}`}
        onClick={(e) => e.stopPropagation()}
        id="add-equipment-modal-container"
      >
        {/* Sticky Header */}
        <div className="eq-modal-header">
          <div className="eq-modal-header-left">
            <div className="eq-modal-icon-badge">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="eq-modal-title">
                {editingProduct ? 'Edit Tool Details & Price' : 'Add New Equipment to Catalog'}
              </h3>
              <p className="eq-modal-subtitle">
                {editingProduct ? `Updating SKU ${editingProduct.id || editingProduct._id || ''}` : 'Configure pricing, stock, technical specifications & photos'}
              </p>
            </div>
          </div>

          <div className="eq-modal-header-right">
            <span className="eq-protected-badge" title="Outside clicking is disabled to prevent accidental data loss">
              <ShieldCheck size={13} />
              <span>Outside Click Protected</span>
            </span>

            <button
              type="button"
              className="eq-btn-close"
              onClick={handleAttemptClose}
              title="Close modal (Esc)"
              id="btn-close-equipment-modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body: Split Form & Live Customer Card Preview */}
        <div className="eq-modal-body">
          {/* Left Column: Form Controls */}
          <div className="eq-form-col">
            {/* SECTION 1: Product Identity */}
            <div className="eq-section-card">
              <div className="eq-section-header">
                <h4 className="eq-section-title">
                  <Zap size={14} style={{ color: '#ea580c' }} />
                  <span>1. Equipment Identity & Taxonomy</span>
                </h4>
                <span className="eq-section-subtitle">Catalog Details</span>
              </div>

              {/* Equipment Name */}
              <div>
                <label className="eq-field-label" htmlFor="input-tool-name">
                  <span>Equipment Name & Model <span className="req">*</span></span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{form.name.length} chars</span>
                </label>
                <input
                  id="input-tool-name"
                  type="text"
                  required
                  placeholder="e.g. Bosch GWS 600 Heavy Duty Angle Grinder 100mm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="eq-input"
                  autoFocus
                />
              </div>

              {/* Brand & Category Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Brand */}
                <div>
                  <div className="eq-field-label">
                    <span>Brand *</span>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandInline(!showAddBrandInline)}
                      style={{
                        background: 'none', border: 'none', color: '#ea580c',
                        fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '2px', padding: 0
                      }}
                      id="btn-inline-brand-toggle"
                    >
                      <Plus size={12} />
                      <span>{showAddBrandInline ? 'Cancel' : 'Add Brand'}</span>
                    </button>
                  </div>

                  {showAddBrandInline && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: '#fff7ed', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      <input
                        type="text"
                        placeholder="Brand name (e.g. KPT)"
                        value={newBrandInput}
                        onChange={(e) => setNewBrandInput(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #ea580c', borderRadius: '4px' }}
                        id="input-inline-brand-name"
                      />
                      <button
                        type="button"
                        onClick={async (e) => {
                          const brandName = newBrandInput.trim();
                          if (!brandName) return;
                          await handleAddBrandInline(e);
                          setForm(prev => ({ ...prev, brand: brandName }));
                        }}
                        disabled={isAddingBrand}
                        style={{ background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                        id="btn-save-inline-brand"
                      >
                        {isAddingBrand ? '...' : 'Save'}
                      </button>
                    </div>
                  )}

                  <GlideSelect
                    id="select-tool-brand"
                    options={[
                      ...(taxonomy.brands || []).map(b => ({ value: b, label: b })),
                      ...(form.brand && !(taxonomy.brands || []).includes(form.brand)
                        ? [{ value: form.brand, label: form.brand }]
                        : [])
                    ]}
                    value={form.brand || (taxonomy.brands?.[0] || 'Bosch')}
                    onChange={(val) => setForm({ ...form, brand: val })}
                    ariaLabel="Select tool brand"
                    placeholder="Select Brand…"
                    size="md"
                    radius={8}
                    fullWidth
                    menuWidth="100%"
                    maxHeight={260}
                    align="left"
                    accentColor="#ea580c"
                    surfaceColor="#ffffff"
                    borderColor="#cbd5e1"
                    textColor="#0f172a"
                    highlightColor="#fff7ed"
                  />
                </div>

                {/* Category */}
                <div>
                  <div className="eq-field-label">
                    <span>Category *</span>
                    <button
                      type="button"
                      onClick={() => setShowAddCatInline(!showAddCatInline)}
                      style={{
                        background: 'none', border: 'none', color: '#ea580c',
                        fontSize: '0.74rem', fontWeight: '800', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '2px', padding: 0
                      }}
                      id="btn-inline-cat-toggle"
                    >
                      <Plus size={12} />
                      <span>{showAddCatInline ? 'Cancel' : 'Add Category'}</span>
                    </button>
                  </div>

                  {showAddCatInline && (
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', background: '#fff7ed', padding: '6px', borderRadius: '6px', border: '1px solid #fed7aa' }}>
                      <input
                        type="text"
                        placeholder="Category (e.g. Welding)"
                        value={newCatNameInput}
                        onChange={(e) => setNewCatNameInput(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', fontSize: '0.8rem', border: '1px solid #ea580c', borderRadius: '4px' }}
                        id="input-inline-cat-name"
                      />
                      <button
                        type="button"
                        onClick={async (e) => {
                          const clean = newCatNameInput.trim();
                          if (!clean) return;
                          await handleAddCategoryInline(e);
                          const catId = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          setForm(prev => ({ ...prev, category: catId }));
                        }}
                        disabled={isAddingCat}
                        style={{ background: '#ea580c', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '6px 10px', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer' }}
                        id="btn-save-inline-cat"
                      >
                        {isAddingCat ? '...' : 'Save'}
                      </button>
                    </div>
                  )}

                  <GlideSelect
                    id="select-tool-category"
                    options={[
                      ...(taxonomy.categories || []).map(c => ({ value: c.id, label: c.name })),
                      ...(form.category && !(taxonomy.categories || []).some(c => c.id === form.category)
                        ? [{ value: form.category, label: form.category }]
                        : [])
                    ]}
                    value={form.category || (taxonomy.categories?.[0]?.id || '')}
                    onChange={(val) => setForm({ ...form, category: val })}
                    ariaLabel="Select tool category"
                    placeholder="Select Category…"
                    size="md"
                    radius={8}
                    fullWidth
                    menuWidth="100%"
                    maxHeight={260}
                    align="right"
                    accentColor="#ea580c"
                    surfaceColor="#ffffff"
                    borderColor="#cbd5e1"
                    textColor="#0f172a"
                    highlightColor="#fff7ed"
                  />
                </div>
              </div>

              {/* Badge Selection */}
              <div>
                <label className="eq-field-label">
                  <span>Highlight Badge Ribbon</span>
                </label>
                <div className="eq-chips-wrap">
                  {BADGE_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`eq-chip-btn ${form.badge === opt.id ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, badge: opt.id })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: Pricing, Stock & Shipping */}
            <div className="eq-section-card">
              <div className="eq-section-header">
                <h4 className="eq-section-title">
                  <Percent size={14} style={{ color: '#ea580c' }} />
                  <span>2. Pricing, Stock & Shipping</span>
                </h4>
                <span className="eq-section-subtitle">Real-time Calculation</span>
              </div>

              {/* Prices Grid */}
              <div className="eq-pricing-grid">
                <div>
                  <label className="eq-field-label" htmlFor="input-tool-price">
                    <span>Selling Price (₹) <span className="req">*</span></span>
                  </label>
                  <input
                    id="input-tool-price"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 2500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="eq-input"
                  />
                </div>

                <div>
                  <label className="eq-field-label" htmlFor="input-tool-mrp">
                    <span>Original MRP (₹)</span>
                  </label>
                  <input
                    id="input-tool-mrp"
                    type="number"
                    min="0"
                    placeholder="e.g. 3200 (optional)"
                    value={form.originalPrice}
                    onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="eq-input"
                  />
                </div>
              </div>

              {/* Dynamic Discount Feedback Banner */}
              {discountStats && (
                <div className="eq-discount-banner">
                  <span>Customer Saves ₹{discountStats.savings.toLocaleString('en-IN')}!</span>
                  <span style={{ background: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: '4px' }}>
                    {discountStats.percent}% Discount Applied
                  </span>
                </div>
              )}

              {/* Stock Units & Quick Stepper */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="eq-field-label" htmlFor="input-tool-stock">
                    <span>Stock Units <span className="req">*</span></span>
                  </label>
                  <div className="eq-stepper-wrap">
                    <button
                      type="button"
                      className="eq-stepper-btn"
                      onClick={() => adjustStock(-1)}
                      title="Decrease stock by 1"
                    >
                      −
                    </button>
                    <input
                      id="input-tool-stock"
                      type="number"
                      min="0"
                      required
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="eq-stepper-input"
                    />
                    <button
                      type="button"
                      className="eq-stepper-btn"
                      onClick={() => adjustStock(1)}
                      title="Increase stock by 1"
                    >
                      +
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[+5, +10, +25].map(step => (
                      <button
                        key={step}
                        type="button"
                        className="eq-chip-btn"
                        style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                        onClick={() => adjustStock(step)}
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Fee */}
                <div>
                  <label className="eq-field-label" htmlFor="input-tool-delivery-cost">
                    <span>Delivery Fee (₹)</span>
                  </label>
                  <input
                    id="input-tool-delivery-cost"
                    type="number"
                    min="0"
                    placeholder="0 = Free Courier"
                    value={form.deliveryCost}
                    onChange={(e) => setForm({ ...form, deliveryCost: e.target.value })}
                    className="eq-input"
                  />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    <button
                      type="button"
                      className={`eq-chip-btn ${Number(form.deliveryCost) === 0 ? 'active' : ''}`}
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={() => setForm({ ...form, deliveryCost: 0 })}
                    >
                      Free (₹0)
                    </button>
                    <button
                      type="button"
                      className={`eq-chip-btn ${Number(form.deliveryCost) === 120 ? 'active' : ''}`}
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={() => setForm({ ...form, deliveryCost: 120 })}
                    >
                      Std (₹120)
                    </button>
                    <button
                      type="button"
                      className={`eq-chip-btn ${Number(form.deliveryCost) === 250 ? 'active' : ''}`}
                      style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                      onClick={() => setForm({ ...form, deliveryCost: 250 })}
                    >
                      Heavy (₹250)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Equipment Photos */}
            <div className="eq-section-card">
              <div className="eq-section-header">
                <h4 className="eq-section-title">
                  <ImageIcon size={14} style={{ color: '#ea580c' }} />
                  <span>3. Equipment Photos</span>
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <CloudUpload size={10} /> Cloudinary CDN
                  </span>
                  <span className="eq-section-subtitle">
                    {form.images?.length || 0} photo{(form.images?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                className={`eq-dropzone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !isUploadingPhotos && fileInputRef.current?.click()}
                title="Click or drag photos to upload directly from your device"
                style={{ opacity: isUploadingPhotos ? 0.75 : 1, cursor: isUploadingPhotos ? 'wait' : 'pointer' }}
              >
                {isUploadingPhotos ? (
                  <>
                    <div className="eq-dropzone-icon" style={{ animation: 'spin 1s linear infinite' }}>
                      <Loader2 size={18} />
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#ea580c' }}>
                      Uploading to Cloudinary CDN & Optimizing...
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Directly hosted on Cloudinary • Zero database storage used
                    </div>
                  </>
                ) : (
                  <>
                    <div className="eq-dropzone-icon">
                      <Upload size={18} />
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                      Click to Upload Photos from Phone or PC
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Auto-compressed & stored on Cloudinary CDN for instant loading
                    </div>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  disabled={isUploadingPhotos}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.length) handleFilesUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {uploadError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', padding: '8px 12px', fontSize: '0.74rem' }}>
                  ⚠️ {uploadError}
                </div>
              )}

              {/* Manual URL Input */}
              <div>
                <label className="eq-field-label">
                  <span>Or Enter Image URL Link:</span>
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualUrl(); } }}
                    className="eq-input"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    disabled={!newImageUrl.trim()}
                    className="eq-btn-cancel"
                    style={{ padding: '8px 14px', background: '#f8fafc', color: '#ea580c', fontWeight: '800', whiteSpace: 'nowrap' }}
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              {/* Thumbnails list with Cover Badge and Delete */}
              {Array.isArray(form.images) && form.images.length > 0 && (
                <div>
                  <div className="eq-field-label">
                    <span>Uploaded Equipment Gallery (Click thumbnail to set as Cover Photo):</span>
                  </div>
                  <div className="eq-thumb-grid">
                    {form.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`eq-thumb-card ${idx === 0 ? 'is-cover' : ''}`}
                        onClick={() => handleSetCoverPhoto(idx)}
                        title={idx === 0 ? 'Main Cover Photo' : 'Click to make Cover Photo'}
                      >
                        <img src={imgUrl} alt={`Equipment ${idx + 1}`} onError={(e) => { e.target.style.opacity = '0.3'; }} />
                        {idx === 0 && <span className="eq-thumb-badge">COVER</span>}
                        {form.images.length > 1 && (
                          <button
                            type="button"
                            className="eq-thumb-remove"
                            onClick={(e) => { e.stopPropagation(); handleDeletePhoto(idx); }}
                            title="Remove photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Technical Specifications */}
            <div className="eq-section-card">
              <div className="eq-section-header">
                <h4 className="eq-section-title">
                  <Wrench size={14} style={{ color: '#ea580c' }} />
                  <span>4. Technical Specifications & Warranty</span>
                </h4>
                <span className="eq-section-subtitle">Customer-Facing Specs</span>
              </div>

              {/* Cordless Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Battery size={18} style={{ color: form.cordless ? '#16a34a' : '#94a3b8' }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                      Is this a Cordless (Battery Operated) Tool?
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Highlights battery specs and cordless badges in shop
                    </div>
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.cordless}
                    onChange={(e) => handleToggleCordless(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: 0, borderRadius: '24px',
                    background: form.cordless ? '#16a34a' : '#cbd5e1',
                    transition: '0.2s', display: 'flex', alignItems: 'center'
                  }}>
                    <span style={{
                      height: '18px', width: '18px', borderRadius: '50%',
                      background: '#ffffff', margin: '3px',
                      transform: form.cordless ? 'translateX(20px)' : 'translateX(0)',
                      transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
              </div>

              {/* Specs Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="eq-field-label">
                    <span>Power / Wattage</span>
                  </label>
                  <input
                    type="text"
                    placeholder={form.cordless ? 'e.g. 20V XR Brushless' : 'e.g. 850 Watts'}
                    value={form.specs?.power || ''}
                    onChange={(e) => setForm({ ...form, specs: { ...form.specs, power: e.target.value } })}
                    className="eq-input"
                  />
                </div>

                <div>
                  <label className="eq-field-label">
                    <span>Operating Voltage / Battery</span>
                  </label>
                  <input
                    type="text"
                    placeholder={form.cordless ? 'e.g. 20V Max (Dual Battery)' : 'e.g. 230V / 50Hz'}
                    value={form.specs?.voltage || ''}
                    onChange={(e) => setForm({ ...form, specs: { ...form.specs, voltage: e.target.value } })}
                    className="eq-input"
                  />
                </div>
              </div>

              {/* Warranty Quick Chips */}
              <div>
                <label className="eq-field-label">
                  <span>Warranty Coverage</span>
                </label>
                <div className="eq-chips-wrap">
                  {WARRANTY_OPTIONS.map(w => (
                    <button
                      key={w}
                      type="button"
                      className={`eq-chip-btn ${form.specs?.warranty === w ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, specs: { ...form.specs, warranty: w } })}
                    >
                      <Shield size={12} />
                      <span>{w}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="eq-field-label">
                  <span>Short Description</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Tool features, applications, included accessories..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="eq-textarea"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Live Customer Card Preview */}
          <div className="eq-preview-col">
            <div className="eq-preview-header">
              <h4 className="eq-preview-title">
                <Eye size={14} style={{ color: '#ea580c' }} />
                <span>Live Catalog Card Preview</span>
              </h4>
              <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                LIVE PREVIEW
              </span>
            </div>

            {/* The Official Customer-Facing Product Card Preview */}
            <div className="eq-preview-card-wrap" style={{ width: '100%', maxWidth: '280px', margin: '0 auto' }}>
              <ProductCard product={previewProduct} isPreview={true} />
            </div>

            {/* Live Administrative & Stock Details */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '0.74rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '280px', width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontWeight: '800', color: '#1e293b' }}>
                <span>Inventory & Storefront Sync</span>
                <span style={{ color: '#16a34a', fontSize: '0.68rem', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>● Atlas Live</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Warehouse Stock:</span>
                <strong style={{ color: Number(form.stock) <= 3 ? '#dc2626' : '#16a34a' }}>
                  {Number(form.stock) <= 3 ? `⚠️ Low: ${form.stock} left` : `🟢 ${form.stock} In Stock`}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping:</span>
                <strong>
                  {Number(form.deliveryCost) === 0 ? '🚚 Free Express Delivery' : `📦 ₹${form.deliveryCost} Delivery`}
                </strong>
              </div>
              {form.specs?.warranty && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Warranty:</span>
                  <strong>{form.specs.warranty}</strong>
                </div>
              )}
              {form.specs?.power && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Power:</span>
                  <strong>{form.specs.power}</strong>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="eq-modal-footer">
          <button
            type="button"
            className="eq-btn-cancel"
            onClick={handleAttemptClose}
            disabled={isSubmitting}
            id="btn-cancel-equipment-modal"
          >
            Cancel & Discard
          </button>

          <div className="eq-footer-actions-right">
            {!editingProduct && (
              <button
                type="button"
                className="eq-btn-add-another"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !form.name.trim() || !form.price}
                title="Save this tool and keep the modal open to add the next one"
                id="btn-save-add-another"
              >
                <Plus size={15} />
                <span>Save & Add Another</span>
              </button>
            )}

            <button
              type="button"
              className="eq-btn-submit"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !form.name.trim() || !form.price}
              id="btn-save-tool-submit"
            >
              {isSubmitting ? (
                <>
                  <div style={{ width: '14px', height: '14px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>{editingProduct ? 'Save Changes' : 'Add to Store Catalog'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEquipmentModal;
