import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, TrendingUp, Heart, Play, Users,
  Star, ArrowRight, CheckCircle, Server, Sparkles,
  Instagram, Youtube, Globe, MessageCircle, Clock,
  Brain, GraduationCap, Cpu, Mail, Phone, ShoppingBag, BookOpen
} from 'lucide-react';

/* ─── Animated counter hook ─────────────────────── */
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(target / (duration / 16));
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(start);
      }, 16);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

/* ─── Data ───────────────────────────────────────── */
const HOT_DEALS = [
  { platform: 'TikTok',     service: 'Likes',           price: 'Rp 65',    unit: '/ 1k', color: '#ff0050', icon: 'tiktok', tag: 'TERLARIS' },
  { platform: 'TikTok',     service: 'Views',           price: 'Rp 10',    unit: '/ 1k', color: '#69C9D0', icon: 'tiktok', tag: 'TERMURAH' },
  { platform: 'Instagram',  service: 'Followers',       price: 'Rp 1.200', unit: '/ 1k', color: '#e1306c', icon: 'instagram', tag: 'TERPOPULER' },
  { platform: 'YouTube',    service: 'Views',           price: 'Rp 5.400', unit: '/ 1k', color: '#ff0000', icon: 'youtube', tag: 'BEST SELLER' },
  { platform: 'Spotify',    service: 'Plays',           price: 'Rp 500',   unit: '/ 1k', color: '#1db954', icon: 'spotify', tag: 'NEW' },
  { platform: 'Threads',    service: 'Followers',       price: 'Rp 900',   unit: '/ 1k', color: '#ffffff', icon: 'threads', tag: 'POPULER' },
];

const PREMIUM_BRANDS = [
  { name: 'Netflix',        discount: '75%', icon: 'netflix', color: '#e50914' },
  { name: 'Spotify',        discount: '70%', icon: 'spotify', color: '#1db954' },
  { name: 'ChatGPT Plus',   discount: '65%', icon: 'chatgpt', color: '#10a37f' },
  { name: 'Canva Pro',      discount: '80%', icon: 'canva', color: '#00c4cc' },
  { name: 'YouTube Premium',discount: '60%', icon: 'youtube', color: '#ff0000' },
  { name: 'Disney+',        discount: '72%', icon: 'disney', color: '#113ccf' },
  { name: 'Claude AI',      discount: '60%', icon: 'claude', color: '#cc785c' },
  { name: 'Duolingo',       discount: '55%', icon: 'duolingo', color: '#58cc02' },
];

