import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from './categoryConfig';

/**
 * CategorySidebar — shared between JakmallMarketplace and MarketplaceCategory
 * Shows all 11 categories with product counts, active state highlighting
 */
export default function CategorySidebar({ products = [], activeSlug = null }) {
  const counts = {};
  products.forEach(p => {
    const slug = p.category?.slug?.replace('fisik-', '');
    if (slug) counts[slug] = (counts[slug] || 0) + 1;
  });

  return (
    <div className="mkp-cat-sidebar">
      <div className="mkp-cat-nav">
        <div className="mkp-cat-title">Kategori</div>
        <Link to="/marketplace" className={`mkp-cat-link ${!activeSlug ? 'mkp-cat-link--active' : ''}`}>
          <span className="mkp-cat-link-icon">📦</span>
          <span className="mkp-cat-link-label">Semua Produk</span>
          <span className="mkp-cat-count">{products.length}</span>
        </Link>
        <div className="mkp-cat-divider" />
        {CATEGORIES.map(cat => {
          const count = counts[cat.slug] || 0;
          const isActive = activeSlug === cat.slug;
          return (
            <Link key={cat.slug} to={`/marketplace/${cat.slug}`} className={`mkp-cat-link ${isActive ? 'mkp-cat-link--active' : ''}`}>
              <span className="mkp-cat-link-icon">{cat.icon}</span>
              <span className="mkp-cat-link-label">{cat.name}</span>
              {count > 0 && <span className="mkp-cat-count">{count}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
