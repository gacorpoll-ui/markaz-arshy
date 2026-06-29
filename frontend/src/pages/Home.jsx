import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, TrendingUp, Users, Star, ArrowRight, CheckCircle,
  Server, Cpu, Globe, MessageCircle, Clock,
  ShoppingBag, Mail, Phone, BookOpen
} from 'lucide-react';

/* ─── Animated counter hook ─────────────── */
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

/* ─── Data ───────────────────────────────── */
const HOT_DEALS = [
  { platform: 'TikTok',     service: 'Likes',       price: 'Rp 65',    unit: '/ 1k', color: '#ff0050', icon: 'tiktok', tag: 'TERLARIS' },
  { platform: 'TikTok',     service: 'Views',       price: 'Rp 10',    unit: '/ 1k', color: '#69C9D0', icon: 'tiktok', tag: 'TERMURAH' },
  { platform: 'Instagram',  service: 'Followers',   price: 'Rp 1.200', unit: '/ 1k', color: '#e1306c', icon: 'instagram', tag: 'TERPOPULER' },
  { platform: 'YouTube',    service: 'Views',       price: 'Rp 5.400', unit: '/ 1k', color: '#ff0000', icon: 'youtube', tag: 'BEST SELLER' },
  { platform: 'Spotify',    service: 'Plays',       price: 'Rp 500',   unit: '/ 1k', color: '#1db954', icon: 'spotify', tag: 'NEW' },
  { platform: 'Threads',    service: 'Followers',   price: 'Rp 900',   unit: '/ 1k', color: '#111827', icon: 'threads', tag: 'POPULER' },
];

const PREMIUM_BRANDS = [
  { name: 'Netflix',         discount: '75%', color: '#e50914', icon: 'N' },
  { name: 'Spotify',         discount: '70%', color: '#1db954', icon: 'S' },
  { name: 'ChatGPT Plus',    discount: '65%', color: '#10a37f', icon: 'C' },
  { name: 'Canva Pro',       discount: '80%', color: '#00c4cc', icon: 'C' },
  { name: 'YouTube Premium', discount: '60%', color: '#ff0000', icon: 'Y' },
  { name: 'Disney+',         discount: '72%', color: '#113ccf', icon: 'D' },
  { name: 'Claude AI',       discount: '60%', color: '#cc785c', icon: 'C' },
  { name: 'Duolingo',        discount: '55%', color: '#58cc02', icon: 'D' },
];

const MARQUEE_ITEMS = [
  'Pengiriman Otomatis 24/7',
  'Harga Reseller Tersedia',
  'Garansi Refill SMM',
  '10.000+ Pelanggan Puas',
  'Proses < 60 Detik',
  'Transaksi 100% Aman',
  'Layanan SMM Terlengkap',
  'Toko SMM No. 1',
];

const TESTIMONIALS = [
  { name: 'Rizal A.',   role: 'Content Creator',   text: 'Views TikTok naik 10x dalam seminggu! Prosesnya super cepat dan harga terjangkau banget.', rating: 5, avatar: 'R' },
  { name: 'Dewi S.',    role: 'Online Shop Owner',  text: 'Sudah langganan 6 bulan. Netflix UHD dengan harga yang super murah, recommended!', rating: 5, avatar: 'D' },
  { name: 'Budi P.',    role: 'Reseller SMM',       text: 'Margin keuntungan tinggi, stok selalu ada, dan CS responsif. Partner terpercaya!', rating: 5, avatar: 'B' },
];

const FEATURES = [
  { icon: <Zap size={24} />,         title: 'Pengiriman Instan',    desc: 'Pesanan diproses otomatis begitu pembayaran dikonfirmasi.', color: '#3B82F6' },
  { icon: <ShieldCheck size={24} />,  title: 'Garansi Terjamin',    desc: 'Garansi refill untuk SMM dan garansi ganti akun untuk premium.', color: '#10B981' },
  { icon: <TrendingUp size={24} />,   title: 'Program Reseller',     desc: 'Harga khusus reseller dengan margin menggiurkan.', color: '#8B5CF6' },
  { icon: <Clock size={24} />,        title: 'Layanan 24/7',         desc: 'Sistem berjalan non-stop. Pesan kapan saja.', color: '#F59E0B' },
  { icon: <Globe size={24} />,        title: 'Ratusan Layanan',      desc: 'SMM untuk 10+ platform, 20+ akun premium, VPS/RDP.', color: '#06B6D4' },
  { icon: <MessageCircle size={24} />,title: 'Live Chat Support',    desc: 'Tim support siap membantu via WhatsApp.', color: '#10B981' },
];