// --- SVG Icons Helper Components ---
const TikTokIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YouTubeIcon = ({ size = 24, color = "#ff0000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={color} />
  </svg>
);

const SpotifyIcon = ({ size = 24, color = "#1db954" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 11.5c2.5-1.5 5.5-1.5 8 0" />
    <path d="M7 9c3.5-2 7.5-2 11 0" />
    <path d="M9 14c2-1 4-1 6 0" />
  </svg>
);

const ThreadsIcon = ({ size = 24, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 2a10 10 0 1 0 10 10c0-1.7-.5-3.3-1.4-4.6A6 6 0 0 0 15 6c-2.4 0-4 1.6-4 4s1.6 4 4 4a4.5 4.5 0 0 0 3-1.1" />
    <path d="M12 12a2 2 0 1 1-2-2" />
  </svg>
);

const ChatGPTIcon = ({ size = 24, color = "#10a37f" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4.5 16.5c-1.5-1.2-2.5-3-2.5-5s1-3.8 2.5-5" />
    <path d="M19.5 16.5c1.5-1.2 2.5-3 2.5-5s-1-3.8-2.5-5" />
    <path d="M12 2c3.5 0 6.5 2.5 7.5 6M4.5 8C5.5 4.5 8.5 2 12 2" />
    <path d="M12 22c-3.5 0-6.5-2.5-7.5-6M19.5 16c-1 3.5-4 6-7.5 6" />
    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
  </svg>
);

const NetflixIcon = ({ size = 24, color = "#e50914" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4 2v20h4V13.6L16 22h4V2h-4v8.4L8 2H4z" />
  </svg>
);

const CanvaIcon = ({ size = 24, color = "#00c4cc" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const DisneyIcon = ({ size = 24, color = "#113ccf" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12 3v18M3 12h18" />
    <path d="M5 5l14 14M5 19L19 5" />
  </svg>
);

const renderPlatformIcon = (iconName, color, size = 32) => {
  switch (iconName) {
    case 'tiktok': return <TikTokIcon size={size} color={color} />;
    case 'instagram': return <Instagram size={size} color={color} />;
    case 'youtube': return <YouTubeIcon size={size} color={color} />;
    case 'spotify': return <SpotifyIcon size={size} color={color} />;
    case 'threads': return <ThreadsIcon size={size} color={color} />;
    default: return null;
  }
};

const renderBrandIcon = (brandIconName, color, size = 20) => {
  switch (brandIconName) {
    case 'netflix': return <NetflixIcon size={size} color={color} />;
    case 'spotify': return <SpotifyIcon size={size} color={color} />;
    case 'chatgpt': return <ChatGPTIcon size={size} color={color} />;
    case 'canva': return <CanvaIcon size={size} color={color} />;
    case 'youtube': return <YouTubeIcon size={size} color={color} />;
    case 'disney': return <DisneyIcon size={size} color={color} />;
    case 'claude': return <Brain size={size} color={color} />;
    case 'duolingo': return <GraduationCap size={size} color={color} />;
    default: return null;
  }
};

const MARQUEE_ITEMS = [
  '🚀 Pengiriman Otomatis 24/7',
  '🔥 Harga Reseller Tersedia',
  '✅ Garansi Refill SMM',
  '💎 10.000+ Pelanggan Puas',
  '⚡ Proses < 60 Detik',
  '🛡️ Transaksi 100% Aman',
  '🎯 Layanan SMM Terlengkap',
  '🏆 Toko SMM No. 1',
];

const TESTIMONIALS = [
  { name: 'Rizal A.',   role: 'Content Creator',  text: 'Views TikTok naik 10x dalam seminggu! Prosesnya super cepat dan harga terjangkau banget.', rating: 5, avatar: 'R' },
  { name: 'Dewi S.',    role: 'Online Shop Owner', text: 'Sudah langganan 6 bulan. Netflix UHD dengan harga yang super murah, recommended!', rating: 5, avatar: 'D' },
  { name: 'Budi P.',    role: 'Reseller SMM',      text: 'Margin keuntungan tinggi, stok selalu ada, dan CS responsif. Partner terpercaya!', rating: 5, avatar: 'B' },
];

/* ─── Component ──────────────────────────────────── */
export default function Home({ user }) {
  const [ordersCount, ordersRef]     = useCounter(15847);
  const [usersCount, usersRef]       = useCounter(10293);
  const [servicesCount, servicesRef] = useCounter(500);

  return (
    <div className="home-page">

      {/* ══════════ ANNOUNCEMENT BAR ══════════ */}
      <div className="home-announcement">
        <div className="home-announcement-inner">
          {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
            <span key={i} className="home-marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ══════════ HERO ══════════ */}
      <section className="home-hero">
        {/* Decorative glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        <div className="container home-hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            🚀 Platform SMM &amp; Akun Premium No. 1 di Indonesia
          </div>

          <h1 className="hero-title">
            Boost Sosmed &amp; <br />
            <span className="text-gradient">Akun Premium</span><br />
            Harga Kilat!
          </h1>

          <p className="hero-subtitle">
            Followers, likes, views, dan akun Netflix · Spotify · ChatGPT
            dengan pengiriman otomatis dalam hitungan detik.
          </p>

          <div className="hero-ctas">
            <Link to="/catalog/smm" className="btn btn-primary hero-cta-primary">
              <Zap size={18} /> Mulai Boost Sekarang
            </Link>
            <Link to="/catalog/premium" className="btn btn-secondary hero-cta-secondary">
              Akun Premium <ArrowRight size={16} />
            </Link>
          </div>

          {/* Floating trust pills */}
          <div className="hero-trust-pills">
            <span className="hero-pill"><CheckCircle size={13} /> Tanpa Biaya Pendaftaran</span>
            <span className="hero-pill"><CheckCircle size={13} /> Garansi Uang Kembali</span>
            <span className="hero-pill"><CheckCircle size={13} /> Proses Otomatis 24/7</span>
          </div>
        </div>
      </section>

      {/* ══════════ LIVE STATS ══════════ */}
      <section className="home-stats-bar">
        <div className="container home-stats-inner">
          <div className="home-stat-item" ref={ordersRef}>
            <span className="home-stat-number">{ordersCount.toLocaleString('id-ID')}+</span>
            <span className="home-stat-label">Pesanan Selesai</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item" ref={usersRef}>
            <span className="home-stat-number">{usersCount.toLocaleString('id-ID')}+</span>
            <span className="home-stat-label">Pelanggan Aktif</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item" ref={servicesRef}>
            <span className="home-stat-number">{servicesCount}+</span>
            <span className="home-stat-label">Layanan Tersedia</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat-item">
            <span className="home-stat-number">99%</span>
            <span className="home-stat-label">Tingkat Kepuasan</span>
          </div>
        </div>
      </section>

      {/* ══════════ HOT DEALS ══════════ */}
      <section className="container home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-eyebrow">🔥 Promo Eksklusif</div>
            <h2 className="home-section-title">Penawaran Panas Hari Ini</h2>
            <p className="home-section-sub">Harga terbaik untuk boost media sosial Anda</p>
          </div>
          <Link to="/catalog/smm" className="home-see-all">
            Lihat Semua <ArrowRight size={15} />
          </Link>
        </div>

        <div className="hot-deals-grid">
          {HOT_DEALS.map((deal, i) => (
            <Link to="/catalog/smm" key={i} className="hot-deal-card">
              <div className="hot-deal-tag" style={{ background: deal.color + '22', color: deal.color, border: `1px solid ${deal.color}44` }}>
                {deal.tag}
              </div>
              <div className="hot-deal-emoji" style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                {renderPlatformIcon(deal.icon, deal.color, 32)}
              </div>
              <div className="hot-deal-platform" style={{ color: deal.color }}>{deal.platform}</div>
              <div className="hot-deal-service">{deal.service}</div>
              <div className="hot-deal-price">
                <span className="hot-deal-from">Mulai</span>
                <span className="hot-deal-amount">{deal.price}</span>
                <span className="hot-deal-unit">{deal.unit}</span>
              </div>
              <div className="hot-deal-cta">Pesan Sekarang →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════ PREMIUM BANNER ══════════ */}
      <section className="container home-section">
        <div className="premium-banner">
          {/* Background decorations */}
          <div className="premium-banner-glow-1" />
          <div className="premium-banner-glow-2" />

          <div className="premium-banner-left">
            <div className="home-section-eyebrow" style={{ color: '#a5f3fc' }}>💎 Akun Premium</div>
            <h2 className="premium-banner-title">
              Streaming &amp; AI Tools<br />
              <span style={{ background: 'linear-gradient(135deg, #a5f3fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Harga Gila-Gilaan!
              </span>
            </h2>
            <p className="premium-banner-desc">
              Netflix UHD, Spotify Family, ChatGPT Plus, Canva Pro — diskon hingga <strong style={{ color: '#fbbf24' }}>80%</strong> dari harga resmi. Pengiriman instan!
            </p>
            <div className="premium-banner-perks">
              {['Akun Private', 'Garansi Penuh', 'Support 24/7', 'Harga Reseller'].map((perk, i) => (
                <span key={i} className="premium-perk-badge"><CheckCircle size={12} /> {perk}</span>
              ))}
            </div>
            <Link to="/catalog/premium" className="btn btn-primary" style={{ width: 'fit-content', padding: '13px 28px', marginTop: '10px' }}>
              <Sparkles size={16} /> Eksplor Sekarang
            </Link>
          </div>

          <div className="premium-banner-brands">
            {PREMIUM_BRANDS.map((brand, i) => (
              <div key={i} className="premium-brand-chip">
                <span className="premium-brand-emoji" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {renderBrandIcon(brand.icon, brand.color, 20)}
                </span>
                <span className="premium-brand-name" style={{ marginLeft: '8px' }}>{brand.name}</span>
                <span className="premium-brand-disc" style={{ color: '#4ade80' }}>-{brand.discount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ VPS / RDP BANNER ══════════ */}
      <section className="container home-section">
        <div className="vps-banner">
          <div className="vps-banner-left">
            <div className="home-section-eyebrow" style={{ color: '#d8b4fe' }}>🖥️ Server &amp; Infrastruktur</div>
            <h2 className="vps-banner-title">
              VPS &amp; RDP<br />
              <span className="text-gradient">Performa Tinggi</span>
            </h2>
            <p className="vps-banner-desc">
              Virtual Private Server dan Remote Desktop siap pakai. Uptime 99.9%, lokasi server premium, dan harga yang sangat kompetitif.
            </p>
            <Link to="/catalog/vps-rdp" className="btn btn-secondary" style={{ width: 'fit-content', padding: '12px 26px', marginTop: '8px' }}>
              <Server size={16} /> Lihat Paket Server
            </Link>
          </div>
          <div className="vps-banner-specs">
            {[
              { icon: '⚡', label: 'NVMe SSD',       sub: 'I/O Tinggi' },
              { icon: '🌐', label: 'IP Dedicated',   sub: 'Full Kontrol' },
              { icon: '🔒', label: 'DDoS Protected',  sub: 'Ultra Aman' },
              { icon: '🕐', label: 'Uptime 99.9%',   sub: 'Selalu Online' },
            ].map((s, i) => (
              <div key={i} className="vps-spec-card">
                <span className="vps-spec-emoji">{s.icon}</span>
                <span className="vps-spec-label">{s.label}</span>
                <span className="vps-spec-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ AI ROUTER BANNER ══════════ */}
      <section className="container home-section">
        <div className="vps-banner" style={{ background: 'linear-gradient(135deg, rgba(7, 9, 19, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(79, 172, 254, 0.2)', position: 'relative', overflow: 'hidden' }}>
          {/* Radial cyan glows */}
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(79, 172, 254, 0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          <div className="vps-banner-left">
            <div className="home-section-eyebrow" style={{ color: '#00f2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} /> AI Router API
            </div>
            <h2 className="vps-banner-title">
              Satu Saldo untuk<br />
              <span style={{ background: 'linear-gradient(135deg, #00f2fe, #4facfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Semua Model AI</span>
            </h2>
            <p className="vps-banner-desc" style={{ color: 'var(--text-secondary)' }}>
              Akses OpenAI (GPT-4o), Anthropic (Claude 3.5), Gemini, dan puluhan model AI tercepat di dunia menggunakan satu API Key terintegrasi. Hemat biaya token hingga 50% dengan auto-routing otomatis!
            </p>
            <div className="premium-banner-perks" style={{ marginBottom: '20px' }}>
              {['1 API Key Terintegrasi', 'Tercepat & Hemat', 'Monitoring Real-time', 'Auto-routing Cerdas'].map((perk, i) => (
                <span key={i} className="premium-perk-badge" style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.1)', color: '#00f2fe' }}>
                  <CheckCircle size={12} /> {perk}
                </span>
              ))}
            </div>
            <Link to="/catalog/ai-router" className="btn btn-primary" style={{ width: 'fit-content', padding: '13px 28px', background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', border: 'none', color: '#070913', fontWeight: '700' }}>
              <Cpu size={16} /> Buat API Key AI
            </Link>
          </div>
          
          <div className="vps-banner-specs" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              { icon: '🤖', label: 'Multi-LLM Integration', sub: 'GPT-4o, Claude, Gemini' },
              { icon: '💳', label: '1 Saldo Wallet', sub: 'Tanpa ribet isi ulang banyak platform' },
              { icon: '⚡', label: 'Ultra Low Latency', sub: 'Pencarian routing otomatis tercepat' },
              { icon: '📊', label: 'Sistem Usage Analitik', sub: 'Pantau pemakaian token real-time' },
            ].map((s, i) => (
              <div key={i} className="vps-spec-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <span className="vps-spec-emoji">{s.icon}</span>
                <span className="vps-spec-label" style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginTop: '8px' }}>{s.label}</span>
                <span className="vps-spec-sub" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="container home-section">
        <div className="home-section-header" style={{ marginBottom: '32px' }}>
          <div>
            <div className="home-section-eyebrow">⭐ Ulasan Pelanggan</div>
            <h2 className="home-section-title">Dipercaya Ribuan Pembeli</h2>
          </div>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card glass-card">
              <div className="testimonial-stars">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} size={14} fill="currentColor" style={{ color: 'var(--color-warning)' }} />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="container home-section">
        <div className="home-section-header" style={{ marginBottom: '32px' }}>
          <div>
            <div className="home-section-eyebrow">💡 Kenapa Kami?</div>
            <h2 className="home-section-title">Platform Terpercaya &amp; Terlengkap</h2>
          </div>
        </div>
        <div className="features-grid">
          {[
            { icon: <Zap size={28} />,         title: 'Pengiriman Instan',    desc: 'Pesanan diproses otomatis begitu pembayaran dikonfirmasi. Tidak perlu menunggu operator.', color: '#00f2fe' },
            { icon: <ShieldCheck size={28} />,  title: 'Garansi Terjamin',    desc: 'Garansi refill untuk SMM dan garansi ganti akun untuk layanan premium. Tidak ada risiko.', color: '#10b981' },
            { icon: <TrendingUp size={28} />,   title: 'Program Reseller',     desc: 'Harga khusus reseller dengan margin menggiurkan. Daftar gratis dan mulai jualan hari ini!', color: '#7f00ff' },
            { icon: <Clock size={28} />,        title: 'Layanan 24/7',         desc: 'Sistem berjalan non-stop. Pesan kapan saja, dari mana saja, dan selesai dalam hitungan detik.', color: '#f59e0b' },
            { icon: <Globe size={28} />,        title: 'Ratusan Layanan',      desc: 'SMM untuk 10+ platform, 20+ akun premium, dan paket VPS/RDP tersedia lengkap di satu tempat.', color: '#4facfe' },
            { icon: <MessageCircle size={28} />,title: 'Live Chat Support',    desc: 'Tim support siap membantu melalui WhatsApp. Respon cepat dan solutif untuk setiap kendala.', color: '#25d366' },
          ].map((f, i) => (
            <div key={i} className="feature-card glass-card">
              <div className="feature-icon" style={{ background: f.color + '1a', color: f.color }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="container home-section">
        <div className="final-cta-banner">
          <div className="final-cta-glow" />
          <div className="home-section-eyebrow" style={{ color: '#a5f3fc', textAlign: 'center' }}>🎯 Mulai Sekarang</div>
          <h2 className="final-cta-title">Siap Viralkan Kontenmu?</h2>
          <p className="final-cta-sub">
            Bergabung dengan {(10293).toLocaleString('id-ID')}+ pengguna yang sudah merasakan manfaatnya.
          </p>
          <div className="final-cta-buttons">
            <Link to="/catalog/smm" className="btn btn-primary" style={{ padding: '15px 36px', fontSize: '16px' }}>
              <Zap size={18} /> Boost Sosmed Sekarang
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-secondary" style={{ padding: '15px 36px', fontSize: '16px' }}>
                Daftar Gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ 
        background: 'rgba(15, 23, 42, 0.95)', 
        borderTop: '1px solid var(--border-color)', 
        padding: '60px 0 30px 0', 
        marginTop: '80px',
        color: 'var(--text-secondary)'
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr', gap: '40px', marginBottom: '50px' }}>
          {/* Col 1: Logo & Info */}
          <div>
            <Link to="/" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              fontSize: '22px', 
              fontWeight: '800', 
              color: '#fff', 
              textDecoration: 'none', 
              marginBottom: '15px' 
            }}>
              <ShoppingBag size={22} style={{ color: 'var(--color-primary)' }} />
              Markaz-Arshy
            </Link>
            <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px', maxWidth: '320px' }}>
              Penyedia layanan booster media sosial (SMM) terlengkap dan penjualan akun premium streaming, VPS, RDP, serta AI Router API Key tercepat dan otomatis 24/7 di Indonesia.
            </p>
            <div style={{ display: 'flex', gap: '15px' }}>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Instagram size={20} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Youtube size={20} />
              </a>
              <a href="https://wa.me/6285175450863" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Col 2: Layanan */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Layanan</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><Link to="/catalog/smm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Sosial Media Boost</Link></li>
              <li><Link to="/catalog/premium" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Akun Premium</Link></li>
              <li><Link to="/catalog/vps-rdp" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>VPS &amp; RDP Server</Link></li>
              <li><Link to="/catalog/ai-router" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>AI Router API Key</Link></li>
            </ul>
          </div>

          {/* Col 3: Bantuan */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dokumen &amp; Bantuan</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><Link to="/docs/ai" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}><BookOpen size={12} /> Panduan AI</Link></li>
              <li><a href="https://wa.me/6285175450863" target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Hubungi Customer Service</a></li>
              <li><Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Syarat &amp; Ketentuan</Link></li>
              <li><Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>Kebijakan Privasi</Link></li>
            </ul>
          </div>

          {/* Col 4: Hubungi Kami */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Hubungi Kami</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={15} style={{ color: 'var(--color-primary)' }} />
                <span>support@markaz-arshy.com</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={15} style={{ color: 'var(--color-primary)' }} />
                <span>+62 851-7545-0863</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                <Clock size={15} style={{ color: 'var(--color-primary)', marginTop: '2px' }} />
                <span>Jam Layanan:<br />Setiap Hari (24 Jam Non-stop)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer bar */}
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.05)', 
          paddingTop: '25px', 
          fontSize: '12px', 
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '10px' }}>© 2026 Markaz-Arshy. All rights reserved. Semua transaksi dilindungi enkripsi SSL aman.</p>
          <p style={{ fontSize: '10px', opacity: 0.6 }}>Disclaimer: Seluruh pembelian followers &amp; akun premium diproses secara otomatis via sistem backend terintegrasi.</p>
        </div>
      </footer>
    </div>
  );
}
