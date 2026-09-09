import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal, RotateCcw, BatteryCharging, Disc, Hammer, Wrench, Wind, Sparkles, Layers } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

const CATEGORIES = [
  { id: 'all', label: 'All Equipment', icon: Layers },
  { id: 'cordless', label: 'Cordless Tools ⚡', icon: BatteryCharging },
  { id: 'grinders-cutters', label: 'Grinders & Cutters', icon: Disc },
  { id: 'hammers', label: 'Hammer Drills', icon: Hammer },
  { id: 'woodworking', label: 'Woodworking', icon: Wrench },
  { id: 'washers-blowers', label: 'Washers & Blowers', icon: Wind },
  { id: 'accessories', label: 'Accessories & Bits', icon: Sparkles },
];

const BRANDS = [
  'All Brands',
  'Bosch',
  'Makita',
  'DeWalt',
  'Dongcheng',
  'HiKOKI',
  'Stanley'
];

export const ShopPage = ({
  products,
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
  const [dynamicCategories, setDynamicCategories] = useState(CATEGORIES);
  const [dynamicBrands, setDynamicBrands] = useState(BRANDS);

  useEffect(() => {
    api.getTaxonomy().then(res => {
      if (res && res.brands && res.categories) {
        const mergedCats = [
          { id: 'all', label: 'All Equipment', icon: Layers },
          ...res.categories.map(c => {
            const found = CATEGORIES.find(d => d.id === c.id);
            return {
              id: c.id,
              label: c.name,
              icon: found ? found.icon : Sparkles
            };
          })
        ];
        setDynamicCategories(mergedCats);

        const mergedBrands = ['All Brands', ...res.brands.filter((b, idx, arr) => arr.indexOf(b) === idx)];
        setDynamicBrands(mergedBrands);
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

  const handleResetFilters = () => {
    setActiveCategory('all');
    setActiveBrand('all');
    setSearchQuery('');
    setSortBy('featured');
    setSearchParams({});
  };

  return (
    <div style={{ padding: '16px 0 48px' }}>
      {/* Top Shop Banner / Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Equipment Catalog
        </h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
          Explore genuine power tools, cordless machinery, and industrial accessories at Variathu Power Tools.
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
            Showing <strong style={{ color: '#0f172a' }}>{products.length}</strong> Tools
          </span>

          <select
            className="sort-select-clean"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="shop-sort-select"
          >
            <option value="featured">Featured / Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="btn-icon"
            style={{ display: 'inline-flex' }}
            title="Toggle Filters"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Shop Layout: Sidebar + Product Grid */}
      <div className="shop-layout">
        {/* Left Sidebar Filter (Desktop + Mobile Drawer) */}
        <aside
          className="filter-sidebar-clean"
          style={{
            display: showMobileFilter ? 'block' : undefined
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a' }}>Filters</span>
            <button
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Categories */}
          <div className="filter-group">
            <span className="filter-heading">Categories</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {dynamicCategories.map(cat => {
                const Icon = cat.icon || Layers;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    className={`filter-option-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchParams(prev => {
                        if (cat.id === 'all') prev.delete('category');
                        else prev.set('category', cat.id);
                        return prev;
                      });
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={15} style={{ color: isActive ? '#ea580c' : '#64748b' }} />
                      <span>{cat.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands */}
          <div className="filter-group">
            <span className="filter-heading">Manufacturer Brand</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {dynamicBrands.map(brand => {
                const isAll = brand === 'All Brands';
                const brandVal = isAll ? 'all' : brand.toLowerCase();
                const isActive = activeBrand === brandVal;
                return (
                  <button
                    key={brand}
                    className={`filter-option-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setActiveBrand(brandVal);
                      setSearchParams(prev => {
                        if (brandVal === 'all') prev.delete('brand');
                        else prev.set('brand', brandVal);
                        return prev;
                      });
                    }}
                  >
                    <span>{brand}</span>
                    {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kozhencherry Store Info Snippet */}
          <div
            style={{
              marginTop: '24px',
              padding: '14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '0.78rem',
              color: '#64748b',
              lineHeight: 1.5
            }}
          >
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              Store Pickup Available
            </strong>
            Order online or via WhatsApp and collect immediately at <strong>Poyanil Building, Kozhencherry</strong>.
          </div>
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
                  borderTopColor: '#ea580c',
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
          ) : products.length === 0 ? (
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
                Try clearing your search query or selecting a different brand/category.
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
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
