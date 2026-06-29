import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES } from './categoryConfig';

/**
 * CategorySidebar
 * - mode="main" (default) → shows main categories (for /marketplace)
 * - mode="sub" → shows Jakmall sub-categories within a parent (for /marketplace/:slug)
 */
export default function CategorySidebar({ products = [], activeSlug = null, showAll = true, mode = 'main', activeSubCat = null, onSubCatChange }) {
  const navigate = useNavigate();

  // ── Main category mode ──
  if (mode === 'main') {
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

  // ── Sub-category mode (for category pages) ──
  const subCats = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      const sub = p.categoryJakmall;
      if (sub) counts[sub] = (counts[sub] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [products]);

  const parentCat = CATEGORIES.find(c => c.slug === activeSlug);

  return (
    <div className="mkp-cat-sidebar">
      <div className="mkp-cat-nav">
        <div className="mkp-cat-title">Sub Kategori</div>

        {/* Back to all categories */}
        <Link to="/marketplace" className="mkp-cat-link">
          <span className="mkp-cat-link-label">← Semua Kategori</span>
        </Link>
        <div className="mkp-cat-divider" />

        {/* "All" for this category */}
        <button
          className={`mkp-cat-link ${!activeSubCat ? 'mkp-cat-link--active' : ''}`}
          onClick={() => onSubCatChange?.(null)}
        >
          <span className="mkp-cat-link-label">Semua {parentCat?.name || activeSlug}</span>
          <span className="mkp-cat-count">{products.length}</span>
        </button>

        <div className="mkp-cat-divider" />

        {/* Sub-category items */}
        {subCats.map(sub => {
          const isActive = activeSubCat === sub.name;
          return (
            <button
              key={sub.name}
              className={`mkp-cat-link ${isActive ? 'mkp-cat-link--active' : ''}`}
              onClick={() => onSubCatChange?.(sub.name)}
            >
              <span className="mkp-cat-link-label">{sub.name}</span>
              <span className="mkp-cat-count">{sub.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

