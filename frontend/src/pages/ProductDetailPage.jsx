import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw, ShieldCheck, Star, CheckCircle2, Zap,
  ShoppingCart, ArrowLeft, Tag, Clock, Users,
  Info, MessageSquare, ChevronRight, Package, Infinity,
  AlertTriangle, Check, ExternalLink, Copy
} from 'lucide-react';

/* ── Skeleton loading ── */
function DetailSkeleton() {
  const sh = {
    background: 'var(--bg-muted)', borderRadius: '8px',
    animation: 'shimmer 1.5s infinite',
    backgroundImage: 'linear-gradient(90deg, var(--bg-muted) 0%, var(--bg-page) 50%, var(--bg-muted) 100%)',
    backgroundSize: '200% 100%',
  };
  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ ...sh, width: '200px', height: '14px', marginBottom: '24px' }} />
      <div className="pd-layout">
        <div style={{ flex: 1 }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ ...sh, width: '120px', height: '24px', marginBottom: '16px' }} />
            <div style={{ ...sh, width: '80%', height: '32px', marginBottom: '20px' }} />
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div style={{ ...sh, width: '80px', height: '20px' }} />
              <div style={{ ...sh, width: '120px', height: '20px' }} />
            </div>
            <div style={{ ...sh, width: '100%', height: '100px' }} />
          </div>
        </div>
        <div style={{ width: '380px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ ...sh, width: '60%', height: '18px', marginBottom: '16px' }} />
            <div style={{ ...sh, width: '100%', height: '48px', marginBottom: '12px' }} />
            <div style={{ ...sh, width: '100%', height: '48px', marginBottom: '12px' }} />
            <div style={{ ...sh, width: '100%', height: '56px' }} />
          </div>
        </div>
      </div>
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}

/* ── Utility + Copy button ── */
const formatRupiah = (n) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent-primary)', verticalAlign:'middle', padding:'2px 4px', fontSize:'12px' }}>
      {copied ? '✓' : <Copy size={12} />}
    </button>
  );
}

