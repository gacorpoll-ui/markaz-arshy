import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProductCardJakmall from '../components/ProductCardJakmall';
import { Package, RefreshCw, ChevronRight, LayoutGrid, List } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

const CATEGORY_DISPLAY_NAMES = {
  'handphone-tablet': 'Handphone & Tablet',
  'komputer-laptop': 'Komputer & Laptop',
  'elektronik': 'Elektronik',
  'fashion-perhiasan': 'Fashion & Perhiasan',
  'ibu-bayi-anak': 'Ibu, Bayi & Anak',
  'mainan-video-games': 'Mainan & Video Games',
  'peralatan-rumah-tangga': 'Peralatan Rumah Tangga',
  'kesehatan-kecantikan': 'Kesehatan & Kecantikan',
  'hobi-olahraga-outdoor': 'Hobi, Olahraga & Outdoor',
  'makanan-minuman': 'Makanan & Minuman',
  'aksesoris-lainnya': 'Aksesoris Lainnya',
};

export default function MarketplaceCategory() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    setPage(1);
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

  const dbSlug = slug.startsWith('fisik-') ? slug : `fisik-${slug}`;
  const categoryName = CATEGORY_DISPLAY_NAMES[slug] || slug;

  const filtered = useMemo(() => {
    let result = products.filter(p => p.category?.slug === dbSlug);
    if (sortBy === 'price-low') result = [...result].sort((a, b) => (a.priceUser || 0) - (b.priceUser || 0));
    else if (sortBy === 'price-high') result = [...result].sort((a, b) => (b.priceUser || 0) - (a.priceUser || 0));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return result;
  }, [products, dbSlug, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedProducts = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px 40px' }}>
      <div style={{ paddingTop: '20px', marginBottom: '20px' }}>
        <div className="mp-skeleton-text" style={{ width: '200px', height: '20px' }} />
        <div className="mp-skeleton-text mp-skeleton-text--short" style={{ width: '120px' }} />
      </div>
      <div className="mp-grid">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="mp-skeleton"><div className="mp-skeleton-img" /><div className="mp-skeleton-text" /><div className="mp-skeleton-text mp-skeleton-text--short" /><div className="mp-skeleton-text mp-skeleton-text--price" /></div>
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
      <nav style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#999', marginBottom: '20px', paddingTop: '20px' }}>
        <Link to="/" style={{ color: '#999', textDecoration: 'none' }}>Home</Link>
        <ChevronRight size={10} />
        <Link to="/marketplace" style={{ color: '#999', textDecoration: 'none' }}>Mall</Link>
        <ChevronRight size={10} />
        <span style={{ color: '#333', fontWeight: '600' }}>{categoryName}</span>
      </nav>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>{categoryName}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{filtered.length} produk tersedia</p>
      </div>

      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          <Link to="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#e74c3c', textDecoration: 'none', fontWeight: '600' }}>← Kembali ke Mall</Link>
        </div>
        <div className="mp-toolbar-right">
          <select className="mp-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga Terendah</option>
            <option value="price-high">Harga Tertinggi</option>
            <option value="name">Nama A-Z</option>
          </select>
          <button className={`mp-view-btn ${viewMode === 'grid' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></button>
          <button className={`mp-view-btn ${viewMode === 'list' ? 'mp-view-btn--active' : ''}`} onClick={() => setViewMode('list')}><List size={16} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mp-empty">
          <Package size={48} className="mp-empty-icon" />
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e0e0e0', background: page === 1 ? '#f5f5f5' : '#fff', color: page === 1 ? '#ccc' : '#333', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}>← Sebelumnya</button>
              <span style={{ fontSize: '13px', color: '#999', padding: '0 8px' }}>Halaman <strong style={{ color: '#333' }}>{page}</strong> dari {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e0e0e0', background: page === totalPages ? '#f5f5f5' : '#fff', color: page === totalPages ? '#ccc' : '#333', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}>Selanjutnya →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
