import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Disc,
  Hammer,
  Wrench,
  Wind,
  Sparkles,
  Layers,
  Check,
  Zap,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'All Categories', icon: Layers },
  { id: 'grinders-cutters', label: 'Grinders & Cutters', icon: Disc },
  { id: 'hammers', label: 'Hammer Drills', icon: Hammer },
  { id: 'woodworking', label: 'Woodworking', icon: Wrench },
  { id: 'washers-blowers', label: 'Washers & Blowers', icon: Wind },
  { id: 'accessories', label: 'Accessories & Bits', icon: Sparkles },
  { id: 'welding-machines', label: 'Welding Machines', icon: Zap },
];

const PRICE_PRESETS = [
  { id: 'all', label: 'Any Price' },
  { id: 'under-3000', label: 'Under ₹3,000' },
  { id: '3000-6000', label: '₹3,000 - ₹6,000' },
  { id: '6000-12000', label: '₹6,000 - ₹12,000' },
  { id: 'over-12000', label: 'Over ₹12,000' }
];

export const ShopPage = ({
  products = [],
  loading,
  error,
  activeCategory,
  setActiveCategory,
  activeBrand,
  setActiveBrand,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onSelectProduct
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal Visibility and Active Tab state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('category'); // 'category' | 'brand' | 'price' | 'power' | 'availability'

  // Dynamic taxonomy from backend
  const [dynamicCategories, setDynamicCategories] = useState(DEFAULT_CATEGORIES);
  const [dynamicBrands, setDynamicBrands] = useState([]);

  // Search queries inside filter modal (Amazon / Flipkart inline filter search)
  const [brandSearch, setBrandSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Price & Feature Filters
  const [priceFilter, setPriceFilter] = useState('all');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [powerFilter, setPowerFilter] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Lock body scroll and listen for ESC key when filter modal is open
  useEffect(() => {
    if (showFilterModal) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setShowFilterModal(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showFilterModal]);

  // Fetch taxonomy from backend
  useEffect(() => {
    api.getTaxonomy().then(res => {
      if (res && res.brands && res.categories) {
        const mergedCats = [
          { id: 'all', label: 'All Categories', icon: Layers },
          ...res.categories.map(c => ({
            id: c.id,
            label: c.name,
            icon: c.id.includes('hammer') ? Hammer :
                  c.id.includes('grind') ? Disc :
                  c.id.includes('wood') ? Wrench :
                  c.id.includes('wash') ? Wind :
                  c.id.includes('weld') ? Zap : Sparkles
          }))
        ];
        setDynamicCategories(mergedCats);
        setDynamicBrands(res.brands);
      }
    }).catch(err => console.error("Could not fetch taxonomy in shop:", err));
  }, []);

  // Sync URL search params
  useEffect(() => {
    const brandParam = searchParams.get('brand');
    const catParam = searchParams.get('category');
    if (brandParam) setActiveBrand(brandParam);
    if (catParam) setActiveCategory(catParam);
  }, [searchParams]);

  // Dynamic Item Counts (Amazon / Flipkart style counts)
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const brandCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.brand) {
        const key = p.brand.toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const cordlessCount = useMemo(() => {
    return products.filter(p => {
      const txt = `${p.name} ${p.category} ${p.specs || ''}`.toLowerCase();
      return txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
    }).length;
  }, [products]);

  const cordedCount = useMemo(() => {
    return Math.max(0, products.length - cordlessCount);
  }, [products.length, cordlessCount]);

  const inStockCount = useMemo(() => {
    return products.filter(p => p.stock !== 0 && p.inStock !== false).length;
  }, [products]);

  // Filtered lists for inline searches
  const filteredBrandsList = useMemo(() => {
    if (!brandSearch.trim()) return dynamicBrands;
    return dynamicBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [dynamicBrands, brandSearch]);

  const filteredCategoriesList = useMemo(() => {
    if (!categorySearch.trim()) return dynamicCategories;
    return dynamicCategories.filter(c => c.label.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [dynamicCategories, categorySearch]);

  // Master product filtering logic
  const displayedProducts = useMemo(() => {
    return products
      .filter(product => {
        // Category Filter
        if (activeCategory && activeCategory !== 'all') {
          if (product.category !== activeCategory) return false;
        }

        // Brand Filter
        if (activeBrand && activeBrand !== 'all') {
          if ((product.brand || '').toLowerCase() !== activeBrand.toLowerCase()) return false;
        }

        // Price Filter
        if (priceFilter === 'under-3000' && product.price >= 3000) return false;
        if (priceFilter === '3000-6000' && (product.price < 3000 || product.price > 6000)) return false;
        if (priceFilter === '6000-12000' && (product.price < 6000 || product.price > 12000)) return false;
        if (priceFilter === 'over-12000' && product.price <= 12000) return false;
        if (priceFilter === 'custom') {
          const min = appliedMinPrice ? Number(appliedMinPrice) : 0;
          const max = appliedMaxPrice ? Number(appliedMaxPrice) : Infinity;
          if (product.price < min || product.price > max) return false;
        }

        // Power Source Filter
        if (powerFilter === 'cordless') {
          const txt = `${product.name} ${product.category} ${product.specs || ''}`.toLowerCase();
          const isCordless = txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
          if (!isCordless) return false;
        }
        if (powerFilter === 'corded') {
          const txt = `${product.name} ${product.category} ${product.specs || ''}`.toLowerCase();
          const isCordless = txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
          if (isCordless) return false;
        }

        // Availability Filter
        if (inStockOnly) {
          if (product.stock === 0 || product.inStock === false) return false;
        }

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name?.toLowerCase().includes(q);
          const matchBrand = product.brand?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchCat && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return 0; // featured/default
      });
  }, [
    products,
    activeCategory,
    activeBrand,
    priceFilter,
    appliedMinPrice,
    appliedMaxPrice,
    powerFilter,
    inStockOnly,
    searchQuery,
    sortBy
  ]);

  const handleApplyCustomPrice = (e) => {
    e.preventDefault();
    if (minPriceInput || maxPriceInput) {
      setPriceFilter('custom');
      setAppliedMinPrice(minPriceInput);
      setAppliedMaxPrice(maxPriceInput);
    }
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveBrand('all');
    setSearchQuery('');
    setSortBy('featured');
    setPriceFilter('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setPowerFilter('all');
    setInStockOnly(false);
    setBrandSearch('');
    setCategorySearch('');
    setSearchParams({});
  };

  // Check if any filter is active
  const hasActiveFilters =
    (activeCategory && activeCategory !== 'all') ||
    (activeBrand && activeBrand !== 'all') ||
    (priceFilter && priceFilter !== 'all') ||
    (powerFilter && powerFilter !== 'all') ||
    inStockOnly ||
    Boolean(searchQuery);

  const activeFiltersCount =
    (activeCategory !== 'all' ? 1 : 0) +
    (activeBrand !== 'all' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (powerFilter !== 'all' ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div style={{ padding: '16px 0 48px' }}>
      {/* Top Shop Banner / Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Equipment Catalog
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Explore genuine power tools, cordless machinery, and industrial accessories backed by direct repair support in Kozhencherry.
        </p>
      </div>

      {/* Top Controls Bar with Filter Button (Saves screen space & opens filter modal) */}
      <div className="shop-top-controls">
        {/* Search Input */}
        <div className="search-input-clean">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search Bosch, Makita, grinder, drill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="shop-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Action Controls: Filter Button, Tool Counter, Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Prominent Filter Button that opens modal */}
          <button
            type="button"
            className={`shop-filter-trigger-btn ${hasActiveFilters ? 'active' : ''}`}
            onClick={() => setShowFilterModal(true)}
            id="btn-open-filter-modal"
            title="Open Filter Dialog"
          >
            <SlidersHorizontal size={16} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="shop-filter-badge" id="filter-badge-counter">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
            Showing <strong style={{ color: '#0f172a' }}>{displayedProducts.length}</strong> Tools
          </span>

          <select
            className="sort-select-clean"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="shop-sort-select"
          >
            <option value="featured">Featured / Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* ACTIVE FILTERS CHIPS BAR (Flipkart / Amazon style chips under top controls) */}
      {hasActiveFilters && (
        <div className="active-filters-chips-bar" id="active-filters-bar">
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Active Filters:
          </span>

          {/* Category Chip */}
          {activeCategory && activeCategory !== 'all' && (
            <span className="active-filter-chip">
              <span>Category: {dynamicCategories.find(c => c.id === activeCategory)?.label || activeCategory}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchParams(prev => { prev.delete('category'); return prev; });
                }}
                title="Remove Category filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {/* Brand Chip */}
          {activeBrand && activeBrand !== 'all' && (
            <span className="active-filter-chip">
              <span style={{ textTransform: 'capitalize' }}>Brand: {activeBrand}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveBrand('all');
                  setSearchParams(prev => { prev.delete('brand'); return prev; });
                }}
                title="Remove Brand filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {/* Price Chip */}
          {priceFilter !== 'all' && (
            <span className="active-filter-chip">
              <span>
                {priceFilter === 'custom'
                  ? `Price: ₹${appliedMinPrice || '0'} - ₹${appliedMaxPrice || 'Max'}`
                  : PRICE_PRESETS.find(p => p.id === priceFilter)?.label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPriceFilter('all');
                  setAppliedMinPrice('');
                  setAppliedMaxPrice('');
                }}
                title="Remove Price filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {/* Power Type Chip */}
          {powerFilter !== 'all' && (
            <span className="active-filter-chip">
              <span>{powerFilter === 'cordless' ? '⚡ Cordless Only' : '🔌 Corded Electric'}</span>
              <button type="button" onClick={() => setPowerFilter('all')} title="Remove Power filter">
                <X size={13} />
              </button>
            </span>
          )}

          {/* In Stock Chip */}
          {inStockOnly && (
            <span className="active-filter-chip">
              <span>In Stock Only</span>
              <button type="button" onClick={() => setInStockOnly(false)} title="Remove In-Stock filter">
                <X size={13} />
              </button>
            </span>
          )}

          {/* Search Query Chip */}
          {searchQuery && (
            <span className="active-filter-chip">
              <span>Keyword: "{searchQuery}"</span>
              <button type="button" onClick={() => setSearchQuery('')} title="Clear Search">
                <X size={13} />
              </button>
            </span>
          )}

          {/* Clear All Button */}
          <button
            type="button"
            className="btn-clear-all-chips"
            onClick={handleResetFilters}
            id="btn-clear-all-chips"
          >
            Clear All
          </button>
        </div>
      )}

      {/* FULL-WIDTH PRODUCT CATALOG (No permanent sidebar eating horizontal space) */}
      <main className="shop-catalog-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 0', color: '#64748b' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                border: '3px solid #e2e8f0',
                borderTopColor: 'var(--brand-primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 14px'
              }}
            />
            <p style={{ fontWeight: '600' }}>Loading equipment catalog...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#dc2626' }}>
            <p>{error}</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px'
            }}
          >
            <h4 style={{ color: '#0f172a', fontSize: '1.15rem', marginBottom: '6px' }}>
              No tools match your active filters
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>
              Try adjusting your brand, category, or price range criteria.
            </p>
            <button
              className="btn-hero-clean"
              onClick={handleResetFilters}
              style={{ fontSize: '0.86rem', padding: '10px 20px' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* AMAZON & FLIPKART STYLE FILTER MODAL DIALOG */}
      {showFilterModal && (
        <div className="filter-modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div
            className="filter-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="filter-modal-header">
              <div className="filter-modal-title-wrap">
                <div className="filter-modal-icon-badge">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="filter-modal-title">Filters</h3>
                  <span className="filter-modal-subtitle">
                    {activeFiltersCount > 0
                      ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} currently active`
                      : 'Refine machinery by brand, category, price & power type'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="filter-modal-clear-btn"
                    onClick={handleResetFilters}
                    id="btn-modal-clear-all"
                  >
                    <RotateCcw size={13} />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  type="button"
                  className="filter-modal-close-btn"
                  onClick={() => setShowFilterModal(false)}
                  aria-label="Close filters modal"
                  id="btn-close-filter-modal"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Tabs + Right Options Panel */}
            <div className="filter-modal-body">
              {/* Left Vertical Tabs (Flipkart / Amazon Style) */}
              <div className="filter-modal-tabs" role="tablist">
                {/* Category Tab */}
                <button
                  type="button"
                  className={`filter-tab-btn ${activeModalTab === 'category' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('category')}
                  role="tab"
                  aria-selected={activeModalTab === 'category'}
                  id="tab-filter-category"
                >
                  <div className="filter-tab-btn-content">
                    <span className="filter-tab-label">Category</span>
                    {activeCategory !== 'all' && <span className="filter-tab-active-dot" />}
                  </div>
                  <span className="filter-tab-count-sub">
                    {activeCategory !== 'all'
                      ? (dynamicCategories.find(c => c.id === activeCategory)?.label || activeCategory)
                      : 'All'}
                  </span>
                </button>

                {/* Brand Tab */}
                <button
                  type="button"
                  className={`filter-tab-btn ${activeModalTab === 'brand' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('brand')}
                  role="tab"
                  aria-selected={activeModalTab === 'brand'}
                  id="tab-filter-brand"
                >
                  <div className="filter-tab-btn-content">
                    <span className="filter-tab-label">Brand</span>
                    {activeBrand !== 'all' && <span className="filter-tab-active-dot" />}
                  </div>
                  <span className="filter-tab-count-sub">
                    {activeBrand !== 'all' ? activeBrand : 'All'}
                  </span>
                </button>

                {/* Price Tab */}
                <button
                  type="button"
                  className={`filter-tab-btn ${activeModalTab === 'price' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('price')}
                  role="tab"
                  aria-selected={activeModalTab === 'price'}
                  id="tab-filter-price"
                >
                  <div className="filter-tab-btn-content">
                    <span className="filter-tab-label">Price (₹)</span>
                    {priceFilter !== 'all' && <span className="filter-tab-active-dot" />}
                  </div>
                  <span className="filter-tab-count-sub">
                    {priceFilter === 'custom'
                      ? `₹${appliedMinPrice || '0'} - ₹${appliedMaxPrice || 'Max'}`
                      : priceFilter !== 'all'
                      ? PRICE_PRESETS.find(p => p.id === priceFilter)?.label
                      : 'Any'}
                  </span>
                </button>

                {/* Power Source Tab */}
                <button
                  type="button"
                  className={`filter-tab-btn ${activeModalTab === 'power' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('power')}
                  role="tab"
                  aria-selected={activeModalTab === 'power'}
                  id="tab-filter-power"
                >
                  <div className="filter-tab-btn-content">
                    <span className="filter-tab-label">Power Source</span>
                    {powerFilter !== 'all' && <span className="filter-tab-active-dot" />}
                  </div>
                  <span className="filter-tab-count-sub">
                    {powerFilter === 'cordless' ? 'Cordless' : powerFilter === 'corded' ? 'Corded' : 'All'}
                  </span>
                </button>

                {/* Availability Tab */}
                <button
                  type="button"
                  className={`filter-tab-btn ${activeModalTab === 'availability' ? 'active' : ''}`}
                  onClick={() => setActiveModalTab('availability')}
                  role="tab"
                  aria-selected={activeModalTab === 'availability'}
                  id="tab-filter-availability"
                >
                  <div className="filter-tab-btn-content">
                    <span className="filter-tab-label">Availability</span>
                    {inStockOnly && <span className="filter-tab-active-dot" />}
                  </div>
                  <span className="filter-tab-count-sub">
                    {inStockOnly ? 'In Stock Only' : 'All'}
                  </span>
                </button>
              </div>

              {/* Right Panel Content */}
              <div className="filter-modal-panel">
                {/* 1. CATEGORY TAB PANEL */}
                {activeModalTab === 'category' && (
                  <div>
                    <div className="filter-panel-header">
                      <h4>Equipment Categories</h4>
                      <span className="filter-panel-hint">Select a specialized machinery category</span>
                    </div>

                    {dynamicCategories.length > 6 && (
                      <div className="filter-search-box">
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                          type="text"
                          placeholder="Filter categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                        {categorySearch && (
                          <button
                            type="button"
                            onClick={() => setCategorySearch('')}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    )}

                    <div className="filter-options-grid">
                      {filteredCategoriesList.map(cat => {
                        const isActive = activeCategory === cat.id;
                        const count = cat.id === 'all' ? products.length : (categoryCounts[cat.id] || 0);

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            className={`filter-pill-option ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setActiveCategory(cat.id);
                              setSearchParams(prev => {
                                if (cat.id === 'all') prev.delete('category');
                                else prev.set('category', cat.id);
                                return prev;
                              });
                            }}
                            id={`modal-filter-cat-${cat.id}`}
                          >
                            <div className="filter-custom-checkbox">
                              {isActive && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="filter-option-name">{cat.label}</span>
                            <span className="filter-count-badge">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. BRAND TAB PANEL */}
                {activeModalTab === 'brand' && (
                  <div>
                    <div className="filter-panel-header">
                      <h4>Manufacturer Brands</h4>
                      <span className="filter-panel-hint">Authorized brand warranties supported by Variathu</span>
                    </div>

                    <div className="filter-search-box">
                      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search Brand (e.g. Bosch, Makita, Stanley)..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        id="modal-brand-filter-search"
                      />
                      {brandSearch && (
                        <button
                          type="button"
                          onClick={() => setBrandSearch('')}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="filter-options-grid">
                      {/* All Brands Option */}
                      <button
                        type="button"
                        className={`filter-pill-option ${activeBrand === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveBrand('all');
                          setSearchParams(prev => { prev.delete('brand'); return prev; });
                        }}
                        id="modal-filter-brand-all"
                      >
                        <div className="filter-custom-checkbox">
                          {activeBrand === 'all' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name">All Brands</span>
                        <span className="filter-count-badge">({products.length})</span>
                      </button>

                      {filteredBrandsList.map(brand => {
                        const brandVal = brand.toLowerCase();
                        const isActive = activeBrand === brandVal;
                        const count = brandCounts[brandVal] || 0;

                        return (
                          <button
                            key={brand}
                            type="button"
                            className={`filter-pill-option ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              const next = isActive ? 'all' : brandVal;
                              setActiveBrand(next);
                              setSearchParams(prev => {
                                if (next === 'all') prev.delete('brand');
                                else prev.set('brand', next);
                                return prev;
                              });
                            }}
                            id={`modal-filter-brand-${brandVal}`}
                          >
                            <div className="filter-custom-checkbox">
                              {isActive && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="filter-option-name">{brand}</span>
                            <span className="filter-count-badge">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. PRICE TAB PANEL */}
                {activeModalTab === 'price' && (
                  <div>
                    <div className="filter-panel-header">
                      <h4>Price Range (₹)</h4>
                      <span className="filter-panel-hint">Select price brackets or specify custom budget</span>
                    </div>

                    <div className="filter-options-column">
                      {PRICE_PRESETS.map(preset => {
                        const isActive = priceFilter === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            className={`filter-pill-option ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setPriceFilter(preset.id);
                              setAppliedMinPrice('');
                              setAppliedMaxPrice('');
                            }}
                            id={`modal-filter-price-${preset.id}`}
                          >
                            <div className="filter-custom-checkbox">
                              {isActive && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="filter-option-name">{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Min - Max with Go Button */}
                    <div className="filter-custom-price-block">
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1e293b' }}>
                        Custom Price Limits
                      </span>
                      <form onSubmit={handleApplyCustomPrice} className="filter-price-input-row">
                        <input
                          type="number"
                          placeholder="₹ Min"
                          value={minPriceInput}
                          onChange={(e) => setMinPriceInput(e.target.value)}
                          className="filter-price-field"
                          id="modal-input-min-price"
                        />
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>-</span>
                        <input
                          type="number"
                          placeholder="₹ Max"
                          value={maxPriceInput}
                          onChange={(e) => setMaxPriceInput(e.target.value)}
                          className="filter-price-field"
                          id="modal-input-max-price"
                        />
                        <button type="submit" className="filter-price-go-btn" id="modal-btn-apply-price">
                          Go
                        </button>
                      </form>
                      {priceFilter === 'custom' && (appliedMinPrice || appliedMaxPrice) && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: '700' }}>
                          Active range: ₹{appliedMinPrice || '0'} to ₹{appliedMaxPrice || 'Max'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. POWER SOURCE TAB PANEL */}
                {activeModalTab === 'power' && (
                  <div>
                    <div className="filter-panel-header">
                      <h4>Power Source</h4>
                      <span className="filter-panel-hint">Select battery cordless or heavy-duty corded electric</span>
                    </div>

                    <div className="filter-options-column">
                      <button
                        type="button"
                        className={`filter-pill-option ${powerFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPowerFilter('all')}
                        id="modal-filter-power-all"
                      >
                        <div className="filter-custom-checkbox">
                          {powerFilter === 'all' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name">All Power Types</span>
                        <span className="filter-count-badge">({products.length})</span>
                      </button>

                      <button
                        type="button"
                        className={`filter-pill-option ${powerFilter === 'cordless' ? 'active' : ''}`}
                        onClick={() => setPowerFilter(powerFilter === 'cordless' ? 'all' : 'cordless')}
                        id="modal-filter-power-cordless"
                      >
                        <div className="filter-custom-checkbox">
                          {powerFilter === 'cordless' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Zap size={14} style={{ color: '#0284c7' }} />
                          <span>Cordless (Battery)</span>
                        </span>
                        <span className="filter-count-badge">({cordlessCount})</span>
                      </button>

                      <button
                        type="button"
                        className={`filter-pill-option ${powerFilter === 'corded' ? 'active' : ''}`}
                        onClick={() => setPowerFilter(powerFilter === 'corded' ? 'all' : 'corded')}
                        id="modal-filter-power-corded"
                      >
                        <div className="filter-custom-checkbox">
                          {powerFilter === 'corded' && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name">Corded / Electric</span>
                        <span className="filter-count-badge">({cordedCount})</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. AVAILABILITY TAB PANEL */}
                {activeModalTab === 'availability' && (
                  <div>
                    <div className="filter-panel-header">
                      <h4>Stock Availability</h4>
                      <span className="filter-panel-hint">Variathu warehouse Kozhencherry stock status</span>
                    </div>

                    <div className="filter-options-column">
                      <button
                        type="button"
                        className={`filter-pill-option ${!inStockOnly ? 'active' : ''}`}
                        onClick={() => setInStockOnly(false)}
                        id="modal-filter-stock-all"
                      >
                        <div className="filter-custom-checkbox">
                          {!inStockOnly && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name">All Equipment</span>
                        <span className="filter-count-badge">({products.length})</span>
                      </button>

                      <button
                        type="button"
                        className={`filter-pill-option ${inStockOnly ? 'active' : ''}`}
                        onClick={() => setInStockOnly(true)}
                        id="modal-filter-stock-instock"
                      >
                        <div className="filter-custom-checkbox">
                          {inStockOnly && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className="filter-option-name">In Stock Only (Ready for Pickup)</span>
                        <span className="filter-count-badge">({inStockCount})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="filter-modal-footer">
              <button
                type="button"
                className="filter-modal-reset-btn"
                onClick={handleResetFilters}
                id="modal-btn-reset-all"
              >
                <RotateCcw size={14} />
                <span>Reset All</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="filter-modal-cancel-btn"
                  onClick={() => setShowFilterModal(false)}
                  id="modal-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="filter-modal-apply-btn"
                  onClick={() => setShowFilterModal(false)}
                  id="modal-btn-apply-filters"
                >
                  Show {displayedProducts.length} Tools
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