export default function ProductDetailPage({ user, token }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [quantity, setQuantity]         = useState(1);
  const [targetUrl, setTargetUrl]       = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedOs, setSelectedOs]     = useState('');
  const [orderError, setOrderError]     = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [activeTab, setActiveTab]       = useState('deskripsi');

  const [reviews, setReviews]               = useState([]);
  const [averageRating, setAverageRating]   = useState(0);
  const [userReview, setUserReview]         = useState('');
  const [userRating, setUserRating]         = useState(0);
  const [hoveredRating, setHoveredRating]   = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError]       = useState('');
  const [reviewSuccess, setReviewSuccess]   = useState('');

  const [durationOptions, setDurationOptions] = useState([]);
  const [osOptions, setOsOptions]             = useState([]);

  useEffect(() => { fetchProduct(); }, [slug]);
  useEffect(() => { if (product?.id) fetchReviews(); }, [product]);

  const fetchReviews = async () => {
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/product/${product.id}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        const total = (data.reviews || []).reduce((s, r) => s + r.rating, 0);
        setAverageRating(data.reviews?.length > 0 ? total / data.reviews.length : 0);
      }
    } catch (e) { console.error(e); }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/catalog/products/${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Product not found');
      setProduct(data.product);
      setQuantity(data.product.type === 'SMM' ? data.product.minOrder : 1);

      if (data.product.durationOptions) {
        try {
          const d = JSON.parse(data.product.durationOptions);
          setDurationOptions(d);
          if (d.length > 0) setSelectedDuration(d[0].label);
        } catch (e) {}
      }
      if (data.product.osOptions) {
        try {
          const o = JSON.parse(data.product.osOptions);
          setOsOptions(o);
          if (o.length > 0) setSelectedOs(o[0]);
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
      navigate('/catalog/smm');
    } finally {
      setLoading(false);
    }
  };

  const getBasePrice = () => {
    if (!product) return 0;
    return user?.role === 'RESELLER' ? product.priceReseller : product.priceUser;
  };

  const getSelectedDurationPrice = () => {
    if (!selectedDuration || durationOptions.length === 0) return null;
    const d = durationOptions.find(d => d.label === selectedDuration);
    if (d?.price && parseFloat(d.price) > 0) return parseFloat(d.price);
    if (d?.priceMultiplier && d.priceMultiplier !== 1) return getBasePrice() * d.priceMultiplier;
    return null;
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const base = getBasePrice();
    if (product.type === 'SMM') return (base / 1000) * quantity;
    const durationPrice = getSelectedDurationPrice();
    if (durationPrice !== null) return durationPrice;
    return base;
  };

  const orderTotal = useMemo(() => calculateTotal(), [product, quantity, selectedDuration, selectedOs, user]);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }

    // Konfirmasi untuk pesanan besar
    if (orderTotal > 500000 && !window.confirm(`Total pesanan Anda Rp ${Math.round(orderTotal).toLocaleString('id-ID')}. Lanjutkan?`)) return;

    setOrderError('');
    setSubmitting(true);
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(quantity),
          targetUrl,
          selectedDuration: durationOptions.length > 0 ? selectedDuration : undefined,
          selectedOs:       osOptions.length > 0       ? selectedOs       : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrderSuccess(data);
    } catch (err) {
      setOrderError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user || !userRating) { setReviewError('Silakan login dan berikan rating bintang terlebih dahulu.'); return; }
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const res  = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: product.id, rating: userRating, comment: userReview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewSuccess('✅ Ulasan Anda berhasil dikirim, terima kasih!');
      setUserReview('');
      setUserRating(0);
      fetchReviews();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getCatalogPath = () => {
    if (!product) return '/catalog/smm';
    if (product.type === 'SMM') return '/catalog/smm';
    if (product.category?.slug === 'vps-rdp') return '/catalog/vps-rdp';
    return '/catalog/premium';
  };

  const getCatalogLabel = () => {
    if (!product) return 'SMM';
    if (product.type === 'SMM') return 'Medsos Boost';
    if (product.category?.slug === 'vps-rdp') return 'VPS & RDP';
    return 'Akun Premium';
  };

  /* ── Loading ── */
  if (loading) return <DetailSkeleton />;
  if (!product) return null;

  const isVpsRdp = product.category?.slug === 'vps-rdp';
  const badgeClass = product.type === 'SMM' ? 'badge-smm' : 'badge-premium';
  const isOutOfStock = product.type === 'PREMIUM' && !isVpsRdp && !product.providerServiceId && (product.stockCount || 0) === 0;

  return (
    <div className="container animate-fade-in pd-page">

      {/* ── Breadcrumb ── */}
      <nav className="pd-breadcrumb">
        <Link to="/">Beranda</Link>
        <ChevronRight size={13} />
        <Link to={getCatalogPath()}>{getCatalogLabel()}</Link>
        <ChevronRight size={13} />
        <span>{product.name}</span>
      </nav>

      <div className="pd-layout">

        {/* ═══ KOLOM KIRI ═══ */}
        <div className="pd-left">

          <div className="glass-card pd-info-card">
            {/* Badge + Rating */}
            <div className="pd-info-top">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${badgeClass}`}>{product.category.name}</span>
                {product.type === 'PREMIUM' && !isVpsRdp && (
                  product.providerStatus === 'Gangguan' || isOutOfStock ? (
                    <span className="badge badge-danger">🚫 Stok Habis</span>
                  ) : (
                    <span className="badge badge-success">🟢 Tersedia</span>
                  )
                )}
                {isVpsRdp && <span className="badge badge-success">♾️ Unlimited</span>}
              </div>
              {reviews.length > 0 && (
                <div className="pd-avg-rating">
                  <Star size={14} fill="currentColor" style={{ color: 'var(--accent-warning)' }} />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="pd-review-count">({reviews.length} ulasan)</span>
                </div>
              )}
            </div>

            <h1 className="pd-title">{product.name}</h1>

            {/* Stats bar */}
            <div className="pd-stats-bar">
              {product.type === 'SMM' && (
                <>
                  <div className="pd-stat-item">
                    <Package size={14} />
                    <span>Min: {product.minOrder?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pd-stat-divider" />
                  <div className="pd-stat-item">
                    <Infinity size={14} />
                    <span>Max: {product.maxOrder?.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pd-stat-divider" />
                </>
              )}
              <div className="pd-stat-item">
                <Zap size={14} />
                <span>Proses Otomatis</span>
              </div>
              {product.type === 'PREMIUM' && !isVpsRdp && (
                <>
                  <div className="pd-stat-divider" />
                  <div className="pd-stat-item">
                    <Tag size={14} />
                    <span>{product.providerServiceId ? 'Stok: Tersedia' : `Stok: ${product.stockCount || 0}`}</span>
                  </div>
                </>
              )}
            </div>

            {/* Tab: Deskripsi / Ulasan */}
            <div className="pd-tabs">
              <button
                className={`pd-tab ${activeTab === 'deskripsi' ? 'active' : ''}`}
                onClick={() => setActiveTab('deskripsi')}
              >
                <Info size={14} /> Deskripsi
              </button>
              <button
                className={`pd-tab ${activeTab === 'ulasan' ? 'active' : ''}`}
                onClick={() => setActiveTab('ulasan')}
              >
                <MessageSquare size={14} /> Ulasan {reviews.length > 0 && `(${reviews.length})`}
              </button>
            </div>

            {activeTab === 'deskripsi' && (
              <div className="pd-description">
                {product.description
                  ? product.description.split('\n').map((line, i) => (
                      line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                    ))
                  : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Tidak ada deskripsi untuk layanan ini.</p>
                }
              </div>
            )}

            {activeTab === 'ulasan' && (
              <div className="pd-reviews-section">
                {reviews.length > 0 && (
                  <div className="pd-rating-summary">
                    <span className="pd-rating-big">{averageRating.toFixed(1)}</span>
                    <div>
                      <div style={{ display: 'flex', gap: '3px', color: 'var(--color-warning)' }}>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={16} fill={i <= Math.round(averageRating) ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                        {reviews.length} ulasan pelanggan
                      </span>
                    </div>
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>
                    Belum ada ulasan. Jadilah yang pertama!
                  </p>
                ) : (
                  <div className="pd-reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="pd-review-item">
                        <div className="pd-review-header">
                          <div className="pd-review-avatar">{r.user.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <span className="pd-review-name">{r.user.name}</span>
                            <div style={{ display: 'flex', gap: '2px', color: 'var(--color-warning)', marginTop: '3px' }}>
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={11} fill={i <= r.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          </div>
                        </div>
                        {r.comment && <p className="pd-review-comment">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {user && (
                  <form onSubmit={handleReviewSubmit} className="pd-review-form">
                    <p className="pd-review-form-title">Tulis Ulasan Anda</p>
                    <div className="pd-star-picker">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={28}
                          fill={(hoveredRating || userRating) >= i ? 'currentColor' : 'none'}
                          style={{
                            color: (hoveredRating || userRating) >= i ? 'var(--color-warning)' : 'var(--text-muted)',
                            cursor: 'pointer', transition: 'color 0.15s, transform 0.15s',
                            transform: (hoveredRating || userRating) >= i ? 'scale(1.2)' : 'scale(1)',
                          }}
                          onMouseEnter={() => setHoveredRating(i)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setUserRating(i)}
                        />
                      ))}
                      {userRating > 0 && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                          {['', 'Buruk', 'Kurang', 'Cukup', 'Bagus', 'Luar Biasa!'][userRating]}
                        </span>
                      )}
                    </div>
                    <textarea className="form-input pd-review-textarea"
                      placeholder="Ceritakan pengalaman Anda menggunakan layanan ini…"
                      value={userReview} onChange={e => setUserReview(e.target.value)} rows={3}
                    />
                    {reviewError   && <p className="pd-alert pd-alert-error">{reviewError}</p>}
                    {reviewSuccess && <p className="pd-alert pd-alert-success">{reviewSuccess}</p>}
                    <button type="submit" className="btn btn-secondary" disabled={submittingReview} style={{ marginTop: '10px' }}>
                      {submittingReview ? 'Mengirim…' : 'Kirim Ulasan'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="pd-trust-grid">
            {[
              { icon: <Zap size={20} />,        label: 'Instan',    sub: 'Proses otomatis 24/7' },
              { icon: <ShieldCheck size={20} />, label: 'Aman',     sub: 'Transaksi terenkripsi' },
              { icon: <CheckCircle2 size={20} />,label: 'Terjamin', sub: 'Garansi penuh' },
              { icon: <Users size={20} />,       label: '10rb+ User',sub: 'Dipercaya ribuan pembeli' },
            ].map((t, i) => (
              <div key={i} className="pd-trust-item glass-card">
                <div className="pd-trust-icon">{t.icon}</div>
                <span className="pd-trust-label">{t.label}</span>
                <span className="pd-trust-sub">{t.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ KOLOM KANAN — CHECKOUT ═══ */}
        <div className="pd-right">
          <div className="glass-card pd-checkout-card">

            {orderSuccess ? (
              <div className="pd-success">
                <div className="pd-success-icon"><CheckCircle2 size={48} /></div>
                <h3>Pesanan Berhasil!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Pesanan #{orderSuccess.order?.id} sedang diproses.</p>
                <div className="pd-success-detail">
                  <div><strong>Produk:</strong> {product.name}</div>
                  <div><strong>Total:</strong> {formatRupiah(orderSuccess.order?.amount)}</div>
                  <div><strong>Status:</strong> {orderSuccess.order?.status === 'COMPLETED' ? '✅ Selesai' : '⏳ Diproses'}</div>
                  {orderSuccess.accountDetails && (
                    <div className="pd-success-cred">
                      <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>📋 Kredensial Akun:</div>
                      <div>Email: <strong>{orderSuccess.accountDetails.email}</strong> <CopyBtn text={orderSuccess.accountDetails.email} /></div>
                      <div>Password: <strong>{orderSuccess.accountDetails.password}</strong> <CopyBtn text={orderSuccess.accountDetails.password} /></div>
                      {orderSuccess.accountDetails.extraInfo && <div style={{ marginTop:'4px', fontSize:'11px', color:'var(--text-muted)' }}>{orderSuccess.accountDetails.extraInfo}</div>}
                    </div>
                  )}
                </div>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary pd-checkout-btn">
                  Lihat di Dashboard <ExternalLink size={14} />
                </button>
                <button onClick={() => { setOrderSuccess(null); setOrderError(''); }}
                  className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                  Pesan Lagi
                </button>
              </div>
            ) : (
              <>
                {/* Price block */}
                <div className="pd-price-block">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="pd-price-label">
                        {durationOptions.length > 0 ? `Harga — ${selectedDuration}` : 'Harga Layanan'}
                      </span>
                      <div className="pd-price-display">
                        {formatRupiah(orderTotal)}
                        {product.type === 'SMM' && <span className="pd-price-unit-text"> / 1k</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {user?.role === 'RESELLER' && (
                        <span className="badge badge-smm">🏷️ Reseller</span>
                      )}
                    </div>
                  </div>
                  {durationOptions.length > 0 && orderTotal !== getBasePrice() && (
                    <div className="pd-price-sub">
                      Harga dasar: {formatRupiah(getBasePrice())}
                    </div>
                  )}
                </div>

                <form onSubmit={handleOrderSubmit} className="pd-form">

                  {/* SMM fields */}
                  {product.type === 'SMM' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">🔗 Link / URL Target</label>
                        <input type="url" className="form-input"
                          placeholder="https://instagram.com/username"
                          value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required />
                        <span className="pd-field-hint">Tempel link profil / postingan yang ingin di-boost</span>
                      </div>
                      <div className="form-group">
                        <label className="form-label">📦 Jumlah</label>
                        <input type="number" className="form-input"
                          min={product.minOrder} max={product.maxOrder}
                          step={1}
                          value={quantity}
                          onChange={e => {
                            const v = parseInt(e.target.value) || product.minOrder;
                            setQuantity(Math.max(product.minOrder, Math.min(product.maxOrder, v)));
                          }} required />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>Min: {product.minOrder?.toLocaleString('id-ID')}</span>
                          <span>Max: {product.maxOrder?.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Durasi (Premium) */}
                  {product.type === 'PREMIUM' && durationOptions.length > 0 && (() => {
                    const prices = durationOptions.map(d => {
                      if (d.price && parseFloat(d.price) > 0) return parseFloat(d.price);
                      if (d.priceMultiplier && d.priceMultiplier !== 1) return getBasePrice() * d.priceMultiplier;
                      return getBasePrice();
                    });

                    const bestValueIdx = durationOptions.reduce((best, d, i) => {
                      const perDay = prices[i] / ((d.months || 1) * 30);
                      const bestPerDay = prices[best] / ((durationOptions[best].months || 1) * 30);
                      return perDay < bestPerDay ? i : best;
                    }, 0);

                    return (
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>⏱️ Pilih Durasi</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {durationOptions.map((d, i) => {
                            const durPrice = prices[i];
                            const months = d.months || (i + 1) * 0.25;
                            const perDay = Math.ceil(durPrice / (months * 30));
                            const isActive = selectedDuration === d.label;
                            const isBest = i === bestValueIdx && durationOptions.length > 1;

                            return (
                              <button key={i} type="button" onClick={() => setSelectedDuration(d.label)}
                                style={{
                                  position: 'relative', padding: '16px 14px', borderRadius: '14px',
                                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-default)',
                                  background: isActive ? 'var(--accent-primary-light)' : 'var(--bg-page)',
                                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                }}>
                                {isBest && (
                                  <span style={{ position: 'absolute', top: '-9px', right: '10px',
                                    background: 'linear-gradient(90deg, var(--color-primary), #06b6d4)',
                                    color: '#fff', fontSize: '9px', fontWeight: '900',
                                    padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px' }}>
                                    ★ TERBAIK
                                  </span>
                                )}
                                <div style={{ fontSize: '14px', fontWeight: '800', color: isActive ? 'var(--color-primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                                  {d.label}
                                </div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                                  {formatRupiah(durPrice)}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  ≈ {formatRupiah(perDay)}/hari
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Target Input (Premium H2H) */}
                  {product.type === 'PREMIUM' && product.providerServiceId && (
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      {(() => {
                        const nameLower = product.name.toLowerCase();
                        const isUpgrade = nameLower.includes('upgrade') || nameLower.includes('email pribadi') || nameLower.includes('invite');
                        const isOtpApp = nameLower.includes('hotstar') || nameLower.includes('otp');

                        if (isUpgrade) return (
                          <>
                            <label className="form-label">📧 Email Akun Anda</label>
                            <input type="email" className="form-input" placeholder="nama@gmail.com" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required />
                            <span className="pd-field-hint">Email yang ingin di-upgrade ke Premium</span>
                          </>
                        );
                        if (isOtpApp) return (
                          <>
                            <label className="form-label">📱 Nomor HP (OTP)</label>
                            <input type="tel" className="form-input" placeholder="081234567890" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required />
                            <span className="pd-field-hint">Nomor HP aktif terdaftar di aplikasi</span>
                          </>
                        );
                        return (
                          <>
                            <label className="form-label">📞 Nomor WhatsApp Penerima</label>
                            <input type="tel" className="form-input" placeholder="081234567890 (Opsional)" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                            <span className="pd-field-hint">Untuk menerima detail kredensial akun</span>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* OS Options */}
                  {osOptions.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">🖥️ Pilih OS</label>
                      <select className="form-input" value={selectedOs} onChange={e => setSelectedOs(e.target.value)}
                        style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
                        {osOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ background: 'var(--bg-page)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                    {product.type === 'SMM' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-default)' }}>
                        <span>{formatRupiah(getBasePrice())} × {(quantity / 1000).toFixed(1)}k</span>
                        <span>{formatRupiah(orderTotal)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>Total Bayar</span>
                      <span style={{ fontWeight: '900', fontSize: '24px', fontFamily: 'var(--font-title)', color: 'var(--color-primary)' }}>
                        {formatRupiah(orderTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Stock warnings */}
                  {isOutOfStock && (
                    <div className="pd-alert pd-alert-error" style={{ marginBottom: '15px' }}>
                      ⚠️ Stok akun premium sedang kosong. Silakan hubungi admin atau coba lagi nanti.
                    </div>
                  )}
                  {product.providerStatus === 'Gangguan' && (
                    <div className="pd-alert pd-alert-error" style={{ marginBottom: '15px' }}>
                      🔧 Layanan ini sedang dalam pemeliharaan.
                    </div>
                  )}
                  {orderError && (
                    <div className="pd-alert pd-alert-error" style={{ marginBottom: '15px' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0 }} /> {orderError}
                    </div>
                  )}

                  {!user ? (
                    <Link to="/login" className="btn btn-primary pd-checkout-btn">
                      <ShoppingCart size={16} /> Masuk untuk Memesan
                    </Link>
                  ) : (
                    <button type="submit" className="btn btn-primary pd-checkout-btn" disabled={submitting || product.providerStatus === 'Gangguan' || isOutOfStock}
                      style={{ fontSize: '16px', padding: '16px', borderRadius: '16px', fontWeight: '800' }}>
                      {product.providerStatus === 'Gangguan' ? '🔧 Layanan Gangguan' :
                       isOutOfStock ? '⏳ Stok Kosong' :
                       submitting ? <><RefreshCw size={16} className="spin" /> Memproses…</> :
                       <><ShoppingCart size={16} /> Beli — {formatRupiah(orderTotal)}</>}
                    </button>
                  )}

                  <p className="pd-checkout-note" style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Clock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Pesanan diproses otomatis dalam hitungan detik. <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Garansi Penuh.</span>
                  </p>
                </form>
              </>
            )}
          </div>

          <button onClick={() => navigate(getCatalogPath())} className="btn btn-secondary pd-back-btn" style={{ marginTop: '12px' }}>
            <ArrowLeft size={15} /> Kembali ke {getCatalogLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
