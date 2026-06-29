import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProductCardJakmall from '../components/ProductCardJakmall';
import CategorySidebar from '../components/CategorySidebar';
import { getCategoryBySlug, getDbSlug, CATEGORIES } from '../components/categoryConfig';
import { Package, ChevronRight, LayoutGrid, List, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

export default function MarketplaceCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);

  const category = getCategoryBySlug(slug);

  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setPriceRange(null);
    setInStockOnly(false);
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${baseUrl}/api/catalog/products?source=jakmall`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setProducts(data.products || []);
      } catch (err) {
        setError('Gagal memuat produk.');
      } finally { setLoading(false); }
    };
    fetchProducts();
  }, [slug]);

  const dbSlug = getDbSlug(slug);

  const filtered = useMemo(() => {
    let result = products.filter(p => p.category?.slug === dbSlug);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (priceRange) {
      result = result.filter(p => {
        const price = p.priceUser || 0;
        if (priceRange === 'under50k') return price < 50000;
        if (priceRange === '50k-100k') return price >= 50000 && price < 100000;
        if (priceRange === '100k-250k') return price >= 100000 && price < 250000;
        if (priceRange === 'over250k') return price >= 250000;
        return true;
      });
    }
    if (inStockOnly) result = result.filter(p => p.stock > 0);
    if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.priceUser || 0) - (b.priceUser || 0));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.priceUser || 0) - (a.priceUser || 0));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [products, dbSlug, sortBy, searchQuery, priceRange, inStockOnly]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const activeFilterCount = (priceRange ? 1 : 0) + (inStockOnly ? 1 : 0);

  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px' }}>
      <div style={{ paddingTop: '20px', marginBottom: '20px' }}>
        <div className="mp-skeleton-text" style={{ width: '200px', height: '20px' }} />
      </div>
      <div className="mkp-layout">
        <div className="mkp-cat-sidebar"><div className="mp-skeleton-text" style={{ height: '400px', borderRadius: '14px' }} /></div>
        <div className="mp-grid">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="mp-skeleton"><div className="mp-skeleton-img" /><div className="mp-skeleton-text" /><div className="mp-skeleton-text mp-skeleton-text--short" /><div className="mp-skeleton-text mp-skeleton-text--price" /></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <p style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
      <button onClick={() => window.location.reload()} className="mp-empty-btn">Coba Lagi</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#999', marginBottom: '16px', paddingTop: '20px' }}>
        <Link to="/" style={{ color: '#999', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={10} />
        <Link to="/marketplace" style={{ color: '#999', textDecoration: 'none' }}>Mall</Link>
        <ChevronRight size={10} />
        <span style={{ color: '#333', fontWeight: '600' }}>{category?.name || slug}</span>
      </nav>

      {/* Hero Banner */}
      {category && (
        <div className="mkp-cat-hero">
          <div className="mkp-cat-hero-bg" style={{ background: category.gradient }} />
          <div className="mkp-cat-hero-content">
            <h1 className="mkp-cat-hero-name">{category.name}</h1>
            <p className="mkp-cat-hero-desc">{category.description}</p>
            <div className="mkp-cat-hero-count">
              <Package size={12} /> {filtered.length} produk tersedia
            </div>
          </div>
          <div className="mkp-cat-hero-img">
            <img src={category.image} alt={category.name} />
          </div>
        </div>
      )}

      {/* 3-Column Layout: Category Sidebar + Filter Sidebar + Product Grid */}
      <div className="mkp-layout">
        <CategorySidebar products={products} activeSlug={slug} />

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Filter Sidebar */}
          <aside style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '80px' }}>
            <div style={{ background: 'var(--bg-surface, #fff)', borderRadius: '12px', border: '1px solid var(--border-default, #eee)', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary, #333)', margin: 0 }}>Filter</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setPriceRange(null); setInStockOnly(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '11px', color: '#e74c3c', cursor: 'pointer', fontWeight: '600' }}>
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Harga</h4>
                {[
                  { key: 'under50k', label: 'Di bawah Rp50.000' },
                  { key: '50k-100k', label: 'Rp50.000 - 100.000' },
                  { key: '100k-250k', label: 'Rp100.000 - 250.000' },
                  { key: 'over250k', label: 'Di atas Rp250.000' },
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0', cursor: 'pointer', fontSize: '11px', color: priceRange === opt.key ? '#e74c3c' : 'var(--text-secondary, #555)' }}>
                    <input type="radio" name="price" checked={priceRange === opt.key}
                      onChange={() => setPriceRange(priceRange === opt.key ? null : opt.key)}
                      style={{ accentColor: '#e74c3c', width: '13px', height: '13px' }} />
                    {opt.label}
                  </label>
                ))}
              </div>
              <div>
                <h4 style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Ketersediaan</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', color: inStockOnly ? '#22c55e' : 'var(--text-secondary, #555)' }}>
                  <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                    style={{ accentColor: '#22c55e', width: '13px', height: '13px' }} />
                  Tersedia saja
                </label>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Toolbar */}
            <div className="mp-toolbar">
              <div className="mp-toolbar-left">
                <div style={{ position: 'relative', maxWidth: '280px' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                  <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                    style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: '8px', border: '1.5px solid var(--border-default, #e0e0e0)', background: '#fff', fontSize: '11px', outline: 'none' }} />
                </div>
                <span className="mp-toolbar-count"><strong>{filtered.length}</strong> produk</span>
              </div>
              <div className="mp-toolbar-right">
                <select className="mp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Terbaru</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                  <option value="name">Nama A-Z</option>
                </select>
                <button className={`mp-view-btn ${viewMode === 'grid' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={14} /></button>
                <button className={`mp-view-btn ${viewMode === 'list' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('list')}><List size={14} /></button>
              </div>
            </div>

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div className="mp-empty">
                <Package size={40} className="mp-empty-icon" />
                <h3 className="mp-empty-title">Belum ada produk di kategori ini</h3>
                <p className="mp-empty-desc">Produk akan segera tersedia.</p>
                <button className="mp-empty-btn" onClick={() => navigate('/marketplace')}>Kembali ke Mall</button>
              </div>
            ) : (
              <>
                <div className={`mp-grid ${viewMode === 'list' ? 'mp-grid--list' : ''}`}>
                  {paginatedProducts.map(product => <ProductCardJakmall key={product.id} product={product} />)}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '28px' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', background: page === 1 ? '#f5f5f5' : '#fff', color: page === 1 ? '#ccc' : '#333', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}>← Prev</button>
                    <span style={{ fontSize: '12px', color: '#999', padding: '0 6px' }}><strong style={{ color: '#333' }}>{page}</strong>/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e0e0e0', background: page === totalPages ? '#f5f5f5' : '#fff', color: page === totalPages ? '#ccc' : '#333', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600' }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
