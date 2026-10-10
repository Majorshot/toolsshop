import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import AnimatedContent from '../components/AnimatedContent';
import GlideSelect from '../components/GlideSelect';
import { api } from '../services/api';
import { safeSessionStorage } from '../utils/safeStorage';

const SHOP_SORT_OPTIONS = [
  { value: 'featured', label: 'Featured / Recommended', tag: 'Best' },
  { value: 'price-low', label: 'Price: Low to High', tag: 'Lowest' },
  { value: 'price-high', label: 'Price: High to Low', tag: 'Highest' }
];

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
  sortBy: propSortBy,
  setSortBy: propSetSortBy,
  onSelectProduct,
  onRetry
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal Visibility and Active Tab state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('category'); // 'category' | 'brand' | 'price' | 'power' | 'availability'

  // Dynamic taxonomy from backend
  const [dynamicCategories, setDynamicCategories] = useState(DEFAULT_CATEGORIES);
  const [dynamicBrands, setDynamicBrands] = useState([]);

  // Search queries inside filter modal (inline filter search)
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

  // Local immediate search input state for debounced 60fps typing
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        setSearchQuery(localSearch);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Synchronize all filters to URL searchParams & sessionStorage for seamless back navigation
  const updateFilterParams = (updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === undefined || val === '' || val === 'all' || val === false || (key === 'sort' && val === 'featured')) {
          next.delete(key);
          try { safeSessionStorage.removeItem(`shop_${key}_filter`); } catch (e) {}
          if (key === 'sort') {
            try { safeSessionStorage.removeItem('shop_sort'); } catch (e) {}
          }
        } else {
          next.set(key, String(val));
          try { safeSessionStorage.setItem(`shop_${key}_filter`, String(val)); } catch (e) {}
          if (key === 'sort') {
            try { safeSessionStorage.setItem('shop_sort', String(val)); } catch (e) {}
          }
        }
      });
      return next;
    }, { replace: true });
  };

  // Resilient Sort State: supports external prop, fallback internal state, and URL sync
  const [internalSortBy, setInternalSortBy] = useState(() => {
    return searchParams.get('sort') || safeSessionStorage.getItem('shop_sort') || propSortBy || 'featured';
  });

  const sortBy = propSortBy !== undefined ? propSortBy : internalSortBy;

  const setSortBy = (val) => {
    setInternalSortBy(val);
    if (typeof propSetSortBy === 'function') {
      try {
        propSetSortBy(val);
      } catch (e) {
        console.error("propSetSortBy error:", e);
      }
    }
    updateFilterParams({ sort: val });
  };

  // Pagination State for 1,000+ Products Performance
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Auto-reset page when any filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeBrand, priceFilter, appliedMinPrice, appliedMaxPrice, powerFilter, inStockOnly, searchQuery, sortBy]);

  // Lock body scroll and listen for ESC key when filter modal is open
  useEffect(() => {
    if (showFilterModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setShowFilterModal(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
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

  // Sync URL search params and sessionStorage on mount / URL changes
  useEffect(() => {
    const brandParam = searchParams.get('brand') || safeSessionStorage.getItem('shop_brand_filter');
    const catParam = searchParams.get('category') || safeSessionStorage.getItem('shop_category_filter');
    const powerParam = searchParams.get('power') || safeSessionStorage.getItem('shop_power_filter');
    const priceParam = searchParams.get('price') || safeSessionStorage.getItem('shop_price_filter');
    const minPriceParam = searchParams.get('minPrice') || safeSessionStorage.getItem('shop_minPrice_filter');
    const maxPriceParam = searchParams.get('maxPrice') || safeSessionStorage.getItem('shop_maxPrice_filter');
    const inStockParam = searchParams.get('inStock') ?? safeSessionStorage.getItem('shop_inStock_filter');

    if (brandParam) setActiveBrand(brandParam);
    else setActiveBrand('all');

    if (catParam) setActiveCategory(catParam);
    else setActiveCategory('all');

    if (powerParam) setPowerFilter(powerParam);
    else setPowerFilter('all');

    if (priceParam) setPriceFilter(priceParam);
    else setPriceFilter('all');

    if (minPriceParam) {
      setMinPriceInput(minPriceParam);
      setAppliedMinPrice(minPriceParam);
    } else {
      setMinPriceInput('');
      setAppliedMinPrice('');
    }

    if (maxPriceParam) {
      setMaxPriceInput(maxPriceParam);
      setAppliedMaxPrice(maxPriceParam);
    } else {
      setMaxPriceInput('');
      setAppliedMaxPrice('');
    }

    if (inStockParam !== null && inStockParam !== undefined) {
      setInStockOnly(inStockParam === 'true');
    } else {
      setInStockOnly(false);
    }

    const sortParam = searchParams.get('sort') || safeSessionStorage.getItem('shop_sort');
    if (sortParam && ['featured', 'price-low', 'price-high'].includes(sortParam)) {
      setInternalSortBy(sortParam);
      if (typeof propSetSortBy === 'function') {
        try { propSetSortBy(sortParam); } catch (e) {}
      }
    }
  }, [searchParams]);

  // Dynamic Item Counts
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
      return Boolean(p.cordless) || txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
    }).length;
  }, [products]);

  const cordedCount = useMemo(() => {
    return Math.max(0, products.length - cordlessCount);
  }, [products.length, cordlessCount]);

  const inStockCount = useMemo(() => {
    return products.filter(p => p.stock !== 0 && p.inStock !== false).length;
  }, [products]);

  // Available categories: ONLY categories that actually have at least 1 product uploaded
  const availableCategories = useMemo(() => {
    const list = [{ id: 'all', label: 'All Categories', icon: Layers }];
    const seenCatIds = new Set(['all']);

    // From backend taxonomy categories, include only those with products
    dynamicCategories.forEach(cat => {
      if (cat.id !== 'all' && (categoryCounts[cat.id] || 0) > 0 && !seenCatIds.has(cat.id)) {
        seenCatIds.add(cat.id);
        list.push(cat);
      }
    });

    // Also include any categories present in products that weren't in dynamicCategories
    products.forEach(p => {
      if (p.category && !seenCatIds.has(p.category) && (categoryCounts[p.category] || 0) > 0) {
        seenCatIds.add(p.category);
        const formattedLabel = p.category
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        list.push({
          id: p.category,
          label: formattedLabel,
          icon: p.category.includes('hammer') ? Hammer :
                p.category.includes('grind') ? Disc :
                p.category.includes('wood') ? Wrench :
                p.category.includes('wash') ? Wind :
                p.category.includes('weld') ? Zap : Sparkles
        });
      }
    });

    return list;
  }, [dynamicCategories, products, categoryCounts]);

  // Available brands: ONLY brand names that actually have at least 1 product uploaded
  const availableBrands = useMemo(() => {
    const brandMap = new Map(); // lowercase -> formatted name

    // From backend taxonomy brands, include only those with at least 1 product
    dynamicBrands.forEach(b => {
      if (b && (brandCounts[b.toLowerCase()] || 0) > 0) {
        brandMap.set(b.toLowerCase(), b);
      }
    });

    // Also include any brand on products with count > 0
    products.forEach(p => {
      if (p.brand && p.brand.trim()) {
        const lower = p.brand.trim().toLowerCase();
        if (!brandMap.has(lower) && (brandCounts[lower] || 0) > 0) {
          brandMap.set(lower, p.brand.trim());
        }
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b));
  }, [dynamicBrands, products, brandCounts]);

  // Filtered lists for inline searches within filter modal
  const filteredBrandsList = useMemo(() => {
    if (!brandSearch.trim()) return availableBrands;
    return availableBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  }, [availableBrands, brandSearch]);

  const filteredCategoriesList = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    return availableCategories.filter(c => c.label.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [availableCategories, categorySearch]);

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
          const isCordless = Boolean(product.cordless) || txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
          if (!isCordless) return false;
        }
        if (powerFilter === 'corded') {
          const txt = `${product.name} ${product.category} ${product.specs || ''}`.toLowerCase();
          const isCordless = Boolean(product.cordless) || txt.includes('cordless') || txt.includes('18v') || txt.includes('20v') || txt.includes('battery');
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
        const priceA = Number(a.price) || 0;
        const priceB = Number(b.price) || 0;
        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
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
      updateFilterParams({
        price: 'custom',
        minPrice: minPriceInput,
        maxPrice: maxPriceInput
      });
    }
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveBrand('all');
    setSearchQuery('');
    setLocalSearch('');
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
    try {
      safeSessionStorage.removeItem('shop_brand_filter');
      safeSessionStorage.removeItem('shop_category_filter');
      safeSessionStorage.removeItem('shop_power_filter');
      safeSessionStorage.removeItem('shop_price_filter');
      safeSessionStorage.removeItem('shop_minPrice_filter');
      safeSessionStorage.removeItem('shop_maxPrice_filter');
      safeSessionStorage.removeItem('shop_inStock_filter');
      safeSessionStorage.removeItem('shop_sort');
    } catch (e) {}
    setSearchParams({});
  };

  // Auto-scroll restoration to the last viewed equipment when returning to ShopPage
  useEffect(() => {
    if (loading || !displayedProducts || displayedProducts.length === 0) return;

    let savedProdId = null;
    let savedScrollPos = null;
    try {
      savedProdId = safeSessionStorage.getItem('shop_last_product_id');
      savedScrollPos = safeSessionStorage.getItem('shop_scroll_pos');
    } catch (e) {}

    if (!savedProdId && !savedScrollPos) return;

    // 1. If product is in catalog, ensure the correct pagination page is displayed
    if (savedProdId) {
      const prodIndex = displayedProducts.findIndex(p => String(p.id || p._id) === String(savedProdId));
      if (prodIndex !== -1) {
        const targetPage = Math.floor(prodIndex / ITEMS_PER_PAGE) + 1;
        if (currentPage !== targetPage) {
          setCurrentPage(targetPage);
          return; // Allow page state to update and re-render target page
        }
      }
    }

    // 2. Poll briefly for the card element in DOM and scroll it cleanly into view
    let attempts = 0;
    const maxAttempts = 18;

    const performScroll = () => {
      attempts++;
      const targetCard = savedProdId
        ? (document.getElementById(`product-card-${savedProdId}`) || document.querySelector(`[data-product-id="${savedProdId}"]`))
        : null;

      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'auto', block: 'center' });
        // Subtle brief highlight ring so user immediately knows which tool was opened
        targetCard.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        targetCard.style.borderColor = 'var(--brand-primary, #dc2626)';
        targetCard.style.boxShadow = '0 0 0 3px rgba(220, 38, 38, 0.25)';
        setTimeout(() => {
          targetCard.style.borderColor = '';
          targetCard.style.boxShadow = '';
        }, 1200);

        try {
          safeSessionStorage.removeItem('shop_last_product_id');
          safeSessionStorage.removeItem('shop_scroll_pos');
        } catch (e) {}
      } else if (attempts < maxAttempts) {
        setTimeout(performScroll, 50);
      } else if (savedScrollPos) {
        const y = Number(savedScrollPos);
        if (!isNaN(y) && y > 0) {
          window.scrollTo({ top: y, behavior: 'auto' });
        }
        try {
          safeSessionStorage.removeItem('shop_last_product_id');
          safeSessionStorage.removeItem('shop_scroll_pos');
        } catch (e) {}
      }
    };

    const timer = setTimeout(performScroll, 60);
    return () => clearTimeout(timer);
  }, [loading, displayedProducts, currentPage]);

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
      {/* Top Controls Bar with Filter Button (Saves screen space & opens filter modal) */}
      <AnimatedContent distance={25} delay={0.1} style={{ position: 'relative', zIndex: 50 }}>
        <div className="shop-top-controls">
          {/* Search Input */}
          <div className="search-input-clean">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search Bosch, Makita, grinder, drill..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              id="shop-search-input"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
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

            <GlideSelect
              id="shop-sort-select"
              options={SHOP_SORT_OPTIONS}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              ariaLabel="Sort equipment catalog"
              showTags
              accentColor="#ea580c"
              surfaceColor="#ffffff"
              highlightColor="#fff7ed"
              textColor="#0f172a"
              borderColor="#cbd5e1"
              size="md"
              radius={8}
              menuWidth={260}
              placement="bottom"
              align="right"
            />
          </div>
        </div>
      </AnimatedContent>

      {/* ACTIVE FILTERS CHIPS BAR (Active filter chips under top controls) */}
      {hasActiveFilters && (
        <div className="active-filters-chips-bar" id="active-filters-bar" style={{ position: 'relative', zIndex: 30 }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Active Filters:
          </span>

          {/* Category Chip */}
          {activeCategory && activeCategory !== 'all' && (
            <span className="active-filter-chip">
              <span>Category: {availableCategories.find(c => c.id === activeCategory)?.label || dynamicCategories.find(c => c.id === activeCategory)?.label || activeCategory}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  updateFilterParams({ category: 'all' });
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
                  updateFilterParams({ brand: 'all' });
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
                  setMinPriceInput('');
                  setMaxPriceInput('');
                  updateFilterParams({ price: 'all', minPrice: null, maxPrice: null });
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
              <button
                type="button"
                onClick={() => {
                  setPowerFilter('all');
                  updateFilterParams({ power: 'all' });
                }}
                title="Remove Power filter"
              >
                <X size={13} />
              </button>
            </span>
          )}

          {/* In Stock Chip */}
          {inStockOnly && (
            <span className="active-filter-chip">
              <span>In Stock Only</span>
              <button
                type="button"
                onClick={() => {
                  setInStockOnly(false);
                  updateFilterParams({ inStock: false });
                }}
                title="Remove In-Stock filter"
              >
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
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#dc2626' }}>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>{error}</p>
            {onRetry && (
              <button
                type="button"
                className="btn-hero-clean"
                onClick={onRetry}
                style={{ fontSize: '0.85rem', padding: '8px 18px' }}
              >
                Retry Connection
              </button>
            )}
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
          <>
            <div
              className="product-grid"
              key={`grid-${sortBy}-${currentPage}-${activeCategory}-${activeBrand}-${priceFilter}-${inStockOnly}`}
            >
              {displayedProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((product) => (
                <div
                  key={product.id || product._id}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <ProductCard
                    product={product}
                    onSelectProduct={onSelectProduct}
                  />
                </div>
              ))}
            </div>

            {/* Catalog Pagination Controls */}
            {Math.ceil(displayedProducts.length / ITEMS_PER_PAGE) > 1 && (
              <AnimatedContent distance={25} delay={0.1}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    marginTop: '36px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ fontSize: '0.88rem', color: '#64748b' }}>
                    Showing <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> – <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * ITEMS_PER_PAGE, displayedProducts.length)}</strong> of <strong style={{ color: '#0f172a' }}>{displayedProducts.length}</strong> items
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: currentPage === 1 ? '#94a3b8' : '#0f172a',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: '600'
                      }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>

                    {Array.from({ length: Math.ceil(displayedProducts.length / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === Math.ceil(displayedProducts.length / ITEMS_PER_PAGE) || Math.abs(p - currentPage) <= 2)
                      .map((pageNum, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && pageNum - prevPage > 1;
                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 120, behavior: 'smooth' });
                              }}
                              style={{
                                minWidth: '36px',
                                height: '36px',
                                padding: '0 8px',
                                borderRadius: '8px',
                                border: pageNum === currentPage ? '1px solid var(--brand-primary, #ea580c)' : '1px solid #cbd5e1',
                                background: pageNum === currentPage ? 'var(--brand-primary, #ea580c)' : '#ffffff',
                                color: pageNum === currentPage ? '#ffffff' : '#0f172a',
                                fontWeight: pageNum === currentPage ? '700' : '500',
                                cursor: 'pointer',
                                fontSize: '0.86rem'
                              }}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      disabled={currentPage === Math.ceil(displayedProducts.length / ITEMS_PER_PAGE)}
                      onClick={() => {
                        setCurrentPage(p => Math.min(Math.ceil(displayedProducts.length / ITEMS_PER_PAGE), p + 1));
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: currentPage === Math.ceil(displayedProducts.length / ITEMS_PER_PAGE) ? '#94a3b8' : '#0f172a',
                        cursor: currentPage === Math.ceil(displayedProducts.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer',
                        fontSize: '0.86rem',
                        fontWeight: '600'
                      }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </AnimatedContent>
            )}
          </>
        )}
      </main>

      {/* INTERACTIVE MULTI-CRITERIA FILTER MODAL DIALOG */}
      {showFilterModal && createPortal(
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
              {/* Left Vertical Tabs */}
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
                      ? (availableCategories.find(c => c.id === activeCategory)?.label || dynamicCategories.find(c => c.id === activeCategory)?.label || activeCategory)
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

                    {availableCategories.length > 6 && (
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
                              updateFilterParams({ category: cat.id });
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

                      {filteredCategoriesList.length <= 1 && products.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                          No categories with uploaded products yet
                        </div>
                      )}

                      {filteredCategoriesList.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                          {categorySearch ? `No categories matching "${categorySearch}"` : 'No categories available'}
                        </div>
                      )}
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

                    {availableBrands.length > 6 && (
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
                    )}

                    <div className="filter-options-grid">
                      {/* All Brands Option */}
                      <button
                        type="button"
                        className={`filter-pill-option ${activeBrand === 'all' ? 'active' : ''}`}
                        onClick={() => {
                          setActiveBrand('all');
                          updateFilterParams({ brand: 'all' });
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
                              updateFilterParams({ brand: next });
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

                      {filteredBrandsList.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                          {brandSearch ? `No brands matching "${brandSearch}"` : 'No brands available with uploaded products yet'}
                        </div>
                      )}
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
                              setMinPriceInput('');
                              setMaxPriceInput('');
                              updateFilterParams({ price: preset.id, minPrice: null, maxPrice: null });
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
                        onClick={() => {
                          setPowerFilter('all');
                          updateFilterParams({ power: 'all' });
                        }}
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
                        onClick={() => {
                          const next = powerFilter === 'cordless' ? 'all' : 'cordless';
                          setPowerFilter(next);
                          updateFilterParams({ power: next });
                        }}
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
                        onClick={() => {
                          const next = powerFilter === 'corded' ? 'all' : 'corded';
                          setPowerFilter(next);
                          updateFilterParams({ power: next });
                        }}
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
                        onClick={() => {
                          setInStockOnly(false);
                          updateFilterParams({ inStock: false });
                        }}
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
                        onClick={() => {
                          setInStockOnly(true);
                          updateFilterParams({ inStock: true });
                        }}
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
        </div>,
        document.body
      )}
    </div>
  );
};