const VPS_SPECS = [
  { icon: '⚡', label: 'NVMe SSD',       sub: 'I/O Tinggi' },
  { icon: '🌐', label: 'IP Dedicated',   sub: 'Full Kontrol' },
  { icon: '🔒', label: 'DDoS Protected', sub: 'Ultra Aman' },
  { icon: '🕐', label: 'Uptime 99.9%',   sub: 'Selalu Online' },
];

const AI_SPECS = [
  { icon: '🤖', label: 'Multi-LLM',      sub: 'GPT-4o, Claude, Gemini' },
  { icon: '💳', label: '1 Saldo Wallet',  sub: 'Tanpa ribet isi ulang' },
  { icon: '⚡', label: 'Ultra Low Latency', sub: 'Routing otomatis' },
  { icon: '📊', label: 'Usage Analitik',  sub: 'Pantau token real-time' },
];

/* ─── Platform icon (inline SVGs) ─────── */
const PlatformIcon = ({ icon, size = 24, color = 'currentColor' }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (icon) {
    case 'tiktok': return <svg {...p}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
    case 'instagram': return <svg {...p}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none"/></svg>;
    case 'youtube': return <svg {...p}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98" fill={color}/></svg>;
    case 'spotify': return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M8 11.5c2.5-1.5 5.5-1.5 8 0"/><path d="M7 9c3.5-2 7.5-2 11 0"/><path d="M9 14c2-1 4-1 6 0"/></svg>;
    case 'threads': return <svg {...p}><path d="M12 2a10 10 0 1 0 10 10c0-1.7-.5-3.3-1.4-4.6A6 6 0 0 0 15 6c-2.4 0-4 1.6-4 4s1.6 4 4 4a4.5 4.5 0 0 0 3-1.1"/><circle cx="12" cy="12" r="2"/></svg>;
    default: return null;
  }
};

