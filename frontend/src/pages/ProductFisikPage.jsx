import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Package, RefreshCw, Check,
  ChevronRight, Star, Truck, ShieldCheck,
  MessageCircle, Clock, Zap, ChevronDown, ChevronUp,
  Minus, Plus, Heart, Share2, MapPin, AlertCircle, Copy,
  ChevronLeft, Palette, Ruler, Layers,
} from 'lucide-react';

function formatRupiah(n) { return `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`; }

const NAV_ITEMS = [
  { key: 'info', label: 'Informasi Produk' },
  { key: 'specs', label: 'Spesifikasi' },
  { key: 'reviews', label: 'Ulasan' },
  { key: 'discuss', label: 'Diskusi' },
];

const POLICY_ITEMS = [
  { title: 'Kebijakan Pengiriman', content: 'Pengiriman barang dengan kategori Dangerous Goods tidak bisa dikirim melalui jalur udara. Estimasi pengiriman 1-3 hari kerja untuk area Jawa, 3-7 hari untuk luar Jawa. Pengiriman Go-Send & Grab Express tersedia setiap hari.' },
  { title: 'Kebijakan Retur', content: 'Retur dapat dilakukan dalam 7 hari setelah barang diterima. Barang harus dalam kondisi original packaging dan belum digunakan. Biaya retur ditanggung pembeli kecuali ada cacat produksi.' },
  { title: 'Kebijakan Garansi', content: 'Produk ini tidak memiliki garansi resmi dari penjual. Silakan hubungi penjual melalui fitur Chat untuk informasi lebih lanjut.' },
];

