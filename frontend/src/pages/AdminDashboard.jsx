import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate, NavLink, Routes, Route } from 'react-router-dom';
import {
  Shield, RefreshCw, LayoutDashboard, Wallet, Settings,
  Tags, Package, PlusCircle, BarChart2, Users, Eye,
  ChevronRight, Bell, User, Bot
} from 'lucide-react';

// ── Lazy-load all admin sub-pages (reduces initial bundle) ──
const AdminOverview = React.lazy(() => import('../components/AdminOverview'));
const AdminDeposits = React.lazy(() => import('../components/AdminDeposits'));
const AdminProducts = React.lazy(() => import('../components/AdminProducts'));
const AdminProductStock = React.lazy(() => import('../components/AdminProductStock'));
const AdminAllOrders = React.lazy(() => import('../components/AdminAllOrders'));
const AdminManualBalance = React.lazy(() => import('../components/AdminManualBalance'));
const AdminPaymentMethods = React.lazy(() => import('../components/AdminPaymentMethods'));
const AdminCategories = React.lazy(() => import('../components/AdminCategories'));
const AdminUsers = React.lazy(() => import('../components/AdminUsers'));
const AdminReviews = React.lazy(() => import('../components/AdminReviews'));
const AdminAIProviders = React.lazy(() => import('../components/AdminAIProviders'));
const AdminAgents = React.lazy(() => import('../components/AdminAgents'));
const AdminPhysicalOrders = React.lazy(() => import('../components/AdminPhysicalOrders'));
const AdminImport = React.lazy(() => import('../components/AdminImport'));
import AdminSkeleton from '../components/AdminSkeleton';

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Overview', badge: null },
  { to: '/admin/deposits', end: false, icon: Wallet, label: 'Approval', badgeKey: 'deposits' },
  { to: '/admin/orders', end: false, icon: BarChart2, label: 'Pesanan', badge: null },
  { to: '/admin/import', end: false, icon: Package, label: 'Import Jakmall', badge: null },
  { to: '/admin/physical-orders', end: false, icon: Package, label: 'Pesanan Fisik', badge: null },
  { to: '/admin/products', end: false, icon: Package, label: 'Produk', badge: null },
  { to: '/admin/categories', end: false, icon: Tags, label: 'Kategori', badge: null },
  { to: '/admin/stock', end: false, icon: PlusCircle, label: 'Stok Premium', badge: null },
  { to: '/admin/balance', end: false, icon: Wallet, label: 'Saldo Manual', badge: null },
  { to: '/admin/payment-methods', end: false, icon: Settings, label: 'Pembayaran', badge: null },
  { to: '/admin/users', end: false, icon: Users, label: 'Pengguna', badge: null },
  { to: '/admin/reviews', end: false, icon: Eye, label: 'Ulasan', badgeKey: 'reviews' },
  { to: '/admin/ai-providers', end: false, icon: Shield, label: 'AI Providers', badge: null },
  { to: '/admin/agents', end: false, icon: Bot, label: 'AI Agents', badge: null },
];

/* ═══════════════════════════════════════
   Toast Notification Component
   ═══════════════════════════════════════ */
