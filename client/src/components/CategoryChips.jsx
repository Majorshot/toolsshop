import React from 'react';
import { Layers, Sparkles, Wrench, BatteryCharging, Hammer, Wind, Disc, Shield } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Equipment', icon: Layers },
  { id: 'cordless', label: 'Cordless Tools ⚡', icon: BatteryCharging },
  { id: 'grinders-cutters', label: 'Grinders & Cutters', icon: Disc },
  { id: 'hammers', label: 'Rotary & Demo Hammers', icon: Hammer },
  { id: 'woodworking', label: 'Woodworking', icon: Wrench },
  { id: 'washers-blowers', label: 'Washers & Blowers', icon: Wind },
  { id: 'accessories', label: 'Bits & Accessories', icon: Sparkles },
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

export const CategoryChips = ({
  activeCategory,
  onSelectCategory,
  activeBrand,
  onSelectBrand,
  sortBy,
  onSelectSort,
  totalResults
}) => {
  return (
    <section className="category-section" id="catalog-section">
      {/* Category Horizontal Scroll Bar */}
      <div className="section-header">
        <h3 className="section-title">Browse Categories</h3>
      </div>

      <div className="category-scroll-container no-scrollbar">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              id={`cat-chip-${cat.id}`}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Brand Chips Bar */}
      <div style={{ marginTop: '14px' }}>
        <div className="brands-row no-scrollbar">
          {BRANDS.map(brand => {
            const isAll = brand === 'All Brands';
            const brandVal = isAll ? 'all' : brand.toLowerCase();
            const isActive = activeBrand === brandVal;
            return (
              <button
                key={brand}
                className={`brand-chip ${isActive ? 'active' : ''}`}
                onClick={() => onSelectBrand(brandVal)}
                id={`brand-chip-${brandVal}`}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Results Counter Row */}
      <div className="filter-controls-bar">
        <div className="filter-left">
          <span>Showing <strong>{totalResults}</strong> Tools in Stock</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="sort-select" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Sort by:
          </label>
          <select
            id="sort-select"
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSelectSort(e.target.value)}
          >
            <option value="featured">Featured / Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>
    </section>
  );
};
