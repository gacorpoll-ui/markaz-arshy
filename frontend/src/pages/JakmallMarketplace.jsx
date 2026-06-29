import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCardJakmall from '../components/ProductCardJakmall';
import CategorySidebar from '../components/CategorySidebar';
import { RefreshCw, Search, Package, LayoutGrid, List, ChevronRight, ChevronLeft } from 'lucide-react';

const PROMOS = [
  { title: 'Koleksi Webcam', subtitle: 'Resolusi Gambar Juara', price: '53', unit: 'Rb-an', bg: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', color: '#fff' },
  { title: 'Kabel HDMI Premium', subtitle: 'High Speed 4K UHD', price: '25', unit: 'Rb-an', bg: 'linear-gradient(135deg, #f093fb, #f5576c)', color: '#fff' },
  { title: 'WiFi Range Extender', subtitle: 'Perluas Jaringan WiFi', price: '89', unit: 'Rb-an', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: '#fff' },
  { title: 'Kertas Thermal', subtitle: 'Untuk Printer POS', price: '15', unit: 'Rb-an', bg: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: '#333' },
];

const PROMO_CARDS = [
  { title: 'Kertas Printer', subtitle: 'Hasil Cetakan Maksimal', bg: 'linear-gradient(135deg, #a8edea, #fed6e3)', color: '#333', icon: '🖨️' },
  { title: 'Cable Organizer', subtitle: 'Kabel Rapi & Tertata', bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', color: '#333', icon: '🔗' },
  { title: 'WiFi Extender', subtitle: 'Perluas Jangkauan', bg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)', color: '#fff', icon: '📡' },
  { title: 'Kabel HDMI', subtitle: 'High Speed 4K', bg: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)', color: '#fff', icon: '🔌' },
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
  const [priceRange, setPriceRange] = useState(null); // 'under50k', '50k-100k', '100k-250k', 'over250k'
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [promoIdx, setPromoIdx] = useState(0);
  const [promoHover, setPromoHover] = useState(false);
  const chipsRef = React.useRef(null);
  const dragState = React.useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const onChipMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    dragState.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  };
  const onChipMouseMove = (e) => {
    if (!dragState.current.isDown) return;
    e.preventDefault();
    const el = chipsRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = dragState.current.scrollLeft - (x - dragState.current.startX);
  };
  const onChipMouseUp = () => {
    dragState.current.isDown = false;
    const el = chipsRef.current;
    if (el) { el.style.cursor = 'grab'; el.style.userSelect = ''; }
  };

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

  // Build categories from product data
  const sortedCategories = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const slug = p.category?.slug;
      const name = p.category?.name;
      if (slug && name) {
        if (!map[slug]) map[slug] = { slug, name, count: 0 };
        map[slug].count++;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [products]);

  // Filter + Sort
  // Extract unique brands
  const availableBrands = useMemo(() => {
    const brandMap = {};
    products.forEach(p => { if (p.brand) brandMap[p.brand] = (brandMap[p.brand] || 0) + 1; });
    return Object.entries(brandMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filtered = useMemo(() => {
    let result = products;
    if (activeCategory) result = result.filter(p => p.category?.slug === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
    }
    // Price range filter
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
    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }
    // Stock filter
    if (inStockOnly) {
      result = result.filter(p => p.stock > 0);
    }
    // Sort
    if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.priceUser || 0) - (b.priceUser || 0));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.priceUser || 0) - (a.priceUser || 0));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [products, activeCategory, searchQuery, sortBy, priceRange, selectedBrands, inStockOnly]);

  const activeCategoryName = activeCategory ? sortedCategories.find(c => c.slug === activeCategory)?.name : null;
  const activeFilterCount = (priceRange ? 1 : 0) + selectedBrands.length + (inStockOnly ? 1 : 0);

  // ── Loading Skeleton ──
  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px' }}>
      <div className="mp-hero" style={{ minHeight: '200px' }}>
        <div className="mp-skeleton-text" style={{ width: '200px', height: '28px', margin: '0 0 12px', background: 'rgba(255,255,255,0.2)' }} />
        <div className="mp-skeleton-text" style={{ width: '300px', height: '14px', margin: '0 0 24px', background: 'rgba(255,255,255,0.15)' }} />
        <div className="mp-skeleton-text" style={{ width: '100%', maxWidth: '520px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[1,2,3,4,5].map(i => <div key={i} className="mp-skeleton-text" style={{ width: '100px', height: '36px', borderRadius: '100px' }} />)}
      </div>
      <div className="mp-grid">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="mp-skeleton">
            <div className="mp-skeleton-img" />
            <div className="mp-skeleton-text" />
            <div className="mp-skeleton-text mp-skeleton-text--short" />
            <div className="mp-skeleton-text mp-skeleton-text--price" />
          </div>
        ))}
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

      {/* ═══ PROMO SECTION ═══ */}
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

        {/* Promo cards grid (2x2) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '14px' }}>
          {PROMO_CARDS.map((card, i) => (
            <div key={i} onClick={() => navigate('/marketplace')}
              style={{
                background: card.bg, borderRadius: '14px', padding: isMobile ? '14px' : '18px',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ fontSize: '28px', position: 'absolute', top: '12px', right: '12px', opacity: 0.3 }}>{card.icon}</span>
              <h4 style={{ fontSize: isMobile ? '13px' : '15px', fontWeight: '800', color: card.color, margin: '0 0 3px', fontFamily: 'var(--font-display)' }}>{card.title}</h4>
              <span style={{ fontSize: isMobile ? '10px' : '11px', color: card.color, opacity: 0.7, fontWeight: '500' }}>{card.subtitle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CATEGORY CHIPS ═══ */}
      <div className="mp-chips" ref={chipsRef}
        onMouseDown={onChipMouseDown}
        onMouseMove={onChipMouseMove}
        onMouseUp={onChipMouseUp}
        onMouseLeave={onChipMouseUp}
        style={{ cursor: 'grab' }}
      >
        <button className={`mp-chip ${!activeCategory ? 'mp-chip--active' : ''}`} onClick={() => setActiveCategory(null)}>
          <Package size={14} /> Semua <span className="mp-chip-count">{products.length}</span>
        </button>
        {sortedCategories.map(cat => (
          <button key={cat.slug} className={`mp-chip ${activeCategory === cat.slug ? 'mp-chip--active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}>
            {cat.name} <span className="mp-chip-count">{cat.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ TOOLBAR ═══ */}
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

      {/* ═══ 3-COLUMN LAYOUT ═══ */}
      <div className="mkp-layout">
        <CategorySidebar products={products} activeSlug={null} />

        <div style={{ minWidth: 0 }}>
          {/* ═══ CONTENT: FILTER + GRID ═══ */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

            {/* Filter Sidebar (desktop only) */}
            {!isMobile && showSidebar && (
              <aside style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '80px' }}>
            <div style={{ background: 'var(--bg-surface, #fff)', borderRadius: '12px', border: '1px solid var(--border-default, #eee)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #333)', margin: 0 }}>Filter</h3>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setPriceRange(null); setSelectedBrands([]); setInStockOnly(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '11px', color: '#e74c3c', cursor: 'pointer', fontWeight: '600' }}>
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Harga */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Harga</h4>
                {[
                  { key: 'under50k', label: 'Di bawah Rp50.000' },
                  { key: '50k-100k', label: 'Rp50.000 - 100.000' },
                  { key: '100k-250k', label: 'Rp100.000 - 250.000' },
                  { key: 'over250k', label: 'Di atas Rp250.000' },
                ].map(opt => (
                  <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '12px', color: priceRange === opt.key ? '#e74c3c' : 'var(--text-secondary, #555)' }}>
                    <input type="radio" name="price" checked={priceRange === opt.key}
                      onChange={() => setPriceRange(priceRange === opt.key ? null : opt.key)}
                      style={{ accentColor: '#e74c3c', width: '14px', height: '14px' }} />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Stok */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Ketersediaan</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: inStockOnly ? '#22c55e' : 'var(--text-secondary, #555)' }}>
                  <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                    style={{ accentColor: '#22c55e', width: '14px', height: '14px' }} />
                  Tersedia saja
                </label>
              </div>

              {/* Brand */}
              {availableBrands.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted, #999)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Brand</h4>
                  <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {availableBrands.map(b => (
                      <label key={b.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0', cursor: 'pointer', fontSize: '12px', color: selectedBrands.includes(b.name) ? '#e74c3c' : 'var(--text-secondary, #555)' }}>
                        <input type="checkbox" checked={selectedBrands.includes(b.name)}
                          onChange={() => setSelectedBrands(prev => prev.includes(b.name) ? prev.filter(x => x !== b.name) : [...prev, b.name])}
                          style={{ accentColor: '#e74c3c', width: '14px', height: '14px' }} />
                        {b.name} <span style={{ fontSize: '10px', color: 'var(--text-muted, #999)', marginLeft: 'auto' }}>{b.count}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="mp-empty">
              <Package size={48} className="mp-empty-icon" />
              <h3 className="mp-empty-title">{searchQuery ? `Tidak ditemukan untuk "${searchQuery}"` : 'Belum ada produk'}</h3>
              <p className="mp-empty-desc">{searchQuery ? 'Coba kata kunci lain atau hapus filter.' : 'Produk akan segera tersedia.'}</p>
              {(searchQuery || activeCategory || activeFilterCount > 0) && (
                <button className="mp-empty-btn" onClick={() => { setSearchQuery(''); setActiveCategory(null); setPriceRange(null); setSelectedBrands([]); setInStockOnly(false); }}>
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
      </div>
    </div>
  );
};

export default JakmallMarketplace;
