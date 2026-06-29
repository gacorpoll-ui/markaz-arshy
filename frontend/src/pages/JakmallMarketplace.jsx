import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCardJakmall from '../components/ProductCardJakmall';
import CategorySidebar from '../components/CategorySidebar';
import { Search, Package, LayoutGrid, List, ChevronRight, ChevronLeft } from 'lucide-react';

const PROMOS = [
  { title: 'Koleksi Webcam', subtitle: 'Resolusi Gambar Juara', price: '53', unit: 'Rb-an', bg: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', color: '#fff' },
  { title: 'Kabel HDMI Premium', subtitle: 'High Speed 4K UHD', price: '25', unit: 'Rb-an', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', color: '#fff' },
  { title: 'WiFi Range Extender', subtitle: 'Perluas Jaringan WiFi', price: '89', unit: 'Rb-an', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: '#fff' },
  { title: 'Kertas Thermal', subtitle: 'Untuk Printer POS', price: '15', unit: 'Rb-an', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: '#333' },
];

const JakmallMarketplace = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [promoIdx, setPromoIdx] = useState(0);
  const [promoHover, setPromoHover] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (promoHover) return;
    const id = setInterval(() => setPromoIdx(i => (i + 1) % PROMOS.length), 4500);
    return () => clearInterval(id);
  }, [promoHover]);

  useEffect(() => {
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
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) result = result.filter(p => p.category?.slug === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.priceUser || 0) - (b.priceUser || 0));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.priceUser || 0) - (a.priceUser || 0));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  const activeCategoryName = activeCategory ? products.find(p => p.category?.slug === activeCategory)?.category?.name : null;

  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px' }}>
      <div className="mp-hero" style={{ minHeight: '200px' }}>
        <div className="mp-skeleton-text" style={{ width: '200px', height: '28px', margin: '0 0 12px', background: 'rgba(255,255,255,0.2)' }} />
        <div className="mp-skeleton-text" style={{ width: '300px', height: '14px', margin: '0 0 24px', background: 'rgba(255,255,255,0.15)' }} />
        <div className="mp-skeleton-text" style={{ width: '100%', maxWidth: '520px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)' }} />
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

      {/* PROMO SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '14px', marginBottom: '28px', minHeight: isMobile ? '200px' : '280px' }}>
        {/* Main promo carousel */}
        <div
          onMouseEnter={() => setPromoHover(true)}
          onMouseLeave={() => setPromoHover(false)}
          style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' }}
        >
          {PROMOS.map((promo, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0, opacity: promoIdx === i ? 1 : 0,
              transition: 'opacity 0.5s ease', background: promo.bg,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: isMobile ? '24px' : '36px',
            }}>
              <span style={{ fontSize: isMobile ? '11px' : '12px', fontWeight: '600', opacity: 0.8, color: promo.color, marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{promo.subtitle}</span>
              <h3 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: promo.color, margin: '0 0 12px', fontFamily: 'var(--font-display)' }}>{promo.title}</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: promo.color, opacity: 0.8 }}>Mulai</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: promo.color }}>Rp</span>
                <span style={{ fontSize: isMobile ? '48px' : '64px', fontWeight: '900', color: promo.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{promo.price}</span>
                <span style={{ fontSize: '16px', fontWeight: '700', color: promo.color, opacity: 0.8 }}>{promo.unit}</span>
              </div>
            </div>
          ))}
          {/* Arrows */}
          {!isMobile && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPromoIdx(i => (i - 1 + PROMOS.length) % PROMOS.length); }}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', cursor: 'pointer', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: promoHover ? 1 : 0 }}>
                <ChevronLeft size={16} style={{ color: '#fff' }} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setPromoIdx(i => (i + 1) % PROMOS.length); }}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', cursor: 'pointer', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: promoHover ? 1 : 0 }}>
                <ChevronRight size={16} style={{ color: '#fff' }} />
              </button>
            </>
          )}
          {/* Dots */}
          <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 3, padding: '3px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', backdropFilter: 'blur(4px)' }}>
            {PROMOS.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setPromoIdx(i); }} style={{ width: promoIdx === i ? '20px' : '6px', height: '6px', borderRadius: '3px', border: 'none', cursor: 'pointer', background: promoIdx === i ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Stats section (right side) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: '0 0 3px' }}>Total Produk</h4>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{products.length}</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb, #f5576c)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: '0 0 3px' }}>Kategori</h4>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{new Set(products.map(p => p.category?.slug)).size}</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#fff', margin: '0 0 3px' }}>Terlaris</h4>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#fff' }}>{products.filter(p => p.stock > 0).length}</span>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', borderRadius: '14px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#333', margin: '0 0 3px' }}>Brand</h4>
            <span style={{ fontSize: '24px', fontWeight: '900', color: '#333' }}>{new Set(products.map(p => p.brand).filter(Boolean)).size}</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '320px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Cari produk atau brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px 8px 34px', borderRadius: '10px',
                border: '1.5px solid var(--border-default, #e0e0e0)', background: 'var(--bg-surface, #fff)',
                fontSize: '12px', outline: 'none', color: 'var(--text-primary, #333)',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#e74c3c'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default, #e0e0e0)'}
            />
          </div>
          <span className="mp-toolbar-count">
            <strong>{filtered.length}</strong> produk{activeCategoryName ? ` di ${activeCategoryName}` : ''}
          </span>
        </div>
        <div className="mp-toolbar-right">
          <select className="mp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="name">Nama A-Z</option>
          </select>
          <button className={`mp-view-btn ${viewMode === 'grid' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={16} /></button>
          <button className={`mp-view-btn ${viewMode === 'list' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('list')} title="List"><List size={16} /></button>
        </div>
      </div>

      {/* 2-COLUMN LAYOUT: Category Sidebar + Product Grid */}
      <div className="mkp-layout">
        <CategorySidebar products={products} activeSlug={activeCategory} />

        <div style={{ minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="mp-empty">
              <Package size={48} className="mp-empty-icon" />
              <h3 className="mp-empty-title">{searchQuery ? `Tidak ditemukan untuk "${searchQuery}"` : 'Belum ada produk'}</h3>
              <p className="mp-empty-desc">{searchQuery ? 'Coba kata kunci lain atau hapus filter.' : 'Produk akan segera tersedia.'}</p>
              {(searchQuery || activeCategory) && (
                <button className="mp-empty-btn" onClick={() => { setSearchQuery(''); setActiveCategory(null); }}>
                  Hapus Semua Filter
                </button>
              )}
            </div>
          ) : (
            <div className={`mp-grid ${viewMode === 'list' ? 'mp-grid--list' : ''}`}>
              {filtered.map(product => <ProductCardJakmall key={product.id} product={product} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JakmallMarketplace;
