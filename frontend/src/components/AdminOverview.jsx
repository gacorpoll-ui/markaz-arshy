import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Database, RefreshCw,
  ShoppingCart, TrendingUp, AlertCircle, BarChart2,
  Package, CheckCircle, Clock, ArrowUpRight, Zap, RotateCw
} from 'lucide-react';

const STATUS_CONFIG = {
  COMPLETED:  { color: 'var(--accent-success)', bg: 'rgba(16,185,129,0.1)',  label: 'Selesai' },
  PROCESSING: { color: 'var(--accent-primary)', bg: 'var(--accent-primary-light)', label: 'Proses' },
  PENDING:    { color: 'var(--accent-warning)', bg: 'rgba(245,158,11,0.1)',  label: 'Pending' },
  FAILED:     { color: 'var(--accent-danger)',  bg: 'rgba(239,68,68,0.1)',   label: 'Gagal' },
};

function formatGrowth(growth) {
  if (growth === 'N/A' || growth === null || growth === undefined) return 'Baru bulan ini';
  const n = parseFloat(growth);
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n}% vs bulan lalu`;
}

function DynamicChart({ dailyData }) {
  if (!dailyData || dailyData.length === 0) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Memuat data grafik...
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
  const width = 400;
  const height = 160;
  const padding = 10;

  const points = dailyData.map((d, i) => {
    const x = padding + (i / (dailyData.length - 1)) * (width - 2 * padding);
    const y = height - padding - (d.revenue / maxRevenue) * (height - 2 * padding);
    return { x, y, label: d.label, revenue: d.revenue };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' L');
  const lineD = `M${linePoints}`;
  const areaD = `${lineD} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(59,130,246,0.2)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGrad1)" />
        <path d={lineD} fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent-primary)" stroke="var(--bg-surface)" strokeWidth="2" />
        ))}
      </svg>
      <div className="adm-chart-labels">
        {points.map((p, i) => <span key={i}>{p.label}</span>)}
      </div>
    </>
  );
}