export default function ProductFisikPage({ user, token }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState({});
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [cartMsg, setCartMsg] = useState('');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [tab, setTab] = useState('info');
  const [activeImg, setActiveImg] = useState(0);
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isFavorited, setIsFavorited] = useState(false);
  const [toast, setToast] = useState('');
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [discussions, setDiscussions] = useState([]);
  const [discussMsg, setDiscussMsg] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [realRating, setRealRating] = useState(null);
  const [realReviewCount, setRealReviewCount] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { fetchProduct(); }, [slug]);

  useEffect(() => {
    if (!product || !user) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/favorites/check/${product.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.favorited) setIsFavorited(true); }).catch(() => {});
  }, [product?.id, user]);

  // Fetch real rating data
  useEffect(() => {
    if (!product) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/product/${product.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.reviews?.length > 0) {
          const avg = d.reviews.reduce((s, r) => s + r.rating, 0) / d.reviews.length;
          setRealRating(avg.toFixed(1));
          setRealReviewCount(d.reviews.length);
        }
      }).catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    if (tab === 'reviews') fetchReviews();
    if (tab === 'discuss') fetchDiscussions();
  }, [tab, product?.id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/products/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Produk tidak ditemukan');
      setProduct(data.product);
      const p = data.product;
      if (p.variants && Array.isArray(p.variants)) {
        const init = {};
        p.variants.forEach(v => {
          const key = v.name || '';
          const opts = v.options || v.values || [];
          if (key && opts.length > 0) init[key] = String(opts[0]);
        });
        setSelectedVariant(init);
      }
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true); setCartMsg('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          selectedVariant: Object.keys(selectedVariant).length > 0 ? selectedVariant : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.dispatchEvent(new Event('cart-update'));
      setAdded(true);
      setCartMsg('Ditambahkan ke keranjang!');
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      setCartMsg(err.message);
    } finally { setAdding(false); }
  };

  const handleVariantSelect = (variantName, value) => {
    setSelectedVariant(prev => ({ ...prev, [variantName]: value }));
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleFavorite = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/favorites/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = await res.json();
      if (res.ok) { setIsFavorited(data.favorited); showToast(data.favorited ? 'Ditambahkan ke Favorit' : 'Dihapus dari Favorit'); }
    } catch {}
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); showToast('Link disalin!'); } catch {}
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/product/${product.id}`);
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } catch {}
  };

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/discussions/${product.id}`);
      const data = await res.json();
      if (res.ok) setDiscussions(data.discussions || []);
    } catch {}
  };

  const handleReviewSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, rating: reviewRating, comment: reviewComment }),
      });
      if (res.ok) { setShowReviewForm(false); setReviewComment(''); setReviewRating(5); fetchReviews(); showToast('Ulasan terkirim!'); }
    } catch {}
  };

  const handleDiscussSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!discussMsg.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/discussions/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: discussMsg, parentId: replyTo }),
      });
      if (res.ok) { setDiscussMsg(''); setReplyTo(null); fetchDiscussions(); }
    } catch {}
  };

  // ── Derived data ──
  const price = product?.priceUser || 0;
  const discountRand = ((product?.id || 1) * 7 + 13) % 30 + 10;
  const multiplier = 100 / (100 - discountRand);
  const originalPrice = Math.round(price * multiplier);
  const discountPct = Math.round((1 - price / originalPrice) * 100);
  const hasVariants = product?.variants && Array.isArray(product.variants) && product.variants.length > 0;
  const isOutOfStock = product?.stock <= 0;

  const allImages = useMemo(() => {
    if (!product) return [];
    try {
      if (product.images) {
        const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    if (product.imageUrl) return [product.imageUrl];
    return [];
  }, [product]);

  const specs = useMemo(() => [
    { label: 'Brand', value: product?.brand },
    { label: 'SKU', value: product?.jakmallProductId },
    { label: 'Berat', value: product?.weight ? `${product.weight >= 1000 ? (product.weight/1000).toFixed(1) + ' kg' : product.weight + ' gram'}` : null },
    { label: 'Dimensi', value: [product?.length, product?.width, product?.height].filter(Boolean).join(' × ') || null },
    { label: 'Stok', value: isOutOfStock ? 'Habis' : 'Tersedia' },
    { label: 'Kategori', value: product?.category?.name },
  ].filter(s => s.value), [product]);

  const isDescLong = (product?.description?.length || 0) > 400;
  const weightDisplay = product?.weight ? `${product.weight >= 1000 ? (product.weight/1000).toFixed(1) + ' kg' : product.weight + ' gram'}` : '-';

  // ── Loading / Error ──
  if (loading) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <RefreshCw size={28} className="spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );
  if (error) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <p style={{ color: 'var(--accent-danger)', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
      <button onClick={() => navigate('/marketplace')} className="btn btn-primary">Kembali ke Mall</button>
    </div>
  );
  if (!product) return null;

  // ── Sub-components ──
  const RatingStars = () => (
    <div className="pf-rating-row">
      {realRating ? (
        <>
          <div className="pf-rating-stars">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={12}
                style={{ fill: s <= Math.round(parseFloat(realRating)) ? '#f59e0b' : '#e5e7eb', color: s <= Math.round(parseFloat(realRating)) ? '#f59e0b' : '#e5e7eb' }}
              />
            ))}
          </div>
          <span className="pf-rating-value">{realRating}</span>
          <span className="pf-rating-count">({realReviewCount} ulasan)</span>
          <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: '600' }}>Verified</span>
        </>
      ) : (
        <span style={{ fontSize: '11px', color: '#999' }}>Belum ada ulasan</span>
      )}
      {isMobile && <span style={{ fontSize: '11px', color: '#bbb' }}>| <strong style={{ color: isOutOfStock ? '#DC2626' : '#22c55e' }}>{isOutOfStock ? 'Habis' : 'Tersedia'}</strong></span>}
    </div>
  );

  const ProductInfo = () => (
    <>
      <div className="pf-category-label">
        <Package size={11} />
        {product.category?.name || 'Produk Fisik'}
      </div>

      <h1 className={`pf-title ${isMobile ? 'pf-title--mobile' : ''}`}>{product.name}</h1>
      <RatingStars />

      <div className="pf-meta-badges">
        {product.brand && (
          <div className="pf-meta-badge"><span>Brand </span><strong>{product.brand}</strong></div>
        )}
        {product.jakmallProductId && (
          <div className="pf-meta-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>SKU </span><strong>{product.jakmallProductId}</strong>
            <Copy size={10} style={{ color: '#ccc', cursor: 'pointer', flexShrink: 0 }} />
          </div>
        )}
      </div>

      <div className="pf-price-row">
        <span className={`pf-price ${isMobile ? 'pf-price--mobile' : ''}`}>{formatRupiah(price)}</span>
        {discountPct > 5 && (
          <>
            <span className="pf-price-original">{formatRupiah(originalPrice)}</span>
            <span className="pf-discount-tag">-{discountPct}%</span>
          </>
        )}
      </div>

      {!isMobile && (
        <div className="pf-shipping-info">
          <span><strong>Dikirim dari Gudang Jakarta Barat</strong></span>
          <span style={{ color: '#999' }}>Berat: {weightDisplay}</span>
        </div>
      )}
    </>
  );

  const getVariantIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (/warna|color|colour/.test(n)) return <Palette size={12} />;
    if (/ukuran|size|dimensi|kapasitas/.test(n)) return <Ruler size={12} />;
    return <Layers size={12} />;
  };

  const VariantSection = () => hasVariants ? product.variants.map((v, i) => {
    const key = v.name || `varian${i}`;
    const options = v.options || v.values || [];
    const isSingleOption = options.length === 1;
    const selectedVal = selectedVariant[key];

    if (isSingleOption) {
      const val = typeof options[0] === 'object' ? options[0].name || options[0].value || options[0] : options[0];
      return (
        <div key={i} style={{ marginBottom: '10px' }}>
          <div className="pf-variant-label">
            {getVariantIcon(key)} {key}
            <span className="pf-selected" style={{ marginLeft: '4px' }}>
              : <strong style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{val}</strong>
            </span>
          </div>
        </div>
      );
    }

    return (
      <div key={i} style={{ marginBottom: '12px' }}>
        <div className="pf-variant-label">
          {getVariantIcon(key)} Pilih {key}
          {selectedVal && <span className="pf-selected">: <strong>{selectedVal}</strong></span>}
        </div>
        <div className="pf-variant-options">
          {options.map(opt => {
            const val = typeof opt === 'object' ? opt.name || opt.value || opt : opt;
            const active = selectedVal === String(val);
            return (
              <button key={val} onClick={() => handleVariantSelect(key, String(val))}
                className={`pf-variant-btn ${active ? 'pf-variant-btn--active' : ''}`}>
                {val}
              </button>
            );
          })}
        </div>
      </div>
    );
  }) : null;

  const QuantitySection = ({ compact }) => (
    <div style={{ marginBottom: compact ? '0' : '14px' }}>
      <div className="pf-qty-label">Jumlah</div>
      <div className="pf-qty-row">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className={`pf-qty-btn ${compact ? 'pf-qty-btn--compact' : ''}`}
          disabled={quantity <= 1}><Minus size={compact ? 12 : 14} /></button>
        <input type="number" value={quantity} readOnly
          className={`pf-qty-input ${compact ? 'pf-qty-input--compact' : ''}`} />
        <button onClick={() => setQuantity(Math.min(9999, quantity + 1))}
          className={`pf-qty-btn ${compact ? 'pf-qty-btn--compact' : ''}`}
          disabled={quantity >= 9999}><Plus size={compact ? 12 : 14} /></button>
        {!compact && <span className="pf-qty-stock" style={{ color: isOutOfStock ? '#DC2626' : '#22c55e', fontWeight: '600' }}>{isOutOfStock ? 'Habis' : 'Tersedia'}</span>}
      </div>
    </div>
  );

  const AddToCartBtn = ({ compact }) => {
    const btnClass = [
      'pf-cart-btn',
      compact ? 'pf-cart-btn--compact' : '',
      adding ? 'pf-cart-btn--adding' : '',
    ].filter(Boolean).join(' ');
    return (
      <button onClick={handleAddToCart} disabled={adding || isOutOfStock || !user}
        className={btnClass}
        style={isOutOfStock ? { background: '#e0e0e0', color: '#999', cursor: 'not-allowed', boxShadow: 'none' } : undefined}>
        {adding ? <><RefreshCw size={compact ? 14 : 16} className="spin" /> Menambahkan...</> :
         added ? <><Check size={compact ? 14 : 16} /> {cartMsg}</> :
         isOutOfStock ? 'Stok Habis' :
         !user ? 'Masuk untuk Membeli' :
         <><ShoppingCart size={compact ? 14 : 16} /> {compact ? formatRupiah(price * quantity) : `Tambah ke Keranjang — ${formatRupiah(price * quantity)}`}</>}
      </button>
    );
  };

  return (
    <div className={`pf-container ${isMobile ? 'pf-container--mobile' : ''}`}>
      {/* Breadcrumb */}
      {!isMobile && (
        <nav className="pf-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={9} />
          <Link to="/marketplace">Mall</Link>
          <ChevronRight size={9} />
          {product.category?.name && <><span>{product.category.name}</span><ChevronRight size={9} /></>}
          <span className="pf-breadcrumb-current">{product.name}</span>
        </nav>
      )}

      {isMobile && (
        <div className="pf-mobile-header">
          <button onClick={() => navigate(-1)}><ChevronLeft size={18} style={{ color: '#333' }} /></button>
          <div className="pf-mobile-breadcrumb">
            <Link to="/marketplace" style={{ color: '#999', textDecoration: 'none' }}>Mall</Link>
            <span style={{ margin: '0 4px' }}>/</span>
            <span style={{ color: '#333', fontWeight: '500' }}>{product.name?.substring(0, 30)}...</span>
          </div>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className={!isMobile ? 'pf-grid-2col' : ''}>
        {/* LEFT: Image + Info Cards */}
        <div>
          {/* Main Image */}
          <div className={`pf-image-main ${isMobile ? 'pf-image-main--mobile' : ''}`}>
            {allImages.length > 0 ? (
              <img src={allImages[activeImg]} alt={product.name} />
            ) : (
              <Package size={80} style={{ color: '#ddd' }} />
            )}
            {discountPct > 5 && <span className="pf-discount-badge">-{discountPct}%</span>}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="pf-image-thumbs" style={isMobile ? { padding: '0 16px' } : undefined}>
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`pf-image-thumb ${activeImg === i ? 'pf-image-thumb--active' : ''}`}>
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}

          {/* Mobile inline info */}
          {isMobile && <div style={{ padding: '12px 16px' }}><ProductInfo /></div>}

          {/* Seller Card */}
          <div className="pf-seller-card" style={isMobile ? { margin: '8px 16px' } : undefined}>
            <div className="pf-seller-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="pf-seller-avatar">MA</div>
                <div>
                  <div className="pf-seller-name">Markaz Arshy</div>
                  <div className="pf-seller-loc">Importir — Kebon Jeruk</div>
                </div>
              </div>
              <button className="pf-seller-chat-btn"><MessageCircle size={12} /> Chat</button>
            </div>
            <div className="pf-seller-stats">
              <div className="pf-seller-stat">
                <div className="pf-seller-stat-label">Transaksi Sukses</div>
                <div className="pf-seller-stat-value pf-seller-stat-value--green"><Zap size={12} /> 97%</div>
              </div>
              <div className="pf-seller-stat">
                <div className="pf-seller-stat-label">Kecepatan Kirim</div>
                <div className="pf-seller-stat-value pf-seller-stat-value--purple"><Clock size={12} /> &lt; 1 hari</div>
              </div>
              <div className="pf-seller-location">
                <MapPin size={12} style={{ color: '#e74c3c' }} />
                Dikirim dari <strong>Gudang Jakarta Barat</strong>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="pf-info-cards" style={isMobile ? { margin: '8px 16px' } : undefined}>
            <div className="pf-info-card">
              <ShieldCheck size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div><strong>Garansi</strong> — Tidak ada garansi untuk produk ini.</div>
            </div>
            <div className="pf-info-card">
              <Truck size={16} style={{ color: '#6366f1', flexShrink: 0 }} />
              <div>
                <strong>Dukungan Pengiriman</strong>
                <div className="pf-info-card-sub">Go-Send, Grab Express, JNE, SiCepat, J&T</div>
              </div>
            </div>
          </div>

          {/* Policy Accordion */}
          <div className="pf-policy" style={isMobile ? { margin: '8px 16px' } : undefined}>
            {POLICY_ITEMS.map((item, i) => (
              <div key={i} className="pf-policy-item">
                <button onClick={() => setExpandedPolicy(expandedPolicy === i ? null : i)}
                  className="pf-policy-trigger">
                  {item.title}
                  {expandedPolicy === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {expandedPolicy === i && <div className="pf-policy-content">{item.content}</div>}
              </div>
            ))}
          </div>

          <div className="pf-report-btn">
            <button><AlertCircle size={11} /> Laporkan produk bermasalah</button>
          </div>
        </div>

        {/* RIGHT: Product Details (desktop) */}
        {!isMobile && (
          <div className="pf-sticky-right">
            <ProductInfo />
            <VariantSection />
            <QuantitySection compact={false} />
            <AddToCartBtn compact={false} />

            {cartMsg && !added && (
              <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{cartMsg}</p>
            )}

            {added && (
              <div className="pf-post-cart">
                <button onClick={() => navigate('/cart')} className="pf-post-cart-btn pf-post-cart-btn--primary">Lihat Keranjang</button>
                <button onClick={() => { setAdded(false); setCartMsg(''); setQuantity(1); }} className="pf-post-cart-btn pf-post-cart-btn--secondary">Pesan Lagi</button>
              </div>
            )}

            <div className="pf-action-row">
              <button className={`pf-action-btn ${isFavorited ? 'pf-fav-btn--active' : ''}`}
                onClick={handleFavorite}>
                <Heart size={12} style={isFavorited ? { fill: '#e74c3c', color: '#e74c3c' } : undefined} />
                {isFavorited ? 'Favorited' : 'Favorit'}
              </button>
              <button className="pf-action-btn" onClick={handleShare}>
                <Share2 size={12} /> Bagikan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Variants + Quantity */}
      {isMobile && (
        <div style={{ padding: '12px 16px' }}>
          <VariantSection />
          <QuantitySection compact={false} />
          <div style={{ marginBottom: '12px' }}>
            <span className="pf-price pf-price--mobile">{formatRupiah(price)}</span>
            {discountPct > 5 && <span className="pf-price-original" style={{ marginLeft: '8px' }}>{formatRupiah(originalPrice)}</span>}
            <span style={{ fontSize: '11px', color: isOutOfStock ? '#DC2626' : '#22c55e', marginLeft: '8px', fontWeight: '600' }}>| {isOutOfStock ? 'Habis' : 'Tersedia'}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="pf-tabs" style={isMobile ? { marginTop: '8px' } : undefined}>
        {NAV_ITEMS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`pf-tab ${tab === t.key ? 'pf-tab--active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className={`pf-tab-content ${isMobile ? 'pf-tab-content--mobile' : ''}`}>
          <h3 className="pf-desc-title">Deskripsi</h3>
          <div className={`pf-desc ${!showFullDesc && isDescLong ? 'pf-desc--collapsed' : ''}`}>
            {product.description || 'Tidak ada deskripsi.'}
            {!showFullDesc && isDescLong && <div className="pf-desc-fade" />}
          </div>
          {isDescLong && (
            <button onClick={() => setShowFullDesc(!showFullDesc)} className="pf-desc-toggle">
              {showFullDesc ? 'Tutup' : 'Lihat Selengkapnya'} {showFullDesc ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      )}

      {/* Tab: Specs */}
      {tab === 'specs' && (
        <div className={`pf-tab-content ${isMobile ? 'pf-tab-content--mobile' : ''}`}>
          <table className="pf-specs-table">
            <tbody>
              {specs.map((s, i) => (
                <tr key={i}>
                  <td>{s.label}</td>
                  <td>{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Reviews */}
      {tab === 'reviews' && (
        <div className={`pf-tab-content ${isMobile ? 'pf-tab-content--mobile' : ''}`}>
          {reviews.length === 0 && !showReviewForm ? (
            <div className="pf-empty-state">
              <Star size={40} style={{ color: '#ddd', marginBottom: '12px' }} />
              <p>Belum ada ulasan untuk produk ini.</p>
              <p>Jadilah yang pertama memberikan ulasan!</p>
              {user && (
                <button className="pf-desc-toggle" style={{ marginTop: '12px' }}
                  onClick={() => setShowReviewForm(true)}>
                  Tulis Ulasan
                </button>
              )}
            </div>
          ) : (
            <>
              {reviews.map(r => (
                <div key={r.id} className="pf-review-item">
                  <div className="pf-review-header">
                    <strong>{r.user?.name || 'User'}</strong>
                    <div className="pf-rating-stars" style={{ display: 'inline-flex', marginLeft: '8px' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11}
                          style={{ fill: s <= r.rating ? '#f59e0b' : '#e5e7eb', color: s <= r.rating ? '#f59e0b' : '#e5e7eb' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                      {new Date(r.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  {r.comment && <p className="pf-review-comment">{r.comment}</p>}
                </div>
              ))}
              {user && !showReviewForm && (
                <button className="pf-desc-toggle" style={{ marginTop: '12px' }}
                  onClick={() => setShowReviewForm(true)}>
                  Tulis Ulasan
                </button>
              )}
            </>
          )}

          {showReviewForm && (
            <div className="pf-review-form">
              <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>Beri Ulasan</h4>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>
                    <Star size={20}
                      style={{ fill: s <= reviewRating ? '#f59e0b' : '#e5e7eb', color: s <= reviewRating ? '#f59e0b' : '#e5e7eb' }} />
                  </button>
                ))}
              </div>
              <textarea className="pf-discussion-input" rows={3}
                placeholder="Tulis ulasan Anda..."
                value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="pf-discussion-submit" onClick={handleReviewSubmit}>Kirim</button>
                <button className="pf-desc-toggle" onClick={() => setShowReviewForm(false)}>Batal</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Diskusi */}
      {tab === 'discuss' && (
        <div className={`pf-tab-content ${isMobile ? 'pf-tab-content--mobile' : ''}`}>
          {/* Discussion form */}
          {user && (
            <div className="pf-discussion-form" style={replyTo ? { borderLeft: '3px solid #e74c3c', paddingLeft: '12px' } : undefined}>
              {replyTo && (
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Membalas komentar
                  <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '11px' }}>x Batal</button>
                </div>
              )}
              <textarea className="pf-discussion-input" rows={2}
                placeholder={replyTo ? 'Tulis balasan...' : 'Tanyakan sesuatu tentang produk ini...'}
                value={discussMsg} onChange={e => setDiscussMsg(e.target.value)} />
              <button className="pf-discussion-submit" onClick={handleDiscussSubmit}
                disabled={!discussMsg.trim()}>
                {replyTo ? 'Kirim Balasan' : 'Kirim'}
              </button>
            </div>
          )}
          {!user && (
            <div className="pf-empty-state" style={{ padding: '20px 0' }}>
              <p style={{ fontSize: '12px' }}>
                <button onClick={() => navigate('/login')} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>Login</button> untuk berdiskusi tentang produk ini.
              </p>
            </div>
          )}

          {/* Discussion list */}
          {discussions.length === 0 ? (
            <div className="pf-empty-state" style={{ padding: '30px 0' }}>
              <MessageCircle size={32} style={{ color: '#ddd', marginBottom: '8px' }} />
              <p>Belum ada diskusi.</p>
            </div>
          ) : (
            <div className="pf-discussion-list">
              {discussions.map(d => (
                <div key={d.id} className="pf-discussion-item">
                  <div className="pf-discussion-header">
                    <strong>{d.user?.name || 'User'}</strong>
                    <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                      {new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="pf-discussion-message">{d.message}</p>
                  {user && (
                    <button className="pf-discussion-reply-btn" onClick={() => setReplyTo(d.id)}>
                      Balas
                    </button>
                  )}
                  {/* Replies */}
                  {d.replies?.length > 0 && (
                    <div className="pf-discussion-replies">
                      {d.replies.map(r => (
                        <div key={r.id} className="pf-discussion-item pf-discussion-reply">
                          <div className="pf-discussion-header">
                            <strong>{r.user?.name || 'User'}</strong>
                            <span style={{ fontSize: '10px', color: '#999', marginLeft: '8px' }}>
                              {new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <p className="pf-discussion-message">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toast notification */}
      {toast && <div className="pf-toast">{toast}</div>}

      {/* Mobile: Sticky Bottom Cart Bar */}
      {isMobile && (
        <div className="pf-mobile-bar">
          <div style={{ flexShrink: 0 }}>
            <div className="pf-mobile-bar-price">{formatRupiah(price * quantity)}</div>
            {discountPct > 5 && <div style={{ fontSize: '10px', color: '#bbb', textDecoration: 'line-through' }}>{formatRupiah(originalPrice)}</div>}
          </div>
          <div style={{ flex: 1 }}><QuantitySection compact={true} /></div>
          <div style={{ flex: 2 }}><AddToCartBtn compact={true} /></div>
        </div>
      )}
    </div>
  );
}
