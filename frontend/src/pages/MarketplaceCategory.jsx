import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProductCardJakmall from '../components/ProductCardJakmall';
import CategorySidebar from '../components/CategorySidebar';
import { getCategoryBySlug, getDbSlug } from '../components/categoryConfig';
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
  const [activeSubCat, setActiveSubCat] = useState(null);

  const category = getCategoryBySlug(slug);

  useEffect(() => {
    setPage(1);
    setSearchQuery('');
    setActiveSubCat(null);
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

  // Products in this parent category (for sidebar sub-cat counts)
  const categoryProducts = useMemo(() => {
    return products.filter(p => p.category?.slug === dbSlug);
  }, [products, dbSlug]);

  const filtered = useMemo(() => {
    let result = [...categoryProducts];
    if (activeSubCat) {
      result = result.filter(p => p.categoryJakmall === activeSubCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.priceUser || 0) - (b.priceUser || 0));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.priceUser || 0) - (a.priceUser || 0));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [categoryProducts, sortBy, searchQuery, activeSubCat]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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

      {/* Hero Banner — Grid Layout (featured product + sub-category cards) */}
      {category && categoryProducts.length > 0 && (() => {
        // Group products by sub-category, pick first product from each
        const subGroups = {};
        categoryProducts.forEach(p => {
          const sub = p.categoryJakmall || 'Other';
          if (!subGroups[sub]) subGroups[sub] = [];
          subGroups[sub].push(p);
        });
        const subEntries = Object.entries(subGroups).sort((a, b) => b[1].length - a[1].length);
        const featured = categoryProducts[0];
        const subCards = subEntries.slice(0, 4);
        const gradients = [
          'linear-gradient(135deg, #667eea, #764ba2)',
          'linear-gradient(135deg, #f093fb, #f5576c)',
          'linear-gradient(135deg, #4facfe, #00f2fe)',
          'linear-gradient(135deg, #43e97b, #38f9d7)',
        ];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', marginBottom: '28px', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Left: Featured product */}
            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border-default, #eee)', display: 'flex', alignItems: 'center', padding: '24px', minHeight: '220px', cursor: 'pointer' }}
              onClick={() => featured && navigate(`/marketplace/product/${featured.slug}`)}>
              <div style={{ flex: 1, zIndex: 2 }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '700', color: category.color, letterSpacing: '0.5px', marginBottom: '6px' }}>{category.name}</div>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#222', margin: '0 0 8px', lineHeight: '1.3', fontFamily: 'var(--font-display)' }}>
                  {featured.name?.substring(0, 55)}{featured.name?.length > 55 ? '...' : ''}
                </h2>
                <div style={{ fontSize: '11px', color: '#777', marginBottom: '10px' }}>Mulai</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#e74c3c' }}>Rp</span>
                  <span style={{ fontSize: '26px', fontWeight: '900', color: '#e74c3c', fontFamily: 'var(--font-display)', lineHeight: '1' }}>
                    {featured.priceUser ? Math.floor(featured.priceUser / 1000) : '—'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#e74c3c' }}>rb</span>
                </div>
              </div>
              {featured.imageUrl && (
                <img src={featured.imageUrl} alt="" style={{ width: '160px', height: '160px', objectFit: 'contain', marginLeft: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} />
              )}
            </div>

            {/* Right: 4 sub-category cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {subCards.map(([subName, prods], i) => {
                const prod = prods[0];
                return (
                  <div key={subName}
                    style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', padding: '14px 14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '104px' }}
                    onClick={() => { setActiveSubCat(subName); setPage(1); window.scrollTo({ top: 400, behavior: 'smooth' }); }}>
                    <div style={{ position: 'absolute', inset: 0, background: gradients[i % gradients.length], opacity: 0.92 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.3px', lineHeight: '1.3' }}>{subName}</div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{prods.length} produk</div>
                    </div>
                    {prod?.imageUrl && (
                      <img src={prod.imageUrl} alt="" style={{ position: 'relative', zIndex: 1, width: '52px', height: '52px', objectFit: 'contain', alignSelf: 'flex-end', marginTop: '4px', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 2-Column Layout: Category Sidebar + Product Grid */}
      <div className="mkp-layout">
        <CategorySidebar products={categoryProducts} activeSlug={slug} showAll={false} mode="sub" activeSubCat={activeSubCat} onSubCatChange={sub => { setActiveSubCat(sub); setPage(1); }} />

        <div style={{ minWidth: 0 }}>
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
  );
}