function Toast({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => removeToast(t.id)} style={{
          padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          background: t.type === 'success' ? '#ECFDF5' : t.type === 'error' ? '#FEF2F2' : '#EFF6FF',
          color: t.type === 'success' ? '#065F46' : t.type === 'error' ? '#991B1B' : '#1E40AF',
          border: `1px solid ${t.type === 'success' ? '#A7F3D0' : t.type === 'error' ? '#FECACA' : '#BFDBFE'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          animation: 'fadeIn 0.2s ease',
          maxWidth: 360,
        }}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard({ user, token }) {
  const [stats, setStats] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const navigate = useNavigate();

  // ── Toast helpers ──
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { navigate('/'); return; }
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setSyncing(true);
      const H = { 'Authorization': `Bearer ${token}` };

      const fetchJson = async (url, opts = {}) => {
        try {
          const res = await fetch(url, opts);
          if (res.status === 401) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/login');
            return null;
          }
          const data = await res.json();
          return res.ok ? data : null;
        } catch { return null; }
      };

      // Only fetch overview essentials (3 requests instead of 7)
      // Other pages fetch their own data on-demand
      const [sD, pD, revD] = await Promise.all([
        fetchJson(`${import.meta.env.VITE_API_BASE_URL}/api/admin/stats`, { headers: H }),
        fetchJson(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/pending`, { headers: H }),
        fetchJson(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin`, { headers: H }),
      ]);

      setStats(sD?.stats || null);
      setPendingDeposits(pD?.deposits || []);
      setPendingReviews((revD?.reviews || []).filter(r => !r.isApproved).length);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  /* ── Handler helpers ── */
  const api = async (url, opts = {}) => {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, ...opts.headers }, ...opts });
    if (res.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
      return null;
    }
    return res;
  };

  const handleConfirmDeposit = async (id) => { const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/${id}/confirm`, { method: 'POST' }); if (r?.ok) { showToast('Deposit berhasil dikonfirmasi!', 'success'); fetchAdminData(); } else { showToast('Gagal konfirmasi deposit.', 'error'); } };
  const handleRejectDeposit = async (id) => { const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/deposits/${id}/reject`, { method: 'POST' }); if (r?.ok) { showToast('Deposit ditolak.', 'success'); fetchAdminData(); } else { showToast('Gagal menolak deposit.', 'error'); } };

  const handleAddProduct = async (data) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r?.ok) { showToast('Produk berhasil ditambahkan!', 'success'); fetchAdminData(); return true; }
    showToast('Gagal menambahkan produk.', 'error'); return false;
  };

  const handleUploadStock = async (productId, accounts) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/${productId}/accounts/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accounts }) });
    if (r?.ok) { showToast(`${accounts.length} akun berhasil di-upload!`, 'success'); fetchAdminData(); return true; }
    showToast('Gagal upload stok.', 'error'); return false;
  };

  const handleManualBalance = async (userId, amount, action) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${userId}/balance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(amount), action }) });
    if (r?.ok) { showToast(`Saldo berhasil ${action === 'ADD' ? 'ditambahkan' : 'dikurangi'}!`, 'success'); fetchAdminData(); return true; }
    showToast('Gagal update saldo.', 'error'); return false;
  };

  const handleAddPaymentMethod = async (formData) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-methods`, { method: 'POST', body: formData });
    if (r?.ok) { showToast('Metode pembayaran ditambahkan!', 'success'); fetchAdminData(); return true; }
    showToast('Gagal menambahkan metode pembayaran.', 'error'); return false;
  };

  const handleTogglePaymentMethod = async (id) => {
    await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/payment-methods/${id}/toggle`, { method: 'PATCH' });
    showToast('Status metode pembayaran diubah.', 'success');
    fetchAdminData();
  };

  const handleAddCategory = async (name, slug, type) => {
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, type }) });
    if (r?.ok) { showToast('Kategori berhasil ditambahkan!', 'success'); fetchAdminData(); return true; }
    showToast('Gagal menambahkan kategori.', 'error'); return false;
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
    const r = await api(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories/${id}`, { method: 'DELETE' });
    if (r?.ok) { showToast('Kategori berhasil dihapus.', 'success'); fetchAdminData(); }
    else { showToast('Gagal menghapus kategori.', 'error'); }
  };

  if (!user || user.role !== 'ADMIN') return null;

  const badgeCounts = { deposits: pendingDeposits.length, reviews: pendingReviews };

  return (
    <div className="adm-layout animate-fade-in">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="adm-sidebar">
        {/* Logo / Identity */}
        <div className="adm-sidebar-logo">
          <div className="adm-logo-icon">
            <Shield size={20} />
          </div>
          <div>
            <div className="adm-logo-title">Admin Panel</div>
            <div className="adm-logo-sub">Markaz-Arshy</div>
          </div>
        </div>

        {/* Admin user chip */}
        <div className="adm-user-chip">
          <div className="adm-user-avatar">
            {user.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="adm-user-info">
            <span className="adm-user-name">{user.name || 'Admin'}</span>
            <span className="adm-user-role">Administrator</span>
          </div>
        </div>

        {/* Section label */}
        <div className="adm-nav-section-label">Menu Utama</div>

        {/* Nav items */}
        <nav className="adm-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label, badge, badgeKey }) => {
            const count = badgeKey ? badgeCounts[badgeKey] : badge;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} className="adm-nav-icon" />
                <span className="adm-nav-label">{label}</span>
                {count > 0 && <span className="adm-nav-badge">{count}</span>}
                <ChevronRight size={14} className="adm-nav-arrow" />
              </NavLink>
            );
          })}
        </nav>

        {/* Sync button at bottom */}
        <div className="adm-sidebar-footer">
          <button
            onClick={fetchAdminData}
            className={`adm-sync-btn ${syncing ? 'syncing' : ''}`}
            disabled={syncing}
          >
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Menyinkron...' : 'Sinkron Data'}
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main className="adm-main">
        {/* Top bar */}
        <div className="adm-topbar">
          <div className="adm-topbar-breadcrumb">
            <Shield size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Admin</span>
            <ChevronRight size={12} />
            <span className="adm-topbar-current">Dashboard</span>
          </div>
          <div className="adm-topbar-right">
            {pendingDeposits.length > 0 && (
              <div className="adm-topbar-alert">
                <Bell size={14} />
                <span>{pendingDeposits.length} approval menunggu</span>
              </div>
            )}
            <div className="adm-topbar-user">
              <User size={14} />
              <span>{user.name}</span>
            </div>
          </div>
        </div>

        {/* Route content */}
        <div className="adm-content-area">
          <Suspense fallback={<AdminSkeleton />}>
            <Routes>
              <Route path="/" element={<AdminOverview stats={stats} loading={loading} onRetry={fetchAdminData} token={token} />} />
              <Route path="/deposits" element={<AdminDeposits pendingDeposits={pendingDeposits} handleConfirmDeposit={handleConfirmDeposit} handleRejectDeposit={handleRejectDeposit} loading={loading} />} />
              <Route path="/products" element={<AdminProducts token={token} categories={[]} handleAddProduct={handleAddProduct} loading={loading} showToast={showToast} />} />
              <Route path="/categories" element={<AdminCategories token={token} handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory} loading={loading} showToast={showToast} />} />
              <Route path="/stock" element={<AdminProductStock token={token} handleUploadStock={handleUploadStock} loading={loading} showToast={showToast} />} />
              <Route path="/orders" element={<AdminAllOrders token={token} showToast={showToast} />} />
              <Route path="/physical-orders" element={<AdminPhysicalOrders token={token} />} />
              <Route path="/import" element={<AdminImport token={token} />} />
              <Route path="/balance" element={<AdminManualBalance handleManualBalance={handleManualBalance} loading={loading} showToast={showToast} />} />
              <Route path="/payment-methods" element={<AdminPaymentMethods token={token} handleAddPaymentMethod={handleAddPaymentMethod} handleTogglePaymentMethod={handleTogglePaymentMethod} loading={loading} showToast={showToast} />} />
              <Route path="/users" element={<AdminUsers token={token} showToast={showToast} />} />
              <Route path="/reviews" element={<AdminReviews token={token} />} />
              <Route path="/ai-providers" element={<AdminAIProviders token={token} />} />
              <Route path="/agents" element={<AdminAgents token={token} />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