/* ══════════════════════════════════════════ */
export default function Home({ user }) {
  const [ordersCount, ordersRef]     = useCounter(15847);
  const [usersCount, usersRef]       = useCounter(10293);
  const [servicesCount, servicesRef] = useCounter(500);

  return (
    <div className="home-page">

      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="home-announcement">
        <div className="home-announcement-inner">
          {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, i) => (
            <span key={i} className="home-marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="home-hero">
        <div className="container home-hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Layanan Digital Terpercaya No. 1 di Indonesia
          </div>

          <h1 className="hero-title">
            Satu Platform untuk<br />
            <span className="hero-title-gradient">Kebutuhan Digitalmu</span>
          </h1>

          <p className="hero-subtitle">
            SMM, akun premium, VPS, dan API AI — semuanya dalam satu tempat.
            Pengiriman instan, harga kompetitif, dan dukungan 24/7.
          </p>

          <div className="hero-ctas">
            <Link to="/marketplace" className="btn btn-primary hero-cta-primary">
              <Zap size={18} /> Belanja Sekarang
            </Link>
            <Link to="/catalog/smm" className="btn btn-secondary hero-cta-secondary">
              Layanan SMM <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hero-trust-pills">
            <span className="hero-pill"><CheckCircle size={13} /> Gratis Daftar</span>
            <span className="hero-pill"><CheckCircle size={13} /> Garansi Uang Kembali</span>
            <span className="hero-pill"><CheckCircle size={13} /> Proses Instan 24/7</span>
            <span className="hero-pill"><CheckCircle size={13} /> Dukungan WhatsApp</span>
          </div>
        </div>
      </section>

      {/* ═══ LIVE STATS ═══ */}
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

      {/* ═══ MALL PROMO — Barang Fisik ═══ */}
      <section className="container" style={{ marginTop: '32px', marginBottom: '48px' }}>
        <div className="mall-hero-banner">
          <div className="mall-hero-content">
            <div className="mall-hero-tag">BARANG FISIK — IMPORTIR NO. 1</div>
            <h2 className="mall-hero-title">
              Importir Terpercaya<br />
              <span style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6, #fb923c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tanpa Modal Stok</span>
            </h2>
            <p className="mall-hero-desc">
              Ratusan produk siap jual dengan margin 15–40%. Kami yang urus stok, pengiriman, dan garansi. Kamu tinggal fokus jualan!
            </p>
            <div className="mall-hero-stats">
              <div className="mall-hero-stat">
                <span className="mall-hero-stat-num">240+</span>
                <span className="mall-hero-stat-label">Produk Tersedia</span>
              </div>
              <div className="mall-hero-stat">
                <span className="mall-hero-stat-num">15–40%</span>
                <span className="mall-hero-stat-label">Margin Keuntungan</span>
              </div>
              <div className="mall-hero-stat">
                <span className="mall-hero-stat-num">100%</span>
                <span className="mall-hero-stat-label">Garansi Produk</span>
              </div>
            </div>
            <div className="mall-hero-pills">
              {[
                { key:'perlengkapan-dapur', label:'Dapur', img:'/images/promo/perlengkapan-dapur.png', bg:'rgba(239,68,68,0.12)' },
                { key:'lampu-rumah', label:'Elektronik', img:'/images/promo/lampu-rumah.png', bg:'rgba(234,179,8,0.12)' },
                { key:'alat-kesehatan', label:'Kesehatan', img:'/images/promo/alat-kesehatan.png', bg:'rgba(34,197,94,0.12)' },
                { key:'perlengkapan-olahraga', label:'Olahraga', img:'/images/promo/perlengkapan-olahraga.png', bg:'rgba(59,130,246,0.12)' },
                { key:'perlengkapan-kopi', label:'Kopi', img:'/images/promo/perlengkapan-kopi.png', bg:'rgba(168,85,247,0.12)' },
                { key:'perkakas', label:'Perkakas', img:'/images/promo/perkakas.png', bg:'rgba(99,102,241,0.12)' },
              ].map(({ key, label, img, bg }) => (
                <Link key={key} to="/marketplace" className="mall-hero-pill" style={{ background: bg }}>
                  <img src={img} alt={label} className="mall-hero-pill-img" /> {label}
                </Link>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/marketplace" className="btn btn-primary btn-lg" style={{ padding: '14px 36px', fontSize: '15px', fontWeight: '800', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #db2777)', border: 'none', color: '#fff' }}>
                <ShoppingBag size={18} /> Jelajahi Koleksi
              </Link>
              <Link to="/register" className="btn btn-lg" style={{ padding: '14px 36px', fontSize: '15px', fontWeight: '700', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
                Hubungi Kami
              </Link>
            </div>
          </div>
          <div className="mall-hero-visual">
            <div className="mall-hero-visual-grid" />
            <div className="mall-hero-overlay" />
            {/* Floating product showcase */}
            <div className="mall-hero-products">
              {[
                { img:'/images/promo/perlengkapan-dapur.png', name:'Peralatan Dapur', price:'Mulai Rp 15rb', discount:'-30%' },
                { img:'/images/promo/perlengkapan-kopi.png', name:'Set Kopi', price:'Mulai Rp 45rb', discount:'-25%' },
                { img:'/images/promo/perkakas.png', name:'Tool Kit', price:'Mulai Rp 89rb', discount:'-40%' },
                { img:'/images/promo/lampu-rumah.png', name:'Lampu LED', price:'Mulai Rp 25rb', discount:'-20%' },
              ].map((p, i) => (
                <Link key={i} to="/marketplace" className="mall-hero-product-card" style={{ textDecoration: 'none' }}>
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <img src={p.img} alt={p.name} style={{ width: '100%', height: 80, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.06)', padding: 6 }} loading="lazy" />
                    <span style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>{p.discount}</span>
                  </div>
                  <div className="name">{p.name}</div>
                  <div className="price">{p.price}</div>
                </Link>
              ))}
            </div>
            <div className="mall-hero-badge top-left">
              <img src="/images/promo/perlengkapan-dapur.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span>Gudang Kebon Jeruk</span>
            </div>
            <div className="mall-hero-badge bottom-right">
              <img src="/images/promo/perlengkapan-olahraga.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              <span>Kirim Se-Indonesia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOT DEALS ═══ */}
      <section className="container home-section">
        <div className="home-section-header">
          <div>
            <div className="home-section-eyebrow">Promo Eksklusif</div>
            <h2 className="home-section-title">Penawaran Panas Hari Ini</h2>
            <p className="home-section-sub">Harga terbaik untuk boost media sosial Anda</p>
          </div>
          <Link to="/catalog/smm" className="home-see-all">Lihat Semua <ArrowRight size={14} /></Link>
        </div>
        <div className="hot-deals-grid">
          {HOT_DEALS.map((deal, i) => (
            <Link to="/catalog/smm" key={i} className="hot-deal-card">
              <div className="hot-deal-tag" style={{ background: deal.color + '12', color: deal.color, border: `1px solid ${deal.color}22` }}>{deal.tag}</div>
              <div className="hot-deal-icon"><PlatformIcon icon={deal.icon} size={28} color={deal.color} /></div>
              <div className="hot-deal-platform" style={{ color: deal.color }}>{deal.platform}</div>
              <div className="hot-deal-service">{deal.service}</div>
              <div className="hot-deal-price">
                <span className="hot-deal-from">Mulai</span>
                <span className="hot-deal-amount">{deal.price}</span>
                <span className="hot-deal-unit">{deal.unit}</span>
              </div>
              <div className="hot-deal-cta">Pesan Sekarang &rarr;</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ PREMIUM BANNER ═══ */}
      <section className="container home-section">
        <div className="brand-banner">
          <div className="premium-banner-glow" />
          <div className="brand-banner-left">
            <div className="home-section-eyebrow">Akun Premium</div>
            <h2 className="brand-banner-title">
              Streaming & AI Tools<br />
              <span style={{ color: '#3B82F6' }}>Harga Gila-Gilaan!</span>
            </h2>
            <p className="brand-banner-desc">
              Netflix UHD, Spotify Family, ChatGPT Plus, Canva Pro &mdash; diskon hingga <strong style={{ color: '#10B981' }}>80%</strong> dari harga resmi. Pengiriman instan!
            </p>
            <div className="brand-banner-perks">
              <span className="brand-perk-badge"><CheckCircle size={12} /> Akun Private</span>
              <span className="brand-perk-badge"><CheckCircle size={12} /> Garansi Penuh</span>
              <span className="brand-perk-badge"><CheckCircle size={12} /> Support 24/7</span>
              <span className="brand-perk-badge"><CheckCircle size={12} /> Harga Reseller</span>
            </div>
            <Link to="/catalog/premium" className="btn btn-primary btn-lg" style={{ width: 'fit-content', marginTop: '8px' }}>
              Eksplor Sekarang
            </Link>
          </div>
          <div className="brand-chip-grid">
            {PREMIUM_BRANDS.map((brand, i) => (
              <div key={i} className="brand-chip">
                <span className="brand-chip-icon" style={{ background: brand.color + '15', color: brand.color }}>{brand.icon}</span>
                <span className="brand-chip-name">{brand.name}</span>
                <span className="brand-chip-discount">-{brand.discount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VPS / RDP BANNER ═══ */}
      <section className="container home-section">
        <div className="brand-banner">
          <div className="brand-banner-left">
            <div className="home-section-eyebrow">Server & Infrastruktur</div>
            <h2 className="brand-banner-title">
              VPS & RDP<br />
              <span style={{ color: '#3B82F6' }}>Performa Tinggi</span>
            </h2>
            <p className="brand-banner-desc">
              Virtual Private Server dan Remote Desktop siap pakai. Uptime 99.9%, lokasi server premium, dan harga kompetitif.
            </p>
            <Link to="/catalog/vps-rdp" className="btn btn-secondary btn-lg" style={{ width: 'fit-content', marginTop: '4px' }}>
              <Server size={16} /> Lihat Paket Server
            </Link>
          </div>
          <div className="spec-grid spec-grid-4col">
            {VPS_SPECS.map((s, i) => (
              <div key={i} className="spec-card">
                <span className="spec-icon">{s.icon}</span>
                <span className="spec-label">{s.label}</span>
                <span className="spec-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI ROUTER BANNER ═══ */}
      <section className="container home-section">
        <div className="brand-banner ai-banner-stripe">
          <div className="brand-banner-left">
            <div className="home-section-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} /> AI Router API
            </div>
            <h2 className="brand-banner-title">
              Satu Saldo untuk<br />
              <span style={{ color: '#3B82F6' }}>Semua Model AI</span>
            </h2>
            <p className="brand-banner-desc">
              Akses OpenAI (GPT-4o), Anthropic (Claude), Gemini, dan puluhan model AI menggunakan satu API Key terintegrasi. Hemat biaya token hingga 50%!
            </p>
            <div className="brand-banner-perks" style={{ marginBottom: '16px' }}>
              <span className="brand-perk-badge" style={{ background: '#EFF6FF', borderColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}><CheckCircle size={12} /> 1 API Key</span>
              <span className="brand-perk-badge" style={{ background: '#EFF6FF', borderColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}><CheckCircle size={12} /> Tercepat & Hemat</span>
              <span className="brand-perk-badge" style={{ background: '#EFF6FF', borderColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}><CheckCircle size={12} /> Monitoring Real-time</span>
              <span className="brand-perk-badge" style={{ background: '#EFF6FF', borderColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}><CheckCircle size={12} /> Auto-routing Cerdas</span>
            </div>
            <Link to="/catalog/ai-router" className="btn btn-primary btn-lg" style={{ width: 'fit-content' }}>
              <Cpu size={16} /> Buat API Key AI
            </Link>
          </div>
          <div className="spec-grid spec-grid-2col">
            {AI_SPECS.map((s, i) => (
              <div key={i} className="spec-card">
                <span className="spec-icon">{s.icon}</span>
                <span className="spec-label">{s.label}</span>
                <span className="spec-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUK PILIHAN ═══ */}
      <section className="container" style={{ marginBottom: '48px' }}>
        <div className="home-section-header">
          <div>
            <div className="home-section-eyebrow">Koleksi Spesial</div>
            <h2 className="home-section-title">Produk Pilihan Bulan Ini</h2>
            <p className="home-section-sub">Harga importir langsung dari gudang Kebon Jeruk</p>
          </div>
          <Link to="/marketplace" className="home-see-all">Lihat Semua <ArrowRight size={14} /></Link>
        </div>
        <div className="promo-cards-grid">
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#fef2f2' }}>
              <img src="https://static.jakmall.id/2026/05/images/products/0f1eed/original/crownful-cetakan-waffle-maker-electric-mini-non-stick-coating-350w-wf-10.jpg" alt="" loading="lazy" />
              <span className="promo-card-discount">-32%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Cetakan Makanan</span>
              <h3 className="promo-card-title">Cetakan Waffle Maker Electric Mini</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp91.400</span>
                <span className="promo-card-price-old">Rp135.000</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#fefce8' }}>
              <img src="https://static.jakmall.id/2026/06/images/products/27c45d/original/one-two-cups-penggiling-kopi-manual-coffee-grinder-burr-stainless-jn60.png" alt="" loading="lazy" />
              <span className="promo-card-discount">-25%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Penggiling Kopi</span>
              <h3 className="promo-card-title">Coffee Grinder Manual Stainless</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp278.950</span>
                <span className="promo-card-price-old">Rp370.000</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#ecfdf5' }}>
              <img src="https://static.jakmall.id/2026/06/images/products/7d3b52/original/eviciv-tas-laptop-sleeve-case-bag-waterproof-for-macbook-13-inch-zk-20.png" alt="" loading="lazy" />
              <span className="promo-card-discount">-18%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Tas Laptop</span>
              <h3 className="promo-card-title">Tas Laptop Waterproof 13 Inch</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp65.220</span>
                <span className="promo-card-price-old">Rp79.000</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#eff6ff' }}>
              <img src="https://static.jakmall.id/2024/06/images/products/8e6987/original/burson-gelas-ukur-plastik-dapur-laboratorium-measuring-cup-b4.png" alt="" loading="lazy" />
              <span className="promo-card-discount">-15%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Gelas Ukur</span>
              <h3 className="promo-card-title">Gelas Ukur Plastik Dapur 100ml</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp7.790</span>
                <span className="promo-card-price-old">Rp9.200</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#fdf4ff' }}>
              <img src="https://static.jakmall.id/2023/12/images/products/a67d1a/original/soledi-sticker-dekorasi-dinding-reflection-mirror-pvc-50x100cm-sl02.png" alt="" loading="lazy" />
              <span className="promo-card-discount">-22%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Dekorasi Dinding</span>
              <h3 className="promo-card-title">Stiker Dekorasi Mirror PVC</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp28.590</span>
                <span className="promo-card-price-old">Rp36.500</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
          <Link to="/marketplace" className="promo-card">
            <div className="promo-card-img" style={{ background: '#f0fdf4' }}>
              <img src="https://static.jakmall.id/2025/12/images/products/8e81c6/original/one-two-cups-kantong-filter-saringan-teh-tea-bag-disposable-100-pcs-m100.png" alt="" loading="lazy" />
              <span className="promo-card-discount">-20%</span>
            </div>
            <div className="promo-card-body">
              <span className="promo-card-cat">Penyaring Teh</span>
              <h3 className="promo-card-title">Kantong Teh Filter 100 Pcs</h3>
              <div className="promo-card-price">
                <span className="promo-card-price-current">Rp11.100</span>
                <span className="promo-card-price-old">Rp13.800</span>
              </div>
              <span className="promo-card-link">Lihat Detail →</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="container home-section">
        <div className="home-section-header" style={{ marginBottom: '28px' }}>
          <div>
            <div className="home-section-eyebrow">Ulasan Pelanggan</div>
            <h2 className="home-section-title">Dipercaya Ribuan Pembeli</h2>
          </div>
        </div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
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

      {/* ═══ FEATURES ═══ */}
      <section className="container home-section">
        <div className="home-section-header" style={{ marginBottom: '28px' }}>
          <div>
            <div className="home-section-eyebrow">Kenapa Kami?</div>
            <h2 className="home-section-title">Platform Terpercaya & Terlengkap</h2>
          </div>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon" style={{ background: f.color + '10', color: f.color }}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="container home-section">
        <div className="final-cta-banner">
          <div className="final-cta-glow" />
          <div className="final-cta-eyebrow home-section-eyebrow">Mulai Sekarang</div>
          <h2 className="final-cta-title">Siap Viralkan Kontenmu?</h2>
          <p className="final-cta-sub">
            Bergabung dengan {usersCount.toLocaleString('id-ID')}+ pengguna aktif dari seluruh Indonesia.
          </p>
          <div className="final-cta-buttons">
            <Link to="/catalog/smm" className="btn btn-primary btn-xl">
              <Zap size={18} /> Boost Sosmed Sekarang
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-secondary btn-xl">
                Daftar Gratis
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <Link to="/" className="footer-brand-name">
                <ShoppingBag size={20} style={{ color: '#3B82F6' }} />
                Markaz-Arshy
              </Link>
              <p className="footer-brand-desc">
                Platform digital terpercaya untuk kebutuhan SMM, akun premium, VPS/RDP, dan AI Router API Key di Indonesia.
              </p>
              <div className="footer-social">
                <a href="https://instagram.com" target="_blank" rel="noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/></svg></a>
                <a href="https://wa.me/6285175450863" target="_blank" rel="noreferrer"><MessageCircle size={18} /></a>
              </div>
            </div>
            <div>
              <h4 className="footer-heading">Layanan</h4>
              <ul className="footer-links">
                <li><Link to="/catalog/smm">Sosial Media Boost</Link></li>
                <li><Link to="/catalog/premium">Akun Premium</Link></li>
                <li><Link to="/catalog/vps-rdp">VPS &amp; RDP Server</Link></li>
                <li><Link to="/catalog/ai-router">AI Router API Key</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Dokumen</h4>
              <ul className="footer-links">
                <li><a href="https://wa.me/6285175450863" target="_blank" rel="noreferrer">Customer Service</a></li>
                <li><Link to="/">Syarat &amp; Ketentuan</Link></li>
                <li><Link to="/">Kebijakan Privasi</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">Hubungi Kami</h4>
              <div className="footer-contact-item">
                <Mail size={15} />
                <span>support@markaz-arshy.com</span>
              </div>
              <div className="footer-contact-item">
                <Phone size={15} />
                <span>+62 851-7545-0863</span>
              </div>
              <div className="footer-contact-item">
                <Clock size={15} />
                <span>Setiap Hari (24 Jam Non-stop)</span>
              </div>
            </div>
          </div>
          {/* Metode Pembayaran & Pengiriman */}
          <div className="footer-partner">
            <div className="footer-partner-section">
              <div className="footer-partner-title">Metode Pembayaran</div>
              <div className="footer-partner-imgs">
                {['bca','mandiri','bni','bri','cimb','qris','klikbca','visa','mastercard','jcb','ovo','indomaret'].map(b => (
                  <div key={b} className="footer-partner-img">
                    <img src={`/images/partners/${b}.png`} alt={b.toUpperCase()} className="img-fit" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
            <div className="footer-partner-section">
              <div className="footer-partner-title">Metode Pengiriman</div>
              <div className="footer-partner-imgs">
                {[
                  { file: 'jne', label: 'JNE' },
                  { file: 'sicepat', label: 'SiCepat' },
                  { file: 'go-send', label: 'Go-Send' },
                  { file: 'jt', label: 'J&T' },
                  { file: 'grab-express', label: 'Grab Express' },
                ].map(({ file, label }) => (
                  <div key={file} className="footer-partner-img">
                    <img src={`/images/partners/${file}.png`} alt={label} className="img-fit" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Markaz-Arshy. All rights reserved.</p>
            <p style={{ fontSize: '11px', opacity: 0.7 }}>Seluruh transaksi dilindungi enkripsi SSL aman.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
