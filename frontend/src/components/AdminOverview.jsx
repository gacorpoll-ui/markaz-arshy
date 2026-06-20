import React from 'react';
import {
  LayoutDashboard, Users, Database, RefreshCw,
  ShoppingCart, TrendingUp, AlertCircle, BarChart2,
  Package, CheckCircle, Clock, ArrowUpRight, Zap
} from 'lucide-react';

const STATUS_CONFIG = {
  COMPLETED:  { color: 'var(--color-success)', bg: 'rgba(16,185,129,0.1)',  label: 'Selesai' },
  PROCESSING: { color: 'var(--color-primary)', bg: 'rgba(0,242,254,0.1)',   label: 'Proses' },
  PENDING:    { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.1)',  label: 'Pending' },
  FAILED:     { color: 'var(--color-error)',   bg: 'rgba(239,68,68,0.1)',   label: 'Gagal' },
};

export default function AdminOverview({ stats, loading }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
      <RefreshCw size={34} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      <p style={{ marginTop: '14px', fontWeight: '600' }}>Menyusun data statistik…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!stats) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
      Gagal memuat statistik.
    </div>
  );

  const totalOrders  = stats.ordersGroup.reduce((s, g) => s + g._count.id,          0);
  const totalRevenue = stats.ordersGroup.reduce((s, g) => s + (g._sum.amount || 0), 0);
  const completedOrders = stats.ordersGroup.find(g => g.status === 'COMPLETED')?._count.id || 0;
  const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const PRIMARY_STATS = [
    {
      icon: <TrendingUp size={22} />,
      label: 'Total Omzet',
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      sub: '+12.5% bulan ini',
      accent: 'var(--color-success)',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      icon: <ShoppingCart size={22} />,
      label: 'Total Pesanan',
      value: totalOrders.toLocaleString('id-ID'),
      sub: `${completedOrders} selesai`,
      accent: 'var(--color-primary)',
      bg: 'rgba(0,242,254,0.1)',
    },
    {
      icon: <Users size={22} />,
      label: 'Total Member',
      value: (stats.totalUsers + stats.totalResellers).toLocaleString('id-ID'),
      sub: `${stats.totalResellers} reseller aktif`,
      accent: '#a78bfa',
      bg: 'rgba(167,139,250,0.1)',
    },
    {
      icon: <Zap size={22} />,
      label: 'Success Rate',
      value: `${successRate}%`,
      sub: 'Order completion rate',
      accent: 'var(--color-warning)',
      bg: 'rgba(245,158,11,0.1)',
    },
  ];

  return (
    <div className="animate-fade-in adm-overview">

      {/* Header */}
      <div className="adm-overview-header">
        <div>
          <div className="adm-overview-eyebrow">
            <div className="adm-live-dot" /> Live Data
          </div>
          <h2 className="adm-overview-title">
            Command <span className="text-gradient">Center</span>
          </h2>
          <p className="adm-overview-sub">Pantau performa bisnis secara real-time.</p>
        </div>
        <div className="adm-overview-timestamp">
          <Clock size={12} />
          {new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
        </div>
      </div>

      {/* Primary stat cards */}
      <div className="adm-stat-grid">
        {PRIMARY_STATS.map((s, i) => (
          <div key={i} className="glass-card adm-stat-card">
            <div className="adm-stat-card-top">
              <div className="adm-stat-icon" style={{ background: s.bg, color: s.accent }}>
                {s.icon}
              </div>
              <ArrowUpRight size={16} className="adm-stat-arrow" style={{ color: s.accent }} />
            </div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={{ color: s.accent }}>{s.value}</div>
            <div className="adm-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle row: Chart + Top Products */}
      <div className="adm-mid-row">

        {/* Trend chart */}
        <div className="glass-card adm-chart-card">
          <div className="adm-card-header">
            <div className="adm-card-header-left">
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Tren Omzet (7 Hari)</span>
            </div>
          </div>
          <div className="adm-chart-wrap">
            <svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="rgba(0,242,254,0.3)" />
                  <stop offset="100%" stopColor="rgba(0,242,254,0)" />
                </linearGradient>
              </defs>
              {/* Area fill */}
              <path
                d="M0,150 L57,120 L114,130 L171,80 L228,90 L285,40 L342,55 L400,25 L400,160 L0,160 Z"
                fill="url(#chartGrad)"
              />
              {/* Line */}
              <path
                d="M0,150 L57,120 L114,130 L171,80 L228,90 L285,40 L342,55 L400,25"
                fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round"
              />
              {/* Dots */}
              {[[0,150],[57,120],[114,130],[171,80],[228,90],[285,40],[342,55],[400,25]].map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="4" fill="var(--color-primary)" stroke="#0f162a" strokeWidth="2" />
              ))}
            </svg>
          </div>
          <div className="adm-chart-labels">
            {['Sen','Sel','Rab','Kam','Jum','Sab','Min','Hari ini'].map((d,i)=>(
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card adm-top-products-card">
          <div className="adm-card-header">
            <div className="adm-card-header-left">
              <Package size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Produk Terlaris</span>
            </div>
          </div>
          <ul className="adm-top-products-list">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((prod, idx) => (
                <li key={idx} className="adm-top-product-item">
                  <div className="adm-top-product-rank" style={{
                    background: idx === 0 ? 'rgba(245,158,11,0.15)' : idx === 1 ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.04)',
                    color: idx === 0 ? '#f59e0b' : idx === 1 ? 'var(--color-primary)' : 'var(--text-muted)',
                  }}>
                    {idx + 1}
                  </div>
                  <span className="adm-top-product-name">{prod.name}</span>
                  <span className="adm-top-product-sales badge badge-premium">{prod.salesCount} Sales</span>
                </li>
              ))
            ) : (
              <li className="adm-empty-placeholder">Belum ada data produk terlaris.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom row: Order distribution + Urgent tasks */}
      <div className="adm-bottom-row">

        {/* Order distribution */}
        <div className="glass-card adm-dist-card">
          <div className="adm-card-header">
            <div className="adm-card-header-left">
              <ShoppingCart size={18} style={{ color: 'var(--color-primary)' }} />
              <span>Distribusi Status Pesanan</span>
            </div>
            <span className="adm-dist-total">{totalOrders} Total</span>
          </div>
          <div className="adm-dist-list">
            {stats.ordersGroup.map((group, idx) => {
              const cfg = STATUS_CONFIG[group.status] || STATUS_CONFIG.PENDING;
              const pct = totalOrders > 0 ? (group._count.id / totalOrders) * 100 : 0;
              return (
                <div key={idx} className="adm-dist-row">
                  <div className="adm-dist-label-row">
                    <div className="adm-dist-status-dot" style={{ background: cfg.color }} />
                    <span className="adm-dist-status-name">{cfg.label || group.status}</span>
                    <span className="adm-dist-count">{group._count.id}</span>
                    <span className="adm-dist-pct">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="adm-dist-bar-track">
                    <div
                      className="adm-dist-bar-fill"
                      style={{ width: `${pct}%`, background: cfg.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action required cards */}
        <div className="adm-action-cards">
          {/* Pending deposits */}
          <div className={`glass-card adm-action-card ${stats.pendingDeposits > 0 ? 'urgent' : ''}`}>
            <div className="adm-action-icon" style={{
              background: stats.pendingDeposits > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
              color: stats.pendingDeposits > 0 ? 'var(--color-warning)' : 'var(--text-muted)',
            }}>
              <AlertCircle size={22} />
            </div>
            <div className="adm-action-value" style={{ color: stats.pendingDeposits > 0 ? 'var(--color-warning)' : 'var(--text-primary)' }}>
              {stats.pendingDeposits}
            </div>
            <div className="adm-action-label">Persetujuan Saldo</div>
            <div className="adm-action-sub">Deposit menunggu verifikasi</div>
            {stats.pendingDeposits > 0 && (
              <div className="adm-action-urgent-pill">
                <div className="adm-pulse-dot" />
                Tindakan Diperlukan
              </div>
            )}
          </div>

          {/* Stok akun */}
          <div className="glass-card adm-action-card">
            <div className="adm-action-icon" style={{ background: 'rgba(0,242,254,0.1)', color: 'var(--color-primary)' }}>
              <Database size={22} />
            </div>
            <div className="adm-action-value" style={{ color: 'var(--color-primary)' }}>
              {stats.totalAccountsAvailable}
            </div>
            <div className="adm-action-label">Stok Premium</div>
            <div className="adm-action-sub">Akun siap jual di database</div>
            <div className="adm-action-ok-pill">
              <CheckCircle size={11} /> Database Aman
            </div>
          </div>

          {/* Reseller count */}
          <div className="glass-card adm-action-card">
            <div className="adm-action-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
              <Users size={22} />
            </div>
            <div className="adm-action-value" style={{ color: '#a78bfa' }}>
              {stats.totalResellers}
            </div>
            <div className="adm-action-label">Reseller Aktif</div>
            <div className="adm-action-sub">Mitra bisnis bergabung</div>
          </div>
        </div>
      </div>
    </div>
  );
}
