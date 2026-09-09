import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  BatteryCharging,
  Disc,
  Hammer,
  Wrench,
  Wind,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
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
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState(DEFAULT_CATEGORIES);
  const [dynamicBrands, setDynamicBrands] = useState([]);

  // Filter Search Inputs (Amazon / Flipkart inline filter search)
  const [brandSearch, setBrandSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Accordion Toggle States
  const [expanded, setExpanded] = useState({
    categories: true,
    brands: true,
    price: true,
    power: true,
    availability: true
  });

  // Price & Feature Filters
  const [priceFilter, setPriceFilter] = useState('all');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [powerFilter, setPowerFilter] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);

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

  // Toggle Accordion Section
  const toggleAccordion = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Dynamic Item Counts (Amazon / Flipkart style counts)
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
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
    return products.filter(p => p.cordless).length;
  }, [products]);

  const cordedCount = useMemo(() => {
    return products.filter(p => !p.cordless).length;
  }, [products]);

  const inStockCount = useMemo(() => {
    return products.filter(p => (typeof p.stock !== 'number' || p.stock > 0)).length;
  }, [products]);

  // Filtered Options for inline searches
  const filteredCategoriesList = useMemo(() => {
    if (!categorySearch.trim()) return dynamicCategories;
    const q = categorySearch.toLowerCase();
    return dynamicCategories.filter(c => c.label.toLowerCase().includes(q) || c.id === 'all');
  }, [dynamicCategories, categorySearch]);

  const filteredBrandsList = useMemo(() => {
    if (!brandSearch.trim()) return dynamicBrands;
    const q = brandSearch.toLowerCase();
    return dynamicBrands.filter(b => b.toLowerCase().includes(q));
  }, [dynamicBrands, brandSearch]);

  // Apply Local Filters (Price, Power, InStock)
  const displayedProducts = useMemo(() => {
    let list = Array.isArray(products) ? [...products] : [];

    // Price Filter
    if (priceFilter === 'under-3000') {
      list = list.filter(p => p.price < 3000);
    } else if (priceFilter === '3000-6000') {
      list = list.filter(p => p.price >= 3000 && p.price <= 6000);
    } else if (priceFilter === '6000-12000') {
      list = list.filter(p => p.price >= 6000 && p.price <= 12000);
    } else if (priceFilter === 'over-12000') {
      list = list.filter(p => p.price > 12000);
    } else if (priceFilter === 'custom') {
      const min = appliedMinPrice ? Number(appliedMinPrice) : null;
      const max = appliedMaxPrice ? Number(appliedMaxPrice) : null;
      if (min !== null && !isNaN(min)) list = list.filter(p => p.price >= min);
      if (max !== null && !isNaN(max)) list = list.filter(p => p.price <= max);
    }

    // Power Source Filter
    if (powerFilter === 'cordless') {
      list = list.filter(p => p.cordless === true);
    } else if (powerFilter === 'corded') {
      list = list.filter(p => !p.cordless);
    }

    // In Stock Only Filter
    if (inStockOnly) {
      list = list.filter(p => (typeof p.stock !== 'number' || p.stock > 0));
    }

    return list;
  }, [products, priceFilter, appliedMinPrice, appliedMaxPrice, powerFilter, inStockOnly]);

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

  // Render Filter Content (reusable for Desktop Sidebar and Mobile Drawer)
  const renderFilterAccordions = () => (
    <>
      {/* 1. CATEGORIES ACCORDION */}
      <div className="filter-accordion-block">
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleAccordion('categories')}
          aria-expanded={expanded.categories}
        >
          <span>Category</span>
          {expanded.categories ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.categories && (
          <div>
            {dynamicCategories.length > 7 && (
              <div className="filter-search-box">
                <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            <div className="filter-scroll-list">
              {filteredCategoriesList.map(cat => {
                const isActive = activeCategory === cat.id;
                const count = cat.id === 'all' ? products.length : (categoryCounts[cat.id] || 0);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`filter-checkbox-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchParams(prev => {
                        if (cat.id === 'all') prev.delete('category');
                        else prev.set('category', cat.id);
                        return prev;
                      });
                    }}
                    id={`filter-cat-${cat.id}`}
                  >
                    <div className="filter-custom-checkbox">
                      {isActive && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.label}
                    </span>
                    <span className="filter-count-badge">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. BRANDS ACCORDION */}
      <div className="filter-accordion-block">
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleAccordion('brands')}
          aria-expanded={expanded.brands}
        >
          <span>Brand</span>
          {expanded.brands ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.brands && (
          <div>
            {/* Quick Search inside Brand List */}
            <div className="filter-search-box">
              <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search Brand (e.g. Bosch, Makita)..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                id="input-brand-filter-search"
              />
              {brandSearch && (
                <button
                  onClick={() => setBrandSearch('')}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="filter-scroll-list">
              {/* All Brands Option */}
              <button
                type="button"
                className={`filter-checkbox-item ${activeBrand === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveBrand('all');
                  setSearchParams(prev => {
                    prev.delete('brand');
                    return prev;
                  });
                }}
                id="filter-brand-all"
              >
                <div className="filter-custom-checkbox">
                  {activeBrand === 'all' && <Check size={11} strokeWidth={3} />}
                </div>
                <span>All Brands</span>
                <span className="filter-count-badge">({products.length})</span>
              </button>

              {/* Dynamic Brands from MongoDB */}
              {filteredBrandsList.map(brand => {
                const brandVal = brand.toLowerCase();
                const isActive = activeBrand === brandVal;
                const count = brandCounts[brandVal] || 0;

                return (
                  <button
                    key={brand}
                    type="button"
                    className={`filter-checkbox-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      const next = isActive ? 'all' : brandVal;
                      setActiveBrand(next);
                      setSearchParams(prev => {
                        if (next === 'all') prev.delete('brand');
                        else prev.set('brand', next);
                        return prev;
                      });
                    }}
                    id={`filter-brand-${brandVal}`}
                  >
                    <div className="filter-custom-checkbox">
                      {isActive && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span>{brand}</span>
                    <span className="filter-count-badge">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. PRICE ACCORDION (Amazon & Flipkart style presets + Go button) */}
      <div className="filter-accordion-block">
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleAccordion('price')}
          aria-expanded={expanded.price}
        >
          <span>Price (₹)</span>
          {expanded.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.price && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
              {PRICE_PRESETS.map(preset => {
                const isActive = priceFilter === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`filter-checkbox-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setPriceFilter(preset.id);
                      setAppliedMinPrice('');
                      setAppliedMaxPrice('');
                    }}
                    id={`filter-price-${preset.id}`}
                  >
                    <div className="filter-custom-checkbox">
                      {isActive && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Min - Max with Go Button */}
            <form onSubmit={handleApplyCustomPrice} className="filter-price-input-row">
              <input
                type="number"
                placeholder="₹ Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="filter-price-field"
                aria-label="Minimum price"
                id="input-min-price"
              />
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
              <input
                type="number"
                placeholder="₹ Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="filter-price-field"
                aria-label="Maximum price"
                id="input-max-price"
              />
              <button type="submit" className="filter-price-go-btn" id="btn-apply-price-go">
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. POWER SOURCE / CORDLESS ACCORDION */}
      <div className="filter-accordion-block">
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleAccordion('power')}
          aria-expanded={expanded.power}
        >
          <span>Power Source</span>
          {expanded.power ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.power && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
            <button
              type="button"
              className={`filter-checkbox-item ${powerFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPowerFilter('all')}
            >
              <div className="filter-custom-checkbox">
                {powerFilter === 'all' && <Check size={11} strokeWidth={3} />}
              </div>
              <span>All Power Types</span>
              <span className="filter-count-badge">({products.length})</span>
            </button>

            <button
              type="button"
              className={`filter-checkbox-item ${powerFilter === 'cordless' ? 'active' : ''}`}
              onClick={() => setPowerFilter(powerFilter === 'cordless' ? 'all' : 'cordless')}
              id="filter-power-cordless"
            >
              <div className="filter-custom-checkbox">
                {powerFilter === 'cordless' && <Check size={11} strokeWidth={3} />}
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={13} style={{ color: '#0284c7' }} />
                <span>Cordless (Battery)</span>
              </span>
              <span className="filter-count-badge">({cordlessCount})</span>
            </button>

            <button
              type="button"
              className={`filter-checkbox-item ${powerFilter === 'corded' ? 'active' : ''}`}
              onClick={() => setPowerFilter(powerFilter === 'corded' ? 'all' : 'corded')}
              id="filter-power-corded"
            >
              <div className="filter-custom-checkbox">
                {powerFilter === 'corded' && <Check size={11} strokeWidth={3} />}
              </div>
              <span>Corded / Electric</span>
              <span className="filter-count-badge">({cordedCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. AVAILABILITY ACCORDION */}
      <div className="filter-accordion-block">
        <button
          type="button"
          className="filter-accordion-header"
          onClick={() => toggleAccordion('availability')}
          aria-expanded={expanded.availability}
        >
          <span>Availability</span>
          {expanded.availability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {expanded.availability && (
          <div style={{ marginTop: '6px' }}>
            <button
              type="button"
              className={`filter-checkbox-item ${inStockOnly ? 'active' : ''}`}
              onClick={() => setInStockOnly(!inStockOnly)}
              id="filter-in-stock-only"
            >
              <div className="filter-custom-checkbox">
                {inStockOnly && <Check size={11} strokeWidth={3} />}
              </div>
              <span>In Stock Only</span>
              <span className="filter-count-badge">({inStockCount})</span>
            </button>
          </div>
        )}
      </div>

      {/* Kozhencherry Store Info Badge */}
      <div
        style={{
          marginTop: '20px',
          padding: '12px 14px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          fontSize: '0.78rem',
          color: '#64748b',
          lineHeight: 1.45
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0f172a', fontWeight: '700', marginBottom: '3px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--brand-primary)' }} />
          <span>Variathu Guaranteed</span>
        </div>
        Authorized sales, official warranty & genuine spare parts at Poyanil Building, Kozhencherry.
      </div>
    </>
  );

  return (
    <div style={{ padding: '16px 0 48px' }}>
      {/* Top Shop Banner / Header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Equipment Catalog
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Explore genuine power tools, cordless machinery, and industrial accessories backed by direct repair support in Kozhencherry.
        </p>
      </div>

      {/* Top Controls Bar */}
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

        {/* Results Counter & Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilter(true)}
            className="btn-icon"
            style={{ display: 'inline-flex', position: 'relative' }}
            title="Open Filters"
            id="btn-open-mobile-filter"
          >
            <SlidersHorizontal size={18} />
            {activeFiltersCount > 0 && (
              <span className="badge-counter animate-fade-in" style={{ top: -5, right: -5 }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE FILTERS CHIPS BAR (Amazon & Flipkart style tags above product grid) */}
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

      {/* Shop Layout: Desktop Sidebar + Product Grid */}
      <div className="shop-layout">
        {/* Left Sidebar Filter (Desktop) */}
        <aside className="filter-sidebar-clean">
          <div className="filter-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Filter size={15} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>Filters</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                id="btn-reset-filters-sidebar"
              >
                <RotateCcw size={12} /> Clear All
              </button>
            )}
          </div>

          {renderFilterAccordions()}
        </aside>

        {/* Product Grid Area */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
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
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>
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
      </div>

      {/* MOBILE FILTER DRAWER (Amazon / Flipkart Style Slide-Over Panel) */}
      {showMobileFilter && (
        <div className="mobile-filter-overlay" onClick={() => setShowMobileFilter(false)}>
          <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-filter-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} style={{ color: 'var(--brand-primary)' }} />
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                  Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMobileFilter(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="mobile-filter-drawer-body">
              {renderFilterAccordions()}
            </div>

            <div className="mobile-filter-drawer-footer">
              <button
                type="button"
                className="btn-hero-secondary"
                onClick={() => setShowMobileFilter(false)}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-hero-clean"
                onClick={() => setShowMobileFilter(false)}
                style={{ flex: 2, justifyContent: 'center' }}
              >
                Apply ({displayedProducts.length} Tools)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
