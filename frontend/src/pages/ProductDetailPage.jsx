import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  RefreshCw, ShieldCheck, Star, CheckCircle2, Zap,
  ShoppingCart, ArrowLeft, Tag, Clock, Users,
  Info, MessageSquare, ChevronRight, Package, Infinity
} from 'lucide-react';

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
  const [activeTab, setActiveTab]       = useState('deskripsi'); // 'deskripsi' | 'ulasan'

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
    // Gunakan harga langsung jika ada (price > 0), atau kalkulasi dari multiplier
    if (d?.price && parseFloat(d.price) > 0) return parseFloat(d.price);
    if (d?.priceMultiplier && d.priceMultiplier !== 1) return getBasePrice() * d.priceMultiplier;
    return null;
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const base = getBasePrice();
    if (product.type === 'SMM') return (base / 1000) * quantity;
    // Gunakan harga durasi jika ada
    const durationPrice = getSelectedDurationPrice();
    if (durationPrice !== null) return durationPrice;
    return base;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
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
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--text-secondary)' }}>
      <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      <p style={{ marginTop: '16px', fontSize: '15px' }}>Memuat detail produk…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!product) return null;

  const isVpsRdp = product.category?.slug === 'vps-rdp';
  const badgeClass = product.type === 'SMM' ? 'badge-smm' : 'badge-premium';

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

        {/* ══════════════ KOLOM KIRI ══════════════ */}
        <div className="pd-left">

          {/* Info utama produk */}
          <div className="glass-card pd-info-card">
            <div className="pd-info-top">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`badge ${badgeClass}`}>{product.category.name}</span>
                {product.type === 'PREMIUM' && (
                  product.providerStatus === 'Gangguan' ? (
                    <span className="badge badge-danger" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                      🚫 Gangguan
                    </span>
                  ) : (
                    <span className="badge badge-success" style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                      🟢 Tersedia
                    </span>
                  )
                )}
              </div>
              {reviews.length > 0 && (
                <div className="pd-avg-rating">
                  <Star size={14} fill="currentColor" style={{ color: 'var(--color-warning)' }} />
                  <span>{averageRating.toFixed(1)}</span>
                  <span className="pd-review-count">({reviews.length} ulasan)</span>
                </div>
              )}
            </div>

            <h1 className="pd-title">{product.name}</h1>

            {/* Stats mini bar */}
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
                <Zap size={14} style={{ color: 'var(--color-primary)' }} />
                <span>Pengiriman Otomatis</span>
              </div>
              {isVpsRdp && (
                <>
                  <div className="pd-stat-divider" />
                  <div className="pd-stat-item">
                    <Infinity size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>Stok Unlimited</span>
                  </div>
                </>
              )}
              {product.type === 'PREMIUM' && !isVpsRdp && (
                <>
                  <div className="pd-stat-divider" />
                  <div className="pd-stat-item">
                    <Tag size={14} />
                    <span>
                      {product.providerServiceId 
                        ? 'Stok: Tersedia' 
                        : `Stok: ${product.stockCount}`
                      }
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Tab switcher */}
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
                <MessageSquare size={14} /> Ulasan ({reviews.length})
              </button>
            </div>

            {/* Tab: Deskripsi */}
            {activeTab === 'deskripsi' && (
              <div className="pd-description">
                {product.description
                  ? product.description.split('\n').map((line, i) => (
                      line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                    ))
                  : <p style={{ color: 'var(--text-muted)' }}>Tidak ada deskripsi.</p>
                }
              </div>
            )}

            {/* Tab: Ulasan */}
            {activeTab === 'ulasan' && (
              <div className="pd-reviews-section">

                {/* Rata-rata rating */}
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

                {/* Daftar ulasan */}
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>
                    Belum ada ulasan. Jadilah yang pertama!
                  </p>
                ) : (
                  <div className="pd-reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="pd-review-item">
                        <div className="pd-review-header">
                          <div className="pd-review-avatar">
                            {r.user.name.charAt(0).toUpperCase()}
                          </div>
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

                {/* Form tulis ulasan */}
                {user && (
                  <form onSubmit={handleReviewSubmit} className="pd-review-form">
                    <p className="pd-review-form-title">Tulis Ulasan Anda</p>

                    {/* Star picker */}
                    <div className="pd-star-picker">
                      {[1,2,3,4,5].map(i => (
                        <Star
                          key={i}
                          size={28}
                          fill={(hoveredRating || userRating) >= i ? 'currentColor' : 'none'}
                          style={{
                            color: (hoveredRating || userRating) >= i ? 'var(--color-warning)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'color 0.15s, transform 0.15s',
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

                    <textarea
                      className="form-input pd-review-textarea"
                      placeholder="Ceritakan pengalaman Anda menggunakan layanan ini…"
                      value={userReview}
                      onChange={e => setUserReview(e.target.value)}
                      rows={3}
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

        {/* ══════════════ KOLOM KANAN — CHECKOUT ══════════════ */}
        <div className="pd-right">
          <div className="glass-card pd-checkout-card">

            {orderSuccess ? (
              /* ── Sukses ── */
              <div className="pd-success">
                <div className="pd-success-icon">
                  <CheckCircle2 size={48} />
                </div>
                <h3>Pesanan Berhasil!</h3>
                <p>Pesanan Anda sedang diproses secara otomatis.</p>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary pd-checkout-btn">
                  Lihat Pesanan di Dashboard
                </button>
                <button
                  onClick={() => { setOrderSuccess(null); setOrderError(''); }}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  Pesan Lagi
                </button>
              </div>
            ) : (
              <>
                {/* ── Dynamic Price Block ── */}
                <div className="pd-price-block" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, rgba(0,242,254,0.06) 0%, rgba(225,48,108,0.06) 100%)', border: '1px solid rgba(0,242,254,0.15)', padding: '20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="pd-price-label" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', color: 'var(--text-muted)' }}>
                        {durationOptions.length > 0 ? `Harga — ${selectedDuration}` : 'Harga Layanan'}
                      </span>
                      <div className="pd-price-main" style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'var(--font-title)', background: 'linear-gradient(90deg, var(--color-primary), #e1306c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: '4px' }}>
                        Rp {calculateTotal().toLocaleString('id-ID')}
                        {product.type === 'SMM' && <span style={{ fontSize: '16px', fontWeight: '600', WebkitTextFillColor: 'var(--text-secondary)' }}> / 1k</span>}
                      </div>
                      {durationOptions.length > 0 && calculateTotal() !== getBasePrice() && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Harga dasar: Rp {getBasePrice().toLocaleString('id-ID')} <span style={{ color: 'var(--color-success)' }}>/ 7 hari</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {user?.role === 'RESELLER' && (
                        <span style={{ display: 'inline-block', background: 'rgba(225,48,108,0.15)', color: '#e1306c', border: '1px solid rgba(225,48,108,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: '700' }}>
                          🏷️ Harga Reseller
                        </span>
                      )}
                      {product.type === 'SMM' && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          Total: Rp {calculateTotal().toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleOrderSubmit} className="pd-form">

                  {/* SMM fields */}
                  {product.type === 'SMM' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">🔗 Link / URL Target</label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://instagram.com/username"
                          value={targetUrl}
                          onChange={e => setTargetUrl(e.target.value)}
                          required
                        />
                        <span className="pd-field-hint">Tempel link profil / postingan yang ingin di-boost</span>
                      </div>
                      <div className="form-group">
                        <label className="form-label">📦 Jumlah</label>
                        <input
                          type="number"
                          className="form-input"
                          min={product.minOrder}
                          max={product.maxOrder}
                          step={product.minOrder}
                          value={quantity}
                          onChange={e => setQuantity(e.target.value)}
                          required
                        />
                        <span className="pd-field-hint">
                          Min: {product.minOrder?.toLocaleString('id-ID')} — Max: {product.maxOrder?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}

                  {/* ── Durasi (Premium) ── */}
                  {product.type === 'PREMIUM' && durationOptions.length > 0 && (() => {
                    // Temukan harga tertinggi untuk kalkulasi savings
                    const prices = durationOptions.map(d => {
                      if (d.price && parseFloat(d.price) > 0) return parseFloat(d.price);
                      if (d.priceMultiplier && d.priceMultiplier !== 1) return getBasePrice() * d.priceMultiplier;
                      return getBasePrice();
                    });
                    const maxPrice = Math.max(...prices);
                    // Best value = harga per hari terendah
                    const bestValueIdx = durationOptions.reduce((bestIdx, d, i) => {
                      const p = prices[i];
                      const months = d.months || 1;
                      const perDay = p / (months * 30);
                      const bestP = prices[bestIdx];
                      const bestMonths = durationOptions[bestIdx].months || 1;
                      const bestPerDay = bestP / (bestMonths * 30);
                      return perDay < bestPerDay ? i : bestIdx;
                    }, 0);

                    return (
                      <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>⏱️ Pilih Durasi</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>Klik untuk memilih</span>
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                          {durationOptions.map((d, i) => {
                            const durPrice = prices[i];
                            const months = d.months || (i + 1) * 0.25;
                            const perDay = Math.ceil(durPrice / (months * 30));
                            const savingsPct = i > 0 ? Math.round((1 - durPrice / (prices[0] * (months * 4))) * 100) : 0;
                            const isActive = selectedDuration === d.label;
                            const isBest = i === bestValueIdx && durationOptions.length > 1;

                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedDuration(d.label)}
                                style={{
                                  position: 'relative',
                                  padding: '14px 12px',
                                  borderRadius: '14px',
                                  border: isActive ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                  background: isActive ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.02)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.25s ease',
                                  boxShadow: isActive ? '0 0 20px rgba(0,242,254,0.15)' : 'none',
                                }}
                              >
                                {isBest && (
                                  <span style={{
                                    position: 'absolute', top: '-9px', right: '10px',
                                    background: 'linear-gradient(90deg, var(--color-primary), #06b6d4)',
                                    color: '#070913', fontSize: '9px', fontWeight: '900',
                                    padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.5px',
                                  }}>
                                    ★ TERBAIK
                                  </span>
                                )}
                                <div style={{ fontSize: '14px', fontWeight: '800', color: isActive ? 'var(--color-primary)' : '#fff', marginBottom: '4px' }}>
                                  {d.label}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)' }}>
                                  Rp {durPrice.toLocaleString('id-ID')}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ≈ Rp {perDay.toLocaleString('id-ID')}/hari
                                </div>
                                {savingsPct > 0 && (
                                  <span style={{
                                    display: 'inline-block', marginTop: '4px',
                                    background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)',
                                    border: '1px solid rgba(34,197,94,0.2)',
                                    borderRadius: '20px', padding: '1px 6px', fontSize: '10px', fontWeight: '700',
                                  }}>
                                    HEMAT {savingsPct}%
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Target Input (Premium H2H Products) */}
                  {product.type === 'PREMIUM' && product.providerServiceId && (
                    <div className="form-group" style={{ marginTop: '15px' }}>
                      {(() => {
                        const nameLower = product.name.toLowerCase();
                        const isUpgrade = nameLower.includes('upgrade') || nameLower.includes('email pribadi') || nameLower.includes('invite');
                        const isOtpApp = nameLower.includes('hotstar') || nameLower.includes('otp');

                        if (isUpgrade) {
                          return (
                            <>
                              <label className="form-label">📧 Email Akun Anda (Untuk Upgrade/Invite)</label>
                              <input
                                type="email"
                                className="form-input"
                                placeholder="nama@gmail.com"
                                value={targetUrl}
                                onChange={e => setTargetUrl(e.target.value)}
                                required
                              />
                              <span className="pd-field-hint">Masukkan email yang ingin didaftarkan/di-upgrade ke Premium</span>
                            </>
                          );
                        } else if (isOtpApp) {
                          return (
                            <>
                              <label className="form-label">📱 Nomor HP Disney+ Hotstar (Untuk OTP)</label>
                              <input
                                type="tel"
                                className="form-input"
                                placeholder="081234567890"
                                value={targetUrl}
                                onChange={e => setTargetUrl(e.target.value)}
                                required
                              />
                              <span className="pd-field-hint">Nomor handphone aktif yang terdaftar di aplikasi Disney+ Hotstar</span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <label className="form-label">📞 Nomor WhatsApp Penerima</label>
                              <input
                                type="tel"
                                className="form-input"
                                placeholder="081234567890 (Opsional)"
                                value={targetUrl}
                                onChange={e => setTargetUrl(e.target.value)}
                              />
                              <span className="pd-field-hint">Nomor WhatsApp untuk menerima rincian kredensial/akun</span>
                            </>
                          );
                        }
                      })()}
                    </div>
                  )}

                  {/* OS Options (VPS/RDP) */}
                  {osOptions.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">🖥️ Pilih Sistem Operasi</label>
                      <select
                        className="form-input"
                        value={selectedOs}
                        onChange={e => setSelectedOs(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                      >
                        {osOptions.map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {/* ── Total Box ── */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                    {product.type === 'SMM' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        <span>Harga per 1k</span>
                        <span>Rp {getBasePrice().toLocaleString('id-ID')} × {(quantity / 1000).toFixed(1)}k</span>
                      </div>
                    )}
                    {product.type === 'PREMIUM' && durationOptions.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                        <span>Durasi dipilih</span>
                        <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{selectedDuration || '—'}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px' }}>Total Bayar</span>
                      <span style={{ fontWeight: '900', fontSize: '22px', fontFamily: 'var(--font-title)', color: 'var(--color-primary)' }}>
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {product.providerStatus === 'Gangguan' && (
                    <div className="pd-alert pd-alert-error" style={{ marginBottom: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: '12px', color: '#f87171' }}>
                      ⚠️ Layanan ini sedang gangguan/pemeliharaan. Pemesanan tidak dapat dilakukan untuk sementara waktu.
                    </div>
                  )}

                  {orderError && (
                    <div className="pd-alert pd-alert-error" style={{ marginBottom: '15px' }}>
                      ⚠️ {orderError}
                    </div>
                  )}

                  {!user ? (
                    <Link to="/login" className="btn btn-primary pd-checkout-btn">
                      <ShoppingCart size={16} /> Masuk untuk Memesan
                    </Link>
                  ) : (
                    <button type="submit" className="btn btn-primary pd-checkout-btn" disabled={submitting || product.providerStatus === 'Gangguan'} style={{ fontSize: '16px', padding: '16px', borderRadius: '16px', fontWeight: '800', opacity: product.providerStatus === 'Gangguan' ? 0.5 : 1, cursor: product.providerStatus === 'Gangguan' ? 'not-allowed' : 'pointer' }}>
                      {product.providerStatus === 'Gangguan' ? (
                        <>🔧 Layanan Sedang Gangguan</>
                      ) : submitting ? (
                        <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Memproses…</>
                      ) : (
                        <><ShoppingCart size={16} /> Beli Sekarang — Rp {calculateTotal().toLocaleString('id-ID')}</>
                      )}
                    </button>
                  )}

                  <p className="pd-checkout-note" style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px' }}>
                    <Clock size={12} /> Pesanan diproses otomatis dalam hitungan detik. <span style={{ color: 'var(--color-success)' }}>Garansi Penuh.</span>
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Back to catalog */}
          <button
            onClick={() => navigate(getCatalogPath())}
            className="btn btn-secondary pd-back-btn"
          >
            <ArrowLeft size={15} /> Kembali ke {getCatalogLabel()}
          </button>
        </div>

      </div>
    </div>
  );
}
