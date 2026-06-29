import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from './categoryConfig';

export default function CategorySidebar({ products = [], activeSlug = null, showAll = true }) {
  const counts = {};
  products.forEach(p => {
    const slug = p.category?.slug?.replace('fisik-', '');
    if (slug) counts[slug] = (counts[slug] || 0) + 1;
  });

  return (
    <div className="mkp-cat-sidebar">
      <div className="mkp-cat-nav">
        <div className="mkp-cat-title">Kategori</div>
        {showAll && (
          <>
            <Link to="/marketplace" className={`mkp-cat-link ${!activeSlug ? 'mkp-cat-link--active' : ''}`}>
              <span className="mkp-cat-link-label">Semua Produk</span>
              <span className="mkp-cat-count">{products.length}</span>
            </Link>
            <div className="mkp-cat-divider" />
          </>
        )}
        {CATEGORIES.map(cat => {
          const count = counts[cat.slug] || 0;
          const isActive = activeSlug === cat.slug;
          return (
            <Link key={cat.slug} to={`/marketplace/${cat.slug}`} className={`mkp-cat-link ${isActive ? 'mkp-cat-link--active' : ''}`}>
              <span className="mkp-cat-link-label">{cat.name}</span>
              {count > 0 && <span className="mkp-cat-count">{count}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
