import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, Zap, TrendingUp, Users, Star, ArrowRight, CheckCircle,
  Server, Cpu, Brain, GraduationCap, Globe, MessageCircle, Clock,
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

/* ─── Platform icon (inline SVGs) ─────── */
const PlatformIcon = ({ icon, size = 24, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (icon) {
    case 'tiktok': return <svg {...props}><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>;
    case 'instagram': return <svg {...props}><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill={color} stroke="none"/></svg>;
    case 'youtube': return <svg {...props}><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98" fill={color}/></svg>;
    case 'spotify': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M8 11.5c2.5-1.5 5.5-1.5 8 0"/><path d="M7 9c3.5-2 7.5-2 11 0"/><path d="M9 14c2-1 4-1 6 0"/></svg>;
    case 'threads': return <svg {...props}><path d="M12 2a10 10 0 1 0 10 10c0-1.7-.5-3.3-1.4-4.6A6 6 0 0 0 15 6c-2.4 0-4 1.6-4 4s1.6 4 4 4a4.5 4.5 0 0 0 3-1.1"/><circle cx="12" cy="12" r="2"/></svg>;
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
            Platform SMM &amp; Akun Premium No. 1 di Indonesia
          </div>

          <h1 className="hero-title">
            Boost Sosmed &amp; <br />
            <span style={{ color: '#3B82F6' }}>Akun Premium</span><br />
            Harga Kilat!
          </h1>

          <p className="hero-subtitle">
            Followers, likes, views, dan akun Netflix, Spotify, ChatGPT
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

          <div className="hero-trust-pills">
            <span className="hero-pill"><CheckCircle size={13} /> Tanpa Biaya Pendaftaran</span>
            <span className="hero-pill"><CheckCircle size={13} /> Garansi Uang Kembali</span>
            <span className="hero-pill"><CheckCircle size={13} /> Proses Otomatis 24/7</span>
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
              <div style={{ height: '32px', display: 'flex', alignItems: 'center' }}>
                <PlatformIcon icon={deal.icon} size={28} color={deal.color} />
              </div>
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
        <div className="premium-banner">
          <div className="premium-banner-left">
            <div className="home-section-eyebrow">Akun Premium</div>
            <h2 className="premium-banner-title">
              Streaming &amp; AI Tools<br />
              <span style={{ color: '#3B82F6' }}>Harga Gila-Gilaan!</span>
            </h2>
            <p className="premium-banner-desc">
              Netflix UHD, Spotify Family, ChatGPT Plus, Canva Pro &mdash; diskon hingga <strong style={{ color: '#10B981' }}>80%</strong> dari harga resmi. Pengiriman instan!
            </p>
            <div className="premium-banner-perks">
              {['Akun Private', 'Garansi Penuh', 'Support 24/7', 'Harga Reseller'].map((perk, i) => (
                <span key={i} className="premium-perk-badge"><CheckCircle size={12} /> {perk}</span>
              ))}
            </div>
            <Link to="/catalog/premium" className="btn btn-primary btn-lg" style={{ width: 'fit-content', marginTop: '8px' }}>
              Eksplor Sekarang
            </Link>
          </div>
          <div className="premium-banner-brands">
            {PREMIUM_BRANDS.map((brand, i) => (
              <div key={i} className="premium-brand-chip">
                <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: brand.color + '15', color: brand.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>{brand.icon}</span>
                <span className="premium-brand-name">{brand.name}</span>
                <span className="premium-brand-disc">-{brand.discount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VPS / RDP BANNER ═══ */}
      <section className="container home-section">
        <div className="vps-banner">
          <div className="vps-banner-left">
            <div className="home-section-eyebrow">Server &amp; Infrastruktur</div>
            <h2 className="vps-banner-title">
              VPS &amp; RDP<br />
              <span style={{ color: '#3B82F6' }}>Performa Tinggi</span>
            </h2>
            <p className="vps-banner-desc">
              Virtual Private Server dan Remote Desktop siap pakai. Uptime 99.9%, lokasi server premium, dan harga kompetitif.
            </p>
            <Link to="/catalog/vps-rdp" className="btn btn-secondary btn-lg" style={{ width: 'fit-content', marginTop: '4px' }}>
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

      {/* ═══ AI ROUTER BANNER ═══ */}
      <section className="container home-section">
        <div className="vps-banner" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <div className="vps-banner-left">
            <div className="home-section-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} /> AI Router API
            </div>
            <h2 className="vps-banner-title">
              Satu Saldo untuk<br />
              <span style={{ color: '#3B82F6' }}>Semua Model AI</span>
            </h2>
            <p className="vps-banner-desc">
              Akses OpenAI (GPT-4o), Anthropic (Claude), Gemini, dan puluhan model AI menggunakan satu API Key terintegrasi. Hemat biaya token hingga 50%!
            </p>
            <div className="premium-banner-perks" style={{ marginBottom: '16px' }}>
              {['1 API Key Terintegrasi', 'Tercepat & Hemat', 'Monitoring Real-time', 'Auto-routing Cerdas'].map((perk, i) => (
                <span key={i} className="premium-perk-badge" style={{ background: '#EFF6FF', borderColor: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>
                  <CheckCircle size={12} /> {perk}
                </span>
              ))}
            </div>
            <Link to="/catalog/ai-router" className="btn btn-primary btn-lg" style={{ width: 'fit-content' }}>
              <Cpu size={16} /> Buat API Key AI
            </Link>
          </div>
          <div className="vps-banner-specs" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {[
              { icon: '🤖', label: 'Multi-LLM',      sub: 'GPT-4o, Claude, Gemini' },
              { icon: '💳', label: '1 Saldo Wallet',  sub: 'Tanpa ribet isi ulang' },
              { icon: '⚡', label: 'Ultra Low Latency', sub: 'Routing otomatis' },
              { icon: '📊', label: 'Usage Analitik',  sub: 'Pantau token real-time' },
            ].map((s, i) => (
              <div key={i} className="vps-spec-card" style={{ background: '#FAFAFA', borderColor: '#E5E7EB' }}>
                <span className="vps-spec-emoji">{s.icon}</span>
                <span className="vps-spec-label">{s.label}</span>
                <span className="vps-spec-sub">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <h2 className="home-section-title">Platform Terpercaya &amp; Terlengkap</h2>
          </div>
        </div>
        <div className="features-grid">
          {[
            { icon: <Zap size={24} />,         title: 'Pengiriman Instan',    desc: 'Pesanan diproses otomatis begitu pembayaran dikonfirmasi.', color: '#3B82F6' },
            { icon: <ShieldCheck size={24} />,  title: 'Garansi Terjamin',    desc: 'Garansi refill untuk SMM dan garansi ganti akun untuk premium.', color: '#10B981' },
            { icon: <TrendingUp size={24} />,   title: 'Program Reseller',     desc: 'Harga khusus reseller dengan margin menggiurkan.', color: '#8B5CF6' },
            { icon: <Clock size={24} />,        title: 'Layanan 24/7',         desc: 'Sistem berjalan non-stop. Pesan kapan saja.', color: '#F59E0B' },
            { icon: <Globe size={24} />,        title: 'Ratusan Layanan',      desc: 'SMM untuk 10+ platform, 20+ akun premium, VPS/RDP.', color: '#06B6D4' },
            { icon: <MessageCircle size={24} />,title: 'Live Chat Support',    desc: 'Tim support siap membantu via WhatsApp.', color: '#10B981' },
          ].map((f, i) => (
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
          <div className="home-section-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>Mulai Sekarang</div>
          <h2 className="final-cta-title">Siap Viralkan Kontenmu?</h2>
          <p className="final-cta-sub">
            Bergabung dengan {usersCount.toLocaleString('id-ID')}+ pengguna yang sudah merasakan manfaatnya.
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
                Penyedia layanan booster media sosial (SMM) terlengkap dan penjualan akun premium, VPS, RDP, serta AI Router API Key tercepat dan otomatis 24/7 di Indonesia.
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
                <li><Link to="/docs/ai"><BookOpen size={12} style={{ marginRight: '4px' }} />Panduan AI</Link></li>
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
          <div className="footer-bottom">
            <p>&copy; 2026 Markaz-Arshy. All rights reserved.</p>
            <p style={{ fontSize: '11px', opacity: 0.7 }}>Seluruh transaksi dilindungi enkripsi SSL aman.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