export default function AdminOverview({ stats, loading, onRetry, token }) {
  const [dailyData, setDailyData] = useState(null);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    if (!token) return;
    const fetchChartData = async () => {
      try {
        const [dailyRes, compRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats/daily-revenue?days=7`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats/monthly-comparison`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (dailyRes.ok) { const d = await dailyRes.json(); setDailyData(d.daily); }
        if (compRes.ok) { const d = await compRes.json(); setComparison(d.comparison); }
      } catch (err) {
        console.error('Chart data fetch error:', err);
      }
    };
    fetchChartData();
  }, [token]);

  if (loading) return (
    <div className="adm-loading">
      <RefreshCw size={34} className="spin" />
      <p style={{ fontWeight: 600 }}>Menyusun data statistik...</p>
    </div>
  );

  if (!stats) return (
    <div className="adm-empty" style={{ padding: '80px 20px' }}>
      <RefreshCw size={34} className="spin" style={{ opacity: 0.4, marginBottom: 8 }} />
      <p style={{ marginBottom: 20 }}>Gagal memuat statistik.</p>
      <button onClick={onRetry} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <RotateCw size={15} /> Muat Ulang
      </button>
    </div>
  );

  const totalOrders  = stats.ordersGroup.reduce((s, g) => s + g._count.id, 0);
  const totalRevenue = stats.ordersGroup.reduce((s, g) => s + (g._sum.amount || 0), 0);
  const completedOrders = stats.ordersGroup.find(g => g.status === 'COMPLETED')?._count.id || 0;
  const successRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

  const revenueSub = comparison ? formatGrowth(comparison.revenue.growth) : 'Memuat...';
  const ordersSub = comparison ? `${comparison.orders.current} bulan ini` : `${completedOrders} selesai`;
  const usersSub = comparison ? formatGrowth(comparison.users.growth) : `${stats.totalResellers} reseller`;

  const PRIMARY_STATS = [
    { icon: <TrendingUp size={22} />,  label: 'Total Omzet',     value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,  sub: revenueSub,   accent: 'var(--accent-success)' },
    { icon: <ShoppingCart size={22} />,label: 'Total Pesanan',   value: totalOrders.toLocaleString('id-ID'),            sub: ordersSub, accent: 'var(--accent-primary)' },
    { icon: <Users size={22} />,       label: 'Total Member',    value: (stats.totalUsers + stats.totalResellers).toLocaleString('id-ID'), sub: usersSub, accent: '#a78bfa' },
    { icon: <Zap size={22} />,         label: 'Success Rate',    value: `${successRate}%`,                               sub: 'Order completion rate', accent: 'var(--accent-warning)' },
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
          <div key={i} className="adm-stat-card">
            <div className="adm-stat-card-top">
              <div className="adm-stat-icon" style={{ background: `${s.accent}10`, color: s.accent }}>{s.icon}</div>
              <ArrowUpRight size={16} className="arrow" style={{ color: s.accent }} />
            </div>
            <div className="adm-stat-label">{s.label}</div>
            <div className="adm-stat-value" style={{ color: s.accent }}>{s.value}</div>
            <div className="adm-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="adm-mid-row">
        {/* Trend chart — NOW DYNAMIC */}
        <div className="adm-card-nest">
          <div className="adm-card-header-row">
            <div className="adm-card-header-left">
              <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Tren Omzet (7 Hari)</span>
            </div>
          </div>
          <div className="adm-chart-wrap">
            <DynamicChart dailyData={dailyData} />
          </div>
        </div>

        {/* Top products */}
        <div className="adm-card-nest">
          <div className="adm-card-header-row">
            <div className="adm-card-header-left">
              <Package size={18} style={{ color: 'var(--accent-primary)' }} />
              <span>Produk Terlaris</span>
            </div>
          </div>
          <ul className="adm-top-list">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((prod, idx) => (
                <li key={idx} className="adm-top-item">
                  <div className="adm-top-rank" style={{
                    background: idx === 0 ? 'rgba(245,158,11,0.15)' : idx === 1 ? 'var(--accent-primary-light)' : 'var(--bg-muted)',
                    color: idx === 0 ? '#f59e0b' : idx === 1 ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}>
                    {idx + 1}
                  </div>
                  <span className="adm-top-name">{prod.name}</span>
                  <span className="adm-badge adm-badge-info">{prod.salesCount} Sales</span>
                </li>
              ))
            ) : (
              <li className="adm-empty-placeholder">Belum ada data produk terlaris.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom row */}
      <div className="adm-bottom-row">
        {/* Order distribution */}
        <div className="adm-card-nest">
          <div className="adm-card-header-row">
            <div className="adm-card-header-left">
              <ShoppingCart size={18} style={{ color: 'var(--accent-primary)' }} />
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
                    <div className="adm-dist-dot" style={{ background: cfg.color }} />
                    <span className="adm-dist-name">{cfg.label || group.status}</span>
                    <span className="adm-dist-count">{group._count.id}</span>
                    <span className="adm-dist-pct">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="adm-dist-bar">
                    <div className="adm-dist-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action cards */}
        <div className="adm-action-cards">
          <div className={`adm-card-nest adm-action-card ${stats.pendingDeposits > 0 ? 'urgent' : ''}`}>
            <div className="adm-action-icon" style={{ background: stats.pendingDeposits > 0 ? 'rgba(245,158,11,0.15)' : 'var(--bg-muted)', color: stats.pendingDeposits > 0 ? 'var(--accent-warning)' : 'var(--text-muted)' }}>
              <AlertCircle size={22} />
            </div>
            <div className="adm-action-val" style={{ color: stats.pendingDeposits > 0 ? 'var(--accent-warning)' : 'var(--text-primary)' }}>
              {stats.pendingDeposits}
            </div>
            <div className="adm-action-lbl">Persetujuan Saldo</div>
            <div className="adm-action-sub">Deposit menunggu verifikasi</div>
            {stats.pendingDeposits > 0 && (
              <div className="adm-urgent-pill">
                <div className="adm-pulse-dot" />
                Tindakan Diperlukan
              </div>
            )}
          </div>

          <div className="adm-card-nest adm-action-card">
            <div className="adm-action-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
              <Database size={22} />
            </div>
            <div className="adm-action-val" style={{ color: 'var(--accent-primary)' }}>
              {stats.totalAccountsAvailable}
            </div>
            <div className="adm-action-lbl">Stok Premium</div>
            <div className="adm-action-sub">Akun siap jual di database</div>
            <div className="adm-ok-pill"><CheckCircle size={11} /> Database Aman</div>
          </div>

          <div className="adm-card-nest adm-action-card">
            <div className="adm-action-icon" style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
              <Users size={22} />
            </div>
            <div className="adm-action-val" style={{ color: '#a78bfa' }}>
              {stats.totalResellers}
            </div>
            <div className="adm-action-lbl">Reseller Aktif</div>
            <div className="adm-action-sub">Mitra bisnis bergabung</div>
          </div>
        </div>
      </div>
    </div>
  );
}
